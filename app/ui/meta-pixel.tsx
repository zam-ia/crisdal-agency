"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { OFFER_EVENT_DATA, PIXEL_ID } from "../lib/config";

// The public pixel ID is intentionally not a secret. CAPI credentials stay server-side.
export function MetaPixel() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current !== pathname) {
      window.fbq?.("track", "PageView");
      if (pathname === "/") window.fbq?.("track", "ViewContent", OFFER_EVENT_DATA);
      previousPath.current = pathname;
    }
  }, [pathname]);
  return (
    <Script id="meta-pixel" strategy="beforeInteractive">{`
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
    t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','${PIXEL_ID}');
    fbq('track','PageView');
    if(window.location.pathname === '/') {
      fbq('track','ViewContent',${JSON.stringify(OFFER_EVENT_DATA)});
    }
  `}</Script>
  );
}
