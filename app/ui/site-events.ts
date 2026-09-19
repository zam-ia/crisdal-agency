"use client";

type PixelFunction = ((...args: unknown[]) => void) & { queue?: unknown[][] };

declare global {
  interface Window {
    fbq?: PixelFunction;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackMarketingEvent(
  event: string,
  parameters: Record<string, unknown> = {},
) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...parameters });
  window.fbq?.("trackCustom", event, parameters);
}
