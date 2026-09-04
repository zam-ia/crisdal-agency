import type { ReactNode } from "react";
const paths: Record<string, ReactNode> = {
  arrow: <path d="M5 19 19 5M5 5h14v14" />,
  check: <path d="m5 12 4 4L19 6" />,
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3Z" />
    </>
  ),
  layers: (
    <>
      <rect x="7" y="3" width="14" height="15" rx="2" />
      <path d="M17 21H5a2 2 0 0 1-2-2V7M11 7h6M11 11h6M11 15h3" />
    </>
  ),
  chart: <path d="M4 3v17h17M8 15v-4M13 15V8M18 15V5" />,
  headphones: (
    <>
      <path d="M4 14v-3a8 8 0 0 1 16 0v7a3 3 0 0 1-3 3h-3" />
      <rect x="3" y="11" width="4" height="7" rx="2" />
      <rect x="17" y="11" width="4" height="7" rx="2" />
    </>
  ),
  target: (
    <>
      <circle cx="11" cy="13" r="8" />
      <circle cx="11" cy="13" r="4" />
      <path d="m11 13 9-9M16 4h4v4" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  bolt: <path d="m13 2-9 12h7l-1 8L21 9h-8Z" />,
  whatsapp: (
    <>
      <path d="M20.4 3.6A11.5 11.5 0 0 0 2.3 17.5L1 23l5.7-1.5A11.5 11.5 0 0 0 20.4 3.6Z" />
      <path d="M8 6.5c-.6 0-1.6 1.2-1.6 2.4 0 2.9 4.9 7.8 8.2 7.8 1.2 0 2.5-1 2.5-1.7l-2.7-1.5-1.2 1.1c-1.9-.8-3.4-2.3-4.1-4l1-1.1Z" />
    </>
  ),
};
export function Icon({ name }: { name: string }) {
  return (
    <svg
      className="icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
