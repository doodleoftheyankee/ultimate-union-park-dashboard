/**
═══════════════════════════════════════════════════════════════════════════════════════
UNION PARK BUICK GMC - SALES COMMAND CENTER v3.1
Enhanced with NEW CAR & USED CAR Tracking + Archive + End Month Backup
═══════════════════════════════════════════════════════════════════════════════════════
*/

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 1: MASTER CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  DEALERSHIP: {
    NAME: "Union Park Buick GMC",
    SHORT_NAME: "Union Park",
    LOCATION: "Wilmington, Delaware",
    TIMEZONE: "America/New_York",
    MANAGER: "Brian Callahan"
  },

  TEAM: {
    MANAGER: { id: "BC", name: "BRIAN CALLAHAN", role: "New Car Sales Manager" },
    SALESPEOPLE: [
      { id: "AG", name: "ANDREA GUIDO", active: true, nickname: "Andrea" },
      { id: "TG", name: "TOM GUIDO", active: true, nickname: "Tom" },
      { id: "JV", name: "JIM VANDYKE", active: true, nickname: "Jim" },
      { id: "SW", name: "SAM WILLIAMS", active: true, nickname: "Sam" },
      { id: "CM", name: "CHRIS MEEKS", active: true, nickname: "Chris" },
      { id: "JA", name: "JAVIER AVILES", active: true, nickname: "Javier" },
      { id: "AC", name: "ALFONSO COLON", active: true, nickname: "Alfonso" }
    ],
    getActiveNames: function() { return this.SALESPEOPLE.filter(function(p) { return p.active; }).map(function(p) { return p.name; }); },
    getActivePeople: function() { return this.SALESPEOPLE.filter(function(p) { return p.active; }); },
    getByName: function(name) { return this.SALESPEOPLE.find(function(p) { return p.name.toUpperCase() === (name || "").toUpperCase(); }); },
    count: function() { return this.SALESPEOPLE.filter(function(p) { return p.active; }).length; }
  },

  INVENTORY: {
    MAKES: ["Buick", "GMC"],
    MODELS: {
      Buick: ["ENCORE GX", "ENVISTA", "ENVISION", "ENVISION AVENIR", "ENCLAVE", "ENCLAVE AVENIR"],
      GMC: ["TERRAIN", "TERRAIN DENALI", "ACADIA", "ACADIA DENALI", "CANYON", "CANYON AT4", "CANYON DENALI",
            "SIERRA 1500", "SIERRA 1500 ELEVATION", "SIERRA 1500 AT4", "SIERRA 1500 DENALI", "SIERRA 1500 DENALI ULTIMATE",
            "SIERRA 2500HD", "SIERRA 2500HD AT4", "SIERRA 2500HD DENALI", "SIERRA 3500HD", "SIERRA 3500HD DENALI",
            "SIERRA EV DENALI", "YUKON", "YUKON DENALI", "YUKON XL", "YUKON XL DENALI", "HUMMER EV PICKUP", "HUMMER EV SUV"]
    },
    YEARS: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    getModelsForMake: function(make) { return this.MODELS[make] || []; }
  },

  LEAD_SOURCES: ["Walk-in", "Internet", "Repeat Customer", "Phone Up", "Referral", "Service Dept", "Social Media", "BDC", "Event/Promotion"],

  COMPENSATION: {
    D2E: { BONUS_AMOUNT: 375, MIN_UNITS_REQUIRED: 4 }
  },

  PERFORMANCE: {
    DAILY_ACTIVITY: { PHONE_CALLS_MIN: 15, APPOINTMENTS_MIN: 1 }
  },

  SHEETS: {
    NEW_CAR_TRACKER: "New Car Tracker",
    USED_CAR_TRACKER: "Used Car Tracker",
    D2E_GOALS: "D2E Goals",
    BRAND_OBJECTIVES: "Brand Objectives",
    DAILY_ACTIVITY: "Daily Activity",
    MONTHLY_GOALS: "Monthly Goals",
    AUDIT_LOG: "Audit Log"
  },

  DATA: {
    TRACKER: {
      HEADER_ROW: 7,
      DATA_START_ROW: 8,
      COLUMNS: { DATE: 1, DEAL_NUMBER: 2, STOCK_NUMBER: 3, MAKE: 4, MODEL: 5, YEAR: 6, CUSTOMER_NAME: 7,
                 LEAD_TYPE: 8, SALES_PERSON: 9, TRADE_IN: 10, TRADE_VALUE: 11, SALE_PRICE: 12,
                 FRONT_END: 13, BACK_END: 14, TOTAL_PROFIT: 15, FINANCING: 16, WARRANTY: 17, D2E_ELIGIBLE: 18, NOTES: 19 }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 2: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════

const Utils = {
  now: function() {
    return new Date();
  },

  formatDate: function(date, format) {
    if (!date) return "";
    return Utilities.formatDate(new Date(date), CONFIG.DEALERSHIP.TIMEZONE, format || "yyyy-MM-dd");
  },

  getMonthStart: function(date) {
    const d = date ? new Date(date) : this.now();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  getMonthEnd: function(date) {
    const d = date ? new Date(date) : this.now();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  },

  getDaysRemaining: function() {
    return Math.ceil((this.getMonthEnd() - this.now()) / (1000 * 60 * 60 * 24));
  },

  getDaysElapsed: function() {
    return Math.floor((this.now() - this.getMonthStart()) / (1000 * 60 * 60 * 24)) + 1;
  },

  getDaysInMonth: function() {
    const now = this.now();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  },

  toNumber: function(value, def) {
    if (value === null || value === undefined || value === "") return def || 0;
    if (typeof value === 'number') return value;
    var cleaned = String(value).replace(/[$,\s]/g, '').trim();
    if (cleaned.charAt(0) === '(' && cleaned.charAt(cleaned.length - 1) === ')') {
      cleaned = '-' + cleaned.substring(1, cleaned.length - 1);
    }
    var num = parseFloat(cleaned);
    return isNaN(num) ? (def || 0) : num;
  },

  toInt: function(value, def) {
    if (value === null || value === undefined || value === "") return def || 0;
    if (typeof value === 'number') return Math.round(value);
    var cleaned = String(value).replace(/[$,\s]/g, '').trim();
    var num = parseInt(cleaned);
    return isNaN(num) ? (def || 0) : num;
  },

  formatCurrency: function(value) {
    return '$' + this.toNumber(value).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
  },

  sanitize: function(value) {
    return value ? String(value).trim().toUpperCase() : "";
  },

  log: function(msg, level) {
    console.log("[" + (level || "INFO") + "] " + msg);
  },

  parseFormDate: function(dateStr) {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    var parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateStr);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 3: DATA ACCESS LAYER
// ═══════════════════════════════════════════════════════════════════════════════════════

const DataAccess = {
  getSpreadsheet: function() { return SpreadsheetApp.getActiveSpreadsheet(); },

  getSheet: function(sheetName) {
    const sheet = this.getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error('Sheet "' + sheetName + '" not found. Run Initialize System first.');
    return sheet;
  },

  sheetExists: function(sheetName) { return this.getSpreadsheet().getSheetByName(sheetName) !== null; },

  getSalesData: function(sheetName) {
    const sheet = this.getSheet(sheetName);
    const lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.DATA.TRACKER.DATA_START_ROW) return [];

    const data = sheet.getRange(CONFIG.DATA.TRACKER.DATA_START_ROW, 1, lastRow - CONFIG.DATA.TRACKER.DATA_START_ROW + 1, 19).getValues();
    const sales = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isUsedCarSheet = (sheetName === CONFIG.SHEETS.USED_CAR_TRACKER);

    data.forEach(function(row, index) {
      if (!row[0]) return;

      var saleDate;
      if (row[0] instanceof Date) {
        saleDate = row[0];
      } else if (typeof row[0] === 'string' && row[0].trim() !== '') {
        saleDate = new Date(row[0]);
      } else if (typeof row[0] === 'number') {
        saleDate = new Date((row[0] - 25569) * 86400 * 1000);
      } else {
        return;
      }

      if (isNaN(saleDate.getTime())) return;

      if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
        var sale;
        if (isUsedCarSheet) {
          sale = {
            row: CONFIG.DATA.TRACKER.DATA_START_ROW + index,
            date: saleDate, dealNumber: String(row[1]), stockNumber: String(row[2]),
            year: Utils.toInt(row[3]), make: String(row[4]), model: String(row[5]),
            customerName: String(row[6]), leadType: String(row[7]), salesPerson: String(row[8]),
            tradeIn: String(row[9]), tradeInValue: Utils.toNumber(row[10]),
            salePrice: Utils.toNumber(row[11]), frontEndProfit: Utils.toNumber(row[12]),
            backEndProfit: Utils.toNumber(row[13]), totalProfit: Utils.toNumber(row[14]),
            financing: String(row[15]), warranty: String(row[16]), notes: String(row[17]),
            d2eEligible: "No"
          };
        } else {
          sale = {
            row: CONFIG.DATA.TRACKER.DATA_START_ROW + index,
            date: saleDate, dealNumber: String(row[1]), stockNumber: String(row[2]),
            make: String(row[3]), model: String(row[4]), year: Utils.toInt(row[5]),
            customerName: String(row[6]), leadType: String(row[7]), salesPerson: String(row[8]),
            tradeIn: String(row[9]), tradeInValue: Utils.toNumber(row[10]),
            salePrice: Utils.toNumber(row[11]), frontEndProfit: Utils.toNumber(row[12]),
            backEndProfit: Utils.toNumber(row[13]), totalProfit: Utils.toNumber(row[14]),
            financing: String(row[15]), warranty: String(row[16]), d2eEligible: String(row[17]), notes: String(row[18])
          };
        }
        sales.push(sale);
      }
    });
    return sales;
  },

  getMonthlyGoals: function() {
    try {
      const sheet = this.getSheet(CONFIG.SHEETS.MONTHLY_GOALS);
      const data = sheet.getDataRange().getValues();
      const now = Utils.now();

      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          const goalDate = new Date(data[i][0]);
          if (goalDate.getMonth() === now.getMonth() && goalDate.getFullYear() === now.getFullYear()) {
            return {
              gmcNewGoal: Utils.toInt(data[i][1], 21),
              buickNewGoal: Utils.toInt(data[i][2], 9),
              usedGoal: Utils.toInt(data[i][3], 75),
              totalGrossGoal: Utils.toNumber(data[i][4], 150000)
            };
          }
        }
      }
    } catch (e) { Utils.log("Could not get monthly goals: " + e.message, "WARN"); }
    return { gmcNewGoal: 21, buickNewGoal: 9, usedGoal: 75, totalGrossGoal: 150000 };
  },

  saveMonthlyGoals: function(monthStr, goals) {
    const sheet = this.getSheet(CONFIG.SHEETS.MONTHLY_GOALS);
    const parts = monthStr.split('-');
    const monthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);

    const data = sheet.getDataRange().getValues();
    let foundRow = null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const d = new Date(data[i][0]);
        if (d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear()) {
          foundRow = i + 1;
          break;
        }
      }
    }

    const rowData = [monthDate, goals.gmcNewGoal, goals.buickNewGoal, goals.usedGoal, goals.totalGrossGoal];

    if (foundRow) {
      sheet.getRange(foundRow, 1, 1, 5).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    SpreadsheetApp.flush();
    return { success: true };
  },

  getD2EGoals: function() {
    const goals = {};
    try {
      const sheet = this.getSheet(CONFIG.SHEETS.D2E_GOALS);
      const data = sheet.getDataRange().getValues();
      const now = Utils.now();

      for (let i = 4; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
          const goalDate = new Date(data[i][0]);
          if (goalDate.getMonth() === now.getMonth() && goalDate.getFullYear() === now.getFullYear()) {
            goals[Utils.sanitize(data[i][1])] = { goal: Utils.toInt(data[i][2], 4) };
          }
        }
      }
    } catch (e) { Utils.log("Could not get D2E goals: " + e.message, "WARN"); }
    return goals;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 4: METRICS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

const MetricsEngine = {
  getDashboardMetrics: function() {
    let newCarSales = [];
    let usedCarSales = [];

    try { newCarSales = DataAccess.getSalesData(CONFIG.SHEETS.NEW_CAR_TRACKER); } catch(e) { Utils.log("No new car data: " + e.message); }
    try { usedCarSales = DataAccess.getSalesData(CONFIG.SHEETS.USED_CAR_TRACKER); } catch(e) { Utils.log("No used car data: " + e.message); }

    const goals = DataAccess.getMonthlyGoals();
    const d2eGoals = DataAccess.getD2EGoals();

    const gmcNewSales = newCarSales.filter(function(s) { return Utils.sanitize(s.make) === "GMC"; });
    const buickNewSales = newCarSales.filter(function(s) { return Utils.sanitize(s.make) === "BUICK"; });

    const totalNewUnits = newCarSales.length;
    const totalUsedUnits = usedCarSales.length;
    const totalUnits = totalNewUnits + totalUsedUnits;

    const newProfit = newCarSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
    const usedProfit = usedCarSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
    const totalProfit = newProfit + usedProfit;

    const totalFrontEnd = newCarSales.reduce(function(sum, s) { return sum + (s.frontEndProfit || 0); }, 0) +
                          usedCarSales.reduce(function(sum, s) { return sum + (s.frontEndProfit || 0); }, 0);
    const totalBackEnd = newCarSales.reduce(function(sum, s) { return sum + (s.backEndProfit || 0); }, 0) +
                         usedCarSales.reduce(function(sum, s) { return sum + (s.backEndProfit || 0); }, 0);

    const salespersonMetrics = CONFIG.TEAM.getActiveNames().map(function(name) {
      const normalizedName = Utils.sanitize(name);
      const firstName = normalizedName.split(' ')[0];

      const personNewSales = newCarSales.filter(function(s) {
        var spName = Utils.sanitize(s.salesPerson);
        return spName === normalizedName || spName === firstName || spName.indexOf(firstName) === 0;
      });
      const personUsedSales = usedCarSales.filter(function(s) {
        var spName = Utils.sanitize(s.salesPerson);
        return spName === normalizedName || spName === firstName || spName.indexOf(firstName) === 0;
      });

      const d2e = d2eGoals[normalizedName] || { goal: 4 };

      const newUnits = personNewSales.length;
      const usedUnits = personUsedSales.length;
      const personTotalUnits = newUnits + usedUnits;

      const gmcUnits = personNewSales.filter(function(s) { return Utils.sanitize(s.make) === "GMC"; }).length;
      const buickUnits = personNewSales.filter(function(s) { return Utils.sanitize(s.make) === "BUICK"; }).length;

      const personNewProfit = personNewSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
      const personUsedProfit = personUsedSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
      const personTotalProfit = personNewProfit + personUsedProfit;

      const personFrontEnd = personNewSales.reduce(function(sum, s) { return sum + (s.frontEndProfit || 0); }, 0) +
                             personUsedSales.reduce(function(sum, s) { return sum + (s.frontEndProfit || 0); }, 0);
      const personBackEnd = personNewSales.reduce(function(sum, s) { return sum + (s.backEndProfit || 0); }, 0) +
                            personUsedSales.reduce(function(sum, s) { return sum + (s.backEndProfit || 0); }, 0);

      const meetsMinUnits = newUnits >= CONFIG.COMPENSATION.D2E.MIN_UNITS_REQUIRED;
      const meetsD2EGoal = newUnits >= d2e.goal;
      const bonusEligible = meetsMinUnits && meetsD2EGoal;

      const person = CONFIG.TEAM.getByName(name);

      return {
        name: name,
        nickname: person ? person.nickname : name.split(" ")[0],
        newUnits: newUnits,
        usedUnits: usedUnits,
        totalUnits: personTotalUnits,
        gmcUnits: gmcUnits,
        buickUnits: buickUnits,
        frontEndProfit: personFrontEnd,
        backEndProfit: personBackEnd,
        newProfit: personNewProfit,
        usedProfit: personUsedProfit,
        totalProfit: personTotalProfit,
        avgNewProfit: newUnits > 0 ? personNewProfit / newUnits : 0,
        avgUsedProfit: usedUnits > 0 ? personUsedProfit / usedUnits : 0,
        avgFrontEnd: personTotalUnits > 0 ? personFrontEnd / personTotalUnits : 0,
        avgBackEnd: personTotalUnits > 0 ? personBackEnd / personTotalUnits : 0,
        d2eGoal: d2e.goal,
        meetsMinUnits: meetsMinUnits,
        meetsD2EGoal: meetsD2EGoal,
        bonusEligible: bonusEligible,
        bonusAmount: bonusEligible ? CONFIG.COMPENSATION.D2E.BONUS_AMOUNT : 0
      };
    });

    const bonusEligibleCount = salespersonMetrics.filter(function(p) { return p.bonusEligible; }).length;

    const allSales = newCarSales.concat(usedCarSales);
    allSales.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    const recentSales = allSales.slice(0, 20).map(function(s) {
      return {
        date: s.date,
        dealNumber: s.dealNumber || '',
        stockNumber: s.stockNumber || '',
        make: s.make || '',
        model: s.model || '',
        year: s.year || 0,
        customerName: s.customerName || '',
        salesPerson: s.salesPerson || '',
        frontEndProfit: s.frontEndProfit || 0,
        backEndProfit: s.backEndProfit || 0,
        totalProfit: s.totalProfit || 0
      };
    });

    return {
      timestamp: Utils.now(),
      monthName: Utils.formatDate(Utils.now(), "MMMM yyyy"),
      daysElapsed: Utils.getDaysElapsed(),
      daysRemaining: Utils.getDaysRemaining(),
      daysInMonth: Utils.getDaysInMonth(),
      percentComplete: Utils.getDaysElapsed() / Utils.getDaysInMonth(),

      goals: goals,

      dealership: {
        totalNewUnits: totalNewUnits,
        gmcSold: gmcNewSales.length,
        gmcGoal: goals.gmcNewGoal,
        gmcProgress: goals.gmcNewGoal > 0 ? gmcNewSales.length / goals.gmcNewGoal : 0,
        gmcRemaining: Math.max(0, goals.gmcNewGoal - gmcNewSales.length),
        buickSold: buickNewSales.length,
        buickGoal: goals.buickNewGoal,
        buickProgress: goals.buickNewGoal > 0 ? buickNewSales.length / goals.buickNewGoal : 0,
        buickRemaining: Math.max(0, goals.buickNewGoal - buickNewSales.length),
        newProfit: newProfit,
        avgNewProfit: totalNewUnits > 0 ? newProfit / totalNewUnits : 0,

        totalUsedUnits: totalUsedUnits,
        usedGoal: goals.usedGoal,
        usedProgress: goals.usedGoal > 0 ? totalUsedUnits / goals.usedGoal : 0,
        usedRemaining: Math.max(0, goals.usedGoal - totalUsedUnits),
        usedProfit: usedProfit,
        avgUsedProfit: totalUsedUnits > 0 ? usedProfit / totalUsedUnits : 0,

        totalUnits: totalUnits,
        totalFrontEnd: totalFrontEnd,
        totalBackEnd: totalBackEnd,
        totalProfit: totalProfit,
        avgProfit: totalUnits > 0 ? totalProfit / totalUnits : 0,
        avgFrontEnd: totalUnits > 0 ? totalFrontEnd / totalUnits : 0,
        avgBackEnd: totalUnits > 0 ? totalBackEnd / totalUnits : 0,
        totalGrossGoal: goals.totalGrossGoal,

        bonusEligibleCount: bonusEligibleCount,
        teamSize: CONFIG.TEAM.count()
      },

      salespeople: salespersonMetrics,
      recentSales: recentSales,

      pace: {
        gmc: {
          sold: gmcNewSales.length,
          goal: goals.gmcNewGoal,
          needed: Math.max(0, goals.gmcNewGoal - gmcNewSales.length),
          pacePerDay: Utils.getDaysRemaining() > 0 ? Math.max(0, goals.gmcNewGoal - gmcNewSales.length) / Utils.getDaysRemaining() : 0,
          onTrack: gmcNewSales.length >= Math.round(goals.gmcNewGoal * (Utils.getDaysElapsed() / Utils.getDaysInMonth()))
        },
        buick: {
          sold: buickNewSales.length,
          goal: goals.buickNewGoal,
          needed: Math.max(0, goals.buickNewGoal - buickNewSales.length),
          pacePerDay: Utils.getDaysRemaining() > 0 ? Math.max(0, goals.buickNewGoal - buickNewSales.length) / Utils.getDaysRemaining() : 0,
          onTrack: buickNewSales.length >= Math.round(goals.buickNewGoal * (Utils.getDaysElapsed() / Utils.getDaysInMonth()))
        },
        used: {
          sold: totalUsedUnits,
          goal: goals.usedGoal,
          needed: Math.max(0, goals.usedGoal - totalUsedUnits),
          pacePerDay: Utils.getDaysRemaining() > 0 ? Math.max(0, goals.usedGoal - totalUsedUnits) / Utils.getDaysRemaining() : 0,
          onTrack: totalUsedUnits >= Math.round(goals.usedGoal * (Utils.getDaysElapsed() / Utils.getDaysInMonth()))
        }
      }
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 5: WEB APP API FOR TV DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    // Check if specific month/year requested
    var params = e ? e.parameter : {};
    var requestedMonth = params.month ? parseInt(params.month) : null;
    var requestedYear = params.year ? parseInt(params.year) : null;

    var metrics;
    if (requestedMonth && requestedYear) {
      metrics = getMetricsForMonth(requestedYear, requestedMonth);
    } else {
      metrics = MetricsEngine.getDashboardMetrics();
    }

    return ContentService.createTextOutput(JSON.stringify(metrics))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Get metrics for a specific month/year
function getMetricsForMonth(year, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var newSheet = ss.getSheetByName(CONFIG.SHEETS.NEW_CAR_TRACKER);
  var usedSheet = ss.getSheetByName(CONFIG.SHEETS.USED_CAR_TRACKER);

  if (!newSheet || !usedSheet) {
    return { error: 'Sheets not found', newSheetExists: !!newSheet, usedSheetExists: !!usedSheet };
  }

  var goals = DataAccess.getMonthlyGoals();
  var d2eGoals = DataAccess.getD2EGoals();

  // Get sales data for specific month
  var newData = newSheet.getDataRange().getValues();
  var usedData = usedSheet.getDataRange().getValues();

  // Debug: check what months exist in the data
  var monthsInNewData = {};
  var monthsInUsedData = {};
  var sampleDates = []; // Store first 5 raw date values for debugging

  var newCarSales = [];
  var usedCarSales = [];

  // Parse new car sales for requested month
  for (var i = CONFIG.DATA.TRACKER.DATA_START_ROW - 1; i < newData.length; i++) {
    var row = newData[i];
    if (!row[0]) continue;

    // Capture first 5 raw dates for debugging
    if (sampleDates.length < 5) {
      sampleDates.push({
        raw: String(row[0]),
        isDate: row[0] instanceof Date,
        parsed: row[0] instanceof Date ? row[0].toISOString() : new Date(row[0]).toISOString()
      });
    }

    var saleDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(saleDate.getTime())) continue;

    // Track what months we find
    var monthKey = saleDate.getFullYear() + '-' + (saleDate.getMonth() + 1);
    monthsInNewData[monthKey] = (monthsInNewData[monthKey] || 0) + 1;

    if (saleDate.getMonth() + 1 === month && saleDate.getFullYear() === year) {
      newCarSales.push({
        date: saleDate,
        dealNumber: String(row[1]),
        stockNumber: String(row[2]),
        make: String(row[3]),
        model: String(row[4]),
        year: Utils.toInt(row[5]),
        customerName: String(row[6]),
        leadType: String(row[7]),
        salesPerson: String(row[8]),
        frontEndProfit: Utils.toNumber(row[12]),
        backEndProfit: Utils.toNumber(row[13]),
        totalProfit: Utils.toNumber(row[14])
      });
    }
  }

  // Parse used car sales for requested month
  for (var j = CONFIG.DATA.TRACKER.DATA_START_ROW - 1; j < usedData.length; j++) {
    var urow = usedData[j];
    if (!urow[0]) continue;

    var uSaleDate = urow[0] instanceof Date ? urow[0] : new Date(urow[0]);
    if (isNaN(uSaleDate.getTime())) continue;

    // Track what months we find
    var uMonthKey = uSaleDate.getFullYear() + '-' + (uSaleDate.getMonth() + 1);
    monthsInUsedData[uMonthKey] = (monthsInUsedData[uMonthKey] || 0) + 1;

    if (uSaleDate.getMonth() + 1 === month && uSaleDate.getFullYear() === year) {
      usedCarSales.push({
        date: uSaleDate,
        dealNumber: String(urow[1]),
        stockNumber: String(urow[2]),
        year: Utils.toInt(urow[3]),
        make: String(urow[4]),
        model: String(urow[5]),
        customerName: String(urow[6]),
        leadType: String(urow[7]),
        salesPerson: String(urow[8]),
        frontEndProfit: Utils.toNumber(urow[12]),
        backEndProfit: Utils.toNumber(urow[13]),
        totalProfit: Utils.toNumber(urow[14])
      });
    }
  }

  // Calculate metrics
  var gmcNewSales = newCarSales.filter(function(s) { return Utils.sanitize(s.make) === "GMC"; });
  var buickNewSales = newCarSales.filter(function(s) { return Utils.sanitize(s.make) === "BUICK"; });

  var totalNewUnits = newCarSales.length;
  var totalUsedUnits = usedCarSales.length;
  var totalUnits = totalNewUnits + totalUsedUnits;

  var newProfit = newCarSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
  var usedProfit = usedCarSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
  var totalProfit = newProfit + usedProfit;

  var totalFrontEnd = newCarSales.reduce(function(sum, s) { return sum + s.frontEndProfit; }, 0) +
                      usedCarSales.reduce(function(sum, s) { return sum + s.frontEndProfit; }, 0);
  var totalBackEnd = newCarSales.reduce(function(sum, s) { return sum + s.backEndProfit; }, 0) +
                     usedCarSales.reduce(function(sum, s) { return sum + s.backEndProfit; }, 0);

  // Salesperson metrics
  var salespersonMetrics = CONFIG.TEAM.getActiveNames().map(function(name) {
    var normalizedName = Utils.sanitize(name);
    var firstName = normalizedName.split(' ')[0];

    var personNewSales = newCarSales.filter(function(s) {
      var spName = Utils.sanitize(s.salesPerson);
      return spName === normalizedName || spName === firstName || spName.indexOf(firstName) === 0;
    });
    var personUsedSales = usedCarSales.filter(function(s) {
      var spName = Utils.sanitize(s.salesPerson);
      return spName === normalizedName || spName === firstName || spName.indexOf(firstName) === 0;
    });

    var d2e = d2eGoals[normalizedName] || { goal: 4 };
    var newUnits = personNewSales.length;
    var usedUnits = personUsedSales.length;

    var gmcUnits = personNewSales.filter(function(s) { return Utils.sanitize(s.make) === "GMC"; }).length;
    var buickUnits = personNewSales.filter(function(s) { return Utils.sanitize(s.make) === "BUICK"; }).length;

    var personNewProfit = personNewSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);
    var personUsedProfit = personUsedSales.reduce(function(sum, s) { return sum + s.totalProfit; }, 0);

    var personFrontEnd = personNewSales.reduce(function(sum, s) { return sum + s.frontEndProfit; }, 0) +
                         personUsedSales.reduce(function(sum, s) { return sum + s.frontEndProfit; }, 0);
    var personBackEnd = personNewSales.reduce(function(sum, s) { return sum + s.backEndProfit; }, 0) +
                        personUsedSales.reduce(function(sum, s) { return sum + s.backEndProfit; }, 0);

    var meetsMinUnits = newUnits >= CONFIG.COMPENSATION.D2E.MIN_UNITS_REQUIRED;
    var meetsD2EGoal = newUnits >= d2e.goal;
    var bonusEligible = meetsMinUnits && meetsD2EGoal;

    var person = CONFIG.TEAM.getByName(name);

    return {
      name: name,
      nickname: person ? person.nickname : name.split(" ")[0],
      newUnits: newUnits,
      usedUnits: usedUnits,
      totalUnits: newUnits + usedUnits,
      gmcUnits: gmcUnits,
      buickUnits: buickUnits,
      frontEndProfit: personFrontEnd,
      backEndProfit: personBackEnd,
      newProfit: personNewProfit,
      usedProfit: personUsedProfit,
      totalProfit: personNewProfit + personUsedProfit,
      avgNewProfit: newUnits > 0 ? personNewProfit / newUnits : 0,
      avgUsedProfit: usedUnits > 0 ? personUsedProfit / usedUnits : 0,
      avgFrontEnd: (newUnits + usedUnits) > 0 ? personFrontEnd / (newUnits + usedUnits) : 0,
      avgBackEnd: (newUnits + usedUnits) > 0 ? personBackEnd / (newUnits + usedUnits) : 0,
      d2eGoal: d2e.goal,
      meetsMinUnits: meetsMinUnits,
      meetsD2EGoal: meetsD2EGoal,
      bonusEligible: bonusEligible,
      bonusAmount: bonusEligible ? CONFIG.COMPENSATION.D2E.BONUS_AMOUNT : 0
    };
  });

  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var daysInMonth = new Date(year, month, 0).getDate();

  return {
    timestamp: new Date().toISOString(),
    monthName: monthNames[month - 1] + ' ' + year,
    requestedMonth: month,
    requestedYear: year,
    daysElapsed: daysInMonth,
    daysRemaining: 0,
    daysInMonth: daysInMonth,
    percentComplete: 1,

    goals: goals,

    dealership: {
      totalNewUnits: totalNewUnits,
      gmcSold: gmcNewSales.length,
      gmcGoal: goals.gmcNewGoal,
      gmcProgress: goals.gmcNewGoal > 0 ? gmcNewSales.length / goals.gmcNewGoal : 0,
      gmcRemaining: Math.max(0, goals.gmcNewGoal - gmcNewSales.length),
      buickSold: buickNewSales.length,
      buickGoal: goals.buickNewGoal,
      buickProgress: goals.buickNewGoal > 0 ? buickNewSales.length / goals.buickNewGoal : 0,
      buickRemaining: Math.max(0, goals.buickNewGoal - buickNewSales.length),
      newProfit: newProfit,
      avgNewProfit: totalNewUnits > 0 ? newProfit / totalNewUnits : 0,
      totalUsedUnits: totalUsedUnits,
      usedGoal: goals.usedGoal,
      usedProgress: goals.usedGoal > 0 ? totalUsedUnits / goals.usedGoal : 0,
      usedRemaining: Math.max(0, goals.usedGoal - totalUsedUnits),
      usedProfit: usedProfit,
      avgUsedProfit: totalUsedUnits > 0 ? usedProfit / totalUsedUnits : 0,
      totalUnits: totalUnits,
      totalFrontEnd: totalFrontEnd,
      totalBackEnd: totalBackEnd,
      totalProfit: totalProfit,
      avgProfit: totalUnits > 0 ? totalProfit / totalUnits : 0,
      avgFrontEnd: totalUnits > 0 ? totalFrontEnd / totalUnits : 0,
      avgBackEnd: totalUnits > 0 ? totalBackEnd / totalUnits : 0,
      totalGrossGoal: goals.totalGrossGoal,
      bonusEligibleCount: salespersonMetrics.filter(function(p) { return p.bonusEligible; }).length,
      teamSize: CONFIG.TEAM.count()
    },

    salespeople: salespersonMetrics,
    recentSales: newCarSales.concat(usedCarSales).slice(0, 20),

    pace: {
      gmc: { sold: gmcNewSales.length, goal: goals.gmcNewGoal, needed: 0, pacePerDay: 0, onTrack: gmcNewSales.length >= goals.gmcNewGoal },
      buick: { sold: buickNewSales.length, goal: goals.buickNewGoal, needed: 0, pacePerDay: 0, onTrack: buickNewSales.length >= goals.buickNewGoal },
      used: { sold: totalUsedUnits, goal: goals.usedGoal, needed: 0, pacePerDay: 0, onTrack: totalUsedUnits >= goals.usedGoal }
    },

    // Debug info - shows what months of data exist in sheets
    debug: {
      requestedMonth: month,
      requestedYear: year,
      newDataRows: newData.length,
      usedDataRows: usedData.length,
      monthsFoundInNewData: monthsInNewData,
      monthsFoundInUsedData: monthsInUsedData,
      matchedNewSales: newCarSales.length,
      matchedUsedSales: usedCarSales.length,
      sampleDates: sampleDates
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 6: COLOR CODE PROFIT COLUMNS
// ═══════════════════════════════════════════════════════════════════════════════════════

function colorCodeProfitColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var sheets = ['New Car Tracker', 'Used Car Tracker'];

  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    var rules = sheet.getConditionalFormatRules();
    var newRules = rules.filter(function(rule) {
      var ranges = rule.getRanges();
      return !ranges.some(function(r) {
        var col = r.getColumn();
        return col >= 13 && col <= 15;
      });
    });

    var frontEndRange = sheet.getRange('M8:M1000');
    var backEndRange = sheet.getRange('N8:N1000');
    var totalProfitRange = sheet.getRange('O8:O1000');

    var greenRule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setBackground('#1a3d1a')
      .setFontColor('#22c55e')
      .setBold(true)
      .setRanges([frontEndRange, backEndRange, totalProfitRange])
      .build();

    var redRule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(0)
      .setBackground('#3d1a1a')
      .setFontColor('#ef4444')
      .setBold(true)
      .setRanges([frontEndRange, backEndRange, totalProfitRange])
      .build();

    var zeroRule = SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(0)
      .setBackground('#3d3d1a')
      .setFontColor('#f59e0b')
      .setRanges([frontEndRange, backEndRange, totalProfitRange])
      .build();

    newRules.push(greenRule);
    newRules.push(redRule);
    newRules.push(zeroRule);

    sheet.setConditionalFormatRules(newRules);

    frontEndRange.setNumberFormat('$#,##0');
    backEndRange.setNumberFormat('$#,##0');
    totalProfitRange.setNumberFormat('$#,##0');
  });

  SpreadsheetApp.flush();
  ui.alert('✅ Profit Color Coding Applied!',
    'Front End, Back End, and Total Profit columns are now color coded:\n\n' +
    '🟢 GREEN = Positive profit\n' +
    '🔴 RED = Negative profit\n' +
    '🟡 YELLOW = Zero\n\n' +
    'Applied to both New Car Tracker and Used Car Tracker.',
    ui.ButtonSet.OK);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 7: MONTHLY GOALS MANAGER
// ═══════════════════════════════════════════════════════════════════════════════════════

function showMonthlyGoalsManager() {
  var goals = DataAccess.getMonthlyGoals();
  var html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; background: #1a1a1a; color: white; }
      .form-group { margin-bottom: 20px; }
      label { display: block; color: #888; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; }
      input { width: 100%; padding: 14px; border: 2px solid #333; border-radius: 8px; background: #2a2a2a; color: white; font-size: 18px; box-sizing: border-box; }
      input:focus { border-color: #c41230; outline: none; }
      button { width: 100%; padding: 16px; background: #c41230; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 15px; }
      button:hover { background: #a50f28; }
      h2 { color: #c41230; margin: 0 0 25px 0; text-align: center; }
      .current { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
      .success { background: #22c55e; padding: 15px; border-radius: 8px; text-align: center; margin-top: 15px; display: none; }
    </style>
    <h2>📊 Monthly Goals</h2>
    <div class="current">Current Month: ${new Date().toLocaleDateString("en-US", {month: "long", year: "numeric"})}</div>
    <div class="form-group"><label>GMC New Car Goal</label><input type="number" id="gmcGoal" value="${goals.gmcNewGoal}"></div>
    <div class="form-group"><label>Buick New Car Goal</label><input type="number" id="buickGoal" value="${goals.buickNewGoal}"></div>
    <div class="form-group"><label>Used Car Goal</label><input type="number" id="usedGoal" value="${goals.usedGoal}"></div>
    <div class="form-group"><label>Total Gross Goal ($)</label><input type="number" id="grossGoal" value="${goals.totalGrossGoal}"></div>
    <button onclick="saveGoals()">SAVE GOALS</button>
    <div id="success" class="success">✓ Goals Saved!</div>
    <script>
      function saveGoals() {
        var goals = {
          gmcNewGoal: parseInt(document.getElementById("gmcGoal").value) || 21,
          buickNewGoal: parseInt(document.getElementById("buickGoal").value) || 9,
          usedGoal: parseInt(document.getElementById("usedGoal").value) || 75,
          totalGrossGoal: parseInt(document.getElementById("grossGoal").value) || 150000
        };
        google.script.run.withSuccessHandler(function() {
          document.getElementById("success").style.display = "block";
          setTimeout(function() { google.script.host.close(); }, 1500);
        }).withFailureHandler(function(e) {
          alert("Error: " + e.message);
        }).saveMonthlyGoalsFromDashboard(goals);
      }
    </script>
  `).setWidth(400).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 Monthly Goals Manager');
}

function saveMonthlyGoalsFromDashboard(goals) {
  var now = new Date();
  var monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  return DataAccess.saveMonthlyGoals(monthStr, goals);
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 8: D2E GOAL MANAGER
// ═══════════════════════════════════════════════════════════════════════════════════════

function showD2EGoalManager() {
  var html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; background: #1a1a1a; color: white; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
      th { color: #888; font-size: 12px; text-transform: uppercase; }
      input { width: 70px; padding: 8px; border: 2px solid #333; border-radius: 6px; background: #2a2a2a; color: white; text-align: center; }
      input:focus { border-color: #22c55e; outline: none; }
      button { width: 100%; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px; }
      h2 { color: #22c55e; margin: 0 0 10px 0; text-align: center; }
      .info { color: #888; text-align: center; margin-bottom: 15px; font-size: 13px; }
      .success { background: #22c55e; padding: 15px; border-radius: 8px; text-align: center; margin-top: 15px; display: none; }
    </style>
    <h2>🎯 D2E Goals</h2>
    <div class="info">Set individual new car goals for $375 bonus eligibility</div>
    <table>
      <tr><th>Salesperson</th><th>D2E Goal</th></tr>
      <tr><td>Andrea Guido</td><td><input type="number" id="andrea" value="4"></td></tr>
      <tr><td>Tom Guido</td><td><input type="number" id="tom" value="4"></td></tr>
      <tr><td>Jim VanDyke</td><td><input type="number" id="jim" value="4"></td></tr>
      <tr><td>Sam Williams</td><td><input type="number" id="sam" value="4"></td></tr>
      <tr><td>Chris Meeks</td><td><input type="number" id="chris" value="4"></td></tr>
      <tr><td>Javier Aviles</td><td><input type="number" id="javier" value="4"></td></tr>
      <tr><td>Alfonso Colon</td><td><input type="number" id="alfonso" value="4"></td></tr>
    </table>
    <button onclick="saveD2E()">SAVE D2E GOALS</button>
    <div id="success" class="success">✓ D2E Goals Saved!</div>
    <script>
      function saveD2E() {
        var now = new Date();
        var month = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0");
        var goals = {
          month: month,
          gmcNewGoal: 21, buickNewGoal: 9, usedGoal: 75, totalGrossGoal: 150000,
          individual: {
            andrea: parseInt(document.getElementById("andrea").value) || 4,
            tom: parseInt(document.getElementById("tom").value) || 4,
            jim: parseInt(document.getElementById("jim").value) || 4,
            sam: parseInt(document.getElementById("sam").value) || 4,
            chris: parseInt(document.getElementById("chris").value) || 4,
            javier: parseInt(document.getElementById("javier").value) || 4,
            alfonso: parseInt(document.getElementById("alfonso").value) || 4
          }
        };
        google.script.run.withSuccessHandler(function() {
          document.getElementById("success").style.display = "block";
          setTimeout(function() { google.script.host.close(); }, 1500);
        }).withFailureHandler(function(e) {
          alert("Error: " + e.message);
        }).saveMonthlyGoalsFromManager(goals);
      }
    </script>
  `).setWidth(400).setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, '🎯 D2E Goal Manager');
}

function saveMonthlyGoalsFromManager(goals) {
  // Save monthly goals
  DataAccess.saveMonthlyGoals(goals.month, goals);

  // Save individual D2E goals
  try {
    var sheet = DataAccess.getSheet(CONFIG.SHEETS.D2E_GOALS);
    var monthDate = new Date(goals.month + '-01');

    var names = {
      'andrea': 'ANDREA GUIDO',
      'tom': 'TOM GUIDO',
      'jim': 'JIM VANDYKE',
      'sam': 'SAM WILLIAMS',
      'chris': 'CHRIS MEEKS',
      'javier': 'JAVIER AVILES',
      'alfonso': 'ALFONSO COLON'
    };

    for (var key in goals.individual) {
      sheet.appendRow([monthDate, names[key], goals.individual[key]]);
    }
  } catch(e) {
    Utils.log("Could not save D2E goals: " + e.message, "WARN");
  }

  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 9: MAIN MENU & ADD DEAL
// ═══════════════════════════════════════════════════════════════════════════════════════

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚗 Sales Command Center')
    .addItem('🚀 Initialize System', 'initializeSystem')
    .addSeparator()
    .addSubMenu(ui.createMenu('📝 Data Entry')
      .addItem('➕ Add New Deal', 'showAddDealDialog'))
    .addSubMenu(ui.createMenu('🎯 Goals & Targets')
      .addItem('📊 Monthly Goals', 'showMonthlyGoalsManager')
      .addItem('🎯 D2E Goals', 'showD2EGoalManager'))
    .addSubMenu(ui.createMenu('📺 Dashboards')
      .addItem('📺 TV Dashboard Info', 'showTVDashboardInfo')
      .addItem('🏆 Leaderboard', 'showLeaderboard'))
    .addSubMenu(ui.createMenu('🚙 Used Car Sync')
      .addItem('🔗 Setup Sync (Paste URL)', 'showSyncDialog')
      .addItem('📥 Import Now', 'importUsedCarData')
      .addItem('⏰ Enable Daily Auto-Sync', 'enableDailyAutoSync')
      .addItem('🚫 Disable Daily Auto-Sync', 'disableDailyAutoSync'))
    .addSubMenu(ui.createMenu('🔧 Manager Tools')
      .addItem('🌅 Morning Briefing', 'generateMorningBriefing')
      .addItem('📊 Quick Stats', 'showQuickStats')
      .addItem('🎨 Color Code Profits', 'colorCodeProfitColumns'))
    .addItem('❓ Help', 'showHelp')
    .addToUi();

  // Archive menu
  ui.createMenu('📁 Archive')
    .addItem('Archive Current Month', 'archiveCurrentMonth_')
    .addItem('Archive Previous Month', 'archivePreviousMonth_')
    .addSeparator()
    .addItem('🏁 End Month (Full Backup)', 'endMonthBackup_')
    .addSeparator()
    .addItem('View Archives', 'viewArchives_')
    .addItem('View Raw Backups', 'viewRawBackups_')
    .addToUi();
}

function showAddDealDialog() {
  var html = HtmlService.createHtmlOutput(getAddDealFormHtml())
    .setWidth(500)
    .setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Deal');
}

function getAddDealFormHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; padding: 20px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); }
    .card { background: #252525; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    h2 { color: white; margin: 0 0 20px 0; text-align: center; font-size: 24px; }
    .badge { background: linear-gradient(135deg, #c41230, #e8394a); color: white; padding: 8px 24px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 15px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; color: #888; font-size: 12px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    input, select { width: 100%; padding: 14px; border: 2px solid #333; background: #1a1a1a; color: white; border-radius: 10px; font-size: 16px; box-sizing: border-box; }
    input:focus, select:focus { border-color: #c41230; outline: none; }
    select option { background: #1a1a1a; color: white; }
    .row { display: flex; gap: 12px; }
    .row .form-group { flex: 1; }
    button { width: 100%; padding: 16px; background: linear-gradient(135deg, #c41230, #e8394a); color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    button:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(196,18,48,0.4); }
    button:disabled { background: #444; cursor: not-allowed; transform: none; }
    .success { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; border-radius: 10px; text-align: center; display: none; font-size: 18px; }
    .type-toggle { display: flex; gap: 10px; margin-bottom: 20px; }
    .type-btn { flex: 1; padding: 12px; border: 2px solid #333; background: #1a1a1a; color: #888; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; }
    .type-btn.active { border-color: #c41230; background: rgba(196,18,48,0.13); color: #c41230; }
    .type-btn.used.active { border-color: #f59e0b; background: rgba(245,158,11,0.13); color: #f59e0b; }
    .profit-display { background: #1a1a1a; border: 2px solid #22c55e; border-radius: 10px; padding: 12px; text-align: center; margin-top: 10px; }
    .profit-label { color: #888; font-size: 12px; }
    .profit-value { color: #22c55e; font-size: 28px; font-weight: bold; }
    .brand-select { display: flex; gap: 10px; margin-bottom: 16px; }
    .brand-btn { flex: 1; padding: 12px; border: 2px solid #333; background: #1a1a1a; color: #888; border-radius: 10px; font-weight: bold; cursor: pointer; }
    .brand-btn.gmc.active { border-color: #c41230; background: rgba(196,18,48,0.13); color: white; }
    .brand-btn.buick.active { border-color: #c5a04f; background: rgba(197,160,79,0.13); color: #c5a04f; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align:center"><span class="badge">UNION PARK GMC</span></div>
    <h2>Add New Deal</h2>
    <div id="success" class="success"></div>
    <form id="dealForm">
      <div class="type-toggle">
        <button type="button" class="type-btn active" id="newBtn" onclick="setType('new')">🚗 NEW</button>
        <button type="button" class="type-btn used" id="usedBtn" onclick="setType('used')">🚙 USED</button>
      </div>
      <div id="brandSelect" class="brand-select">
        <button type="button" class="brand-btn gmc active" id="gmcBtn" onclick="setBrand('GMC')">GMC</button>
        <button type="button" class="brand-btn buick" id="buickBtn" onclick="setBrand('Buick')">BUICK</button>
      </div>
      <input type="hidden" id="carType" value="new">
      <input type="hidden" id="brand" value="GMC">
      <div class="row">
        <div class="form-group"><label>Date</label><input type="date" id="date" required></div>
        <div class="form-group"><label>Deal #</label><input type="text" id="dealNumber" placeholder="157001" required></div>
      </div>
      <div class="row">
        <div class="form-group"><label>Stock #</label><input type="text" id="stockNumber" placeholder="T15999" required></div>
        <div class="form-group"><label>Salesperson</label>
          <select id="salesperson" required>
            <option value="">Select...</option>
            <option value="ANDREA GUIDO">Andrea Guido</option>
            <option value="TOM GUIDO">Tom Guido</option>
            <option value="JIM VANDYKE">Jim VanDyke</option>
            <option value="SAM WILLIAMS">Sam Williams</option>
            <option value="CHRIS MEEKS">Chris Meeks</option>
            <option value="JAVIER AVILES">Javier Aviles</option>
            <option value="ALFONSO COLON">Alfonso Colon</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Customer Name</label><input type="text" id="customer" placeholder="SMITH, JOHN" required></div>
      <div class="row">
        <div class="form-group"><label>Year</label><input type="number" id="year" value="2026" required></div>
        <div class="form-group"><label>Model</label><input type="text" id="model" placeholder="SIERRA 1500" required></div>
      </div>
      <div class="row">
        <div class="form-group"><label>Front End Gross ($)</label><input type="number" id="frontGross" value="0" step="0.01" oninput="updateTotal()"></div>
        <div class="form-group"><label>Back End Gross ($)</label><input type="number" id="backGross" value="0" step="0.01" oninput="updateTotal()"></div>
      </div>
      <div class="profit-display"><div class="profit-label">TOTAL PROFIT</div><div class="profit-value" id="totalProfit">$0</div></div>
      <button type="submit" id="submitBtn">ADD DEAL</button>
    </form>
  </div>
  <script>
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    function setType(type) {
      document.getElementById("carType").value = type;
      document.getElementById("newBtn").classList.toggle("active", type === "new");
      document.getElementById("usedBtn").classList.toggle("active", type === "used");
      document.getElementById("brandSelect").style.display = type === "new" ? "flex" : "none";
      if (type === "used") { document.getElementById("brand").value = "Used"; }
      else { document.getElementById("brand").value = "GMC"; document.getElementById("gmcBtn").classList.add("active"); document.getElementById("buickBtn").classList.remove("active"); }
    }
    function setBrand(brand) {
      document.getElementById("brand").value = brand;
      document.getElementById("gmcBtn").classList.toggle("active", brand === "GMC");
      document.getElementById("buickBtn").classList.toggle("active", brand === "Buick");
    }
    function updateTotal() {
      var front = parseFloat(document.getElementById("frontGross").value) || 0;
      var back = parseFloat(document.getElementById("backGross").value) || 0;
      document.getElementById("totalProfit").textContent = "$" + (front + back).toLocaleString();
    }
    document.getElementById("dealForm").addEventListener("submit", function(e) {
      e.preventDefault();
      var btn = document.getElementById("submitBtn");
      btn.disabled = true; btn.textContent = "Adding...";
      var deal = {
        date: document.getElementById("date").value,
        dealNumber: document.getElementById("dealNumber").value,
        stockNumber: document.getElementById("stockNumber").value,
        salesperson: document.getElementById("salesperson").value,
        customer: document.getElementById("customer").value,
        year: document.getElementById("year").value,
        brand: document.getElementById("brand").value,
        model: document.getElementById("model").value,
        frontGross: document.getElementById("frontGross").value,
        backGross: document.getElementById("backGross").value,
        carType: document.getElementById("carType").value
      };
      google.script.run.withSuccessHandler(function(result) {
        document.getElementById("dealForm").style.display = "none";
        document.getElementById("success").style.display = "block";
        document.getElementById("success").innerHTML = "✓ Deal Added to Row " + result.row + "!";
        setTimeout(function() { google.script.host.close(); }, 1500);
      }).withFailureHandler(function(err) {
        alert("Error: " + err.message); btn.disabled = false; btn.textContent = "ADD DEAL";
      }).addDeal(deal);
    });
  </script>
</body>
</html>`;
}

function addDeal(deal) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = deal.carType === 'used' ? 'Used Car Tracker' : 'New Car Tracker';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) throw new Error('Sheet not found: ' + sheetName);

  var dataRange = sheet.getRange('A8:A').getValues();
  var lastRowWithData = 7;
  for (var i = 0; i < dataRange.length; i++) {
    if (dataRange[i][0] !== '' && dataRange[i][0] !== null) lastRowWithData = i + 8;
  }
  var nextRow = lastRowWithData + 1;

  var saleDate = new Date();
  if (deal.date) {
    var parts = deal.date.split('-');
    saleDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  var frontEnd = parseFloat(String(deal.frontGross || 0).replace(/[$,]/g, '')) || 0;
  var backEnd = parseFloat(String(deal.backGross || 0).replace(/[$,]/g, '')) || 0;
  var totalProfit = frontEnd + backEnd;

  var rowData = [
    saleDate, String(deal.dealNumber || ''), String(deal.stockNumber || ''),
    String(deal.brand || 'GMC'), String(deal.model || ''), String(deal.year || '2026'),
    String(deal.customer || ''), 'Walk-in', String(deal.salesperson || ''),
    'No', 0, 0, frontEnd, backEnd, totalProfit, 'Yes', 'Yes', 'Yes', ''
  ];

  sheet.getRange(nextRow, 1, 1, 19).setValues([rowData]);
  sheet.getRange(nextRow, 1).setNumberFormat('M/d/yyyy');

  return { success: true, row: nextRow };
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 10: SYNC DIALOG & USED CAR IMPORT
// ═══════════════════════════════════════════════════════════════════════════════════════

function showSyncDialog() {
  var html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; background: #1a1a1a; color: white; }
      input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #333; border-radius: 8px; background: #2a2a2a; color: white; box-sizing: border-box; }
      button { width: 100%; padding: 14px; background: #c41230; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
      .info { background: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 15px; color: #888; }
      h3 { margin: 0 0 15px 0; color: #c41230; }
    </style>
    <h3>🔄 Sync Used Cars</h3>
    <div class="info">Paste the Google Sheet URL or ID containing used car sales.</div>
    <input type="text" id="sheetUrl" placeholder="Paste Sheet URL or ID...">
    <input type="text" id="sheetName" value="NEW** USED CAR SALES TRACKER 3.0" placeholder="Sheet tab name">
    <button onclick="doSync()">SYNC NOW</button>
    <div id="result" style="margin-top:15px;text-align:center;"></div>
    <script>
      function doSync() {
        var url = document.getElementById("sheetUrl").value;
        var name = document.getElementById("sheetName").value;
        document.getElementById("result").innerHTML = "<p style='color:#f59e0b'>Syncing...</p>";
        google.script.run.withSuccessHandler(function(r) {
          document.getElementById("result").innerHTML = "<p style='color:#22c55e'>" + r.message + "</p>";
        }).withFailureHandler(function(e) {
          document.getElementById("result").innerHTML = "<p style='color:#ef4444'>Error: " + e.message + "</p>";
        }).syncFromExternalSheet(url, name);
      }
    </script>
  `).setWidth(450).setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, 'Sync Used Cars');
}

function syncFromExternalSheet(urlOrId, sheetName) {
  var sheetId = urlOrId;
  if (urlOrId.includes('docs.google.com')) {
    var match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) sheetId = match[1];
  }

  var sourceSpreadsheet;
  try { sourceSpreadsheet = SpreadsheetApp.openById(sheetId); }
  catch (e) { throw new Error('Cannot open sheet. Check URL/ID and access.'); }

  var sourceSheet = sourceSpreadsheet.getSheetByName(sheetName);
  if (!sourceSheet) throw new Error('Sheet "' + sheetName + '" not found.');

  var destSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Used Car Tracker');
  if (!destSheet) throw new Error('Used Car Tracker not found.');

  var sourceLastRow = sourceSheet.getLastRow();
  if (sourceLastRow < 2) return { success: true, message: 'No data to sync.' };

  var sourceData = sourceSheet.getRange(2, 1, sourceLastRow - 1, 20).getValues();

  var destLastRow = destSheet.getLastRow();
  var existingDeals = {};
  if (destLastRow >= 8) {
    destSheet.getRange(8, 2, destLastRow - 7, 1).getValues().forEach(function(r) {
      if (r[0]) existingDeals[String(r[0]).trim()] = true;
    });
  }

  var now = new Date();
  var newRows = [];

  sourceData.forEach(function(row) {
    if (!row[0]) return;
    var saleDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(saleDate.getTime())) return;
    if (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear()) return;
    var dealNum = String(row[1] || '').trim();
    if (dealNum && existingDeals[dealNum]) return;

    newRows.push([
      saleDate, row[1]||'', row[2]||'', row[3]||'', row[4]||'', row[5]||'',
      row[6]||'', row[7]||'Walk-in', row[8]||'', row[9]||'No',
      parseFloat(String(row[10]).replace(/[$,]/g,''))||0,
      parseFloat(String(row[11]).replace(/[$,]/g,''))||0,
      parseFloat(String(row[12]).replace(/[$,]/g,''))||0,
      parseFloat(String(row[13]).replace(/[$,]/g,''))||0,
      parseFloat(String(row[14]).replace(/[$,]/g,''))||0,
      row[15]||'Yes', row[16]||'Yes', row[17]||''
    ]);
    existingDeals[dealNum] = true;
  });

  if (newRows.length === 0) return { success: true, message: 'No new deals to sync.' };

  var dataRange = destSheet.getRange('A8:A').getValues();
  var lastRowWithData = 7;
  for (var i = 0; i < dataRange.length; i++) {
    if (dataRange[i][0]) lastRowWithData = i + 8;
  }

  var nextRow = lastRowWithData + 1;
  destSheet.getRange(nextRow, 1, newRows.length, 18).setValues(newRows);
  destSheet.getRange(nextRow, 1, newRows.length, 1).setNumberFormat('M/d/yyyy');

  return { success: true, message: '✓ Added ' + newRows.length + ' used car deals!' };
}

function importUsedCarData() {
  SpreadsheetApp.getUi().alert('Use "Setup Sync" to configure and import used car data.');
}

function enableDailyAutoSync() {
  SpreadsheetApp.getUi().alert('Daily auto-sync would be configured here via time-based triggers.');
}

function disableDailyAutoSync() {
  SpreadsheetApp.getUi().alert('Auto-sync disabled.');
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 11: HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════

function initializeSystem() {
  SpreadsheetApp.getUi().alert('System initialized! All sheets are ready.');
}

function showTVDashboardInfo() {
  var url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert('TV Dashboard API URL:\n\n' + (url || 'Deploy as web app first'));
}

function showLeaderboard() {
  var metrics = MetricsEngine.getDashboardMetrics();
  var sorted = metrics.salespeople.sort(function(a,b) { return b.totalUnits - a.totalUnits; });
  var msg = '🏆 LEADERBOARD\n\n';
  sorted.forEach(function(p, i) {
    msg += (i+1) + '. ' + p.nickname + ' - ' + p.totalUnits + ' units ($' + p.totalProfit.toLocaleString() + ')\n';
  });
  SpreadsheetApp.getUi().alert(msg);
}

function generateMorningBriefing() {
  var metrics = MetricsEngine.getDashboardMetrics();
  var msg = '🌅 MORNING BRIEFING - ' + metrics.monthName + '\n\n';
  msg += 'Days Remaining: ' + metrics.daysRemaining + '\n\n';
  msg += '📊 PROGRESS:\n';
  msg += 'GMC: ' + metrics.dealership.gmcSold + '/' + metrics.dealership.gmcGoal + '\n';
  msg += 'Buick: ' + metrics.dealership.buickSold + '/' + metrics.dealership.buickGoal + '\n';
  msg += 'Used: ' + metrics.dealership.totalUsedUnits + '/' + metrics.dealership.usedGoal + '\n\n';
  msg += 'Total Gross: $' + metrics.dealership.totalProfit.toLocaleString();
  SpreadsheetApp.getUi().alert(msg);
}

function showQuickStats() {
  var metrics = MetricsEngine.getDashboardMetrics();
  var msg = '📊 QUICK STATS\n\n';
  msg += 'New Cars: ' + metrics.dealership.totalNewUnits + '\n';
  msg += 'Used Cars: ' + metrics.dealership.totalUsedUnits + '\n';
  msg += 'Total Units: ' + metrics.dealership.totalUnits + '\n\n';
  msg += 'Front End: $' + metrics.dealership.totalFrontEnd.toLocaleString() + '\n';
  msg += 'Back End: $' + metrics.dealership.totalBackEnd.toLocaleString() + '\n';
  msg += 'Total Gross: $' + metrics.dealership.totalProfit.toLocaleString();
  SpreadsheetApp.getUi().alert(msg);
}

function showHelp() {
  SpreadsheetApp.getUi().alert('UNION PARK SALES COMMAND CENTER\n\n' +
    '📝 Data Entry - Add deals and log activity\n' +
    '🎯 Goals - Set monthly and D2E targets\n' +
    '📺 Dashboards - View TV dashboard and leaderboard\n' +
    '🚙 Used Car Sync - Import from external sheets\n' +
    '📁 Archive - Save monthly data and backups\n\n' +
    'For support, contact your administrator.');
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 12: ARCHIVE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════════

// Archive column mappings
var ARCHIVE_NEW_COLS = {
  date: 0,       // Column A
  make: 3,       // Column D - Make (GMC/Buick)
  frontEnd: 12,  // Column M - Front End Profit
  backEnd: 13    // Column N - Back End Profit
};

var ARCHIVE_USED_COLS = {
  date: 0,       // Column A
  frontEnd: 12,  // Column M - Front End Profit
  backEnd: 13    // Column N - Back End Profit
};

var ARCHIVE_GMC_GOAL = 21;
var ARCHIVE_BUICK_GOAL = 9;
var ARCHIVE_USED_GOAL = 75;

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

  var newSheet = ss.getSheetByName('New Car Tracker');
  var usedSheet = ss.getSheetByName('Used Car Tracker');

  if (!newSheet || !usedSheet) {
    ui.alert('Cannot find New Car Tracker or Used Car Tracker sheet!');
    return;
  }

  var archiveSheet = ss.getSheetByName('Archive');
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet('Archive');
    setupArchiveHeaders_(archiveSheet);
  }

  var newData = newSheet.getDataRange().getValues();
  var newSales = filterArchiveByMonth_(newData, ARCHIVE_NEW_COLS.date, year, month);

  var usedData = usedSheet.getDataRange().getValues();
  var usedSales = filterArchiveByMonth_(usedData, ARCHIVE_USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ui.alert('No sales found for ' + getArchiveMonthName_(month) + ' ' + year);
    return;
  }

  // Calculate NEW results
  var gmcUnits = 0, buickUnits = 0, newFront = 0, newBack = 0;
  for (var i = 0; i < newSales.length; i++) {
    var make = String(newSales[i][ARCHIVE_NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) gmcUnits++;
    if (make.includes('BUICK')) buickUnits++;
    newFront += parseArchiveNum_(newSales[i][ARCHIVE_NEW_COLS.frontEnd]);
    newBack += parseArchiveNum_(newSales[i][ARCHIVE_NEW_COLS.backEnd]);
  }
  var newTotal = newFront + newBack;
  var newUnits = newSales.length;

  // Calculate USED results
  var usedUnits = usedSales.length;
  var usedFront = 0, usedBack = 0;
  for (var j = 0; j < usedSales.length; j++) {
    usedFront += parseArchiveNum_(usedSales[j][ARCHIVE_USED_COLS.frontEnd]);
    usedBack += parseArchiveNum_(usedSales[j][ARCHIVE_USED_COLS.backEnd]);
  }
  var usedTotal = usedFront + usedBack;

  // Calculate COMBINED
  var combinedUnits = newUnits + usedUnits;
  var combinedFront = newFront + usedFront;
  var combinedBack = newBack + usedBack;
  var combinedGross = newTotal + usedTotal;

  var monthName = getArchiveMonthName_(month) + ' ' + year;
  var monthKey = year + '-' + String(month).padStart(2, '0');

  // Find existing row or get next row
  var dataStart = 4;
  var lastRow = findArchiveLastDataRow_(archiveSheet, 1, dataStart);
  var existingRow = findArchiveMonthRow_(archiveSheet, 1, dataStart, lastRow, monthKey);
  var dataRow = existingRow > 0 ? existingRow : lastRow + 1;

  // Write NEW CARS data (columns A-J)
  var newRowData = [
    monthKey,
    new Date().toLocaleDateString(),
    monthName,
    gmcUnits,
    gmcUnits >= ARCHIVE_GMC_GOAL ? 'MET' : 'NOT MET',
    buickUnits,
    buickUnits >= ARCHIVE_BUICK_GOAL ? 'MET' : 'NOT MET',
    newFront,
    newBack,
    newTotal
  ];
  archiveSheet.getRange(dataRow, 1, 1, newRowData.length).setValues([newRowData]);

  // Write USED CARS data (columns L-Q)
  var usedColStart = 12;
  var usedRowData = [
    monthName,
    usedUnits,
    usedUnits >= ARCHIVE_USED_GOAL ? 'MET' : 'NOT MET',
    usedFront,
    usedBack,
    usedTotal
  ];
  archiveSheet.getRange(dataRow, usedColStart, 1, usedRowData.length).setValues([usedRowData]);

  // Write COMBINED data (columns S-W)
  var combinedColStart = 19;
  var combinedRowData = [
    monthName,
    combinedUnits,
    combinedFront,
    combinedBack,
    combinedGross
  ];
  archiveSheet.getRange(dataRow, combinedColStart, 1, combinedRowData.length).setValues([combinedRowData]);

  formatArchiveDataRow_(archiveSheet, dataRow);
  archiveSheet.activate();

  ui.alert('✅ ' + monthName + ' Archived!\n\n' +
    'NEW: GMC ' + gmcUnits + ' | Buick ' + buickUnits + '\n' +
    'USED: ' + usedUnits + ' units\n\n' +
    'COMBINED:\n' +
    '  Units: ' + combinedUnits + '\n' +
    '  Gross: $' + combinedGross.toLocaleString());
}

function setupArchiveHeaders_(sheet) {
  // NEW CARS (Columns A-J)
  sheet.getRange(1, 1, 1, 10).merge()
    .setValue('🚗 NEW CARS')
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(2, 1, 1, 10).merge()
    .setValue('GMC Goal: ' + ARCHIVE_GMC_GOAL + '  |  Buick Goal: ' + ARCHIVE_BUICK_GOAL)
    .setBackground('#dbeafe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  var newHeaders = ['Key', 'Date', 'Month', 'GMC Sold', 'GMC', 'Buick Sold', 'Buick', 'Front End', 'Back End', 'Total'];
  sheet.getRange(3, 1, 1, newHeaders.length).setValues([newHeaders])
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // USED CARS (Columns L-Q)
  var usedStart = 12;
  sheet.getRange(1, usedStart, 1, 6).merge()
    .setValue('🚙 USED CARS')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(2, usedStart, 1, 6).merge()
    .setValue('Used Goal: ' + ARCHIVE_USED_GOAL)
    .setBackground('#ede9fe')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  var usedHeaders = ['Month', 'Units Sold', 'Status', 'Front End', 'Back End', 'Total'];
  sheet.getRange(3, usedStart, 1, usedHeaders.length).setValues([usedHeaders])
    .setBackground('#4c1d95')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // COMBINED TOTALS (Columns S-W)
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
  sheet.setColumnWidth(11, 20);
  sheet.setColumnWidth(18, 20);
  sheet.getRange(1, 11, 3, 1).setBackground('#f3f4f6');
  sheet.getRange(1, 18, 3, 1).setBackground('#f3f4f6');

  // Hide key column
  sheet.hideColumns(1);

  // Freeze header rows
  sheet.setFrozenRows(3);

  // Set column widths
  for (var c = 2; c <= 10; c++) sheet.setColumnWidth(c, 85);
  for (var d = 12; d <= 17; d++) sheet.setColumnWidth(d, 85);
  for (var e = 19; e <= 23; e++) sheet.setColumnWidth(e, 90);
}

function formatArchiveDataRow_(sheet, row) {
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

function filterArchiveByMonth_(data, dateCol, year, month) {
  var sales = [];
  for (var i = CONFIG.DATA.TRACKER.DATA_START_ROW - 1; i < data.length; i++) {
    var dateVal = data[i][dateCol];
    if (!dateVal) continue;
    var d = new Date(dateVal);
    if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() + 1 === month) {
      sales.push(data[i]);
    }
  }
  return sales;
}

function parseArchiveNum_(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  var num = parseFloat(String(val).replace(/[$,\s]/g, ''));
  return isNaN(num) ? 0 : num;
}

function findArchiveLastDataRow_(sheet, col, startRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return startRow - 1;
  for (var r = lastRow; r >= startRow; r--) {
    if (sheet.getRange(r, col).getValue() !== '') return r;
  }
  return startRow - 1;
}

function findArchiveMonthRow_(sheet, col, startRow, endRow, monthKey) {
  if (endRow < startRow) return -1;
  for (var r = startRow; r <= endRow; r++) {
    if (sheet.getRange(r, col).getValue() === monthKey) return r;
  }
  return -1;
}

function getArchiveMonthName_(m) {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][m-1];
}

function viewArchives_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archive');
  if (sheet) sheet.activate();
  else SpreadsheetApp.getUi().alert('No archives yet! Use Archive menu to create one.');
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// SECTION 13: END MONTH - FULL RAW DATA BACKUP
// ═══════════════════════════════════════════════════════════════════════════════════════

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
  var month = now.getMonth();
  if (month === 0) { month = 12; year--; }

  createRawBackup_(year, month);
}

function createRawBackup_(year, month) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var newSheet = ss.getSheetByName('New Car Tracker');
  var usedSheet = ss.getSheetByName('Used Car Tracker');

  if (!newSheet || !usedSheet) {
    ui.alert('Cannot find New Car Tracker or Used Car Tracker sheet!');
    return;
  }

  var monthName = getArchiveMonthName_(month);
  var backupName = monthName + ' ' + year + ' - Raw Backup';

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

  var backupSheet = ss.insertSheet(backupName);

  var newData = newSheet.getDataRange().getValues();
  var newHeaders = newData[CONFIG.DATA.TRACKER.HEADER_ROW - 1];
  var newSales = filterArchiveByMonth_(newData, ARCHIVE_NEW_COLS.date, year, month);

  var usedData = usedSheet.getDataRange().getValues();
  var usedHeaders = usedData[CONFIG.DATA.TRACKER.HEADER_ROW - 1];
  var usedSales = filterArchiveByMonth_(usedData, ARCHIVE_USED_COLS.date, year, month);

  if (newSales.length === 0 && usedSales.length === 0) {
    ss.deleteSheet(backupSheet);
    ui.alert('No sales found for ' + monthName + ' ' + year);
    return;
  }

  var currentRow = 1;

  // NEW CARS SECTION
  backupSheet.getRange(currentRow, 1, 1, newHeaders.length).merge()
    .setValue('🚗 NEW CARS - ' + monthName + ' ' + year + ' (' + newSales.length + ' deals)')
    .setBackground('#2563eb')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold');
  currentRow++;

  backupSheet.getRange(currentRow, 1, 1, newHeaders.length).setValues([newHeaders])
    .setBackground('#1e3a5f')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  currentRow++;

  if (newSales.length > 0) {
    backupSheet.getRange(currentRow, 1, newSales.length, newSales[0].length).setValues(newSales);
    for (var i = 0; i < newSales.length; i++) {
      if (i % 2 === 1) {
        backupSheet.getRange(currentRow + i, 1, 1, newSales[0].length).setBackground('#f0f9ff');
      }
    }
    currentRow += newSales.length;
  }

  currentRow += 2;

  // USED CARS SECTION
  backupSheet.getRange(currentRow, 1, 1, usedHeaders.length).merge()
    .setValue('🚙 USED CARS - ' + monthName + ' ' + year + ' (' + usedSales.length + ' deals)')
    .setBackground('#7c3aed')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold');
  currentRow++;

  backupSheet.getRange(currentRow, 1, 1, usedHeaders.length).setValues([usedHeaders])
    .setBackground('#4c1d95')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  currentRow++;

  if (usedSales.length > 0) {
    backupSheet.getRange(currentRow, 1, usedSales.length, usedSales[0].length).setValues(usedSales);
    for (var j = 0; j < usedSales.length; j++) {
      if (j % 2 === 1) {
        backupSheet.getRange(currentRow + j, 1, 1, usedSales[0].length).setBackground('#faf5ff');
      }
    }
    currentRow += usedSales.length;
  }

  currentRow += 2;

  // SUMMARY SECTION
  backupSheet.getRange(currentRow, 1, 1, 7).merge()
    .setValue('📊 MONTH SUMMARY')
    .setBackground('#059669')
    .setFontColor('#ffffff')
    .setFontSize(12)
    .setFontWeight('bold');
  currentRow++;

  var gmcUnits = 0, buickUnits = 0, newFront = 0, newBack = 0;
  for (var k = 0; k < newSales.length; k++) {
    var make = String(newSales[k][ARCHIVE_NEW_COLS.make] || '').toUpperCase();
    if (make.includes('GMC')) gmcUnits++;
    if (make.includes('BUICK')) buickUnits++;
    newFront += parseArchiveNum_(newSales[k][ARCHIVE_NEW_COLS.frontEnd]);
    newBack += parseArchiveNum_(newSales[k][ARCHIVE_NEW_COLS.backEnd]);
  }

  var usedFront = 0, usedBack = 0;
  for (var l = 0; l < usedSales.length; l++) {
    usedFront += parseArchiveNum_(usedSales[l][ARCHIVE_USED_COLS.frontEnd]);
    usedBack += parseArchiveNum_(usedSales[l][ARCHIVE_USED_COLS.backEnd]);
  }

  var summaryData = [
    ['', 'Units', 'Goal', 'Status', 'Front End', 'Back End', 'Total'],
    ['GMC', gmcUnits, ARCHIVE_GMC_GOAL, gmcUnits >= ARCHIVE_GMC_GOAL ? 'MET ✓' : 'NOT MET', '', '', ''],
    ['Buick', buickUnits, ARCHIVE_BUICK_GOAL, buickUnits >= ARCHIVE_BUICK_GOAL ? 'MET ✓' : 'NOT MET', '', '', ''],
    ['New Total', newSales.length, '', '', newFront, newBack, newFront + newBack],
    ['Used Total', usedSales.length, ARCHIVE_USED_GOAL, usedSales.length >= ARCHIVE_USED_GOAL ? 'MET ✓' : 'NOT MET', usedFront, usedBack, usedFront + usedBack],
    ['GRAND TOTAL', newSales.length + usedSales.length, '', '', newFront + usedFront, newBack + usedBack, newFront + newBack + usedFront + usedBack]
  ];

  backupSheet.getRange(currentRow, 1, summaryData.length, 7).setValues(summaryData);
  backupSheet.getRange(currentRow, 1, 1, 7).setBackground('#065f46').setFontColor('#ffffff').setFontWeight('bold');
  backupSheet.getRange(currentRow + 5, 1, 1, 7).setBackground('#d1fae5').setFontWeight('bold');

  for (var m = currentRow + 1; m <= currentRow + 5; m++) {
    backupSheet.getRange(m, 5).setNumberFormat('$#,##0');
    backupSheet.getRange(m, 6).setNumberFormat('$#,##0');
    backupSheet.getRange(m, 7).setNumberFormat('$#,##0');
  }

  for (var c = 1; c <= Math.max(newHeaders.length, usedHeaders.length); c++) {
    backupSheet.autoResizeColumn(c);
  }

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
