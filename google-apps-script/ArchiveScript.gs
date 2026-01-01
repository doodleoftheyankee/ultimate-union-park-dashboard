/**
 * UNION PARK BUICK GMC - Monthly Archive Script
 *
 * This script automatically archives your monthly sales data (New & Used)
 * to a dedicated "Archive" sheet for historical tracking.
 *
 * SETUP INSTRUCTIONS:
 * 1. In your Google Sheet, go to Extensions > Apps Script
 * 2. Delete any existing code and paste this entire script
 * 3. Click Save (Ctrl+S or Cmd+S)
 * 4. Run the "setupArchiveSystem" function once to create the Archive sheet
 * 5. Set up automatic monthly trigger by running "setupMonthlyTrigger"
 *
 * MANUAL USAGE:
 * - Run "archiveCurrentMonth" anytime to save current month's data
 * - The Archive sheet will show all historical months
 */

// ============================================
// CONFIGURATION - Adjust these to match your sheet
// ============================================
const CONFIG = {
  // Sheet names in your workbook
  SALES_SHEET: 'Sales Data',        // Your main sales data sheet
  GOALS_SHEET: 'Goals',             // Sheet with monthly goals (optional)
  ARCHIVE_SHEET: 'Archive',         // Will be created if doesn't exist

  // Column positions in your Sales Data sheet (1-indexed)
  // Adjust these to match your actual column layout
  COLUMNS: {
    DATE: 1,              // Column A - Sale date
    DEAL_NUMBER: 2,       // Column B - Deal number
    STOCK_NUMBER: 3,      // Column C - Stock number
    SALESPERSON: 4,       // Column D - Salesperson name
    CUSTOMER: 5,          // Column E - Customer name
    YEAR: 6,              // Column F - Vehicle year
    MAKE: 7,              // Column G - Make (GMC, Buick, etc.)
    MODEL: 8,             // Column H - Model
    NEW_USED: 9,          // Column I - "New" or "Used"
    FRONT_GROSS: 10,      // Column J - Front-end gross
    BACK_GROSS: 11,       // Column K - Back-end gross
    TOTAL_GROSS: 12,      // Column L - Total gross
  },

  // Default goals (will be overridden if Goals sheet exists)
  DEFAULT_GOALS: {
    GMC_GOAL: 21,
    BUICK_GOAL: 9,
    USED_GOAL: 20,
    TOTAL_GROSS_GOAL: 150000,
    BONUS_PER_PERSON: 375,
    MIN_UNITS_FOR_BONUS: 4
  }
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Initial setup - creates Archive sheet and menu
 * Run this once when first setting up
 */
function setupArchiveSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create Archive sheet if it doesn't exist
  let archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET);
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(CONFIG.ARCHIVE_SHEET);
    setupArchiveHeaders(archiveSheet);
    SpreadsheetApp.getUi().alert('Archive sheet created successfully!\n\nYou can now archive months manually or set up automatic archiving.');
  } else {
    SpreadsheetApp.getUi().alert('Archive sheet already exists. Setup complete!');
  }

  // Add custom menu
  createCustomMenu();
}

/**
 * Creates custom menu in Google Sheets
 */
function onOpen() {
  createCustomMenu();
}

function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Archive Tools')
    .addItem('Archive Current Month', 'archiveCurrentMonth')
    .addItem('Archive Previous Month', 'archivePreviousMonth')
    .addSeparator()
    .addItem('View Archive Summary', 'showArchiveSummary')
    .addSeparator()
    .addItem('Setup Monthly Auto-Archive', 'setupMonthlyTrigger')
    .addItem('Remove Auto-Archive', 'removeMonthlyTrigger')
    .addToUi();
}

/**
 * Archives the current month's data
 */
function archiveCurrentMonth() {
  const now = new Date();
  archiveMonth(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Archives the previous month's data
 */
function archivePreviousMonth() {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // Previous month (0-indexed becomes previous)

  if (month === 0) {
    month = 12;
    year--;
  }

  archiveMonth(year, month);
}

/**
 * Main archive function - saves a month's data to the Archive sheet
 */
function archiveMonth(year, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName(CONFIG.SALES_SHEET);
  let archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET);

  if (!salesSheet) {
    SpreadsheetApp.getUi().alert('Error: Could not find sheet named "' + CONFIG.SALES_SHEET + '".\n\nPlease update the CONFIG.SALES_SHEET value in the script.');
    return;
  }

  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(CONFIG.ARCHIVE_SHEET);
    setupArchiveHeaders(archiveSheet);
  }

  // Get all sales data
  const salesData = salesSheet.getDataRange().getValues();
  const headers = salesData[0];

  // Filter sales for the specified month
  const monthSales = filterSalesByMonth(salesData.slice(1), year, month);

  if (monthSales.length === 0) {
    SpreadsheetApp.getUi().alert('No sales found for ' + getMonthName(month) + ' ' + year);
    return;
  }

  // Calculate metrics
  const metrics = calculateMonthMetrics(monthSales);
  const goals = getGoals();

  // Calculate goal status
  const gmcGoalHit = metrics.gmcUnits >= goals.GMC_GOAL;
  const buickGoalHit = metrics.buickUnits >= goals.BUICK_GOAL;
  const usedGoalHit = metrics.usedUnits >= goals.USED_GOAL;
  const d2eUnlocked = gmcGoalHit && buickGoalHit;

  // Get salesperson breakdown
  const salespersonMetrics = calculateSalespersonMetrics(monthSales, goals, d2eUnlocked);

  // Create archive entry
  const monthKey = year + '-' + String(month).padStart(2, '0');
  const monthName = getMonthName(month) + ' ' + year;
  const archiveDate = new Date().toISOString();

  // Check if this month already exists in archive
  const existingRow = findArchiveRow(archiveSheet, monthKey);

  // Prepare archive data
  const archiveRow = [
    monthKey,                           // A: Month Key (YYYY-MM)
    monthName,                          // B: Month Name
    archiveDate,                        // C: Archived Date
    // Goals
    goals.GMC_GOAL,                     // D: GMC Goal
    goals.BUICK_GOAL,                   // E: Buick Goal
    goals.USED_GOAL,                    // F: Used Goal
    goals.TOTAL_GROSS_GOAL,             // G: Total Gross Goal
    goals.BONUS_PER_PERSON,             // H: Bonus Per Person
    goals.MIN_UNITS_FOR_BONUS,          // I: Min Units for Bonus
    // Results - New
    metrics.gmcUnits,                   // J: GMC Sold
    metrics.buickUnits,                 // K: Buick Sold
    metrics.newUnits,                   // L: Total New Units
    metrics.newGross,                   // M: New Gross
    // Results - Used
    metrics.usedUnits,                  // N: Used Sold
    metrics.usedGross,                  // O: Used Gross
    // Results - Combined
    metrics.totalUnits,                 // P: Total Units
    metrics.totalGross,                 // Q: Total Gross
    metrics.frontEndGross,              // R: Total Front End
    metrics.backEndGross,               // S: Total Back End
    metrics.avgPerDeal,                 // T: Avg Per Deal
    // Goal Status
    gmcGoalHit ? 'HIT' : 'MISSED',      // U: GMC Goal Status
    buickGoalHit ? 'HIT' : 'MISSED',    // V: Buick Goal Status
    usedGoalHit ? 'HIT' : 'MISSED',     // W: Used Goal Status
    d2eUnlocked ? 'UNLOCKED' : 'NOT MET', // X: D2E Status
    // Bonus Info
    salespersonMetrics.eligibleCount,   // Y: Eligible Count
    salespersonMetrics.totalBonus,      // Z: Total Bonus Payout
    // Salesperson JSON (for detailed view)
    JSON.stringify(salespersonMetrics.details) // AA: Salesperson Details (JSON)
  ];

  if (existingRow > 0) {
    // Update existing row
    archiveSheet.getRange(existingRow, 1, 1, archiveRow.length).setValues([archiveRow]);
    SpreadsheetApp.getUi().alert('Updated archive for ' + monthName + '!\n\n' + getArchiveSummaryText(metrics, goals, d2eUnlocked, salespersonMetrics));
  } else {
    // Add new row
    archiveSheet.appendRow(archiveRow);
    SpreadsheetApp.getUi().alert('Archived ' + monthName + ' successfully!\n\n' + getArchiveSummaryText(metrics, goals, d2eUnlocked, salespersonMetrics));
  }

  // Format the archive sheet
  formatArchiveSheet(archiveSheet);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sets up headers for the Archive sheet
 */
function setupArchiveHeaders(sheet) {
  const headers = [
    'Month Key', 'Month Name', 'Archived Date',
    'GMC Goal', 'Buick Goal', 'Used Goal', 'Gross Goal', 'Bonus/Person', 'Min Units',
    'GMC Sold', 'Buick Sold', 'New Units', 'New Gross',
    'Used Sold', 'Used Gross',
    'Total Units', 'Total Gross', 'Front End', 'Back End', 'Avg/Deal',
    'GMC Status', 'Buick Status', 'Used Status', 'D2E Status',
    'Eligible Count', 'Total Bonus', 'Salesperson Details'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * Filters sales data for a specific month
 */
function filterSalesByMonth(salesData, year, month) {
  return salesData.filter(row => {
    const saleDate = new Date(row[CONFIG.COLUMNS.DATE - 1]);
    return saleDate.getFullYear() === year && (saleDate.getMonth() + 1) === month;
  });
}

/**
 * Calculates metrics for a month's sales
 */
function calculateMonthMetrics(sales) {
  let metrics = {
    gmcUnits: 0,
    buickUnits: 0,
    newUnits: 0,
    usedUnits: 0,
    totalUnits: 0,
    newGross: 0,
    usedGross: 0,
    totalGross: 0,
    frontEndGross: 0,
    backEndGross: 0,
    avgPerDeal: 0
  };

  sales.forEach(row => {
    const make = String(row[CONFIG.COLUMNS.MAKE - 1]).toUpperCase();
    const newUsed = String(row[CONFIG.COLUMNS.NEW_USED - 1]).toUpperCase();
    const frontGross = Number(row[CONFIG.COLUMNS.FRONT_GROSS - 1]) || 0;
    const backGross = Number(row[CONFIG.COLUMNS.BACK_GROSS - 1]) || 0;
    const totalGross = Number(row[CONFIG.COLUMNS.TOTAL_GROSS - 1]) || (frontGross + backGross);

    metrics.totalUnits++;
    metrics.totalGross += totalGross;
    metrics.frontEndGross += frontGross;
    metrics.backEndGross += backGross;

    if (newUsed === 'NEW' || newUsed === 'N') {
      metrics.newUnits++;
      metrics.newGross += totalGross;

      if (make.includes('GMC')) {
        metrics.gmcUnits++;
      } else if (make.includes('BUICK')) {
        metrics.buickUnits++;
      }
    } else {
      metrics.usedUnits++;
      metrics.usedGross += totalGross;
    }
  });

  metrics.avgPerDeal = metrics.totalUnits > 0 ? Math.round(metrics.totalGross / metrics.totalUnits) : 0;

  return metrics;
}

/**
 * Calculates per-salesperson metrics
 */
function calculateSalespersonMetrics(sales, goals, d2eUnlocked) {
  const byPerson = {};

  sales.forEach(row => {
    const name = String(row[CONFIG.COLUMNS.SALESPERSON - 1]).trim();
    const newUsed = String(row[CONFIG.COLUMNS.NEW_USED - 1]).toUpperCase();
    const make = String(row[CONFIG.COLUMNS.MAKE - 1]).toUpperCase();
    const frontGross = Number(row[CONFIG.COLUMNS.FRONT_GROSS - 1]) || 0;
    const backGross = Number(row[CONFIG.COLUMNS.BACK_GROSS - 1]) || 0;
    const totalGross = Number(row[CONFIG.COLUMNS.TOTAL_GROSS - 1]) || (frontGross + backGross);

    if (!byPerson[name]) {
      byPerson[name] = {
        name: name,
        newUnits: 0,
        usedUnits: 0,
        totalUnits: 0,
        gmcUnits: 0,
        buickUnits: 0,
        frontEndGross: 0,
        backEndGross: 0,
        totalGross: 0
      };
    }

    byPerson[name].totalUnits++;
    byPerson[name].frontEndGross += frontGross;
    byPerson[name].backEndGross += backGross;
    byPerson[name].totalGross += totalGross;

    if (newUsed === 'NEW' || newUsed === 'N') {
      byPerson[name].newUnits++;
      if (make.includes('GMC')) byPerson[name].gmcUnits++;
      if (make.includes('BUICK')) byPerson[name].buickUnits++;
    } else {
      byPerson[name].usedUnits++;
    }
  });

  // Calculate eligibility
  let eligibleCount = 0;
  let totalBonus = 0;
  const details = [];

  Object.values(byPerson).forEach(person => {
    const meetsMinUnits = person.newUnits >= goals.MIN_UNITS_FOR_BONUS;
    const eligible = meetsMinUnits && d2eUnlocked;
    const bonus = eligible ? goals.BONUS_PER_PERSON : 0;

    if (eligible) {
      eligibleCount++;
      totalBonus += bonus;
    }

    details.push({
      name: person.name,
      newUnits: person.newUnits,
      usedUnits: person.usedUnits,
      totalUnits: person.totalUnits,
      gmcUnits: person.gmcUnits,
      buickUnits: person.buickUnits,
      frontEndGross: person.frontEndGross,
      backEndGross: person.backEndGross,
      totalGross: person.totalGross,
      eligible: eligible,
      bonus: bonus
    });
  });

  // Sort by total units descending
  details.sort((a, b) => b.totalUnits - a.totalUnits);

  return {
    eligibleCount: eligibleCount,
    totalBonus: totalBonus,
    details: details
  };
}

/**
 * Gets goals from Goals sheet or uses defaults
 */
function getGoals() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const goalsSheet = ss.getSheetByName(CONFIG.GOALS_SHEET);

  if (goalsSheet) {
    try {
      // Try to read goals from the Goals sheet
      // Adjust these cell references to match your Goals sheet layout
      return {
        GMC_GOAL: Number(goalsSheet.getRange('B2').getValue()) || CONFIG.DEFAULT_GOALS.GMC_GOAL,
        BUICK_GOAL: Number(goalsSheet.getRange('B3').getValue()) || CONFIG.DEFAULT_GOALS.BUICK_GOAL,
        USED_GOAL: Number(goalsSheet.getRange('B4').getValue()) || CONFIG.DEFAULT_GOALS.USED_GOAL,
        TOTAL_GROSS_GOAL: Number(goalsSheet.getRange('B5').getValue()) || CONFIG.DEFAULT_GOALS.TOTAL_GROSS_GOAL,
        BONUS_PER_PERSON: Number(goalsSheet.getRange('B6').getValue()) || CONFIG.DEFAULT_GOALS.BONUS_PER_PERSON,
        MIN_UNITS_FOR_BONUS: Number(goalsSheet.getRange('B7').getValue()) || CONFIG.DEFAULT_GOALS.MIN_UNITS_FOR_BONUS
      };
    } catch (e) {
      // Fall back to defaults if reading fails
    }
  }

  return CONFIG.DEFAULT_GOALS;
}

/**
 * Finds existing archive row for a month
 */
function findArchiveRow(sheet, monthKey) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === monthKey) {
      return i + 1; // 1-indexed row number
    }
  }
  return -1;
}

/**
 * Formats the archive sheet for readability
 */
function formatArchiveSheet(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Format currency columns
  const currencyColumns = [7, 8, 13, 15, 17, 18, 19, 20, 26]; // Gross and bonus columns
  currencyColumns.forEach(col => {
    sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('$#,##0');
  });

  // Color code status columns
  const statusRange = sheet.getRange(2, 21, lastRow - 1, 4); // Columns U-X
  const statusValues = statusRange.getValues();

  for (let i = 0; i < statusValues.length; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = sheet.getRange(i + 2, 21 + j);
      if (statusValues[i][j] === 'HIT' || statusValues[i][j] === 'UNLOCKED') {
        cell.setBackground('#d4edda').setFontColor('#155724');
      } else {
        cell.setBackground('#f8d7da').setFontColor('#721c24');
      }
    }
  }

  // Auto-resize columns
  sheet.autoResizeColumns(1, 26);

  // Hide the JSON column (salesperson details)
  sheet.hideColumns(27);
}

/**
 * Gets month name from number
 */
function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

/**
 * Creates summary text for alert
 */
function getArchiveSummaryText(metrics, goals, d2eUnlocked, salespersonMetrics) {
  return 'NEW CARS:\n' +
         '  GMC: ' + metrics.gmcUnits + '/' + goals.GMC_GOAL + '\n' +
         '  Buick: ' + metrics.buickUnits + '/' + goals.BUICK_GOAL + '\n' +
         '  Total New: ' + metrics.newUnits + '\n\n' +
         'USED CARS:\n' +
         '  Used: ' + metrics.usedUnits + '/' + goals.USED_GOAL + '\n\n' +
         'TOTALS:\n' +
         '  Units: ' + metrics.totalUnits + '\n' +
         '  Gross: $' + metrics.totalGross.toLocaleString() + '\n\n' +
         'D2E STATUS: ' + (d2eUnlocked ? 'UNLOCKED!' : 'Not Met') + '\n' +
         'Eligible for Bonus: ' + salespersonMetrics.eligibleCount + '\n' +
         'Total Bonus Payout: $' + salespersonMetrics.totalBonus.toLocaleString();
}

/**
 * Shows a summary of all archived months
 */
function showArchiveSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const archiveSheet = ss.getSheetByName(CONFIG.ARCHIVE_SHEET);

  if (!archiveSheet || archiveSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('No archived months found.\n\nUse "Archive Current Month" to create your first archive.');
    return;
  }

  const data = archiveSheet.getDataRange().getValues();
  let summary = 'ARCHIVED MONTHS:\n\n';

  for (let i = 1; i < data.length; i++) {
    const monthName = data[i][1];
    const d2eStatus = data[i][23];
    const totalUnits = data[i][15];
    const totalGross = data[i][16];

    summary += monthName + '\n';
    summary += '  Units: ' + totalUnits + ' | Gross: $' + Number(totalGross).toLocaleString() + '\n';
    summary += '  D2E: ' + d2eStatus + '\n\n';
  }

  SpreadsheetApp.getUi().alert(summary);
}

// ============================================
// TRIGGER FUNCTIONS (Auto-Archive)
// ============================================

/**
 * Sets up automatic monthly archiving on the 1st of each month
 */
function setupMonthlyTrigger() {
  // Remove any existing triggers first
  removeMonthlyTrigger();

  // Create new trigger for 1st of each month at 6 AM
  ScriptApp.newTrigger('autoArchivePreviousMonth')
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .create();

  SpreadsheetApp.getUi().alert('Auto-archive enabled!\n\nThe previous month will be automatically archived on the 1st of each month at 6 AM.');
}

/**
 * Removes the monthly trigger
 */
function removeMonthlyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'autoArchivePreviousMonth') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  SpreadsheetApp.getUi().alert('Auto-archive disabled.');
}

/**
 * Called automatically by the trigger
 */
function autoArchivePreviousMonth() {
  archivePreviousMonth();

  // Send email notification (optional - uncomment to enable)
  // const email = Session.getActiveUser().getEmail();
  // const ss = SpreadsheetApp.getActiveSpreadsheet();
  // MailApp.sendEmail(email, 'Monthly Archive Complete',
  //   'The previous month has been automatically archived in ' + ss.getName());
}
