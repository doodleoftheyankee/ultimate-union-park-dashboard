// ============================================
// ARCHIVE ADD-ON - Paste this at the END of your existing Code.gs
// ============================================

/**
 * Adds Archive menu to your spreadsheet
 * This extends your existing onOpen if you have one
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
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
  const now = new Date();
  runArchive_(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Archive the previous month's data
 */
function archivePreviousMonth_() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed, so this is previous month
  if (month === 0) {
    month = 12;
    year--;
  }
  runArchive_(year, month);
}

/**
 * Main archive function - auto-detects your columns
 */
function runArchive_(year, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find the sales data sheet (tries common names)
  const sheetNames = ['Sales Data', 'Sales', 'Data', 'Deals', 'Sheet1'];
  let salesSheet = null;
  for (const name of sheetNames) {
    salesSheet = ss.getSheetByName(name);
    if (salesSheet) break;
  }

  if (!salesSheet) {
    // Use the first sheet if none found
    salesSheet = ss.getSheets()[0];
  }

  // Get or create Archive sheet
  let archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    setupArchiveSheet_(archiveSheet);
  }

  // Get all data
  const data = salesSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('No data found in ' + salesSheet.getName());
    return;
  }

  // Auto-detect columns from headers
  const headers = data[0].map(h => String(h).toLowerCase().trim());
  const cols = detectColumns_(headers);

  // Filter sales for the target month
  const monthSales = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateVal = row[cols.date];
    if (!dateVal) continue;

    const saleDate = new Date(dateVal);
    if (saleDate.getFullYear() === year && (saleDate.getMonth() + 1) === month) {
      monthSales.push(row);
    }
  }

  if (monthSales.length === 0) {
    SpreadsheetApp.getUi().alert('No sales found for ' + getMonthName_(month) + ' ' + year);
    return;
  }

  // Calculate totals
  const results = calculateResults_(monthSales, cols);

  // Get goals (default values)
  const goals = {
    gmc: 21,
    buick: 9,
    used: 20,
    bonus: 375,
    minUnits: 4
  };

  // Determine goal status
  const gmcHit = results.gmcUnits >= goals.gmc;
  const buickHit = results.buickUnits >= goals.buick;
  const usedHit = results.usedUnits >= goals.used;
  const d2eUnlocked = gmcHit && buickHit;

  // Calculate salesperson data
  const spData = calculateSalespersonData_(monthSales, cols, goals, d2eUnlocked);

  // Create month key
  const monthKey = year + '-' + String(month).padStart(2, '0');
  const monthName = getMonthName_(month) + ' ' + year;

  // Check if already archived
  const archiveData = archiveSheet.getDataRange().getValues();
  let existingRow = -1;
  for (let i = 1; i < archiveData.length; i++) {
    if (archiveData[i][0] === monthKey) {
      existingRow = i + 1;
      break;
    }
  }

  // Build archive row
  const archiveRow = [
    monthKey,
    monthName,
    new Date().toLocaleDateString(),
    // Goals
    goals.gmc,
    goals.buick,
    goals.used,
    goals.bonus,
    goals.minUnits,
    // Results
    results.gmcUnits,
    results.buickUnits,
    results.newUnits,
    results.usedUnits,
    results.totalUnits,
    results.frontEnd,
    results.backEnd,
    results.totalGross,
    results.avgPerDeal,
    // Status
    gmcHit ? 'HIT' : 'MISSED',
    buickHit ? 'HIT' : 'MISSED',
    usedHit ? 'HIT' : 'MISSED',
    d2eUnlocked ? 'UNLOCKED' : 'NOT MET',
    // Bonus
    spData.eligibleCount,
    spData.totalBonus
  ];

  if (existingRow > 0) {
    archiveSheet.getRange(existingRow, 1, 1, archiveRow.length).setValues([archiveRow]);
  } else {
    archiveSheet.appendRow(archiveRow);
  }

  // Format and show success
  formatArchive_(archiveSheet);

  const msg = monthName + ' Archived!\n\n' +
    'NEW: GMC ' + results.gmcUnits + '/' + goals.gmc + ' | Buick ' + results.buickUnits + '/' + goals.buick + '\n' +
    'USED: ' + results.usedUnits + '/' + goals.used + '\n' +
    'TOTAL: ' + results.totalUnits + ' units | $' + results.totalGross.toLocaleString() + '\n\n' +
    'D2E: ' + (d2eUnlocked ? 'UNLOCKED!' : 'Not Met') + '\n' +
    'Bonus Eligible: ' + spData.eligibleCount + ' ($' + spData.totalBonus + ')';

  SpreadsheetApp.getUi().alert(msg);
}

/**
 * Auto-detect column positions from headers
 */
function detectColumns_(headers) {
  const cols = {
    date: -1,
    salesperson: -1,
    make: -1,
    newUsed: -1,
    frontGross: -1,
    backGross: -1,
    totalGross: -1
  };

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];

    // Date column
    if (h.includes('date') || h.includes('sold') || h === 'day') {
      if (cols.date === -1) cols.date = i;
    }

    // Salesperson
    if (h.includes('sales') && (h.includes('person') || h.includes('rep') || h.includes('man'))) {
      cols.salesperson = i;
    } else if (h === 'salesperson' || h === 'rep' || h === 'sold by' || h === 'salesman') {
      cols.salesperson = i;
    }

    // Make/Brand
    if (h === 'make' || h === 'brand' || h.includes('manufacturer')) {
      cols.make = i;
    }

    // New/Used
    if (h.includes('new') && h.includes('used')) {
      cols.newUsed = i;
    } else if (h === 'type' || h === 'condition' || h === 'n/u' || h === 'new/used') {
      cols.newUsed = i;
    }

    // Front Gross
    if ((h.includes('front') && (h.includes('gross') || h.includes('end'))) || h === 'front' || h === 'frontend') {
      cols.frontGross = i;
    }

    // Back Gross
    if ((h.includes('back') && (h.includes('gross') || h.includes('end'))) || h === 'back' || h === 'backend') {
      cols.backGross = i;
    }

    // Total Gross
    if ((h.includes('total') && h.includes('gross')) || h === 'gross' || h === 'total profit' || h === 'deal gross') {
      cols.totalGross = i;
    }
  }

  return cols;
}

/**
 * Calculate sales results
 */
function calculateResults_(sales, cols) {
  let results = {
    gmcUnits: 0,
    buickUnits: 0,
    newUnits: 0,
    usedUnits: 0,
    totalUnits: 0,
    frontEnd: 0,
    backEnd: 0,
    totalGross: 0,
    avgPerDeal: 0
  };

  for (const row of sales) {
    results.totalUnits++;

    // Get make
    const make = cols.make >= 0 ? String(row[cols.make]).toUpperCase() : '';

    // Get new/used
    const newUsed = cols.newUsed >= 0 ? String(row[cols.newUsed]).toUpperCase() : '';
    const isNew = newUsed.includes('NEW') || newUsed === 'N';

    if (isNew) {
      results.newUnits++;
      if (make.includes('GMC')) results.gmcUnits++;
      if (make.includes('BUICK')) results.buickUnits++;
    } else {
      results.usedUnits++;
    }

    // Get gross
    const front = cols.frontGross >= 0 ? (Number(row[cols.frontGross]) || 0) : 0;
    const back = cols.backGross >= 0 ? (Number(row[cols.backGross]) || 0) : 0;
    let total = cols.totalGross >= 0 ? (Number(row[cols.totalGross]) || 0) : 0;

    if (total === 0) total = front + back;

    results.frontEnd += front;
    results.backEnd += back;
    results.totalGross += total;
  }

  results.avgPerDeal = results.totalUnits > 0 ? Math.round(results.totalGross / results.totalUnits) : 0;

  return results;
}

/**
 * Calculate per-salesperson data
 */
function calculateSalespersonData_(sales, cols, goals, d2eUnlocked) {
  const byPerson = {};

  for (const row of sales) {
    const name = cols.salesperson >= 0 ? String(row[cols.salesperson]).trim() : 'Unknown';
    const newUsed = cols.newUsed >= 0 ? String(row[cols.newUsed]).toUpperCase() : '';
    const isNew = newUsed.includes('NEW') || newUsed === 'N';

    if (!byPerson[name]) {
      byPerson[name] = { newUnits: 0, usedUnits: 0, totalUnits: 0 };
    }

    byPerson[name].totalUnits++;
    if (isNew) {
      byPerson[name].newUnits++;
    } else {
      byPerson[name].usedUnits++;
    }
  }

  let eligibleCount = 0;
  let totalBonus = 0;

  for (const name in byPerson) {
    const person = byPerson[name];
    if (person.newUnits >= goals.minUnits && d2eUnlocked) {
      eligibleCount++;
      totalBonus += goals.bonus;
    }
  }

  return { eligibleCount, totalBonus };
}

/**
 * Setup archive sheet headers
 */
function setupArchiveSheet_(sheet) {
  const headers = [
    'Month Key', 'Month', 'Archived',
    'GMC Goal', 'Buick Goal', 'Used Goal', 'Bonus', 'Min Units',
    'GMC Sold', 'Buick Sold', 'New Units', 'Used Units', 'Total Units',
    'Front End', 'Back End', 'Total Gross', 'Avg/Deal',
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
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Currency columns
  [14, 15, 16, 17, 23].forEach(col => {
    if (col <= sheet.getLastColumn()) {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('$#,##0');
    }
  });

  // Color status columns
  for (let row = 2; row <= lastRow; row++) {
    for (let col = 18; col <= 21; col++) {
      const cell = sheet.getRange(row, col);
      const val = cell.getValue();
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archiveSheet = ss.getSheetByName('Archive');

  if (!archiveSheet || archiveSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('No archives yet!\n\nUse "Archive Current Month" to create one.');
    return;
  }

  archiveSheet.activate();
}

/**
 * Get month name
 */
function getMonthName_(month) {
  return ['January','February','March','April','May','June',
          'July','August','September','October','November','December'][month - 1];
}
