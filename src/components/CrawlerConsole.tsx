import React, { useState } from "react";
import { CrawlerLog } from "../types";
import { 
  Bot, 
  Activity, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Compass,
  CheckCircle,
  HelpCircle,
  Globe
} from "lucide-react";

const CRAWLER_AGENTS = [
  { name: "Googlebot (AdSense/AdMob)", value: "Googlebot/2.1 (+http://www.google.com/bot.html)" },
  { name: "AppLovin Crawler Bot", value: "AppLovin app-ads-txt crawler" },
  { name: "ironSource Crawler Agent", value: "ironSource-app-ads-txt-crawler" },
  { name: "Meta Audience Network Crawler", value: "facebookexternalhit/1.1" },
  { name: "Unity Ads Spider", value: "UnityAdsScraper/1.0" },
  { name: "Generic Ad Bidding Engine", value: "Sellers-App-Ads-Verification-Engine/2.0" }
];

interface CrawlerConsoleProps {
  logs: CrawlerLog[];
  onSimulate: (userAgent: string) => Promise<void>;
  onClearLogs: () => Promise<void>;
  isLoadingSimulate: boolean;
  hostedUrl: string;
}

export const CrawlerConsole: React.FC<CrawlerConsoleProps> = ({
  logs,
  onSimulate,
  onClearLogs,
  isLoadingSimulate,
  hostedUrl,
}) => {
  const [selectedAgent, setSelectedAgent] = useState(CRAWLER_AGENTS[0].value);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/app-ads.txt`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Official Hosted URL Reference */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-teal-400 animate-pulse" />
          <h3 className="font-semibold text-sm tracking-wide uppercase">Your Live Endpoint</h3>
        </div>
        
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Ad networks scan this URL on your Developer Domain to verify authorized sellers. Ensure this link is public:
        </p>

        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-xs select-all text-teal-300 overflow-x-auto whitespace-nowrap mb-4 scrollbar-thin">
          <span>{window.location.origin}/app-ads.txt</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 active:scale-95 transition-all outline-none"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                Copy URL
              </>
            )}
          </button>
          
          <a
            href="/app-ads.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-center"
          >
            View Live File
            <span className="text-[10px]">&nearr;</span>
          </a>
        </div>
      </div>

      {/* 2. Live Crawler Simulator */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Crawler Simulator</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            TEST BOT SUITE
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Trigger simulated crawlers to verify the format of headers, ensure proper status code outputs, and watch live traffic registrations.
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Crawler Agent
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:border-teal-500 focus:bg-white text-slate-700 font-sans"
            >
              {CRAWLER_AGENTS.map((bot) => (
                <option key={bot.name} value={bot.value}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isLoadingSimulate}
            onClick={() => onSimulate(selectedAgent)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 active:scale-[0.99] disabled:bg-slate-300 disabled:scale-100 disabled:cursor-not-allowed transition-all leading-none"
          >
            {isLoadingSimulate ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Simulating Crawford Retrieval...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Simulate Crawler Request
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Crawler Logs History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
            <h3 className="font-semibold text-slate-800 text-sm">Real-time Crawler Log</h3>
          </div>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-100"
              title="Clear logs history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Watch crawler requests in real time. Standard programmatic crawlers query with exact HTTP codes to verify authorization lines.
        </p>

        <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg bg-slate-950 p-3 font-mono text-[10px]">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 text-slate-500">
              <Bot className="w-8 h-8 text-slate-700 mb-2 opacity-40" />
              <p>No scans logged yet</p>
              <p className="text-[9px] text-slate-600 mt-1 max-w-[200px]">
                Trigger the simulator above or load the raw file in your browser to write logs.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <div key={log.id} className="border-b border-slate-900 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center text-teal-400 mb-1">
                    <span className="font-semibold flex items-center gap-1 text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      GET {log.path}
                    </span>
                    <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-slate-300 truncate font-sans text-[11px]" title={log.userAgent}>
                    <strong className="text-slate-400">Agent: </strong>
                    {log.userAgent.length > 35 ? log.userAgent.substring(0, 35) + "..." : log.userAgent}
                  </div>
                  
                  <div className="text-slate-500 flex justify-between mt-0.5">
                    <span>IP: {log.ip}</span>
                    <span className="text-emerald-500 font-semibold uppercase">200 OK</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. App-ads.txt Tutorial Checklist */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
        <h4 className="font-bold text-slate-800 text-xs tracking-wider uppercase mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Publishing Guide
        </h4>
        
        <ul className="space-y-3.5">
          <li className="flex gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div className="text-xs">
              <strong className="block text-slate-700">Add Configurations</strong>
              <p className="text-slate-500 mt-0.5">
                Paste your ad network records inside our editor tab (or use Fast-Fill templates). Press the save button.
              </p>
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div className="text-xs">
              <strong className="block text-slate-700">Set Developer Website</strong>
              <p className="text-slate-500 mt-0.5">
                Configure your App Store or Google Play Console developer website precisely to this site's domain.
              </p>
            </div>
          </li>
          <li className="flex gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] shrink-0 mt-0.5">
              3
            </span>
            <div className="text-xs">
              <strong className="block text-slate-700">Automatic Sells Verification</strong>
              <p className="text-slate-500 mt-0.5">
                Ad exchanges crawler bots query your domain automatically at `/app-ads.txt` within 24 hours to approve you.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};
