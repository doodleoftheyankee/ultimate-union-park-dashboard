# Union Park Buick GMC - Sales Command Center TV Dashboard

A professional-grade TV dashboard for Union Park Buick GMC dealership, designed to display real-time sales performance, monthly goals, and spiff car inventory on office displays.

## Features

### Sales Leaderboard
- Real-time sales tracking from Google Sheets
- Individual salesperson performance (New + Used)
- GMC/Buick brand breakdown
- Total profit tracking
- D2E bonus eligibility status

### Monthly Goals (D2E Tracking)
- GMC New Car Goal tracking
- Buick New Car Goal tracking
- Used Car Goal tracking
- **D2E Bonus System**:
  - Must hit BOTH GMC and Buick goals to unlock bonus
  - Salespeople must sell 4+ new car units minimum
  - $375 bonus per eligible salesperson
- Editable goals with local storage persistence

### Spiff Cars
- Old age inventory display (3-4 units)
- Stock number and vehicle details
- Age indicator (days in inventory)
- Spiff bonus amount per vehicle
- Fully editable via dashboard

### TV Display Features
- **Auto-Rotate Mode**: Automatically cycles through pages (15-second intervals)
- **TV Mode**: Enhanced fonts and spacing for large displays
- **Keyboard Controls**:
  - `R` - Toggle auto-rotate
  - `T` - Toggle TV mode
  - `←` / `→` - Navigate between pages

## Getting Started

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Google Sheets Integration

### Setting Up Connection

1. **Deploy your Google Apps Script** as a web app:
   - Open your Google Sheet with the Sales Command Center script
   - Go to Extensions → Apps Script
   - Click Deploy → New deployment
   - Select Web app
   - Execute as: Me
   - Who has access: Anyone
   - Click Deploy and copy the URL

2. **Configure the Dashboard**:
   - Go to the Settings page (gear icon)
   - Paste your Web App URL
   - Test the connection
   - Save settings

### Expected Data Format

The dashboard expects your Google Apps Script `getDashboardData()` function to return:

```javascript
{
  timestamp: Date,
  monthName: "December 2024",
  daysElapsed: 17,
  daysRemaining: 14,
  daysInMonth: 31,

  goals: {
    gmcNewGoal: 21,
    buickNewGoal: 9,
    usedGoal: 20,
    totalGrossGoal: 150000
  },

  dealership: {
    totalNewUnits: number,
    gmcSold: number,
    buickSold: number,
    totalUsedUnits: number,
    totalProfit: number,
    // ... see types/index.ts for full structure
  },

  salespeople: [
    {
      name: "SALESPERSON NAME",
      nickname: "Nickname",
      newUnits: number,
      usedUnits: number,
      gmcUnits: number,
      buickUnits: number,
      totalProfit: number,
      bonusEligible: boolean,
      // ... see lib/sheets.ts for full structure
    }
  ],

  recentSales: [...],
  pace: { gmc: {...}, buick: {...}, used: {...} }
}
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy

### Self-Hosted

```bash
npm run build
npm start
# Or use PM2 for production
pm2 start npm --name "dashboard" -- start
```

## Customization

### Branding
Edit `src/app/globals.css` to customize:
- GMC Red: `--gmc-red: #c41230`
- Buick Blue: `--buick-blue: #002d62`
- Buick Gold: `--buick-gold: #c5a04f`

### Team Members
Update the mock data in `src/lib/sheets.ts` or connect to your Google Sheets with real data.

### Refresh Interval
Configure in Settings page (default: 60 seconds)

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Local Storage** - Persistent settings

## Support

For issues with the dashboard, check the Settings page for connection status and troubleshooting tips.

---

**Union Park Buick GMC** | *Professional Grade*
