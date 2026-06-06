export interface AdRecord {
  id: string;
  lineNumber: number;
  domain: string;
  publisherId: string;
  relationship: "DIRECT" | "RESELLER" | string;
  certificationId?: string;
  inlineComment?: string;
  groupComment?: string;
  raw: string;
  isValid: boolean;
  errors: string[];
}

export interface CrawlerLog {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
}

export interface AdNetworkTemplate {
  name: string;
  domain: string;
  relationship: "DIRECT" | "RESELLER";
  publisherIdPlaceholder: string;
  certificationId: string;
  description: string;
}
