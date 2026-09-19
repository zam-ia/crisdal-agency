"use client";

import { useEffect } from "react";
import { trackMarketingEvent } from "./site-events";

export function SiteTracking() {
  useEffect(() => {
    let scrollSent = false;
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (!scrollSent && height > 0 && window.scrollY / height >= 0.5) {
        scrollSent = true;
        trackMarketingEvent("scroll_50");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const plans = document.getElementById("planes");
    let observer: IntersectionObserver | undefined;
    if (plans) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            trackMarketingEvent("view_plans");
            observer?.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(plans);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  return null;
}
