'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSheetsConfig, saveSheetsConfig, SheetsConfig } from '@/lib/storage';

export default function SettingsPage() {
  const [config, setConfig] = useState<SheetsConfig>({
    webAppUrl: '',
    refreshInterval: 60,
  });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const savedConfig = getSheetsConfig();
    setConfig(savedConfig);
  }, []);

  const handleSave = () => {
    saveSheetsConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!config.webAppUrl) {
      setTestResult({ success: false, message: 'Please enter a Web App URL first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`${config.webAppUrl}?page=api`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.monthName) {
        setTestResult({
          success: true,
          message: `Connected! Found data for ${data.monthName} - ${data.dealership?.totalUnits || 0} total units`,
        });
      } else {
        setTestResult({
          success: false,
          message: 'Connected but received unexpected data format',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-[#888] text-sm">Configure your dashboard connection</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="h-1 bg-gradient-to-r from-[#002d62] via-[#c41230] to-[#c5a04f]" />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Connection Settings */}
        <div className="dashboard-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Google Sheets Connection</h2>

          <div className="space-y-6">
            {/* Web App URL */}
            <div>
              <label className="block text-sm text-[#888] mb-2">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                value={config.webAppUrl}
                onChange={(e) => setConfig({ ...config, webAppUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
                className="edit-input w-full"
              />
              <p className="text-xs text-[#888] mt-2">
                Deploy your Google Apps Script as a web app and paste the URL here
              </p>
            </div>

            {/* Refresh Interval */}
            <div>
              <label className="block text-sm text-[#888] mb-2">
                Auto-Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={config.refreshInterval}
                onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) || 60 })}
                min="10"
                max="300"
                className="edit-input w-32"
              />
              <p className="text-xs text-[#888] mt-2">
                How often to refresh data from Google Sheets (10-300 seconds)
              </p>
            </div>

            {/* Test Connection */}
            <div className="pt-4 border-t border-[#2a2a2a]">
              <button
                onClick={handleTestConnection}
                disabled={testing || !config.webAppUrl}
                className="px-6 py-3 bg-[#002d62] text-white rounded-lg font-semibold hover:bg-[#001a3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div className={`mt-4 p-4 rounded-lg ${
                  testResult.success
                    ? 'bg-[#22c55e]/20 border border-[#22c55e] text-[#22c55e]'
                    : 'bg-[#ef4444]/20 border border-[#ef4444] text-[#ef4444]'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#2a2a2a] flex items-center justify-between">
              <button
                onClick={handleSave}
                className="px-8 py-3 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#16a34a] transition-colors"
              >
                Save Settings
              </button>

              {saved && (
                <span className="text-[#22c55e] font-medium">Settings saved!</span>
              )}
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="dashboard-card p-6">
          <h2 className="text-xl font-semibold mb-6">Setup Instructions</h2>

          <div className="space-y-6 text-[#888]">
            <div>
              <h3 className="text-white font-semibold mb-2">1. Google Apps Script Setup</h3>
              <p className="mb-2">
                Make sure you have the Sales Command Center script installed in your Google Sheets.
                The script includes the <code className="text-[#c5a04f] bg-[#1a1a1a] px-2 py-1 rounded">getDashboardData()</code> function
                that this dashboard connects to.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">2. Deploy as Web App</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open your Google Sheet</li>
                <li>Go to <strong>Extensions → Apps Script</strong></li>
                <li>Click <strong>Deploy → New deployment</strong></li>
                <li>Select type: <strong>Web app</strong></li>
                <li>Set &quot;Execute as&quot;: <strong>Me</strong></li>
                <li>Set &quot;Who has access&quot;: <strong>Anyone</strong></li>
                <li>Click <strong>Deploy</strong> and copy the URL</li>
              </ol>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">3. CORS Note</h3>
              <p>
                Google Apps Script web apps handle CORS automatically. If you encounter issues,
                make sure your script is deployed with the correct access permissions.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">4. Demo Mode</h3>
              <p>
                If no Web App URL is configured, the dashboard will display demo data so you can
                preview the layout and features.
              </p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="dashboard-card p-6 mt-8">
          <h2 className="text-xl font-semibold mb-6">Keyboard Shortcuts</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-[#888]">Toggle Auto-Rotate</span>
              <kbd className="px-3 py-1 bg-[#2a2a2a] rounded text-white font-mono">R</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-[#888]">Toggle TV Mode</span>
              <kbd className="px-3 py-1 bg-[#2a2a2a] rounded text-white font-mono">T</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-[#888]">Next Page</span>
              <kbd className="px-3 py-1 bg-[#2a2a2a] rounded text-white font-mono">→</kbd>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
              <span className="text-[#888]">Previous Page</span>
              <kbd className="px-3 py-1 bg-[#2a2a2a] rounded text-white font-mono">←</kbd>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] mt-12 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-[#888] text-sm">
          Union Park Buick GMC | Professional Grade Dashboard
        </div>
      </footer>
    </div>
  );
}
