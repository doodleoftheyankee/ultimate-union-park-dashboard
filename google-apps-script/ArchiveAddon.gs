// ============================================
// ARCHIVE ADD-ON - Paste at END of Code.gs
// Then add: addArchiveMenu_(); to your onOpen()
// ============================================

var NEW_COLS = {
  date: 0, make: 4, frontEnd: 12, backEnd: 13
};

var USED_COLS = {
  date: 0, frontEnd: 12, backEnd: 13
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
    setupTwoCharts_(archiveSheet);
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

  var combinedUnits = newUnits + usedUnits;
  var monthName = getMonthName_(month) + ' ' + year;
  var monthKey = year + '-' + String(month).padStart(2, '0');

  // Find existing row or get next row for NEW table (starts at row 4)
  var newTableStart = 4;
  var lastNewRow = findLastDataRow_(archiveSheet, 1, newTableStart);
  var existingNewRow = findMonthRow_(archiveSheet, 1, newTableStart, lastNewRow, monthKey);
  var newRow = existingNewRow > 0 ? existingNewRow : lastNewRow + 1;

  // Find existing row or get next row for USED table (starts at row 4)
  var usedTableCol = 9; // Column I
  var lastUsedRow = findLastDataRow_(archiveSheet, usedTableCol, newTableStart);
  var existingUsedRow = findMonthRow_(archiveSheet, usedTableCol, newTableStart, lastUsedRow, monthKey);
  var usedRow = existingUsedRow > 0 ? existingUsedRow : lastUsedRow + 1;

  // Make sure both tables stay aligned (same row)
  var dataRow = Math.max(newRow, usedRow);

  // Write NEW CARS data (columns A-G)
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

  // Write USED CARS data (columns L-R)
  var usedColStart = 12; // Column L
  var usedRowData = [
    monthKey,                                    // L: Key (hidden)
    monthName,                                   // M: Month
    usedUnits,                                   // N: Units Sold
    usedUnits >= USED_GOAL ? 'MET' : 'NOT MET', // O: Status
    usedFront,                                   // P: Front End
    usedBack,                                    // Q: Back End
    usedTotal,                                   // R: Total
    combinedUnits                                // S: Combined Units
  ];
  archiveSheet.getRange(dataRow, usedColStart, 1, usedRowData.length).setValues([usedRowData]);

  // Format the row
  formatDataRow_(archiveSheet, dataRow);

  archiveSheet.activate();

  ui.alert('✅ ' + monthName + ' Archived!\n\n' +
    'NEW CARS:\n' +
    '  GMC: ' + gmcUnits + '/' + GMC_GOAL + (gmcUnits >= GMC_GOAL ? ' ✓' : '') + '\n' +
    '  Buick: ' + buickUnits + '/' + BUICK_GOAL + (buickUnits >= BUICK_GOAL ? ' ✓' : '') + '\n' +
    '  Gross: $' + newTotal.toLocaleString() + '\n\n' +
    'USED CARS:\n' +
    '  Units: ' + usedUnits + '/' + USED_GOAL + (usedUnits >= USED_GOAL ? ' ✓' : '') + '\n' +
    '  Gross: $' + usedTotal.toLocaleString() + '\n\n' +
    'COMBINED: ' + combinedUnits + ' units');
}

function setupTwoCharts_(sheet) {
  // ===== NEW CARS SECTION (Columns A-J) =====
  // Title row
  sheet.getRange(1, 1, 1, 10).merge()
    .setValue('🚗 NEW CARS')
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Goals row
  sheet.getRange(2, 1, 1, 10).merge()
    .setValue('GMC Goal: ' + GMC_GOAL + '  |  Buick Goal: ' + BUICK_GOAL)
    .setBackground('#dbeafe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Headers row
  var newHeaders = ['Key', 'Date', 'Month', 'GMC Sold', 'GMC', 'Buick Sold', 'Buick', 'Front End', 'Back End', 'Total'];
  sheet.getRange(3, 1, 1, newHeaders.length).setValues([newHeaders])
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // ===== USED CARS SECTION (Columns L-S) =====
  var usedStart = 12; // Column L

  // Title row
  sheet.getRange(1, usedStart, 1, 8).merge()
    .setValue('🚙 USED CARS')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Goals row
  sheet.getRange(2, usedStart, 1, 8).merge()
    .setValue('Used Goal: ' + USED_GOAL)
    .setBackground('#ede9fe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // Headers row
  var usedHeaders = ['Key', 'Month', 'Units Sold', 'Status', 'Front End', 'Back End', 'Total', 'Combined'];
  sheet.getRange(3, usedStart, 1, usedHeaders.length).setValues([usedHeaders])
    .setBackground('#4c1d95')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // Gap column (K)
  sheet.setColumnWidth(11, 30);
  sheet.getRange(1, 11, 3, 1).setBackground('#f3f4f6');

  // Hide key columns
  sheet.hideColumns(1);  // Column A
  sheet.hideColumns(12); // Column L

  // Freeze header rows
  sheet.setFrozenRows(3);

  // Set column widths
  for (var c = 2; c <= 10; c++) sheet.setColumnWidth(c, 90);
  for (var d = 13; d <= 19; d++) sheet.setColumnWidth(d, 90);
}

function formatDataRow_(sheet, row) {
  // NEW section currency (columns H, I, J = 8, 9, 10)
  sheet.getRange(row, 8).setNumberFormat('$#,##0');
  sheet.getRange(row, 9).setNumberFormat('$#,##0');
  sheet.getRange(row, 10).setNumberFormat('$#,##0').setFontWeight('bold').setBackground('#dbeafe');

  // NEW GMC status (column E = 5)
  var gmcCell = sheet.getRange(row, 5);
  if (gmcCell.getValue() === 'MET') {
    gmcCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    gmcCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // NEW Buick status (column G = 7)
  var buickCell = sheet.getRange(row, 7);
  if (buickCell.getValue() === 'MET') {
    buickCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    buickCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // USED section currency (columns O, P, Q = 15, 16, 17)
  sheet.getRange(row, 15).setNumberFormat('$#,##0');
  sheet.getRange(row, 16).setNumberFormat('$#,##0');
  sheet.getRange(row, 17).setNumberFormat('$#,##0').setFontWeight('bold').setBackground('#ede9fe');

  // USED status (column N = 14)
  var usedCell = sheet.getRange(row, 14);
  if (usedCell.getValue() === 'MET') {
    usedCell.setBackground('#d4edda').setFontColor('#155724').setFontWeight('bold');
  } else {
    usedCell.setBackground('#f8d7da').setFontColor('#721c24').setFontWeight('bold');
  }

  // Combined units (column S = 19)
  sheet.getRange(row, 19).setFontWeight('bold').setBackground('#fef3c7');
}

function findLastDataRow_(sheet, col, startRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return startRow - 1;

  for (var r = lastRow; r >= startRow; r--) {
    var val = sheet.getRange(r, col).getValue();
    if (val !== '') return r;
  }
  return startRow - 1;
}

function findMonthRow_(sheet, col, startRow, endRow, monthKey) {
  if (endRow < startRow) return -1;

  for (var r = startRow; r <= endRow; r++) {
    if (sheet.getRange(r, col).getValue() === monthKey) {
      return r;
    }
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
