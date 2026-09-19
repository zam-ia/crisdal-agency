"use client";

import { trackMarketingEvent } from "./site-events";

export function TrackedFaq({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  return (
    <details
      className="faq-item"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          trackMarketingEvent("faq_open", { question, index });
        }
      }}
    >
      <summary>
        <span>{question}</span>
        <span aria-hidden="true">+</span>
      </summary>
      <p>{answer}</p>
    </details>
  );
}
