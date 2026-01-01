// ============================================
// ARCHIVE ADD-ON - Paste at END of Code.gs
// Then add: addArchiveMenu_(); to your onOpen()
// ============================================

// NEW sheet columns: Date | Deal # | Stock # | Make | Model | Year | Customer | Lead Type | Salesperson | Trade In | Trade Value | Sale Price | Front End Profit | Back End Profit | Total Profit | Financing | Warranty | D2E | Notes
var NEW_COLS = {
  date: 0,       // Column A
  make: 3,       // Column D - Make (GMC/Buick)
  frontEnd: 12,  // Column M - Front End Profit
  backEnd: 13    // Column N - Back End Profit
};

// USED sheet columns: Date | Deal # | Stock # | Year | Make | Model | Customer | Lead Type | Salesperson | Trade In | Trade Value | Sale Price | Front End Profit | Back End Profit | Total Profit | Financing | Warranty | Notes
var USED_COLS = {
  date: 0,       // Column A
  frontEnd: 12,  // Column M - Front End Profit
  backEnd: 13    // Column N - Back End Profit
};

var GMC_GOAL = 21;
var BUICK_GOAL = 9;
var USED_GOAL = 75;

function addArchiveMenu_() {
  SpreadsheetApp.getUi().createMenu('📁 Archive')
    .addItem('Archive Current Month', 'archiveCurrentMonth_')
    .addItem('Archive Previous Month', 'archivePreviousMonth_')
    .addSeparator()
    .addItem('View Archives', 'viewArchives_')
    .addToUi();
}

function archiveCurrentMonth_() {
  var now = new Date();
  runArchive_(now.getFullYear(), now.getMonth() + 1);
}

function archivePreviousMonth_() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  if (month === 0) { month = 12; year--; }
  runArchive_(year, month);
}

function runArchive_(year, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var newSheet = findSheet_(ss, ['New', 'NEW', 'New Cars']);
  var usedSheet = findSheet_(ss, ['Used', 'USED', 'Used Cars']);

  if (!newSheet || !usedSheet) {
    ui.alert('Cannot find New or Used sheet!');
    return;
  }

  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    setupThreeCharts_(archiveSheet);
  }

  var newData = newSheet.getDataRange().getValues();
  var newSales = filterByMonth_(newData, NEW_COLS.date, year, month);

  var usedData = usedSheet.getDataRange().getValues();
  var usedSales = filterByMonth_(usedData, USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ui.alert('No sales found for ' + getMonthName_(month) + ' ' + year);
    return;
  }

  // Calculate NEW results
  var gmcUnits = 0, buickUnits = 0, newFront = 0, newBack = 0;
  for (var i = 0; i < newSales.length; i++) {
    var make = String(newSales[i][NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) gmcUnits++;
    if (make.includes('BUICK')) buickUnits++;
    newFront += parseNum_(newSales[i][NEW_COLS.frontEnd]);
    newBack += parseNum_(newSales[i][NEW_COLS.backEnd]);
  }
  var newTotal = newFront + newBack;
  var newUnits = newSales.length;

  // Calculate USED results
  var usedUnits = usedSales.length;
  var usedFront = 0, usedBack = 0;
  for (var j = 0; j < usedSales.length; j++) {
    usedFront += parseNum_(usedSales[j][USED_COLS.frontEnd]);
    usedBack += parseNum_(usedSales[j][USED_COLS.backEnd]);
  }
  var usedTotal = usedFront + usedBack;

  // Calculate COMBINED
  var combinedUnits = newUnits + usedUnits;
  var combinedFront = newFront + usedFront;
  var combinedBack = newBack + usedBack;
  var combinedGross = newTotal + usedTotal;

  var monthName = getMonthName_(month) + ' ' + year;
  var monthKey = year + '-' + String(month).padStart(2, '0');

  // Find existing row or get next row (starts at row 4)
  var dataStart = 4;
  var lastRow = findLastDataRow_(archiveSheet, 1, dataStart);
  var existingRow = findMonthRow_(archiveSheet, 1, dataStart, lastRow, monthKey);
  var dataRow = existingRow > 0 ? existingRow : lastRow + 1;

  // Write NEW CARS data (columns A-J)
  var newRowData = [
    monthKey,                                    // A: Key (hidden)
    new Date().toLocaleDateString(),             // B: Date
    monthName,                                   // C: Month
    gmcUnits,                                    // D: GMC Sold
    gmcUnits >= GMC_GOAL ? 'MET' : 'NOT MET',   // E: GMC Status
    buickUnits,                                  // F: Buick Sold
    buickUnits >= BUICK_GOAL ? 'MET' : 'NOT MET', // G: Buick Status
    newFront,                                    // H: Front End
    newBack,                                     // I: Back End
    newTotal                                     // J: Total
  ];
  archiveSheet.getRange(dataRow, 1, 1, newRowData.length).setValues([newRowData]);

  // Write USED CARS data (columns L-Q)
  var usedColStart = 12; // Column L
  var usedRowData = [
    monthName,                                   // L: Month
    usedUnits,                                   // M: Units Sold
    usedUnits >= USED_GOAL ? 'MET' : 'NOT MET', // N: Status
    usedFront,                                   // O: Front End
    usedBack,                                    // P: Back End
    usedTotal                                    // Q: Total
  ];
  archiveSheet.getRange(dataRow, usedColStart, 1, usedRowData.length).setValues([usedRowData]);

  // Write COMBINED data (columns S-W)
  var combinedColStart = 19; // Column S
  var combinedRowData = [
    monthName,                                   // T: Month
    combinedUnits,                               // U: Total Units
    combinedFront,                               // V: Total Front End
    combinedBack,                                // W: Total Back End
    combinedGross                                // X: Total Gross
  ];
  archiveSheet.getRange(dataRow, combinedColStart, 1, combinedRowData.length).setValues([combinedRowData]);

  // Format the row
  formatDataRow_(archiveSheet, dataRow);

  archiveSheet.activate();

  ui.alert('✅ ' + monthName + ' Archived!\n\n' +
    'NEW: GMC ' + gmcUnits + ' | Buick ' + buickUnits + '\n' +
    'USED: ' + usedUnits + ' units\n\n' +
    'COMBINED:\n' +
    '  Units: ' + combinedUnits + '\n' +
    '  Gross: $' + combinedGross.toLocaleString());
}

function setupThreeCharts_(sheet) {
  // ===== NEW CARS (Columns A-J) =====
  sheet.getRange(1, 1, 1, 10).merge()
    .setValue('🚗 NEW CARS')
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(2, 1, 1, 10).merge()
    .setValue('GMC Goal: ' + GMC_GOAL + '  |  Buick Goal: ' + BUICK_GOAL)
    .setBackground('#dbeafe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  var newHeaders = ['Key', 'Date', 'Month', 'GMC Sold', 'GMC', 'Buick Sold', 'Buick', 'Front End', 'Back End', 'Total'];
  sheet.getRange(3, 1, 1, newHeaders.length).setValues([newHeaders])
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // ===== USED CARS (Columns L-Q) =====
  var usedStart = 12;

  sheet.getRange(1, usedStart, 1, 6).merge()
    .setValue('🚙 USED CARS')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(2, usedStart, 1, 6).merge()
    .setValue('Used Goal: ' + USED_GOAL)
    .setBackground('#ede9fe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  var usedHeaders = ['Month', 'Units Sold', 'Status', 'Front End', 'Back End', 'Total'];
  sheet.getRange(3, usedStart, 1, usedHeaders.length).setValues([usedHeaders])
    .setBackground('#4c1d95')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // ===== COMBINED TOTALS (Columns S-W) =====
  var combStart = 19;

  sheet.getRange(1, combStart, 1, 5).merge()
    .setValue('📊 COMBINED TOTALS')
    .setBackground('#059669')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(2, combStart, 1, 5).merge()
    .setValue('New + Used')
    .setBackground('#d1fae5')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  var combHeaders = ['Month', 'Total Units', 'Total Front', 'Total Back', 'Total Gross'];
  sheet.getRange(3, combStart, 1, combHeaders.length).setValues([combHeaders])
    .setBackground('#065f46')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Gap columns
  sheet.setColumnWidth(11, 20); // K (gap between NEW and USED)
  sheet.setColumnWidth(18, 20); // R (gap between USED and COMBINED)
  sheet.getRange(1, 11, 3, 1).setBackground('#f3f4f6');
  sheet.getRange(1, 18, 3, 1).setBackground('#f3f4f6');

  // Hide key column
  sheet.hideColumns(1);  // A

  // Freeze header rows
  sheet.setFrozenRows(3);

  // Set column widths
  for (var c = 2; c <= 10; c++) sheet.setColumnWidth(c, 85);
  for (var d = 12; d <= 17; d++) sheet.setColumnWidth(d, 85);
  for (var e = 19; e <= 23; e++) sheet.setColumnWidth(e, 90);
}

function formatDataRow_(sheet, row) {
  // NEW: Currency (H, I, J)
  sheet.getRange(row, 8).setNumberFormat('$#,##0');
  sheet.getRange(row, 9).setNumberFormat('$#,##0');
  sheet.getRange(row, 10).setNumberFormat('$#,##0').setFontWeight('bold').setBackground('#dbeafe');

  // NEW: GMC status (E)
  var gmcCell = sheet.getRange(row, 5);
  if (gmcCell.getValue() === 'MET') {
    gmcCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    gmcCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // NEW: Buick status (G)
  var buickCell = sheet.getRange(row, 7);
  if (buickCell.getValue() === 'MET') {
    buickCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    buickCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // USED: Currency (O, P, Q = 15, 16, 17)
  sheet.getRange(row, 15).setNumberFormat('$#,##0');
  sheet.getRange(row, 16).setNumberFormat('$#,##0');
  sheet.getRange(row, 17).setNumberFormat('$#,##0').setFontWeight('bold').setBackground('#ede9fe');

  // USED: Status (N = 14)
  var usedCell = sheet.getRange(row, 14);
  if (usedCell.getValue() === 'MET') {
    usedCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    usedCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // COMBINED: Units (T = 20) highlighted
  sheet.getRange(row, 20).setFontWeight('bold').setBackground('#fef3c7');

  // COMBINED: Currency (U, V, W = 21, 22, 23)
  sheet.getRange(row, 21).setNumberFormat('$#,##0');
  sheet.getRange(row, 22).setNumberFormat('$#,##0');
  sheet.getRange(row, 23).setNumberFormat('$#,##0').setFontWeight('bold').setBackground('#d1fae5');
}

function findLastDataRow_(sheet, col, startRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return startRow - 1;
  for (var r = lastRow; r >= startRow; r--) {
    if (sheet.getRange(r, col).getValue() !== '') return r;
  }
  return startRow - 1;
}

function findMonthRow_(sheet, col, startRow, endRow, monthKey) {
  if (endRow < startRow) return -1;
  for (var r = startRow; r <= endRow; r++) {
    if (sheet.getRange(r, col).getValue() === monthKey) return r;
  }
  return -1;
}

function findSheet_(ss, names) {
  for (var i = 0; i < names.length; i++) {
    var sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  return null;
}

function filterByMonth_(data, dateCol, year, month) {
  var sales = [];
  for (var i = 1; i < data.length; i++) {
    var dateVal = data[i][dateCol];
    if (!dateVal) continue;
    var d = new Date(dateVal);
    if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() + 1 === month) {
      sales.push(data[i]);
    }
  }
  return sales;
}

function parseNum_(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  var num = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(num) ? 0 : num;
}

function viewArchives_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archive');
  if (sheet) sheet.activate();
  else SpreadsheetApp.getUi().alert('No archives yet!');
}

function getMonthName_(m) {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][m-1];
}
