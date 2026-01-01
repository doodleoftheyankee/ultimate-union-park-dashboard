// ============================================
// ARCHIVE ADD-ON - Paste this at the END of your existing Code.gs
// ============================================
//
// IMPORTANT: After pasting, find your existing onOpen() function
// and add this line inside it:
//
//   addArchiveMenu_();
//
// ============================================

// Column positions for NEW sheet (0-indexed)
var NEW_COLS = {
  date: 0, dealNum: 1, stockNum: 2, year: 3, make: 4, model: 5,
  customer: 6, leadType: 7, salesperson: 8, tradeIn: 9, tradeValue: 10,
  salePrice: 11, frontEnd: 12, backEnd: 13, totalProfit: 14,
  financing: 15, warranty: 16, d2e: 17, notes: 18
};

// Column positions for USED sheet (0-indexed)
var USED_COLS = {
  date: 0, dealNum: 1, stockNum: 2, year: 3, make: 4, model: 5,
  customer: 6, leadType: 7, salesperson: 8, tradeIn: 9, tradeValue: 10,
  salePrice: 11, frontEnd: 12, backEnd: 13, totalProfit: 14,
  financing: 15, warranty: 16, notes: 17
};

function addArchiveMenu_() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 Archive')
    .addItem('Archive Current Month', 'archiveCurrentMonth_')
    .addItem('Archive Previous Month', 'archivePreviousMonth_')
    .addSeparator()
    .addItem('View All Archives', 'viewArchives_')
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

  var newSheet = findSheet_(ss, ['New', 'NEW', 'New Cars', 'New Deals']);
  if (!newSheet) {
    ui.alert('Cannot find New sheet!\n\nLooking for: New, NEW, New Cars, or New Deals');
    return;
  }

  var usedSheet = findSheet_(ss, ['Used', 'USED', 'Used Cars', 'Used Deals']);
  if (!usedSheet) {
    ui.alert('Cannot find Used sheet!\n\nLooking for: Used, USED, Used Cars, or Used Deals');
    return;
  }

  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
  }

  var newData = newSheet.getDataRange().getValues();
  var newSales = filterSalesByMonth_(newData, NEW_COLS.date, year, month);

  var usedData = usedSheet.getDataRange().getValues();
  var usedSales = filterSalesByMonth_(usedData, USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ui.alert('No sales found for ' + getMonthName_(month) + ' ' + year);
    return;
  }

  var newResults = calculateNewResults_(newSales);
  var usedResults = calculateUsedResults_(usedSales);

  var goals = { gmc: 21, buick: 9, used: 20, bonus: 375, minUnits: 4 };

  var gmcHit = newResults.gmcUnits >= goals.gmc;
  var buickHit = newResults.buickUnits >= goals.buick;
  var usedHit = usedResults.totalUnits >= goals.used;
  var d2eUnlocked = gmcHit && buickHit;

  var spData = calculateAllSalespersonData_(newSales, usedSales, goals, d2eUnlocked);

  var monthName = getMonthName_(month) + ' ' + year;
  var monthKey = year + '-' + String(month).padStart(2, '0');

  // Find if this month already exists
  var startRow = findMonthBlock_(archiveSheet, monthKey);
  if (startRow === -1) {
    // Add new block at the end
    startRow = archiveSheet.getLastRow() + 2;
    if (startRow < 2) startRow = 2;
  }

  // Clear existing block if updating
  if (archiveSheet.getLastRow() >= startRow) {
    var clearRange = archiveSheet.getRange(startRow, 1, 20, 20);
    clearRange.clear();
  }

  // Build the two-chart layout
  writeArchiveBlock_(archiveSheet, startRow, monthKey, monthName, goals, newResults, usedResults, gmcHit, buickHit, usedHit, d2eUnlocked, spData);

  archiveSheet.activate();

  var totalUnits = newResults.totalUnits + usedResults.totalUnits;
  var totalGross = newResults.totalGross + usedResults.totalGross;

  ui.alert('✅ ' + monthName + ' Archived!\n\n' +
    'NEW: ' + newResults.totalUnits + ' units | $' + newResults.totalGross.toLocaleString() + '\n' +
    'USED: ' + usedResults.totalUnits + ' units | $' + usedResults.totalGross.toLocaleString() + '\n\n' +
    'TOTAL: ' + totalUnits + ' units | $' + totalGross.toLocaleString() + '\n\n' +
    'D2E: ' + (d2eUnlocked ? 'UNLOCKED!' : 'Not Met'));
}

function writeArchiveBlock_(sheet, startRow, monthKey, monthName, goals, newResults, usedResults, gmcHit, buickHit, usedHit, d2eUnlocked, spData) {
  var row = startRow;

  // ===== MONTH HEADER =====
  sheet.getRange(row, 1).setValue(monthKey).setFontColor('#999999').setFontSize(8);
  sheet.getRange(row, 2, 1, 5).merge().setValue(monthName).setFontSize(16).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#ffffff');
  sheet.getRange(row, 8, 1, 5).merge().setValue('Archived: ' + new Date().toLocaleDateString()).setFontSize(10).setFontColor('#666666');
  row += 2;

  // ===== NEW CARS SECTION (Left) =====
  var newStartCol = 1;

  // NEW header
  sheet.getRange(row, newStartCol, 1, 5).merge().setValue('🚗 NEW CARS').setFontSize(14).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff').setHorizontalAlignment('center');

  // USED CARS SECTION header (Right) - same row
  var usedStartCol = 7;
  sheet.getRange(row, usedStartCol, 1, 5).merge().setValue('🚙 USED CARS').setFontSize(14).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff').setHorizontalAlignment('center');

  row++;

  // NEW sub-headers
  sheet.getRange(row, newStartCol).setValue('Metric').setFontWeight('bold').setBackground('#e5e7eb');
  sheet.getRange(row, newStartCol + 1).setValue('Goal').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue('Actual').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 3).setValue('Status').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 4).setValue('').setBackground('#e5e7eb');

  // USED sub-headers
  sheet.getRange(row, usedStartCol).setValue('Metric').setFontWeight('bold').setBackground('#e5e7eb');
  sheet.getRange(row, usedStartCol + 1).setValue('Goal').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 2).setValue('Actual').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 3).setValue('Status').setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 4).setValue('').setBackground('#e5e7eb');

  row++;

  // NEW - GMC row
  sheet.getRange(row, newStartCol).setValue('GMC Units');
  sheet.getRange(row, newStartCol + 1).setValue(goals.gmc).setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.gmcUnits).setHorizontalAlignment('center');
  setStatusCell_(sheet.getRange(row, newStartCol + 3), gmcHit);

  // USED - Units row
  sheet.getRange(row, usedStartCol).setValue('Used Units');
  sheet.getRange(row, usedStartCol + 1).setValue(goals.used).setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 2).setValue(usedResults.totalUnits).setHorizontalAlignment('center');
  setStatusCell_(sheet.getRange(row, usedStartCol + 3), usedHit);

  row++;

  // NEW - Buick row
  sheet.getRange(row, newStartCol).setValue('Buick Units');
  sheet.getRange(row, newStartCol + 1).setValue(goals.buick).setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.buickUnits).setHorizontalAlignment('center');
  setStatusCell_(sheet.getRange(row, newStartCol + 3), buickHit);

  // USED - Front End
  sheet.getRange(row, usedStartCol).setValue('Front End');
  sheet.getRange(row, usedStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 2).setValue(usedResults.frontEnd).setNumberFormat('$#,##0').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 3).setValue('').setHorizontalAlignment('center');

  row++;

  // NEW - Total Units
  sheet.getRange(row, newStartCol).setValue('Total New');
  sheet.getRange(row, newStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.totalUnits).setHorizontalAlignment('center').setFontWeight('bold');
  sheet.getRange(row, newStartCol + 3).setValue('').setHorizontalAlignment('center');

  // USED - Back End
  sheet.getRange(row, usedStartCol).setValue('Back End');
  sheet.getRange(row, usedStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 2).setValue(usedResults.backEnd).setNumberFormat('$#,##0').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 3).setValue('').setHorizontalAlignment('center');

  row++;

  // NEW - Front End
  sheet.getRange(row, newStartCol).setValue('Front End');
  sheet.getRange(row, newStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.frontEnd).setNumberFormat('$#,##0').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 3).setValue('').setHorizontalAlignment('center');

  // USED - Total Gross
  sheet.getRange(row, usedStartCol).setValue('Total Gross').setFontWeight('bold');
  sheet.getRange(row, usedStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, usedStartCol + 2).setValue(usedResults.totalGross).setNumberFormat('$#,##0').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#f3e8ff');
  sheet.getRange(row, usedStartCol + 3).setValue('').setHorizontalAlignment('center');

  row++;

  // NEW - Back End
  sheet.getRange(row, newStartCol).setValue('Back End');
  sheet.getRange(row, newStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.backEnd).setNumberFormat('$#,##0').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 3).setValue('').setHorizontalAlignment('center');

  row++;

  // NEW - Total Gross
  sheet.getRange(row, newStartCol).setValue('Total Gross').setFontWeight('bold');
  sheet.getRange(row, newStartCol + 1).setValue('-').setHorizontalAlignment('center');
  sheet.getRange(row, newStartCol + 2).setValue(newResults.totalGross).setNumberFormat('$#,##0').setHorizontalAlignment('center').setFontWeight('bold').setBackground('#dbeafe');
  sheet.getRange(row, newStartCol + 3).setValue('').setHorizontalAlignment('center');

  row += 2;

  // ===== COMBINED TOTALS & D2E STATUS =====
  sheet.getRange(row, 1, 1, 5).merge().setValue('📊 COMBINED TOTALS').setFontSize(14).setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff').setHorizontalAlignment('center');
  sheet.getRange(row, 7, 1, 5).merge().setValue('🎯 D2E STATUS').setFontSize(14).setFontWeight('bold').setBackground('#dc2626').setFontColor('#ffffff').setHorizontalAlignment('center');

  row++;

  var totalUnits = newResults.totalUnits + usedResults.totalUnits;
  var totalFront = newResults.frontEnd + usedResults.frontEnd;
  var totalBack = newResults.backEnd + usedResults.backEnd;
  var totalGross = newResults.totalGross + usedResults.totalGross;
  var avgPerDeal = totalUnits > 0 ? Math.round(totalGross / totalUnits) : 0;

  // Combined data
  sheet.getRange(row, 1).setValue('Total Units').setFontWeight('bold');
  sheet.getRange(row, 2).setValue(totalUnits).setFontSize(14).setFontWeight('bold');
  sheet.getRange(row, 3).setValue('Avg/Deal').setFontWeight('bold');
  sheet.getRange(row, 4).setValue(avgPerDeal).setNumberFormat('$#,##0').setFontWeight('bold');

  // D2E Status
  sheet.getRange(row, 7).setValue('GMC Goal');
  setStatusCell_(sheet.getRange(row, 8), gmcHit);
  sheet.getRange(row, 9).setValue('Buick Goal');
  setStatusCell_(sheet.getRange(row, 10), buickHit);

  row++;

  sheet.getRange(row, 1).setValue('Total Front End');
  sheet.getRange(row, 2).setValue(totalFront).setNumberFormat('$#,##0');
  sheet.getRange(row, 3).setValue('Total Back End');
  sheet.getRange(row, 4).setValue(totalBack).setNumberFormat('$#,##0');

  // D2E Unlocked status
  sheet.getRange(row, 7).setValue('D2E Status').setFontWeight('bold');
  var d2eCell = sheet.getRange(row, 8, 1, 3).merge();
  d2eCell.setValue(d2eUnlocked ? '✅ UNLOCKED!' : '❌ NOT MET');
  d2eCell.setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  if (d2eUnlocked) {
    d2eCell.setBackground('#d4edda').setFontColor('#155724');
  } else {
    d2eCell.setBackground('#f8d7da').setFontColor('#721c24');
  }

  row++;

  sheet.getRange(row, 1).setValue('TOTAL GROSS').setFontWeight('bold').setFontSize(12);
  sheet.getRange(row, 2, 1, 2).merge().setValue(totalGross).setNumberFormat('$#,##0').setFontSize(16).setFontWeight('bold').setBackground('#d1fae5');

  // Bonus info
  sheet.getRange(row, 7).setValue('Bonus Eligible');
  sheet.getRange(row, 8).setValue(spData.eligibleCount + ' salespeople');
  sheet.getRange(row, 9).setValue('Total Bonus');
  sheet.getRange(row, 10).setValue(spData.totalBonus).setNumberFormat('$#,##0').setFontWeight('bold');

  row += 2;

  // Add a separator line
  sheet.getRange(row, 1, 1, 11).merge().setBackground('#e5e7eb');

  // Auto-resize columns
  for (var c = 1; c <= 11; c++) {
    sheet.setColumnWidth(c, 100);
  }
  sheet.setColumnWidth(6, 30); // Gap column
}

function setStatusCell_(cell, isHit) {
  if (isHit) {
    cell.setValue('✅ HIT').setBackground('#d4edda').setFontColor('#155724').setHorizontalAlignment('center').setFontWeight('bold');
  } else {
    cell.setValue('❌ MISSED').setBackground('#f8d7da').setFontColor('#721c24').setHorizontalAlignment('center').setFontWeight('bold');
  }
}

function findMonthBlock_(sheet, monthKey) {
  if (sheet.getLastRow() < 1) return -1;

  var data = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === monthKey) {
      return i + 1;
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

function filterSalesByMonth_(data, dateCol, year, month) {
  var sales = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dateVal = row[dateCol];
    if (!dateVal) continue;

    var saleDate = new Date(dateVal);
    if (isNaN(saleDate.getTime())) continue;

    if (saleDate.getFullYear() === year && (saleDate.getMonth() + 1) === month) {
      sales.push(row);
    }
  }
  return sales;
}

function calculateNewResults_(sales) {
  var results = { gmcUnits: 0, buickUnits: 0, totalUnits: 0, frontEnd: 0, backEnd: 0, totalGross: 0 };

  for (var i = 0; i < sales.length; i++) {
    var row = sales[i];
    results.totalUnits++;

    var make = String(row[NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) results.gmcUnits++;
    if (make.includes('BUICK')) results.buickUnits++;

    var front = parseNumber_(row[NEW_COLS.frontEnd]);
    var back = parseNumber_(row[NEW_COLS.backEnd]);
    var total = parseNumber_(row[NEW_COLS.totalProfit]);

    if (total === 0 && (front !== 0 || back !== 0)) total = front + back;

    results.frontEnd += front;
    results.backEnd += back;
    results.totalGross += total;
  }

  return results;
}

function calculateUsedResults_(sales) {
  var results = { totalUnits: 0, frontEnd: 0, backEnd: 0, totalGross: 0 };

  for (var i = 0; i < sales.length; i++) {
    var row = sales[i];
    results.totalUnits++;

    var front = parseNumber_(row[USED_COLS.frontEnd]);
    var back = parseNumber_(row[USED_COLS.backEnd]);
    var total = parseNumber_(row[USED_COLS.totalProfit]);

    if (total === 0 && (front !== 0 || back !== 0)) total = front + back;

    results.frontEnd += front;
    results.backEnd += back;
    results.totalGross += total;
  }

  return results;
}

function parseNumber_(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  var str = String(val).replace(/[$,\s]/g, '');
  var num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function calculateAllSalespersonData_(newSales, usedSales, goals, d2eUnlocked) {
  var byPerson = {};

  for (var i = 0; i < newSales.length; i++) {
    var name = String(newSales[i][NEW_COLS.salesperson] || 'Unknown').trim();
    if (!byPerson[name]) byPerson[name] = { newUnits: 0 };
    byPerson[name].newUnits++;
  }

  var eligibleCount = 0;
  var totalBonus = 0;

  for (var n in byPerson) {
    if (byPerson[n].newUnits >= goals.minUnits && d2eUnlocked) {
      eligibleCount++;
      totalBonus += goals.bonus;
    }
  }

  return { eligibleCount: eligibleCount, totalBonus: totalBonus };
}

function viewArchives_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = ss.getSheetByName('Archive');

  if (!archiveSheet || archiveSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('No archives yet!\n\nUse "Archive Current Month" or "Archive Previous Month" to create one.');
    return;
  }

  archiveSheet.activate();
}

function getMonthName_(month) {
  var names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return names[month - 1];
}
