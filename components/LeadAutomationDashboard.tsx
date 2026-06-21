"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProcessResult {
  email: string;
  status: string;
  score?: number;
  messageId?: string;
  error?: string;
}

interface ProcessResponse {
  success: boolean;
  error?: string;
  summary: {
    total: number;
    successCount: number;
    failureCount: number;
    qualified: number;
  };
  results: ProcessResult[];
}

interface PreviewData {
  initial: string;
  followup3day: string;
  followup7day: string;
}

type PreviewTab = "initial" | "followup3day" | "followup7day";

export default function LeadAutomationDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [results, setResults] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>("initial");
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [cronReady, setCronReady] = useState(false);
  const [isRunningFollowups, setIsRunningFollowups] = useState(false);
  const [followupRunResult, setFollowupRunResult] = useState<{
    sent: number;
    errors: number;
    total: number;
    message?: string;
    results: { email: string; company: string; type: string; status: string; error?: string }[];
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const rt = params.get("rt");
    const cron = params.get("cron");
    if (token) {
      setIsAuthenticated(true);
      setAccessToken(token);
      if (rt) setRefreshToken(rt);
      if (cron === "ready") setCronReady(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleAuth = () => {
    const clientId = "683483184037-gaqs9i5bfrsutjng9rkimh3up7cgfunv.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/spreadsheets",
    ];

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(" "))}&access_type=offline&prompt=consent`;

    window.location.href = authUrl;
  };

  const parseLeadsFromInput = (): { leads: unknown[] | null; error: string } => {
    let parsedLeads;
    try {
      parsedLeads = JSON.parse(jsonInput);
    } catch {
      return { leads: null, error: "Invalid JSON format. Please check your input." };
    }
    const leadsArray = Array.isArray(parsedLeads) ? parsedLeads : parsedLeads.leads || [];
    if (!Array.isArray(leadsArray) || leadsArray.length === 0) {
      return { leads: null, error: "No leads found in JSON. Format should be: { leads: [...] }" };
    }
    return { leads: leadsArray, error: "" };
  };

  const [processingStatus, setProcessingStatus] = useState("");

  const handleProcessLeads = async () => {
    setError("");
    setSuccessMessage("");
    setProcessingStatus("");
    setIsProcessing(true);

    const { leads: leadsArray, error: parseError } = parseLeadsFromInput();
    if (!leadsArray) {
      setError(parseError);
      setIsProcessing(false);
      return;
    }

    const allResults: ProcessResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Send one lead per request with a 3-second client-side delay between calls.
    // This avoids Vercel's serverless timeout (10s Hobby / 60s Pro) entirely.
    for (let i = 0; i < leadsArray.length; i++) {
      const lead = leadsArray[i];
      setProcessingStatus(`Sending ${i + 1} of ${leadsArray.length}: ${lead.name || lead.email}`);

      try {
        const response = await fetch("/api/leads/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ lead }),
        });

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          failureCount++;
          allResults.push({ email: lead.email, status: "error", error: "Server error (non-JSON response)" });
          continue;
        }

        if (!response.ok) {
          failureCount++;
          allResults.push({ email: lead.email, status: "error", error: data.error || "Failed" });
        } else {
          successCount++;
          allResults.push(data.result || { email: lead.email, status: "email_sent" });
        }
      } catch (err) {
        failureCount++;
        allResults.push({ email: lead.email, status: "error", error: err instanceof Error ? err.message : "Network error" });
      }

      // Update results live after each email
      setResults({
        success: true,
        summary: { total: i + 1, successCount, failureCount, qualified: successCount },
        results: [...allResults],
      });

      // 3-second delay between emails (client-side — no Vercel timeout risk)
      if (i < leadsArray.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    setProcessingStatus("");
    setSuccessMessage(`Done! Sent ${successCount} of ${leadsArray.length} emails.`);
    setJsonInput("");
    setIsProcessing(false);
  };

  const handlePreview = async () => {
    setError("");
    setIsGeneratingPreview(true);

    const { leads: leadsArray, error: parseError } = parseLeadsFromInput();
    if (!leadsArray) {
      setError(parseError);
      setIsGeneratingPreview(false);
      return;
    }

    try {
      const response = await fetch("/api/leads/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ lead: leadsArray[0] }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Preview generation failed");
        return;
      }

      setPreviewData(data);
      setActivePreviewTab("initial");
      setTimeout(() => {
        document.getElementById("email-preview")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleRunFollowups = async () => {
    setIsRunningFollowups(true);
    setFollowupRunResult(null);
    try {
      const response = await fetch("/api/leads/run-followups", {
        method: "POST",
        headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to run follow-ups");
        return;
      }
      setFollowupRunResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run follow-ups");
    } finally {
      setIsRunningFollowups(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Lead Automation
            </h1>
            <p className="text-slate-600 mb-8">
              Connect your Gmail account to start sending automated lead emails
            </p>
            <Button
              onClick={handleGoogleAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Login with Google
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const previewTabs: { key: PreviewTab; label: string; desc: string }[] = [
    { key: "initial", label: "Initial Email", desc: "Sent on Day 1" },
    { key: "followup3day", label: "3-Day Follow-up", desc: "Sent on Day 3" },
    { key: "followup7day", label: "7-Day Follow-up", desc: "Sent on Day 7" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Lead Automation Dashboard
          </h1>
          <p className="text-slate-600">
            Upload leads in JSON format and send AI-personalized emails
          </p>
        </div>

        {/* Cron / Refresh Token Setup Banner */}
        {cronReady && !refreshToken && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6 flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-800 text-sm font-medium">
              Automatic follow-ups enabled. Cron runs daily at 9 AM UTC via Vercel.
            </p>
          </div>
        )}

        {refreshToken && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 mb-6">
            <p className="text-amber-900 font-semibold mb-2">Action required: Save your refresh token for Vercel</p>
            <p className="text-amber-800 text-sm mb-3">
              Locally saved. For the Vercel cron to work, add this as <code className="bg-amber-100 px-1 rounded">GOOGLE_REFRESH_TOKEN</code> in your Vercel project env vars:
            </p>
            <div className="flex gap-2 items-center">
              <code className="flex-1 text-xs bg-white border border-amber-200 rounded p-2 break-all text-slate-800">
                {refreshToken}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(refreshToken); }}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded font-semibold whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="text-amber-700 text-xs mt-2">
              Also add <code className="bg-amber-100 px-1 rounded">CRON_SECRET=any-random-string</code> to both <code className="bg-amber-100 px-1 rounded">.env.local</code> and Vercel env vars.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Upload Leads
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                JSON Format (Required)
              </label>
              <div className="bg-slate-50 p-4 rounded-lg mb-3 border border-slate-200">
                <code className="text-xs text-slate-600 whitespace-pre-wrap break-words">
                  {`{
  "leads": [
    {
      "name": "John Doe",
      "first_name": "John",
      "email": "john@company.com",
      "title": "CEO",
      "company": "Company Name",
      "industry": "IT Services",
      "location": "New York"
    }
  ]
}`}
                </code>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your JSON here..."
                className="w-full h-64 p-4 border-2 border-slate-300 rounded-lg font-mono text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700 text-sm font-semibold">
                  {successMessage}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleProcessLeads}
                disabled={isProcessing || !jsonInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {isProcessing ? (processingStatus || "Starting...") : "Process & Send Emails"}
              </Button>
              <Button
                onClick={handlePreview}
                disabled={isGeneratingPreview || !jsonInput.trim()}
                className="w-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
              >
                {isGeneratingPreview ? "Generating Preview..." : "Preview All 3 Email Templates"}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Results</h2>

            {results ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Total Leads</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {results.summary.total}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Emails Sent</p>
                    <p className="text-2xl font-bold text-green-600">
                      {results.summary.successCount}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {results.summary.failureCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Detailed Results
                  </h3>
                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                    {results.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-b border-slate-100 last:border-b-0 ${
                          result.status === "email_sent"
                            ? "bg-green-50"
                            : "bg-red-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {result.email}
                        </p>
                        <p className="text-xs text-slate-600">
                          Status:{" "}
                          <span
                            className={`font-semibold ${
                              result.status === "email_sent"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {result.status}
                          </span>
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-700">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  Upload leads and click "Process & Send Emails" to see results here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Preview Section */}
        {previewData && (
          <div id="email-preview" className="bg-white rounded-lg shadow-lg p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Email Previews</h2>
                <p className="text-slate-500 text-sm mt-1">
                  AI-generated content for the first lead in your JSON. All 3 emails are fully personalized.
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-medium px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {previewTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActivePreviewTab(tab.key)}
                  className={`flex flex-col px-5 py-3 rounded-lg text-sm font-semibold transition border ${
                    activePreviewTab === tab.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs font-normal mt-0.5 ${
                      activePreviewTab === tab.key ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {tab.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs text-slate-400 ml-2">Email Preview</span>
              </div>
              <iframe
                srcDoc={previewData[activePreviewTab]}
                className="w-full"
                style={{ height: "640px" }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* Follow-up Testing Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Follow-up Testing</h2>
          <p className="text-slate-500 text-sm mb-6">
            Run follow-ups manually right now. Use this to test before relying on the Vercel cron.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* How to test */}
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
              <p className="font-semibold text-slate-800 mb-3">How to test the follow-up logic:</p>
              <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                <li>Send at least one initial email via "Process & Send Emails" above</li>
                <li>
                  Open your{" "}
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_SHEET_ID || "your-sheet-id"}`}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Google Sheet
                  </a>{" "}
                  and find that lead's row
                </li>
                <li>
                  Change the <strong>Follow-up Date</strong> column (column J) to{" "}
                  <strong>yesterday's date</strong> (e.g. <code className="bg-slate-200 px-1 rounded">2026-06-19</code>)
                </li>
                <li>Click "Run Follow-ups Now" — the 3-day email will send immediately</li>
                <li>Check your inbox. The sheet status updates to <code className="bg-slate-200 px-1 rounded">followup_3day_sent</code></li>
                <li>Repeat steps 3-4 to test the 7-day follow-up (change Follow-up Date to yesterday again)</li>
              </ol>
              <p className="text-xs text-slate-500 mt-3">
                On Vercel, the cron at <code className="bg-slate-200 px-1 rounded">/api/cron/followups</code> runs this same logic daily at 9 AM UTC automatically.
              </p>
            </div>

            {/* Run button + result */}
            <div className="flex flex-col">
              <Button
                onClick={handleRunFollowups}
                disabled={isRunningFollowups}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition mb-4"
              >
                {isRunningFollowups ? "Running Follow-ups..." : "Run Follow-ups Now"}
              </Button>

              {followupRunResult && (
                <div className="flex-1">
                  {followupRunResult.total === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                      <p className="text-slate-600 text-sm font-medium">No leads are due for a follow-up.</p>
                      <p className="text-slate-500 text-xs mt-1">Change a lead's Follow-up Date in the sheet to yesterday to test.</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-3 mb-3">
                        <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Sent</p>
                          <p className="text-2xl font-bold text-green-600">{followupRunResult.sent}</p>
                        </div>
                        <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{followupRunResult.errors}</p>
                        </div>
                        <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500">Total</p>
                          <p className="text-2xl font-bold text-blue-600">{followupRunResult.total}</p>
                        </div>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {followupRunResult.results.map((r, idx) => (
                          <div
                            key={idx}
                            className={`p-3 border-b border-slate-100 last:border-b-0 ${r.status === "sent" ? "bg-green-50" : "bg-red-50"}`}
                          >
                            <p className="text-sm font-semibold text-slate-900">{r.company} — {r.email}</p>
                            <p className="text-xs text-slate-500">
                              <span className={`font-semibold ${r.status === "sent" ? "text-green-700" : "text-red-700"}`}>
                                {r.type}
                              </span>{" "}
                              {r.status === "sent" ? "sent" : `failed: ${r.error}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">How It Works</h3>
          <ul className="text-sm text-blue-900 space-y-2">
            <li><strong>Day 0</strong> — Paste leads as JSON, click "Process & Send Emails". AI (Groq / Llama 3.3) generates a personalized pain point, hook, and messaging per lead. Initial email sent immediately. Lead logged to Google Sheet with follow-up date set to Day 3.</li>
            <li><strong>Day 3</strong> — Vercel cron runs at 9 AM UTC, reads the sheet, finds leads with status <code className="bg-blue-100 px-1 rounded">initial_sent</code> past their follow-up date, sends AI-personalized 3-day follow-up. Sheet updated to <code className="bg-blue-100 px-1 rounded">followup_3day_sent</code>, next follow-up set to Day 7.</li>
            <li><strong>Day 7</strong> — Cron runs again, sends final 7-day follow-up to any leads with status <code className="bg-blue-100 px-1 rounded">followup_3day_sent</code>. Sheet updated to <code className="bg-blue-100 px-1 rounded">followup_7day_sent</code>. No further emails.</li>
            <li><strong>Setup for Vercel</strong> — After logging in, copy the refresh token shown above and add it as <code className="bg-blue-100 px-1 rounded">GOOGLE_REFRESH_TOKEN</code> in your Vercel project settings. Also add <code className="bg-blue-100 px-1 rounded">CRON_SECRET</code>. The cron does the rest automatically.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
