export interface Session {
  id: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}
