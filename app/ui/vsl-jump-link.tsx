"use client";

import { trackMarketingEvent } from "./site-events";
import { Icon } from "./symbol";

export function VslJumpLink() {
  return (
    <a
      className="button button-outline"
      href="#vsl"
      onClick={() => trackMarketingEvent("click_vsl_hero", { placement: "hero" })}
    >
      <Icon name="video" /> Ver la mini VSL
    </a>
  );
}
