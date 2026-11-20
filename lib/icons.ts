/** Nama ikon yang boleh dipilih AI untuk tiap scene. Dipetakan ke komponen di remotion/Icons.tsx. */
export const ICONS = [
  "smartphone", "key", "lock", "shield", "alert", "wifi", "bank", "card", "wallet", "user", "users", "chat", "mail",
  "phone", "package", "bug", "server", "cloud", "cpu", "bot", "globe", "search", "eye", "zap", "plug", "gauge",
  "qrcode", "camera", "fingerprint", "face", "code", "database", "chart", "clock", "home", "school", "heart", "star", "question", "check", "cart", "tag", "settings", "battery", "bell",
] as const;
export type IconName = (typeof ICONS)[number];
