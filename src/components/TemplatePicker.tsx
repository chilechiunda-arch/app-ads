import React from "react";
import { AdNetworkTemplate } from "../types";
import { ListPlus, HelpCircle } from "lucide-react";

const AD_NETWORK_TEMPLATES: AdNetworkTemplate[] = [
  {
    name: "Google AdMob",
    domain: "google.com",
    relationship: "DIRECT",
    publisherIdPlaceholder: "pub-0000000000000000",
    certificationId: "f5c9fe415231d93e",
    description: "Required for AdMob & Google Ad Manager publishing verification."
  },
  {
    name: "AppLovin",
    domain: "applovin.com",
    relationship: "DIRECT",
    publisherIdPlaceholder: "YOUR_ACCOUNT_ID",
    certificationId: "c4a17364cf6e680a",
    description: "AppLovin MAX SDK programmatic mediation requirement."
  },
  {
    name: "ironSource",
    domain: "ironsrc.com",
    relationship: "DIRECT",
    publisherIdPlaceholder: "YOUR_ACCOUNT_ID",
    certificationId: "",
    description: "IronSource Direct programmatic ad bidding lines."
  },
  {
    name: "Unity Ads",
    domain: "unity3d.com",
    relationship: "DIRECT",
    publisherIdPlaceholder: "YOUR_ACCOUNT_ID",
    certificationId: "",
    description: "Unity Ads publisher network verification line."
  },
  {
    name: "Meta Audience Network",
    domain: "facebook.com",
    relationship: "RESELLER",
    publisherIdPlaceholder: "YOUR_PROPERTY_ID",
    certificationId: "f5c9fe415231d93e",
    description: "Meta Partner Reseller entry for Facebook SDK monetisation."
  },
  {
    name: "TikTok Pangle",
    domain: "pangle.io",
    relationship: "DIRECT",
    publisherIdPlaceholder: "YOUR_ACCOUNT_ID",
    certificationId: "",
    description: "ByteDance Pangle SDK monetization in global markets."
  },
  {
    name: "Mintegral",
    domain: "mintegral.com",
    relationship: "DIRECT",
    publisherIdPlaceholder: "YOUR_ACCOUNT_ID",
    certificationId: "",
    description: "Mintegral SDK mediation verification registry."
  }
];

interface TemplatePickerProps {
  onSelect: (template: AdNetworkTemplate) => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ onSelect }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ListPlus className="w-5 h-5 text-teal-600" />
        <h3 className="font-semibold text-slate-800 text-sm">Fast-Fill Ad Network Templates</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Click an ad network below to automatically load its standardized entry pattern with verified domain, relation, and authority hash settings.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {AD_NETWORK_TEMPLATES.map((tpl) => (
          <button
            key={tpl.name}
            type="button"
            onClick={() => onSelect(tpl)}
            className="group flex flex-col items-start p-3 rounded-lg border border-slate-100 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/20 text-left transition-all duration-200"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-medium text-xs text-slate-800 group-hover:text-teal-700 transition-colors">
                {tpl.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800 font-mono scale-90">
                {tpl.relationship}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate w-full mb-1">
              {tpl.domain}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight line-clamp-2 h-7 font-sans">
              {tpl.description}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-600">What is Certification ID?</strong> The last optional parameter is your ad network authority key (e.g. Google's SHA-256 cert tag <code className="bg-slate-200 px-1 rounded text-slate-700">f5c9fe415231d93e</code>). It acts as cryptographic verification for secure exchange routing.
        </p>
      </div>
    </div>
  );
};
