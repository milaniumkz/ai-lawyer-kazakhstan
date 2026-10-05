import type { ReactNode } from "react";

export type DesignIconName = "home" | "briefcase" | "folder" | "document" | "calendar" | "user" | "bell" | "scales" | "microphone" | "phone" | "mail" | "face" | "camera" | "upload" | "settings" | "keyboard";

const paths: Record<DesignIconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12l9 3 9-3" /><rect x="10" y="12" width="4" height="5" rx="1" /></>,
  folder: <path d="M3 6h6l2 3h10v12H3Z" />,
  document: <><path d="M6 2h8l5 5v15H6Z M14 2v6h5M9 12h5M9 16h7M9 19h7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="17" rx="2" /><path d="M7 2v6M17 2v6M3 10h18M7 14h2M15 14h2M7 18h2M15 18h2" /></>,
  user: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="8" r="3" /><path d="M5 19c0-8 14-8 14 0" /></>,
  bell: <><path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5ZM9 20c0 3 6 3 6 0" /><circle cx="19" cy="4" r="2.5" fill="currentColor" /></>,
  scales: <><path d="M12 3v17M8 22h8M4 7q8-5 16 0M5 7 2 15h6L5 7ZM19 7l-3 8h6l-3-8Z" /><path d="M2 15q3 5 6 0M16 15q3 5 6 0" /><circle cx="12" cy="4" r="1" fill="currentColor" /></>,
  microphone: <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M6 10v3a6 6 0 0 0 12 0v-3M12 19v3M8 22h8" /></>,
  phone: <path d="m6 3 4 5-3 3q2 4 6 6l3-3 5 4q-1 6-6 3Q3 17 3 7q0-4 3-4Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  face: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 9v3M16 9v3M12 9v6h-2M8 17q4 3 8 0" /></>,
  camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3Z" /><circle cx="12" cy="14" r="4" /></>,
  settings: <><path d="m9 3 1-2h4l1 2 3 2 2 0 2 4-1 2v3l1 2-2 4-2 0-3 2-1 2h-4l-1-2-3-2H4l-2-4 1-2v-3L2 9l2-4h2Z" /><circle cx="12" cy="12" r="3" /></>,
  keyboard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M6 16h12" /></>,
  upload: <><path d="M12 17V3m-5 5 5-5 5 5M3 15v6h18v-6" /></>,
};

export function DesignIcon({ name, className = "" }: { name: DesignIconName; className?: string }) {
  return <svg className={`designIcon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

