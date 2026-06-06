import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface CrawlerLog {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const APP_ADS_PATH = path.join(process.cwd(), "app-ads.txt");

const DEFAULT_CONTENT = `# AppLovin
applovin.com, PENDING_APPROVAL, DIRECT, c4a17364cf6e680a

# ironSource / Unity
ironsrc.com, 11270679362841, DIRECT
`;

// In-memory logs for crawlers visiting app-ads.txt
const crawlerLogs: CrawlerLog[] = [];

// Initialize app-ads.txt if it doesn't exist
if (!fs.existsSync(APP_ADS_PATH)) {
  try {
    fs.writeFileSync(APP_ADS_PATH, DEFAULT_CONTENT, "utf8");
    console.log("Created initial default app-ads.txt file on disk.");
  } catch (err) {
    console.error("Error creating initial default app-ads.txt:", err);
  }
}

// Function to parse app-ads.txt into structured objects
function parseAppAds(text: string) {
  const lines = text.split(/\r?\n/);
  const entries: any[] = [];
  let currentGroupComment = "";

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return; // Skip empty lines
    }

    if (trimmed.startsWith("#")) {
      currentGroupComment = trimmed.replace(/^#\s*/, "");
      return;
    }

    // Parse record line: split by comma, handles inline trailing comments if any
    let cleanLine = trimmed;
    let inlineComment = "";
    const hashIndex = trimmed.indexOf("#");
    if (hashIndex !== -1) {
      cleanLine = trimmed.substring(0, hashIndex).trim();
      inlineComment = trimmed.substring(hashIndex + 1).trim();
    }

    const parts = cleanLine.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      const entry = {
        lineNumber: index + 1,
        id: `entry-${index}-${Math.random().toString(36).substr(2, 9)}`,
        domain: parts[0] || "",
        publisherId: parts[1] || "",
        relationship: parts[2] ? parts[2].toUpperCase() : "DIRECT",
        certificationId: parts[3] || "",
        inlineComment: inlineComment || undefined,
        groupComment: currentGroupComment || undefined,
        raw: trimmed,
        isValid: true,
        errors: [] as string[],
      };

      // Perform deep validation
      if (!entry.domain) {
        entry.isValid = false;
        entry.errors.push("Domain name is required.");
      } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(entry.domain)) {
        entry.isValid = false;
        entry.errors.push(`Invalid domain structure: "${entry.domain}". Exclude http:// or trailing slashes.`);
      }

      if (!entry.publisherId) {
        entry.isValid = false;
        entry.errors.push("Publisher/Account ID is missing or empty.");
      }

      const rel = entry.relationship;
      if (rel !== "DIRECT" && rel !== "RESELLER") {
        entry.isValid = false;
        entry.errors.push(`Relationship type must be standard "DIRECT" or "RESELLER" (found: "${rel}").`);
      }

      entries.push(entry);
    } else {
      // Line is malformed (not a comment or empty, nor comma-separated record)
      entries.push({
        lineNumber: index + 1,
        id: `entry-malformed-${index}`,
        raw: trimmed,
        isValid: false,
        domain: "",
        publisherId: "",
        relationship: "",
        certificationId: "",
        groupComment: currentGroupComment || undefined,
        errors: ["Malformed line: expected a comma-separated format 'domain, publisherId, relationship, certId'"]
      });
    }
  });

  return entries;
}

// Function to log visits to app-ads.txt
function logCrawlerVisit(req: express.Request) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "Unknown IP";
  const userAgent = req.headers["user-agent"] || "Unknown User Agent";
  
  const log: CrawlerLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    ip: ip.split(",")[0].trim(),
    userAgent,
    method: req.method,
    path: req.path,
  };

  crawlerLogs.unshift(log);
  if (crawlerLogs.length > 100) {
    crawlerLogs.pop(); // Keep last 100 entries
  }
}

// Serve public app-ads.txt crawler endpoint with strict media type headers
app.get(["/app-ads.txt", "/app-ads.txt/"], (req, res) => {
  logCrawlerVisit(req);
  
  try {
    if (fs.existsSync(APP_ADS_PATH)) {
      const content = fs.readFileSync(APP_ADS_PATH, "utf8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(200).send(content);
    } else {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(404).send(`# Warning: app-ads.txt file not found on disk\n${DEFAULT_CONTENT}`);
    }
  } catch (err) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send(`# Error reading app-ads.txt: ${(err as Error).message}`);
  }
});

// API endpoint to fetch app-ads data
app.get("/api/app-ads", (req, res) => {
  try {
    let rawText = DEFAULT_CONTENT;
    if (fs.existsSync(APP_ADS_PATH)) {
      rawText = fs.readFileSync(APP_ADS_PATH, "utf8");
    }
    const entries = parseAppAds(rawText);
    res.json({
      rawText,
      entries,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// API endpoint to update app-ads data
app.post("/api/app-ads", (req, res) => {
  const { rawText } = req.body;
  if (typeof rawText !== "string") {
    res.status(400).json({ error: "rawText parameter must be a string." });
    return;
  }

  try {
    fs.writeFileSync(APP_ADS_PATH, rawText, "utf8");
    const entries = parseAppAds(rawText);
    res.json({
      success: true,
      rawText,
      entries,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// API endpoint to perform a quick real-time validate check
app.post("/api/app-ads/validate-text", (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string") {
    res.status(400).json({ error: "text parameter is required as string." });
    return;
  }

  const entries = parseAppAds(text);
  const total = entries.length;
  const invalid = entries.filter(e => !e.isValid).length;
  const valid = total - invalid;

  res.json({
    entries,
    totals: {
      total,
      valid,
      invalid,
    }
  });
});

// API Endpoint to fetch crawler access log history
app.get("/api/crawler-logs", (req, res) => {
  res.json({
    logs: crawlerLogs,
  });
});

// API Endpoint to simulate a crawler request
app.post("/api/simulate-crawler", (req, res) => {
  const { userAgent } = req.body;
  
  const simulatedHeader: any = {
    "user-agent": userAgent || "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "x-forwarded-for": "66.249.66.1, 10.0.0.1",
  };

  const fakeReq = {
    headers: simulatedHeader,
    socket: { remoteAddress: "66.249.66.1" },
    method: "GET",
    path: "/app-ads.txt",
  } as any;

  logCrawlerVisit(fakeReq);
  res.json({
    success: true,
    message: "Crawler visit simulated successfully.",
    log: crawlerLogs[0],
  });
});

// Clear simulation logs
app.post("/api/clear-logs", (req, res) => {
  crawlerLogs.length = 0;
  res.json({ success: true, message: "Logs cleared" });
});

// Vite Middleware & SPA Static Routing Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`App-ads.txt publisher running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
