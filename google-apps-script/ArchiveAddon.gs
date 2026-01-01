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
    .addItem('🏁 End Month (Full Backup)', 'endMonthBackup_')
    .addSeparator()
    .addItem('View Archives', 'viewArchives_')
    .addItem('View Raw Backups', 'viewRawBackups_')
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

  var newSheet = findSheet_(ss, ['New Car Tracker', 'New', 'NEW', 'New Cars']);
  var usedSheet = findSheet_(ss, ['Used Car Tracker', 'Used', 'USED', 'Used Cars']);

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

// ============================================
// END MONTH - Full Raw Data Backup
// ============================================

function endMonthBackup_() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '🏁 End Month Backup',
    'This will create a raw data backup of the PREVIOUS month with all deal details.\n\n' +
    'This includes deal numbers, customer names, and all data for callbacks.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth(); // Previous month (0-indexed = previous)
  if (month === 0) { month = 12; year--; }

  createRawBackup_(year, month);
}

function createRawBackup_(year, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var newSheet = findSheet_(ss, ['New Car Tracker', 'New', 'NEW', 'New Cars']);
  var usedSheet = findSheet_(ss, ['Used Car Tracker', 'Used', 'USED', 'Used Cars']);

  if (!newSheet || !usedSheet) {
    ui.alert('Cannot find New Car Tracker or Used Car Tracker sheet!');
    return;
  }

  var monthName = getMonthName_(month);
  var backupName = monthName + ' ' + year + ' - Raw Backup';

  // Check if backup already exists
  var existingBackup = ss.getSheetByName(backupName);
  if (existingBackup) {
    var overwrite = ui.alert(
      'Backup Exists',
      'A backup for ' + monthName + ' ' + year + ' already exists.\n\nOverwrite it?',
      ui.ButtonSet.YES_NO
    );
    if (overwrite !== ui.Button.YES) return;
    ss.deleteSheet(existingBackup);
  }

  // Create new backup sheet
  var backupSheet = ss.insertSheet(backupName);

  // Get NEW car data with headers
  var newData = newSheet.getDataRange().getValues();
  var newHeaders = newData[0]; // First row is headers
  var newSales = filterByMonth_(newData, NEW_COLS.date, year, month);

  // Get USED car data with headers
  var usedData = usedSheet.getDataRange().getValues();
  var usedHeaders = usedData[0];
  var usedSales = filterByMonth_(usedData, USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ss.deleteSheet(backupSheet);
    ui.alert('No sales found for ' + monthName + ' ' + year);
    return;
  }

  var currentRow = 1;

  // ===== NEW CARS SECTION =====
  backupSheet.getRange(currentRow, 1, 1, newHeaders.length).merge()
    .setValue('🚗 NEW CARS - ' + monthName + ' ' + year + ' (' + newSales.length + ' deals)')
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold');
  currentRow++;

  // New car headers
  backupSheet.getRange(currentRow, 1, 1, newHeaders.length).setValues([newHeaders])
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  currentRow++;

  // New car data
  if (newSales.length > 0) {
    backupSheet.getRange(currentRow, 1, newSales.length, newSales[0].length).setValues(newSales);

    // Alternate row colors for readability
    for (var i = 0; i < newSales.length; i++) {
      if (i % 2 === 1) {
        backupSheet.getRange(currentRow + i, 1, 1, newSales[0].length).setBackground('#f0f9ff');
      }
    }
    currentRow += newSales.length;
  }

  // Gap row
  currentRow += 2;

  // ===== USED CARS SECTION =====
  backupSheet.getRange(currentRow, 1, 1, usedHeaders.length).merge()
    .setValue('🚙 USED CARS - ' + monthName + ' ' + year + ' (' + usedSales.length + ' deals)')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold');
  currentRow++;

  // Used car headers
  backupSheet.getRange(currentRow, 1, 1, usedHeaders.length).setValues([usedHeaders])
    .setBackground('#4c1d95')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  currentRow++;

  // Used car data
  if (usedSales.length > 0) {
    backupSheet.getRange(currentRow, 1, usedSales.length, usedSales[0].length).setValues(usedSales);

    // Alternate row colors for readability
    for (var j = 0; j < usedSales.length; j++) {
      if (j % 2 === 1) {
        backupSheet.getRange(currentRow + j, 1, 1, usedSales[0].length).setBackground('#faf5ff');
      }
    }
    currentRow += usedSales.length;
  }

  // Gap row
  currentRow += 2;

  // ===== SUMMARY SECTION =====
  backupSheet.getRange(currentRow, 1, 1, 6).merge()
    .setValue('📊 MONTH SUMMARY')
    .setBackground('#059669')
    .setFontColor('#ffffff')
    .setFontSize(12)
    .setFontWeight('bold');
  currentRow++;

  // Calculate totals
  var gmcUnits = 0, buickUnits = 0, newFront = 0, newBack = 0;
  for (var k = 0; k < newSales.length; k++) {
    var make = String(newSales[k][NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) gmcUnits++;
    if (make.includes('BUICK')) buickUnits++;
    newFront += parseNum_(newSales[k][NEW_COLS.frontEnd]);
    newBack += parseNum_(newSales[k][NEW_COLS.backEnd]);
  }

  var usedFront = 0, usedBack = 0;
  for (var l = 0; l < usedSales.length; l++) {
    usedFront += parseNum_(usedSales[l][USED_COLS.frontEnd]);
    usedBack += parseNum_(usedSales[l][USED_COLS.backEnd]);
  }

  var summaryData = [
    ['', 'Units', 'Goal', 'Status', 'Front End', 'Back End', 'Total'],
    ['GMC', gmcUnits, GMC_GOAL, gmcUnits >= GMC_GOAL ? 'MET ✓' : 'NOT MET', '', '', ''],
    ['Buick', buickUnits, BUICK_GOAL, buickUnits >= BUICK_GOAL ? 'MET ✓' : 'NOT MET', '', '', ''],
    ['New Total', newSales.length, '', '', newFront, newBack, newFront + newBack],
    ['Used Total', usedSales.length, USED_GOAL, usedSales.length >= USED_GOAL ? 'MET ✓' : 'NOT MET', usedFront, usedBack, usedFront + usedBack],
    ['GRAND TOTAL', newSales.length + usedSales.length, '', '', newFront + usedFront, newBack + usedBack, newFront + newBack + usedFront + usedBack]
  ];

  backupSheet.getRange(currentRow, 1, summaryData.length, 7).setValues(summaryData);

  // Format summary headers
  backupSheet.getRange(currentRow, 1, 1, 7).setBackground('#065f46').setFontColor('#ffffff').setFontWeight('bold');

  // Format Grand Total row
  backupSheet.getRange(currentRow + 5, 1, 1, 7).setBackground('#d1fae5').setFontWeight('bold');

  // Format currency columns
  for (var m = currentRow + 1; m <= currentRow + 5; m++) {
    backupSheet.getRange(m, 5).setNumberFormat('$#,##0');
    backupSheet.getRange(m, 6).setNumberFormat('$#,##0');
    backupSheet.getRange(m, 7).setNumberFormat('$#,##0');
  }

  // Auto-resize columns
  for (var c = 1; c <= Math.max(newHeaders.length, usedHeaders.length); c++) {
    backupSheet.autoResizeColumn(c);
  }

  // Freeze header row
  backupSheet.setFrozenRows(0);

  backupSheet.activate();

  ui.alert('✅ Raw Backup Created!\n\n' +
    'Sheet: "' + backupName + '"\n\n' +
    'NEW CARS: ' + newSales.length + ' deals\n' +
    '  - GMC: ' + gmcUnits + '\n' +
    '  - Buick: ' + buickUnits + '\n\n' +
    'USED CARS: ' + usedSales.length + ' deals\n\n' +
    'All deal numbers and customer info preserved for callbacks!');
}

function viewRawBackups_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var backups = [];

  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().includes('Raw Backup')) {
      backups.push(sheets[i].getName());
    }
  }

  if (backups.length === 0) {
    SpreadsheetApp.getUi().alert('No raw backups found!\n\nUse "End Month (Full Backup)" to create one.');
    return;
  }

  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    'Raw Backups Available',
    'Found ' + backups.length + ' backup(s):\n\n' + backups.join('\n') + '\n\nEnter the month name to view (e.g., "December 2024"):',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  var searchName = result.getResponseText().trim() + ' - Raw Backup';
  var sheet = ss.getSheetByName(searchName);

  if (sheet) {
    sheet.activate();
  } else {
    ui.alert('Could not find: "' + searchName + '"');
  }
}
