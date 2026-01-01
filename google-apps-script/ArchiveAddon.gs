// ============================================
// ARCHIVE ADD-ON - Paste at END of Code.gs
// Then add: addArchiveMenu_(); to your onOpen()
// ============================================

var NEW_COLS = {
  date: 0, make: 4, salesperson: 8, frontEnd: 12, backEnd: 13, totalProfit: 14
};

var USED_COLS = {
  date: 0, salesperson: 8, frontEnd: 12, backEnd: 13, totalProfit: 14
};

// Goals
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
    setupHeaders_(archiveSheet);
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

  // Calculate USED results
  var usedUnits = usedSales.length;
  var usedFront = 0, usedBack = 0;
  for (var j = 0; j < usedSales.length; j++) {
    usedFront += parseNum_(usedSales[j][USED_COLS.frontEnd]);
    usedBack += parseNum_(usedSales[j][USED_COLS.backEnd]);
  }
  var usedTotal = usedFront + usedBack;

  // Combined
  var totalUnits = newSales.length + usedUnits;

  var monthName = getMonthName_(month) + ' ' + year;
  var monthKey = year + '-' + String(month).padStart(2, '0');

  // Check if month exists
  var lastRow = archiveSheet.getLastRow();
  var existingRow = -1;
  if (lastRow > 1) {
    var keys = archiveSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var k = 0; k < keys.length; k++) {
      if (keys[k][0] === monthKey) {
        existingRow = k + 2;
        break;
      }
    }
  }

  var row = existingRow > 0 ? existingRow : lastRow + 1;

  // Write the row
  var data = [
    monthKey,                        // A: Key
    new Date().toLocaleDateString(), // B: Date Archived
    monthName,                       // C: Month
    GMC_GOAL,                        // D: GMC Goal
    gmcUnits,                        // E: GMC Sold
    gmcUnits >= GMC_GOAL ? 'MET' : 'NOT MET',  // F: GMC Status
    BUICK_GOAL,                      // G: Buick Goal
    buickUnits,                      // H: Buick Sold
    buickUnits >= BUICK_GOAL ? 'MET' : 'NOT MET', // I: Buick Status
    newFront,                        // J: New Front End
    newBack,                         // K: New Back End
    newTotal,                        // L: New Total
    USED_GOAL,                       // M: Used Goal
    usedUnits,                       // N: Used Sold
    usedUnits >= USED_GOAL ? 'MET' : 'NOT MET', // O: Used Status
    usedFront,                       // P: Used Front End
    usedBack,                        // Q: Used Back End
    usedTotal,                       // R: Used Total
    totalUnits                       // S: Combined Units
  ];

  archiveSheet.getRange(row, 1, 1, data.length).setValues([data]);

  // Format
  formatRow_(archiveSheet, row);

  archiveSheet.activate();

  ui.alert('✅ ' + monthName + ' Archived!\n\n' +
    'NEW: GMC ' + gmcUnits + '/' + GMC_GOAL + ' | Buick ' + buickUnits + '/' + BUICK_GOAL + '\n' +
    'New Gross: $' + newTotal.toLocaleString() + '\n\n' +
    'USED: ' + usedUnits + '/' + USED_GOAL + '\n' +
    'Used Gross: $' + usedTotal.toLocaleString() + '\n\n' +
    'TOTAL UNITS: ' + totalUnits);
}

function setupHeaders_(sheet) {
  var headers = [
    'Key', 'Date', 'Month',
    'GMC Goal', 'GMC Sold', 'GMC',
    'Buick Goal', 'Buick Sold', 'Buick',
    'New Front', 'New Back', 'New Total',
    'Used Goal', 'Used Sold', 'Used',
    'Used Front', 'Used Back', 'Used Total',
    'Combined Units'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 80);
  sheet.hideColumns(1); // Hide the key column
}

function formatRow_(sheet, row) {
  // Currency formatting
  var currencyCols = [10, 11, 12, 16, 17, 18]; // New Front, New Back, New Total, Used Front, Used Back, Used Total
  for (var i = 0; i < currencyCols.length; i++) {
    sheet.getRange(row, currencyCols[i]).setNumberFormat('$#,##0');
  }

  // GMC Status (column 6)
  var gmcCell = sheet.getRange(row, 6);
  if (gmcCell.getValue() === 'MET') {
    gmcCell.setBackground('#d4edda').setFontColor('#155724');
  } else {
    gmcCell.setBackground('#f8d7da').setFontColor('#721c24');
  }

  // Buick Status (column 9)
  var buickCell = sheet.getRange(row, 9);
  if (buickCell.getValue() === 'MET') {
    buickCell.setBackground('#d4edda').setFontColor('#155724');
  } else {
    buickCell.setBackground('#f8d7da').setFontColor('#721c24');
  }

  // Used Status (column 15)
  var usedCell = sheet.getRange(row, 15);
  if (usedCell.getValue() === 'MET') {
    usedCell.setBackground('#d4edda').setFontColor('#155724');
  } else {
    usedCell.setBackground('#f8d7da').setFontColor('#721c24');
  }

  sheet.autoResizeColumns(2, 18);
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
