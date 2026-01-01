// ============================================
// ARCHIVE ADD-ON - Paste this at the END of your existing Code.gs
// ============================================
//
// IMPORTANT: After pasting, find your existing onOpen() function
// and add this line inside it:
//
//   addArchiveMenu_();
//
// Example:
//   function onOpen() {
//     // ... your existing menu code ...
//     addArchiveMenu_();  // <-- ADD THIS LINE
//   }
//
// ============================================

// Column positions for NEW sheet (0-indexed)
// Date | Deal # | Stock # | Year | Make | Model | Customer | Lead Type | Salesperson | Trade In | Trade Value | Sale Price | Front End Profit | Back End Profit | Total Profit | Financing | Warranty | D2E | Notes
var NEW_COLS = {
  date: 0,          // A - Date
  dealNum: 1,       // B - Deal #
  stockNum: 2,      // C - Stock #
  year: 3,          // D - Year
  make: 4,          // E - Make
  model: 5,         // F - Model
  customer: 6,      // G - Customer
  leadType: 7,      // H - Lead Type
  salesperson: 8,   // I - Salesperson
  tradeIn: 9,       // J - Trade In
  tradeValue: 10,   // K - Trade Value
  salePrice: 11,    // L - Sale Price
  frontEnd: 12,     // M - Front End Profit
  backEnd: 13,      // N - Back End Profit
  totalProfit: 14,  // O - Total Profit
  financing: 15,    // P - Financing
  warranty: 16,     // Q - Warranty
  d2e: 17,          // R - D2E
  notes: 18         // S - Notes
};

// Column positions for USED sheet (0-indexed)
// Date | Deal # | Stock # | Year | Make | Model | Customer | Lead Type | Salesperson | Trade In | Trade Value | Sale Price | Front End Profit | Back End Profit | Total Profit | Financing | Warranty | Notes
var USED_COLS = {
  date: 0,          // A - Date
  dealNum: 1,       // B - Deal #
  stockNum: 2,      // C - Stock #
  year: 3,          // D - Year
  make: 4,          // E - Make
  model: 5,         // F - Model
  customer: 6,      // G - Customer
  leadType: 7,      // H - Lead Type
  salesperson: 8,   // I - Salesperson
  tradeIn: 9,       // J - Trade In
  tradeValue: 10,   // K - Trade Value
  salePrice: 11,    // L - Sale Price
  frontEnd: 12,     // M - Front End Profit
  backEnd: 13,      // N - Back End Profit
  totalProfit: 14,  // O - Total Profit
  financing: 15,    // P - Financing
  warranty: 16,     // Q - Warranty
  notes: 17         // R - Notes
};

/**
 * Call this from your existing onOpen() function
 * Adds Archive submenu to your spreadsheet
 */
function addArchiveMenu_() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📁 Archive')
    .addItem('Archive Current Month', 'archiveCurrentMonth_')
    .addItem('Archive Previous Month', 'archivePreviousMonth_')
    .addSeparator()
    .addItem('View All Archives', 'viewArchives_')
    .addToUi();
}

/**
 * Archive the current month's data
 */
function archiveCurrentMonth_() {
  var now = new Date();
  runArchive_(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Archive the previous month's data
 */
function archivePreviousMonth_() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth(); // 0-indexed, so this is previous month
  if (month === 0) {
    month = 12;
    year--;
  }
  runArchive_(year, month);
}

/**
 * Main archive function - reads from New and Used sheets
 */
function runArchive_(year, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  // Find the New sheet
  var newSheet = findSheet_(ss, ['New', 'NEW', 'New Cars', 'New Deals', 'New Sales']);
  if (!newSheet) {
    ui.alert('Cannot find New sheet!\n\nLooking for sheets named: New, NEW, New Cars, New Deals, or New Sales');
    return;
  }

  // Find the Used sheet
  var usedSheet = findSheet_(ss, ['Used', 'USED', 'Used Cars', 'Used Deals', 'Used Sales']);
  if (!usedSheet) {
    ui.alert('Cannot find Used sheet!\n\nLooking for sheets named: Used, USED, Used Cars, Used Deals, or Used Sales');
    return;
  }

  // Get or create Archive sheet
  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    setupArchiveSheet_(archiveSheet);
  }

  // Get New sales data
  var newData = newSheet.getDataRange().getValues();
  var newSales = filterSalesByMonth_(newData, NEW_COLS.date, year, month);

  // Get Used sales data
  var usedData = usedSheet.getDataRange().getValues();
  var usedSales = filterSalesByMonth_(usedData, USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ui.alert('No sales found for ' + getMonthName_(month) + ' ' + year + '\n\nChecked sheets:\n- ' + newSheet.getName() + ' (New)\n- ' + usedSheet.getName() + ' (Used)');
    return;
  }

  // Calculate results for New
  var newResults = calculateNewResults_(newSales);

  // Calculate results for Used
  var usedResults = calculateUsedResults_(usedSales);

  // Combined totals
  var totalUnits = newResults.totalUnits + usedResults.totalUnits;
  var totalFrontEnd = newResults.frontEnd + usedResults.frontEnd;
  var totalBackEnd = newResults.backEnd + usedResults.backEnd;
  var totalGross = newResults.totalGross + usedResults.totalGross;
  var avgPerDeal = totalUnits > 0 ? Math.round(totalGross / totalUnits) : 0;

  // Goals
  var goals = {
    gmc: 21,
    buick: 9,
    used: 20,
    bonus: 375,
    minUnits: 4
  };

  // Determine goal status
  var gmcHit = newResults.gmcUnits >= goals.gmc;
  var buickHit = newResults.buickUnits >= goals.buick;
  var usedHit = usedResults.totalUnits >= goals.used;
  var d2eUnlocked = gmcHit && buickHit;

  // Calculate salesperson data
  var spData = calculateAllSalespersonData_(newSales, usedSales, goals, d2eUnlocked);

  // Create month key
  var monthKey = year + '-' + String(month).padStart(2, '0');
  var monthName = getMonthName_(month) + ' ' + year;

  // Check if already archived
  var archiveData = archiveSheet.getDataRange().getValues();
  var existingRow = -1;
  for (var i = 1; i < archiveData.length; i++) {
    if (archiveData[i][0] === monthKey) {
      existingRow = i + 1;
      break;
    }
  }

  // Build archive row
  var archiveRow = [
    monthKey,                         // A: Month Key
    monthName,                        // B: Month Name
    new Date().toLocaleDateString(),  // C: Archived Date
    // Goals
    goals.gmc,                        // D: GMC Goal
    goals.buick,                      // E: Buick Goal
    goals.used,                       // F: Used Goal
    goals.bonus,                      // G: Bonus Amount
    goals.minUnits,                   // H: Min Units for Bonus
    // New Results
    newResults.gmcUnits,              // I: GMC Sold
    newResults.buickUnits,            // J: Buick Sold
    newResults.totalUnits,            // K: New Units Total
    newResults.frontEnd,              // L: New Front End
    newResults.backEnd,               // M: New Back End
    newResults.totalGross,            // N: New Total Gross
    // Used Results
    usedResults.totalUnits,           // O: Used Units
    usedResults.frontEnd,             // P: Used Front End
    usedResults.backEnd,              // Q: Used Back End
    usedResults.totalGross,           // R: Used Total Gross
    // Combined Totals
    totalUnits,                       // S: Total Units
    totalFrontEnd,                    // T: Total Front End
    totalBackEnd,                     // U: Total Back End
    totalGross,                       // V: Total Gross
    avgPerDeal,                       // W: Avg Per Deal
    // Status
    gmcHit ? 'HIT' : 'MISSED',        // X: GMC Status
    buickHit ? 'HIT' : 'MISSED',      // Y: Buick Status
    usedHit ? 'HIT' : 'MISSED',       // Z: Used Status
    d2eUnlocked ? 'UNLOCKED' : 'NOT MET', // AA: D2E Status
    // Bonus
    spData.eligibleCount,             // AB: Eligible Count
    spData.totalBonus                 // AC: Total Bonus
  ];

  if (existingRow > 0) {
    archiveSheet.getRange(existingRow, 1, 1, archiveRow.length).setValues([archiveRow]);
  } else {
    archiveSheet.appendRow(archiveRow);
  }

  // Format and show success
  formatArchive_(archiveSheet);

  var msg = '✅ ' + monthName + ' Archived!\n\n' +
    '📊 NEW CARS:\n' +
    '   GMC: ' + newResults.gmcUnits + '/' + goals.gmc + (gmcHit ? ' ✓' : '') + '\n' +
    '   Buick: ' + newResults.buickUnits + '/' + goals.buick + (buickHit ? ' ✓' : '') + '\n' +
    '   Total New: ' + newResults.totalUnits + ' units\n' +
    '   Front End: $' + newResults.frontEnd.toLocaleString() + '\n' +
    '   Back End: $' + newResults.backEnd.toLocaleString() + '\n' +
    '   Gross: $' + newResults.totalGross.toLocaleString() + '\n\n' +
    '🚗 USED CARS:\n' +
    '   Units: ' + usedResults.totalUnits + '/' + goals.used + (usedHit ? ' ✓' : '') + '\n' +
    '   Front End: $' + usedResults.frontEnd.toLocaleString() + '\n' +
    '   Back End: $' + usedResults.backEnd.toLocaleString() + '\n' +
    '   Gross: $' + usedResults.totalGross.toLocaleString() + '\n\n' +
    '💰 COMBINED:\n' +
    '   Total: ' + totalUnits + ' units\n' +
    '   Total Gross: $' + totalGross.toLocaleString() + '\n' +
    '   Avg/Deal: $' + avgPerDeal.toLocaleString() + '\n\n' +
    '🎯 D2E: ' + (d2eUnlocked ? 'UNLOCKED!' : 'Not Met') + '\n' +
    '💵 Bonus Eligible: ' + spData.eligibleCount + ' ($' + spData.totalBonus.toLocaleString() + ')';

  ui.alert(msg);
}

/**
 * Find a sheet by trying multiple possible names
 */
function findSheet_(ss, names) {
  for (var i = 0; i < names.length; i++) {
    var sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  return null;
}

/**
 * Filter data rows by month
 */
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

/**
 * Calculate results for New cars
 */
function calculateNewResults_(sales) {
  var results = {
    gmcUnits: 0,
    buickUnits: 0,
    totalUnits: 0,
    frontEnd: 0,
    backEnd: 0,
    totalGross: 0
  };

  for (var i = 0; i < sales.length; i++) {
    var row = sales[i];
    results.totalUnits++;

    // Get make and count by brand
    var make = String(row[NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) results.gmcUnits++;
    if (make.includes('BUICK')) results.buickUnits++;

    // Get gross figures
    var front = parseNumber_(row[NEW_COLS.frontEnd]);
    var back = parseNumber_(row[NEW_COLS.backEnd]);
    var total = parseNumber_(row[NEW_COLS.totalProfit]);

    // If total is missing, calculate from front + back
    if (total === 0 && (front !== 0 || back !== 0)) {
      total = front + back;
    }

    results.frontEnd += front;
    results.backEnd += back;
    results.totalGross += total;
  }

  return results;
}

/**
 * Calculate results for Used cars
 */
function calculateUsedResults_(sales) {
  var results = {
    totalUnits: 0,
    frontEnd: 0,
    backEnd: 0,
    totalGross: 0
  };

  for (var i = 0; i < sales.length; i++) {
    var row = sales[i];
    results.totalUnits++;

    // Get gross figures
    var front = parseNumber_(row[USED_COLS.frontEnd]);
    var back = parseNumber_(row[USED_COLS.backEnd]);
    var total = parseNumber_(row[USED_COLS.totalProfit]);

    // If total is missing, calculate from front + back
    if (total === 0 && (front !== 0 || back !== 0)) {
      total = front + back;
    }

    results.frontEnd += front;
    results.backEnd += back;
    results.totalGross += total;
  }

  return results;
}

/**
 * Parse a number from various formats
 */
function parseNumber_(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove $ signs, commas, and spaces
  var str = String(val).replace(/[$,\s]/g, '');
  var num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate salesperson data from both sheets
 */
function calculateAllSalespersonData_(newSales, usedSales, goals, d2eUnlocked) {
  var byPerson = {};

  // Process new sales
  for (var i = 0; i < newSales.length; i++) {
    var row = newSales[i];
    var name = String(row[NEW_COLS.salesperson] || 'Unknown').trim();
    if (!byPerson[name]) {
      byPerson[name] = { newUnits: 0, usedUnits: 0, totalUnits: 0 };
    }
    byPerson[name].newUnits++;
    byPerson[name].totalUnits++;
  }

  // Process used sales
  for (var j = 0; j < usedSales.length; j++) {
    var row2 = usedSales[j];
    var name2 = String(row2[USED_COLS.salesperson] || 'Unknown').trim();
    if (!byPerson[name2]) {
      byPerson[name2] = { newUnits: 0, usedUnits: 0, totalUnits: 0 };
    }
    byPerson[name2].usedUnits++;
    byPerson[name2].totalUnits++;
  }

  // Calculate bonus eligibility
  var eligibleCount = 0;
  var totalBonus = 0;

  for (var name3 in byPerson) {
    var person = byPerson[name3];
    if (person.newUnits >= goals.minUnits && d2eUnlocked) {
      eligibleCount++;
      totalBonus += goals.bonus;
    }
  }

  return { eligibleCount: eligibleCount, totalBonus: totalBonus };
}

/**
 * Setup archive sheet headers
 */
function setupArchiveSheet_(sheet) {
  var headers = [
    'Month Key', 'Month', 'Archived',
    'GMC Goal', 'Buick Goal', 'Used Goal', 'Bonus', 'Min Units',
    'GMC Sold', 'Buick Sold', 'New Units', 'New Front', 'New Back', 'New Gross',
    'Used Units', 'Used Front', 'Used Back', 'Used Gross',
    'Total Units', 'Total Front', 'Total Back', 'Total Gross', 'Avg/Deal',
    'GMC', 'Buick', 'Used', 'D2E',
    'Eligible', 'Total Bonus'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Format the archive sheet
 */
function formatArchive_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Currency columns (New Front, New Back, New Gross, Used Front, Used Back, Used Gross, Total Front, Total Back, Total Gross, Avg/Deal, Total Bonus)
  var currencyCols = [12, 13, 14, 16, 17, 18, 20, 21, 22, 23, 29];
  for (var i = 0; i < currencyCols.length; i++) {
    var col = currencyCols[i];
    if (col <= sheet.getLastColumn()) {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('$#,##0');
    }
  }

  // Color status columns (GMC, Buick, Used, D2E - columns 24-27)
  for (var row = 2; row <= lastRow; row++) {
    for (var col2 = 24; col2 <= 27; col2++) {
      var cell = sheet.getRange(row, col2);
      var val = cell.getValue();
      if (val === 'HIT' || val === 'UNLOCKED') {
        cell.setBackground('#d4edda').setFontColor('#155724');
      } else if (val === 'MISSED' || val === 'NOT MET') {
        cell.setBackground('#f8d7da').setFontColor('#721c24');
      }
    }
  }

  sheet.autoResizeColumns(1, sheet.getLastColumn());
}

/**
 * View all archives
 */
function viewArchives_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var archiveSheet = ss.getSheetByName('Archive');

  if (!archiveSheet || archiveSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('No archives yet!\n\nUse "Archive Current Month" or "Archive Previous Month" to create one.');
    return;
  }

  archiveSheet.activate();
}

/**
 * Get month name
 */
function getMonthName_(month) {
  var names = ['January','February','March','April','May','June',
               'July','August','September','October','November','December'];
  return names[month - 1];
}
