import React, { useState, useEffect } from "react";
import { 
  Globe, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle, 
  Save, 
  FileText, 
  Plus, 
  Trash2, 
  Code, 
  Layout, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Play, 
  Terminal,
  FileCheck,
  Search,
  BookOpen
} from "lucide-react";
import { AdRecord, CrawlerLog, AdNetworkTemplate } from "./types";
import { TemplatePicker } from "./components/TemplatePicker";
import { CrawlerConsole } from "./components/CrawlerConsole";

export default function App() {
  const [rawText, setRawText] = useState<string>("");
  const [parsedEntries, setParsedEntries] = useState<AdRecord[]>([]);
  const [logs, setLogs] = useState<CrawlerLog[]>([]);
  
  // Editor mode: 'raw' for raw text, 'visual' for interactive rows
  const [editorMode, setEditorMode] = useState<"raw" | "visual">("raw");
  const [statusTab, setStatusTab] = useState<"documentation" | "builder">("builder");
  
  // Single Record builder form state
  const [formDomain, setFormDomain] = useState("");
  const [formPubId, setFormPubId] = useState("");
  const [formRel, setFormRel] = useState<"DIRECT" | "RESELLER">("DIRECT");
  const [formCertId, setFormCertId] = useState("");
  const [formComment, setFormComment] = useState("");
  
  // Search query for filters
  const [searchQuery, setSearchQuery] = useState("");
  
  // System statuses
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [developerDomainInput, setDeveloperDomainInput] = useState(() => {
    // Attempt to parse out a clean developer domain from current URL for instructional display
    try {
      return window.location.hostname;
    } catch {
      return "pixelcraftgames.com";
    }
  });

  // Load backend content on startup
  const loadData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/app-ads");
      if (res.ok) {
        const data = await res.json();
        setRawText(data.rawText || "");
        setParsedEntries(data.entries || []);
      }
      
      const logsRes = await fetch("/api/crawler-logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error("Error loading app-ads configuration data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh logs every 5 seconds for interactive live crawling experience
    const interval = setInterval(async () => {
      try {
        const logsRes = await fetch("/api/crawler-logs");
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        }
      } catch (err) {
        // Silent error
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync state and validate raw text changes in real time
  const handleRawTextChange = async (newVal: string) => {
    setRawText(newVal);
    try {
      const res = await fetch("/api/app-ads/validate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newVal })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Validation failed off-network", err);
    }
  };

  // Safe file save handler
  const saveAppAdsFile = async (textToSave: string) => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/app-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: textToSave })
      });
      if (res.ok) {
        const data = await res.json();
        setRawText(data.rawText || "");
        setParsedEntries(data.entries || []);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Add line to editor from form
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDomain || !formPubId) return;

    // Standard raw record text building
    let newRecordLine = `${formDomain.trim().toLowerCase()}, ${formPubId.trim()}, ${formRel}`;
    if (formCertId.trim()) {
      newRecordLine += `, ${formCertId.trim()}`;
    }
    if (formComment.trim()) {
      newRecordLine += ` # ${formComment.trim()}`;
    }

    const updatedText = rawText.trim() === "" 
      ? newRecordLine 
      : `${rawText.trim()}\n${newRecordLine}`;

    handleRawTextChange(updatedText);
    
    // Reset Form
    setFormDomain("");
    setFormPubId("");
    setFormRel("DIRECT");
    setFormCertId("");
    setFormComment("");
  };

  // Delete line from records list
  const handleDeleteRow = (indexToDelete: number) => {
    const lines = rawText.split(/\r?\n/);
    lines.splice(indexToDelete, 1);
    const updatedText = lines.join("\n");
    handleRawTextChange(updatedText);
  };

  // Faster insert from templates
  const handleSelectTemplate = (template: AdNetworkTemplate) => {
    const defaultPubId = template.publisherIdPlaceholder === "YOUR_ACCOUNT_ID" 
      ? `pub-${Math.floor(Math.random() * 10000000000000)}` 
      : template.publisherIdPlaceholder;

    let line = `${template.domain}, ${defaultPubId}, ${template.relationship}`;
    if (template.certificationId) {
      line += `, ${template.certificationId}`;
    }
    line += ` # Added from ${template.name} Template`;

    const updatedText = rawText.trim() === ""
      ? line
      : `${rawText.trim()}\n${line}`;

    handleRawTextChange(updatedText);
    
    // Flash dynamic preview to visually highlight addition
    const targetElement = document.getElementById("raw-text-preview-code");
    if (targetElement) {
      targetElement.classList.add("ring-2", "ring-teal-500");
      setTimeout(() => targetElement.classList.remove("ring-2", "ring-teal-500"), 1000);
    }
  };

  // Crawler Simulation triggering
  const handleSimulateCrawler = async (userAgent: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/simulate-crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAgent })
      });
      if (res.ok) {
        const data = await res.json();
        // Immediately prepend the mock simulated visit
        setLogs(prev => [data.log, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Log Clear trigger
  const handleClearLogs = async () => {
    try {
      const res = await fetch("/api/clear-logs", { method: "POST" });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate totals stats values
  const totalEntries = parsedEntries.length;
  const invalidEntries = parsedEntries.filter(e => !e.isValid).length;
  const validEntries = totalEntries - invalidEntries;

  // Filter entry elements for visual table viewer
  const filteredEntries = parsedEntries.map((e, index) => ({ ...e, originalIndex: index })).filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.domain?.toLowerCase().includes(query) ||
      e.publisherId?.toLowerCase().includes(query) ||
      (e.relationship && e.relationship.toLowerCase().includes(query)) ||
      (e.errors && e.errors.some(err => err.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* HEADER SECTION - Beautiful Minimal Alignment */}
      <header className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-5 border-b border-slate-200 bg-white shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            V
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight text-slate-900">VerifyAds.host</span>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">APP-ADS.TXT MANAGEMENT</span>
          </div>
        </div>

        {/* Status navigation */}
        <nav className="flex gap-6 text-xs md:text-sm font-medium text-slate-500">
          <button 
            type="button" 
            onClick={() => setStatusTab("builder")}
            className={`pb-1 transition-all ${statusTab === "builder" ? "text-teal-600 border-b-2 border-teal-600 font-semibold" : "hover:text-slate-900"}`}
          >
            Management Dashboard
          </button>
          <button 
            type="button" 
            onClick={() => setStatusTab("documentation")}
            className={`pb-1 transition-all ${statusTab === "documentation" ? "text-teal-600 border-b-2 border-teal-600 font-semibold" : "hover:text-slate-900"}`}
          >
            Integration Guide & Specs
          </button>
        </nav>

        {/* Action Reachable validation pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            CRAWLER REACHABLE
          </div>

          <button
            type="button"
            onClick={() => saveAppAdsFile(rawText)}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-md text-xs font-semibold leading-none shadow-sm transition-all duration-150 transform active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Changes 
              </>
            )}
          </button>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* Dynamic Warning Notification */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Congratultions! Your developer verification file <strong className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded text-[11px]">/app-ads.txt</strong> was compiled and saved to disk successfully.</span>
            </div>
            <button onClick={() => setSaveStatus("idle")} className="text-emerald-500 hover:text-emerald-900 text-[10px] uppercase font-bold tracking-wider ml-4">Dismiss</button>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to save changes. Please try again or check the dev log.</span>
            </div>
            <button onClick={() => setSaveStatus("idle")} className="text-rose-400 hover:text-rose-900 text-xs font-bold ml-4">Close</button>
          </div>
        )}

        {statusTab === "documentation" ? (
          /* INTEGRATION COMPREHENSIVE DOCUMENTATION PANEL */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-teal-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Programmatic Publisher Integration Guide</h2>
                <p className="text-xs text-slate-500">Learn how app-ads.txt standard functions & why developer website URL alignment is critical</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">1. Understanding structural app-ads.txt standard</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The <strong className="text-slate-800 font-semibold">Authorized Sellers for Mobile Apps (app-ads.txt)</strong> is an initiative by the Interactive Advertising Bureau (IAB) Technology Laboratory. 
                  It helps prevent unauthorized domain spoofing and malicious inventory sales by verifying who is authorized to transact on behalf of your mobile application.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100 font-mono text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-700 mb-1 border-b pb-1 text-[10px] uppercase tracking-wider">Example Syntax Block:</div>
                  <div>google.com, pub-103984572230, DIRECT, f5c9fe415231d93e</div>
                  <div className="text-[10px] text-slate-400 font-sans mt-2">
                    Format: <code className="text-teal-600">domain, publisherId, access_type, optional_cert_hash</code>.
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 text-sm border-b pb-2 pt-2">2. Steps to configure developer website in store console</h3>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2.5">
                  <li>Find your app details page inside the <strong className="text-slate-800">Google Play Console</strong> or <strong className="text-slate-800">Apple App Store Connect</strong>.</li>
                  <li>Locate the <strong className="text-slate-700 font-semibold">Developer Website URL</strong> field.</li>
                  <li>Enter the hosting Domain: <code className="bg-slate-100 text-teal-650 px-1 py-0.5 rounded font-mono text-[10px]">{window.location.host}</code></li>
                  <li>Click Save. Once updated, ad networks will combine the app packet package name (e.g., <code className="text-[10px] font-mono">com.pixelcraft.games</code>) with this URL to search for <code className="text-teal-600 font-mono">/app-ads.txt</code>.</li>
                </ol>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 text-sm border-b pb-2">3. Verification Flow Mechanics</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ad verification crawlers inspect directories using specific automated criteria. The app-ads.txt file must:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-2">
                  <li>Be served from the root directory path precisely (e.g. <strong className="text-teal-600 font-mono">/app-ads.txt</strong>). Sub-paths like <code className="bg-slate-100 px-1 text-[10px]">/assets/app-ads.txt</code> will fail.</li>
                  <li>Return a stable HTTP status code level <strong className="text-slate-800 font-medium font-mono text-emerald-600">200 OK</strong>.</li>
                  <li>Serve raw response with a media header type starting with <strong className="text-slate-800 font-mono text-teal-600">text/plain</strong>.</li>
                  <li>Allow open crawl access. Our server already includes CORS headers allowing seamless programmatic requests.</li>
                </ul>

                <div className="mt-4 p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block font-semibold">Critical Crawling Troubleshooting Note:</strong>
                      <p className="mt-1 leading-relaxed text-amber-800">
                        If ad networks (such as Google AdMob) show "No app-ads.txt status was found", please verify your store account listing URL. 
                        It takes up to 24 hours for Googlebot / AppLovin crawler system to synchronize caches globally. Use our 
                        <span className="font-semibold"> Crawler logs</span> panel to verify live traffic hits in real time!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                type="button" 
                onClick={() => setStatusTab("builder")}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Return to Editor Panel
              </button>
            </div>
          </div>
        ) : (
          /* BUILDER DASHBOARD ACTIVE */
          <div className="space-y-8">
            
            {/* STATS OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div id="stat-total" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Records Listed</p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalEntries}</p>
                </div>
                <div className="mt-3 text-[11px] text-slate-500">
                  Total developer lines parsed
                </div>
              </div>

              <div id="stat-valid" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status Verified</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">{validEntries}</p>
                    <span className="text-xs text-slate-400">/ {totalEntries}</span>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Ready for bidding validation
                </div>
              </div>

              <div id="stat-invalid" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Formatting Errors</p>
                  <p className={`text-3xl font-extrabold tracking-tight ${invalidEntries > 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {invalidEntries}
                  </p>
                </div>
                <div className="mt-3 text-[11px] text-slate-500">
                  {invalidEntries > 0 ? "⚠️ Malformed records found" : "✨ Syntax fully standard-compliant"}
                </div>
              </div>

              <div id="stat-content" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Media Header Type</p>
                  <p className="text-sm font-semibold font-mono text-indigo-600 mt-1.5 b-1">text/plain; charset=utf-8</p>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Proper HTTP header is active
                </div>
              </div>
            </div>

            {/* DUAL DIVISION GRID: LEFT IS EDITING AREA, RIGHT IS CRAWLER LOGS / TEMPLATES */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* PRIMARY LEFT WRAPPER FOR AD-ADS.TXT MANAGEMENT */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* INTERACTIVE WORKSPACE CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[580px]">
                  
                  {/* WORKSPACE NAV HEADER */}
                  <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-xs tracking-wide text-slate-700 uppercase">app-ads.txt Contents Workspace</span>
                    </div>

                    <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setEditorMode("raw")}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${editorMode === "raw" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        <Code className="w-3.5 h-3.5" />
                        Raw Editor text
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("visual")}
                        className={`flex items-center gap-1 px-3 py-1 rounded-md transition-all ${editorMode === "visual" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        <Layout className="w-3.5 h-3.5" />
                        Visual Registry table
                      </button>
                    </div>
                  </div>

                  {/* TAB CONTENT: RAW CONFIG TEXTAREA */}
                  {editorMode === "raw" ? (
                    <div className="flex-1 flex flex-col p-5 h-full relative" id="raw-text-preview-code">
                      <div className="mb-3 text-xs text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-150">
                        <span>💡 Tip: Add records, comments using <code className="bg-slate-200 text-slate-700 px-1 rounded font-mono">#</code>, or select a Fast-Fill template on the right.</span>
                        <span className="font-mono text-[10px] text-slate-400">Encoding: UTF-8</span>
                      </div>

                      <div className="flex-1 flex border border-slate-200 rounded-lg overflow-hidden font-mono text-sm bg-slate-950 focus-within:border-teal-500 transition-colors h-full min-h-[350px]">
                        {/* LINE NUMBERS */}
                        <div className="bg-slate-900 text-slate-500 p-4 text-right select-none text-xs border-r border-slate-800 w-12 flex flex-col gap-0.5 font-semibold">
                          {(rawText.split("\n").length > 0 ? rawText.split("\n") : [""]).map((_, index) => (
                            <div key={`line-num-${index}`}>{String(index + 1).padStart(2, "0")}</div>
                          ))}
                        </div>

                        {/* TEXTAREA INTERACTIVE */}
                        <textarea
                          value={rawText}
                          onChange={(e) => handleRawTextChange(e.target.value)}
                          placeholder={`# Format: domain.com, publisherId, access_relationship, optional_authority_cert_id\n# Examples:\ngoogle.com, pub-3940256099942544, DIRECT, f08c47fec0942fa0\napplovin.com, ACCOUNT_ID, DIRECT, c4a17364cf6e680a`}
                          className="flex-1 p-4 bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto"
                          style={{ minHeight: "350px" }}
                        />
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
                        <div className="text-[11px] text-slate-500">
                          {parsedEntries.length} configured publishing sellers lines parsed
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRawTextChange("")}
                            className="px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Clear everything to start raw"
                          >
                            Clear Editor
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => saveAppAdsFile(rawText)}
                            disabled={isSaving}
                            className="bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-300 font-semibold px-4 py-1.5 rounded-lg text-xs shadow-xs flex items-center gap-1.5 transition-all outline-none"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save Config File
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* TAB CONTENT: VISUAL REGISTRY ROWS */
                    <div className="flex-1 flex flex-col p-5">
                      
                      {/* Search Bar filter */}
                      <div className="relative mb-4">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="w-4 h-4 text-slate-450" />
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search lines by publisher ID, domain name, errors, or registry parameters..."
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:bg-white focus:border-teal-500 outline-none text-slate-700"
                        />
                      </div>

                      {/* Visual Interactive Table */}
                      <div className="border border-slate-250/60 rounded-lg overflow-hidden bg-slate-50 text-xs flex-1 max-h-[460px] overflow-y-auto">
                        <table className="w-full border-collapse text-left">
                          <thead>
                            <tr className="bg-slate-150 border-b border-slate-200 text-slate-600 font-semibold select-none text-[10px] uppercase">
                              <th className="p-3 w-12 text-center">Line</th>
                              <th className="p-3">Ad Domain</th>
                              <th className="p-3">Publisher Account ID</th>
                              <th className="p-3">Relation</th>
                              <th className="p-3">Cert ID</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEntries.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-450 font-normal bg-white">
                                  {searchQuery ? (
                                    <span>No records match your search <strong className="font-mono text-slate-600">"{searchQuery}"</strong></span>
                                  ) : (
                                    <div className="flex flex-col items-center py-4">
                                      <Layout className="w-8 h-8 text-slate-300 mb-2" />
                                      <p className="font-medium text-slate-600">No active publishing ad lines</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">Use the quick "Add New Publishing Partner" form below, or load standard files using templating shortcuts.</p>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ) : (
                              filteredEntries.map((record) => (
                                <tr 
                                  key={record.id} 
                                  className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors bg-white ${!record.isValid ? "bg-rose-50/20" : ""}`}
                                >
                                  {/* Line Index */}
                                  <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                                    {record.lineNumber}
                                  </td>
                                  
                                  {/* Domain with error indicators */}
                                  <td className="p-3 font-semibold text-slate-800">
                                    <div className="flex flex-col">
                                      <span className="font-mono text-[11px]">{record.domain || <em className="text-slate-400 italic">empty</em>}</span>
                                      {record.groupComment && (
                                        <span className="text-[10px] text-slate-400 italic font-sans font-normal mt-0.5">
                                          ({record.groupComment})
                                        </span>
                                      )}
                                      {!record.isValid && record.errors.map((err, i) => (
                                        <span key={i} className="text-[10px] text-rose-500 font-normal flex items-center gap-0.5 mt-0.5">
                                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> {err}
                                        </span>
                                      ))}
                                    </div>
                                  </td>

                                  {/* Publisher Id */}
                                  <td className="p-3 font-mono text-slate-650 font-mono text-[11px]">
                                    {record.publisherId || <span className="text-rose-450 italic font-sans">missing</span>}
                                  </td>

                                  {/* Relationship type badge */}
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      record.relationship === "DIRECT" 
                                        ? "bg-slate-100 text-slate-800" 
                                        : record.relationship === "RESELLER" 
                                          ? "bg-indigo-50 text-indigo-700" 
                                          : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {record.relationship || "DIRECT"}
                                    </span>
                                  </td>

                                  {/* Certification hash authority key */}
                                  <td className="p-3 font-mono text-slate-400 text-[11px] truncate max-w-[120px]">
                                    {record.certificationId || <span className="text-slate-300">-</span>}
                                  </td>

                                  {/* Inline comment details & delete execution */}
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {record.inlineComment && (
                                        <span className="text-[10px] text-slate-400 italic mr-2 truncate max-w-[100px]" title={record.inlineComment}>
                                          #{record.inlineComment}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRow(record.originalIndex)}
                                        className="text-slate-450 hover:text-rose-500 hover:bg-slate-100 p-1 rounded transition-colors"
                                        title="Delete validation row record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* FAST FORM ACTION: ADD SINGLE LOG LINE */}
                      <form onSubmit={handleAddRecord} className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-1">
                          <Plus className="w-4 h-4 text-teal-600" />
                          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Add New Publishing Partner Record</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Advertising Network Domain *</label>
                            <input
                              type="text"
                              required
                              value={formDomain}
                              onChange={(e) => setFormDomain(e.target.value)}
                              placeholder="e.g. google.com"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Publisher/Account ID *</label>
                            <input
                              type="text"
                              required
                              value={formPubId}
                              onChange={(e) => setFormPubId(e.target.value)}
                              placeholder="e.g. pub-102938475"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md outline-none focus:border-teal-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Inventory Relationship</label>
                            <select
                              value={formRel}
                              onChange={(e) => setFormRel(e.target.value as "DIRECT" | "RESELLER")}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md outline-none focus:border-teal-500"
                            >
                              <option value="DIRECT">DIRECT (You own or contract inventory)</option>
                              <option value="RESELLER">RESELLER (Authorized third-party resale)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Certification ID (Optional)</label>
                            <input
                              type="text"
                              value={formCertId}
                              onChange={(e) => setFormCertId(e.target.value)}
                              placeholder="e.g. f5c9fe415231d93e"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                          <div className="w-full">
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Inline Comment Descriptor (Optional)</label>
                            <input
                              type="text"
                              value={formComment}
                              onChange={(e) => setFormComment(e.target.value)}
                              placeholder="e.g. Added for Unity Mediation config"
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md outline-none focus:border-teal-500"
                            />
                          </div>

                          <button
                            type="submit"
                            className="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 py-2 rounded-lg text-xs tracking-wide uppercase shrink-0 h-9 shrink-0 flex items-center justify-center gap-1.5 self-end transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Insert record
                          </button>
                        </div>
                      </form>

                      {/* Sync to save warning */}
                      <div className="mt-3 flex items-center justify-between p-3 bg-indigo-50 border border-slate-100 rounded-lg">
                        <span className="text-[11px] text-indigo-750">
                          ⚠️ Changes above are currently staged. Keep editing or commit to save file directory on disk.
                        </span>
                        <button
                          type="button"
                          onClick={() => saveAppAdsFile(rawText)}
                          className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded px-2 py-1 shadow-2xs hover:bg-indigo-50"
                        >
                          Save Changes Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAST-FILL PRESET CHIP SELECTORS */}
                <TemplatePicker onSelect={handleSelectTemplate} />

              </div>

              {/* SIDEBAR RIGHT CONTAINER: ENDPOINT META, BOT TRAFFIC & SIMULATOR LOGS */}
              <div className="lg:col-span-2">
                <CrawlerConsole
                  logs={logs}
                  onSimulate={handleSimulateCrawler}
                  onClearLogs={handleClearLogs}
                  isLoadingSimulate={isSimulating}
                  hostedUrl={`${window.location.origin}/app-ads.txt`}
                />
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="mt-auto px-6 md:px-10 py-6 border-t border-slate-200 bg-white text-xs text-slate-500 font-medium flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-6">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
            STANDALONE SECURE HOSTING ACTIVE
          </span>
          <span>•</span>
          <span>IAB ADS.TXT / APP-ADS.TXT COMPLIANT V1.1</span>
          <span>•</span>
          <span>PUBLIC ANONYMOUS ACCESS ENABLED</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-450 text-[11px]">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          REALTIME CRAWLER SOCKET READY
        </div>
      </footer>
    </div>
  );
}
