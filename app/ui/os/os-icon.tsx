const paths = {
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  calendar: "M4 6h16v15H4z M4 10h16 M8 3v5 M16 3v5",
  plus: "M12 5v14M5 12h14",
  wallet: "M3 6h18v14H3z M3 10h18 M16 15h2",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  inbox: "M5 4h14l3 9v6H2v-6zm-3 9h6l2 3h4l2-3h6",
  users: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  file: "M6 3h8l4 4v14H6z M9 11h6 M9 15h6",
  box: "M4 7 12 3l8 4v10l-8 4-8-4z M4 7l8 4 8-4 M12 11v10",
  image: "M3 4h18v16H3z M3 17l6-5 4 3 4-4 4 4 M9 8h.01",
  spark: "M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z",
  layers: "M12 3 3 8l9 5 9-5z M3 12l9 5 9-5 M3 16l9 5 9-5",
  chart: "M4 4v16h16 M8 15v-3 M12 15V8 M16 15v-6 M20 15V5",
  settings: "M5 5h14v14H5z M9 8v8 M15 8v8 M7 11h4 M13 14h4",
  close: "m6 6 12 12M18 6 6 18",
} as const;

export type OsIconName = keyof typeof paths;
export function OsIcon({ name }: { name: OsIconName }) {
  return <svg aria-hidden="true" focusable="false" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={name === "more" ? 3 : 1.7} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
