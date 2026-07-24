/**
 * AdSense publisher + display slot IDs (manual units only — no Auto ads).
 * EEA/UK/CH consent: publish a Google CMP message in AdSense → Privacy & messaging;
 * the adsbygoogle.js tag in app/layout.tsx then shows it automatically.
 */
export const ADSENSE_CLIENT = "ca-pub-4805854422784600";

export const AD_SLOTS = {
  banner1: "3246539036",
  banner2: "4328400421",
  banner3: "5761021731",
} as const;
