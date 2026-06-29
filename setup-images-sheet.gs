/**
 * Chạy script này 1 lần để tạo sheet "Images" với đầy đủ cấu trúc.
 * Extensions > Apps Script > dán code > Run > xong.
 */
function setupImagesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Xoá sheet cũ nếu có
  const old = ss.getSheetByName('Images');
  if (old) ss.deleteSheet(old);

  const sheet = ss.insertSheet('Images');

  // ── Header row ──────────────────────────────────────────────
  sheet.getRange('A1:D1').setValues([['activity_id', 'url', 'caption', 'link']]);
  sheet.getRange('A1:D1')
    .setBackground('#1C2C1F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11);

  // ── Dữ liệu mẫu – điền URL vào cột B ───────────────────────
  // Cột: activity_id | url | caption | link (bài viết đọc thêm)
  // Chỉ cần điền link 1 lần cho mỗi activity_id (dòng đầu tiên có giá trị sẽ được dùng)
  const rows = [
    // Ngày 1 – 17/7
    ['d1-2', '', 'Homestay nhận phòng',        ''],
    ['d1-3', '', 'Cơm niêu Ông Già',           ''],
    ['d1-3', '', 'Thịt dê tái chanh',          ''],
    ['d1-4', '', 'Phố Cổ Hoa Lư buổi tối',    ''],
    ['d1-4', '', 'Đền Đinh Tiên Hoàng',        ''],
    ['d1-4', '', 'Đèn thờ lung linh',          ''],

    // Ngày 2 – 18/7
    ['d2-2', '', 'Chèo thuyền Tràng An',       ''],
    ['d2-2', '', 'Hang động sương mù',          ''],
    ['d2-2', '', 'Vách đá karst dựng đứng',    ''],
    ['d2-3', '', 'Ăn trưa Quán Thúy',          ''],
    ['d2-4', '', 'Cổng Chùa Bích Động',        ''],
    ['d2-4', '', 'Leo bậc thang rêu phong',    ''],
    ['d2-4', '', 'Góc nhìn từ Chùa Thượng',   ''],
    ['d2-5', '', 'Đàn cò về tổ Thung Nham',   ''],
    ['d2-5', '', 'Chèo thuyền qua đầm sen',    ''],
    ['d2-6', '', 'Dê Ông Bê đặc sản',          ''],

    // Ngày 3 – 19/7
    ['d3-2', '', 'Leo 500 bậc Hang Múa',       ''],
    ['d3-2', '', 'Đỉnh rồng toàn cảnh Tràng An', ''],
    ['d3-2', '', 'Nhìn xuống đồng lúa xanh',  ''],
    ['d3-3', '', 'Cơm cháy đặc sản Ninh Bình', ''],
  ];

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);

  // ── Màu xen kẽ theo ngày ────────────────────────────────────
  const day1 = '#FEF9EE'; // amber nhạt
  const day2 = '#EEF6FB'; // teal nhạt
  const day3 = '#EEF7F0'; // green nhạt

  const dayColors = {
    'd1': day1, 'd2': day2, 'd3': day3,
  };

  for (let i = 0; i < rows.length; i++) {
    const id = rows[i][0].slice(0, 2);
    const color = dayColors[id] || '#FFFFFF';
    sheet.getRange(i + 2, 1, 1, 3).setBackground(color);
  }

  // ── Column widths ────────────────────────────────────────────
  sheet.setColumnWidth(1, 120);  // activity_id
  sheet.setColumnWidth(2, 420);  // url
  sheet.setColumnWidth(3, 220);  // caption
  sheet.setColumnWidth(4, 320);  // link

  // ── Freeze header, auto-resize ───────────────────────────────
  sheet.setFrozenRows(1);

  // ── Note hướng dẫn ──────────────────────────────────────────
  sheet.getRange('B1').setNote(
    'Dán link ảnh vào đây.\n\n' +
    'Hỗ trợ:\n' +
    '• Google Drive (đổi /view → /preview hoặc dùng direct link)\n' +
    '• Imgur: https://i.imgur.com/xxxxx.jpg\n' +
    '• Bất kỳ URL ảnh công khai nào\n\n' +
    'Mỗi activity_id có thể có nhiều dòng → slideshow tự động.'
  );

  // ── Share reminder ───────────────────────────────────────────
  SpreadsheetApp.getUi().alert(
    '✅  Sheet "Images" đã tạo xong!\n\n' +
    'Nhớ: File > Share > Anyone with the link > Viewer\n' +
    'để app có thể đọc ảnh.'
  );
}
