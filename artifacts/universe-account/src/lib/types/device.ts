export interface Device {
  id: string;
  userId: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  os: string;
  browser: string;
  trusted: boolean;
  lastSeen: string;
  registeredAt: string;
}
