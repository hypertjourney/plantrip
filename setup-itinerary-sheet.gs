/**
 * Restructure sheet đầu tiên (Timeline) thành DB lịch trình.
 * Chạy 1 lần: Extensions > Apps Script > Run setupItinerarySheet
 *
 * Cột A (ID) giữ nguyên làm tham chiếu sang sheet Images.
 * Khi thêm hoạt động mới → tự đặt ID dạng d{ngày}-{số}, VD: d2-7
 * App tự reload dữ liệu mỗi khi refresh trình duyệt.
 */

/**
 * Tự động tra tọa độ (lat/lng) từ tên + địa chỉ trong sheet,
 * ghi đè vào cột H (Vĩ độ) và I (Kinh độ).
 *
 * Chạy: Extensions > Apps Script > chọn geocodeAllLocations > Run
 * Cần bật Maps service: Services (+) > Maps > Add
 */
function geocodeAllLocations() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Lịch trình');
  if (!sheet) { SpreadsheetApp.getUi().alert('Không tìm thấy sheet "Lịch trình"'); return; }

  const geo      = Maps.newGeocoder().setRegion('vn').setLanguage('vi');
  const lastRow  = sheet.getLastRow();
  const data     = sheet.getRange(2, 1, lastRow - 1, 9).getValues(); // A→I

  let updated = 0, skipped = 0, failed = 0;
  const log = [];

  for (let i = 0; i < data.length; i++) {
    const row      = i + 2; // dòng thực trong sheet (header = 1)
    const type     = data[i][4]; // col E – Loại
    const title    = data[i][5]; // col F – Tên hoạt động
    const subtitle = data[i][6]; // col G – Địa điểm
    const lat      = data[i][7]; // col H
    const lng      = data[i][8]; // col I

    // Bỏ qua hàng trống hoặc Di chuyển (không cần pin trên bản đồ)
    if (!title || type === 'Di chuyển') { skipped++; continue; }

    // Xây query: ưu tiên subtitle nếu trông như địa chỉ thật (có số / đường / xã / phường)
    const hasAddress = subtitle && /\d|đường|phường|xã|ngõ|thôn|quận|huyện|tp\.|thành phố/i.test(subtitle);
    const query = hasAddress
      ? `${title} ${subtitle} Ninh Bình Vietnam`
      : `${title} Ninh Bình Vietnam`;

    try {
      const result = geo.geocode(query);
      if (result.status === 'OK' && result.results.length > 0) {
        const loc = result.results[0].geometry.location;
        sheet.getRange(row, 8).setValue(loc.lat); // H – Vĩ độ
        sheet.getRange(row, 9).setValue(loc.lng); // I – Kinh độ
        log.push(`✅ [${data[i][0]}] ${title}\n     → ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}\n     (query: ${query})`);
        updated++;
      } else {
        log.push(`⚠ [${data[i][0]}] ${title} — không tìm được (status: ${result.status})`);
        failed++;
      }
    } catch (e) {
      log.push(`❌ [${data[i][0]}] ${title} — lỗi: ${e.message}`);
      failed++;
    }

    Utilities.sleep(300); // tránh rate limit Maps API
  }

  SpreadsheetApp.flush();

  const summary =
    `🗺  Geocode xong!\n\n` +
    `✅ Cập nhật: ${updated} địa điểm\n` +
    `⏭  Bỏ qua:  ${skipped} hàng (Di chuyển / trống)\n` +
    `⚠  Lỗi:     ${failed} địa điểm\n\n` +
    `--- Chi tiết ---\n${log.join('\n')}`;

  Logger.log(summary);
  SpreadsheetApp.getUi().alert(summary);
}

/**
 * Geocode 1 dòng cụ thể để kiểm tra, không ghi vào sheet.
 * Đổi QUERY bên dưới rồi Run → xem kết quả ở View > Logs
 */
function testGeocode() {
  const QUERY = 'Phố Cổ Hoa Lư Ninh Bình Vietnam';
  const geo    = Maps.newGeocoder().setRegion('vn');
  const result = geo.geocode(QUERY);
  if (result.status === 'OK') {
    const loc = result.results[0].geometry.location;
    Logger.log(`Query: ${QUERY}\nKết quả: ${loc.lat}, ${loc.lng}\nĐịa chỉ đầy đủ: ${result.results[0].formatted_address}`);
  } else {
    Logger.log('Không tìm được. Status: ' + result.status);
  }
}

/**
 * Nhận phản hồi từ app và ghi vào sheet "Phản hồi".
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Sau khi deploy → copy URL → dán vào VITE_RSVP_URL trong .env.local
 */
function doPost(e) {
  try {
    const ss   = SpreadsheetApp.getActiveSpreadsheet()
    let sheet  = ss.getSheetByName('Phản hồi')

    if (!sheet) {
      sheet = ss.insertSheet('Phản hồi')
      const hdr = sheet.getRange(1, 1, 1, 5)
      hdr.setValues([['Thời gian', 'Tên', 'Điểm (1-10)', 'Ý kiến đóng góp', 'Địa điểm muốn thêm']])
      hdr.setBackground('#1C2C1F').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11)
      sheet.setFrozenRows(1)
      sheet.setColumnWidth(1, 165)
      sheet.setColumnWidth(2, 110)
      sheet.setColumnWidth(3,  95)
      sheet.setColumnWidth(4, 420)
      sheet.setColumnWidth(5, 420)
    }

    const body = JSON.parse(e.postData.contents)
    sheet.appendRow([
      new Date(),
      body.name    || '',
      body.rating  || '',
      body.opinion || '',
      body.places  || '',
    ])

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function setupItinerarySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Lấy sheet đầu tiên (Timeline) và đổi tên
  const sheet = ss.getSheets()[0];
  sheet.setName('Lịch trình');
  sheet.clear();
  sheet.clearFormats();

  // ── Headers ────────────────────────────────────────────────
  const headers = [
    'ID',             // A  – d1-1, d1-2 … dùng để liên kết với sheet Images
    'Ngày',           // B  – 1 / 2 / 3
    'Giờ BĐ',         // C  – HH:MM
    'Giờ KT',         // D  – HH:MM
    'Loại',           // E  – dropdown
    'Tên hoạt động',  // F  – tiêu đề chính
    'Địa điểm',       // G  – subtitle
    'Vĩ độ',          // H  – lat
    'Kinh độ',        // I  – lng
    'Di chuyển TT',   // J  – phương tiện đến chỗ tiếp theo
    'Mô tả',          // K  – chi tiết
    'Mẹo',            // L  – tips
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange
    .setBackground('#1C2C1F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  // ── Format C, D là text để giữ định dạng HH:MM ────────────
  sheet.getRange('C:D').setNumberFormat('@');

  // ── Data ───────────────────────────────────────────────────
  // [ID, Ngày, Giờ BĐ, Giờ KT, Loại, Tên, Địa điểm, Lat, Lng, Di chuyển TT, Mô tả, Mẹo]
  const rows = [
    // ─ Ngày 1 – Thứ 6, 17/7 ─────────────────────────────────
    ['d1-1',1,'14:00','17:00','Di chuyển',
     'Khởi hành từ Hà Nội','Xe khách / Tàu hỏa',
     '','',
     'Xe khách / Tàu',
     'Di chuyển từ Hà Nội đến Ninh Bình theo quốc lộ 1A hoặc tàu hỏa tuyến Bắc–Nam. Tàu SE1/SE3 khởi hành 14:05, đến Ga Ninh Bình 16:30.',
     'Book vé tàu trước 1 tuần. Ghế ngồi mềm điều hoà tầm 100–130k.'],

    ['d1-2',1,'17:00','18:00','Lưu trú',
     'Nhận phòng homestay','Trung tâm Ninh Bình',
     20.2506,105.9745,
     'Đi bộ / Xe máy',
     'Nhận phòng, để hành lý, tắm rửa sau hành trình. Khu đường Trần Hưng Đạo có nhiều homestay tốt.',
     'Đặt phòng trước ít nhất 2 tuần nếu đi cuối tuần. Hỏi thuê xe máy.'],

    ['d1-3',1,'18:00','19:30','Ăn uống',
     'Ăn tối — Cơm niêu Ông Già','Đặc sản Ninh Bình · đường Lương Văn Tụy',
     20.2500,105.9740,
     'Xe máy / Grab',
     'Bữa tối đầu tiên với đặc sản cơm niêu Ninh Bình — cơm nấu trong niêu đất, ăn kèm dê tái chanh, nem cuốn.',
     'Phải gọi: cơm niêu, thịt dê tái chanh, nem cuốn Ninh Bình. Giá 80–120k/người.'],

    ['d1-4',1,'20:00','21:30','Tham quan',
     'Phố Cổ Hoa Lư','Cố đô nghìn năm · buổi tối',
     20.2633839,105.9681679,
     '',
     'Tản bộ quanh khu đền Đinh Tiên Hoàng và Lê Đại Hành — kinh đô đầu tiên của Đại Việt thế kỷ X. Đêm đèn thờ lung linh, ít khách hơn ban ngày.',
     'Vé vào: 20.000đ. Mang theo đèn pin. Đừng bỏ qua Sơn Lăng và giếng cổ.'],

    // ─ Ngày 2 – Thứ 7, 18/7 ─────────────────────────────────
    ['d2-1',2,'06:30','07:30','Ăn uống',
     'Ăn sáng — Bún bò Thanh Hường','Gần trung tâm · đường Nguyễn Công Trứ',
     20.2510,105.9748,
     'Xe máy',
     'Tô bún bò nóng hổi hoặc bánh cuốn Ninh Bình trước khi xuất phát. Ăn sáng sớm để kịp tour thuyền 8h.',
     'Ăn nhẹ thôi — sẽ chèo thuyền liên tục 3–4 tiếng. Mang nước uống và kem chống nắng.'],

    ['d2-2',2,'08:00','12:00','Tham quan',
     'Tràng An','Di sản Thế giới UNESCO · Thuyền hang động',
     20.252551,105.9183742,
     'Xe máy',
     'Chèo thuyền qua hệ thống 48 hang động và hồ nước trong vắt. Tour đầy đủ khoảng 3–3.5 giờ qua 3 hang chính. Sáng sớm đẹp nhất.',
     'Vé: 250.000đ/người (gồm người chèo thuyền). Đặt sớm lúc 8h để tránh chen.'],

    ['d2-3',2,'12:00','13:30','Ăn uống',
     'Ăn trưa — Quán Thúy','Cách cổng Tràng An 500m',
     20.2570,105.9150,
     'Xe máy',
     'Cơm nhà hàng sạch gần khu Tràng An. Cơm gà rang muối, cá rô đồng rán giòn, canh chua. Ngồi ngoài hiên nhìn ruộng lúa.',
     'Tránh quán ngay cổng chính — đắt và đông. Đi ra ngoài 500m là có quán ngon hơn.'],

    ['d2-4',2,'14:00','15:30','Tham quan',
     'Chùa Bích Động','Nam thiên đệ nhị động · Tam Cốc',
     20.2280,105.9220,
     'Xe máy',
     'Quần thể chùa hang 3 tầng: Chùa Hạ, Chùa Trung, Chùa Thượng nằm lồng vào núi đá. Bậc thang rêu phong cổ kính. Từ đỉnh nhìn ra cánh đồng lúa.',
     'Vé: 20.000đ. Mang đèn pin để vào hang sâu. Ăn mặc kín đáo khi vào chùa.'],

    ['d2-5',2,'16:00','18:00','Tham quan',
     'Thung Nham','Vườn chim thiên nhiên · hang động',
     20.1889,105.9264,
     'Xe máy',
     'Khu sinh thái chim tự nhiên với hàng nghìn cò, vạc. Đi thuyền qua đầm sen và hang nhỏ. Chiều tà đàn chim về tổ — cảnh đẹp hiếm gặp.',
     'Vé: 150.000đ. Đến trước 17:00 để không bỏ lỡ cảnh chim về tổ lúc hoàng hôn.'],

    ['d2-6',2,'19:00','20:30','Ăn uống',
     'Ăn tối — Dê Ông Bê','Đặc sản dê núi · gần trung tâm',
     20.2490,105.9710,
     '',
     'Ninh Bình nức tiếng với dê núi. Thử trọn bộ: dê tái chanh, dê sốt vang, lẩu dê.',
     'Gọi thêm rượu ngô Mộc Châu hoặc bia Hà Nội. Giá 150–200k/người.'],

    // ─ Ngày 3 – Chủ nhật, 19/7 ──────────────────────────────
    ['d3-1',3,'07:00','07:45','Ăn uống',
     'Ăn sáng — Bánh cuốn Thanh Hương','Phường Nam Thành',
     20.2508,105.9742,
     'Xe máy / Grab',
     'Bánh cuốn nóng cuộn nhân thịt băm mộc nhĩ, chan nước dùng ngọt thanh với chả quế.',
     'Ghé sớm trước 8h kẻo hết. Gọi thêm chả lụa và chả quế ăn kèm.'],

    ['d3-2',3,'08:00','11:00','Tham quan',
     'Hang Múa','500 bậc · đỉnh rồng toàn cảnh Tràng An',
     20.2134,105.9093,
     'Xe máy',
     'Leo 500 bậc thang đá lên đỉnh Hang Múa — điểm ngắm toàn cảnh Tràng An đẹp nhất. Nhìn xuống: núi đá nổi giữa đồng lúa xanh như tranh thuỷ mặc.',
     'Vé: 100.000đ. Mang giày thể thao bám chắc. Leo lúc 8h tránh nắng. Mang ít nhất 1L nước.'],

    ['d3-3',3,'11:30','13:30','Ăn uống',
     'Ăn trưa · Cơm cháy · Về Hà Nội','Bữa kết hành trình',
     20.2506,105.9745,
     'Xe khách / Tàu',
     'Cơm cháy đặc sản Ninh Bình — miếng cơm cháy vàng giòn phủ sốt tôm thịt đậm đà. Sau đó trả phòng và về Hà Nội.',
     'Tàu về Hà Nội lúc 14:22 hoặc 15:55. Mua cơm cháy đóng gói làm quà.'],
  ];

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // ── Màu theo ngày ─────────────────────────────────────────
  const palette = { 1: '#FEF9EE', 2: '#EEF6FB', 3: '#EEF7F0' };
  rows.forEach((row, i) => {
    const bg = palette[row[1]] || '#FFFFFF'; // row[1] = Ngày
    sheet.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
  });

  // ── Dropdowns ──────────────────────────────────────────────
  const typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Di chuyển', 'Lưu trú', 'Ăn uống', 'Tham quan'], true)
    .setAllowInvalid(false).build();
  sheet.getRange('E2:E100').setDataValidation(typeRule);

  const dayRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['1', '2', '3'], true)
    .setAllowInvalid(false).build();
  sheet.getRange('B2:B100').setDataValidation(dayRule);

  // ── Column widths ──────────────────────────────────────────
  sheet.setColumnWidth(1,  90);   // ID
  sheet.setColumnWidth(2,  70);   // Ngày
  sheet.setColumnWidth(3,  85);   // Giờ BĐ
  sheet.setColumnWidth(4,  85);   // Giờ KT
  sheet.setColumnWidth(5, 110);   // Loại
  sheet.setColumnWidth(6, 260);   // Tên hoạt động
  sheet.setColumnWidth(7, 230);   // Địa điểm
  sheet.setColumnWidth(8,  85);   // Vĩ độ
  sheet.setColumnWidth(9,  85);   // Kinh độ
  sheet.setColumnWidth(10, 160);  // Di chuyển TT
  sheet.setColumnWidth(11, 380);  // Mô tả
  sheet.setColumnWidth(12, 280);  // Mẹo

  // ── Freeze header ──────────────────────────────────────────
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);

  // ── Notes ─────────────────────────────────────────────────
  sheet.getRange('A1').setNote(
    'ID dùng để gắn ảnh từ sheet Images.\n' +
    'Khi thêm hoạt động mới, tự đặt ID dạng d{ngày}-{số}.\n' +
    'Ví dụ: d2-7 (hoạt động thứ 7 của ngày 2).'
  );
  sheet.getRange('B1').setNote('1 = Thứ 6, 17/7\n2 = Thứ 7, 18/7\n3 = Chủ nhật, 19/7');
  sheet.getRange('H1').setNote('Vĩ độ (latitude). VD: 20.2506\nĐể trống nếu không cần hiển thị trên bản đồ.');
  sheet.getRange('J1').setNote('Phương tiện di chuyển đến hoạt động TIẾP THEO.\nVD: Xe máy / Grab');

  sheet.setRowHeightsForced(2, rows.length, 21);

  SpreadsheetApp.getUi().alert(
    '✅  Sheet "Lịch trình" đã sẵn sàng!\n\n' +
    'Thêm hoạt động mới:\n' +
    '  1. Thêm hàng mới cuối bảng\n' +
    '  2. Điền ID (ví dụ d2-7), Ngày, Giờ, Loại, Tên\n' +
    '  3. Gắn ảnh: mở sheet Images, điền activity_id = ID vừa tạo\n\n' +
    'App tự cập nhật khi F5 refresh trình duyệt.\n\n' +
    '⚠  Nhớ: File > Share > Anyone with the link > Viewer'
  );
}
