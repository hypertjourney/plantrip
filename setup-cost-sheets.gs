/**
 * Tạo 2 sheet chi phí: "Dự trù" và "Thực tế"
 * Chạy: Extensions > Apps Script > chọn setupCostSheets > Run
 */
function setupCostSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  _setupBudgetSheet(ss);
  _setupActualSheet(ss);
  SpreadsheetApp.getUi().alert(
    '✅ Đã tạo 2 sheet:\n' +
    '  • "Dự trù"  — chi phí ước tính (sửa thoải mái)\n' +
    '  • "Thực tế" — tự điền khi đã chi\n\n' +
    'App tự cập nhật khi F5 refresh trình duyệt.'
  );
}

// ─────────────────────────────────────────────────────────────
// SHEET 1: DỰ TRÙ
// ─────────────────────────────────────────────────────────────
function _setupBudgetSheet(ss) {
  let sheet = ss.getSheetByName('Dự trù');
  if (sheet) sheet.clear(); else sheet = ss.insertSheet('Dự trù');

  // Header
  const headers = ['Ngày', 'Danh mục', 'Khoản mục', 'Đơn giá', 'Số lượng', 'Đơn vị', 'Thành tiền', 'Ghi chú'];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#1C4B3A').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);

  // ─ Data ────────────────────────────────────────────────────
  // [Ngày, Danh mục, Khoản mục, Đơn giá, Số lượng, Đơn vị, Thành tiền, Ghi chú]
  const SL = 6; // số người — đổi theo nhóm
  const rows = [
    // ─ Ngày 1 ─
    [1,'Di chuyển', 'Xe 16 chỗ HN → Ninh Bình',  1500000, 1,  'chuyến', '=D2*E2',   'Chia đều cho cả nhóm'],
    [1,'Lưu trú',   'Homestay (2 đêm)',             350000, SL*2,'đêm·người','=D3*E3', 'Check-in ngay khi đến'],
    [1,'Ăn uống',   'Ăn tối — Dê núi Tràng An',    150000, SL, 'người',   '=D4*E4',  'Cơm niêu + dê tái chanh'],
    [1,'Tham quan', 'Phố Cổ Hoa Lư — vé vào',       20000, SL, 'người',   '=D5*E5',  'Đền Đinh + Đền Lê'],

    // ─ Ngày 2 ─
    [2,'Ăn uống',   'Ăn sáng — bún chả quạt',       50000, SL, 'người',   '=D6*E6',  ''],
    [2,'Tham quan', 'Tràng An — vé thuyền',          250000, SL, 'người',   '=D7*E7',  'Đặt trước 8h sáng'],
    [2,'Ăn uống',   'Ăn trưa gần Tràng An',          80000, SL, 'người',   '=D8*E8',  'Tránh quán cổng chính'],
    [2,'Tham quan', 'Chùa Bích Động — vé',           20000, SL, 'người',   '=D9*E9',  ''],
    [2,'Tham quan', 'Thung Nham — vé',              150000, SL, 'người',   '=D10*E10','Xem chim về tổ hoàng hôn'],
    [2,'Tham quan', 'Show Anh Hùng Cờ Lau',         250000, SL, 'người',   '=D11*E11','Đặt vé trước'],
    [2,'Ăn uống',   'Ăn tối — Nhà hàng Madam Thư',  160000, SL, 'người',   '=D12*E12','Dê sốt vang + lẩu dê'],

    // ─ Ngày 3 ─
    [3,'Ăn uống',   'Ăn sáng — Bánh cuốn Hương Hương', 50000, SL, 'người', '=D13*E13','Ghé trước 8h kẻo hết'],
    [3,'Tham quan', 'Hang Múa — vé leo 500 bậc',    100000, SL, 'người',   '=D14*E14','Mang giày thể thao'],
    [3,'Ăn uống',   'Ăn trưa Cơm Cháy',             100000, SL, 'người',   '=D15*E15','Mua thêm hộp làm quà'],
    [3,'Di chuyển', 'Xe 16 chỗ Ninh Bình → HN',    1500000, 1,  'chuyến',  '=D16*E16',''],

    // ─ Phát sinh ─
    ['','Khác',     'Xăng xe máy thuê / Grab',       300000, SL, 'người',   '=D17*E17','Ước tính đi lại trong ngày'],
    ['','Khác',     'Nước uống + snack',              50000, SL*3,'suất',    '=D18*E18',''],
    ['','Khác',     'Dự phòng phát sinh',             200000, SL, 'người',   '=D19*E19','Nên giữ sẵn'],
  ];

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Format số tiền
  sheet.getRange('D2:D100').setNumberFormat('#,##0 "đ"');
  sheet.getRange('G2:G100').setNumberFormat('#,##0 "đ"');

  // Màu xen kẽ theo ngày
  const dayColors = { 1: '#FEF9EE', 2: '#EEF6FB', 3: '#EEF7F0', '': '#F8F7F5' };
  rows.forEach((r, i) => {
    const bg = dayColors[r[0]] ?? '#F8F7F5';
    sheet.getRange(i + 2, 1, 1, headers.length).setBackground(bg);
  });

  // Dòng TỔNG
  const totalRow = rows.length + 2;
  sheet.getRange(totalRow, 1, 1, headers.length)
    .setValues([['', '', 'TỔNG DỰ TRÙ', '', '', '', `=SUM(G2:G${totalRow - 1})`, '']]);
  sheet.getRange(totalRow, 1, 1, headers.length)
    .setBackground('#1C4B3A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(totalRow, 7).setNumberFormat('#,##0 "đ"');

  // Per-person tổng
  const ppRow = totalRow + 1;
  sheet.getRange(ppRow, 6, 1, 2)
    .setValues([[`Mỗi người (/${SL})`, `=G${totalRow}/${SL}`]]);
  sheet.getRange(ppRow, 7).setNumberFormat('#,##0 "đ"').setFontWeight('bold');

  // Column widths
  [90, 110, 260, 100, 90, 100, 110, 280].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.setFrozenRows(1);

  // Dropdown Ngày
  const dayRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['1','2','3',''], true).setAllowInvalid(true).build();
  sheet.getRange('A2:A100').setDataValidation(dayRule);

  // Dropdown Danh mục
  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Di chuyển','Lưu trú','Ăn uống','Tham quan','Khác'], true).build();
  sheet.getRange('B2:B100').setDataValidation(catRule);
}

// ─────────────────────────────────────────────────────────────
// SHEET 2: THỰC TẾ
// ─────────────────────────────────────────────────────────────
function _setupActualSheet(ss) {
  let sheet = ss.getSheetByName('Thực tế');
  if (sheet) sheet.clear(); else sheet = ss.insertSheet('Thực tế');

  const headers = ['Ngày', 'Danh mục', 'Khoản mục', 'Ai trả', 'Số tiền', 'Ghi chú'];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground('#2C1A4A').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);

  // Vài dòng mẫu trống để người dùng biết cấu trúc
  const sample = [
    [1, 'Di chuyển', 'Xe 16 chỗ HN → Ninh Bình', '', '', ''],
    [1, 'Lưu trú',   'Homestay 2 đêm',            '', '', ''],
  ];
  sheet.getRange(2, 1, sample.length, headers.length)
    .setValues(sample)
    .setBackground('#F5F3FF');

  sheet.getRange('E2:E100').setNumberFormat('#,##0 "đ"');

  // Dòng TỔNG
  const totalRow = 102;
  sheet.getRange(totalRow, 4, 1, 2)
    .setValues([['TỔNG THỰC TẾ', `=SUM(E2:E${totalRow - 1})`]]);
  sheet.getRange(totalRow, 4, 1, 2)
    .setBackground('#2C1A4A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(totalRow, 5).setNumberFormat('#,##0 "đ"');

  [90, 110, 260, 120, 110, 280].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.setFrozenRows(1);

  const dayRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['1','2','3',''], true).setAllowInvalid(true).build();
  sheet.getRange('A2:A100').setDataValidation(dayRule);

  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Di chuyển','Lưu trú','Ăn uống','Tham quan','Khác'], true).build();
  sheet.getRange('B2:B100').setDataValidation(catRule);
}
