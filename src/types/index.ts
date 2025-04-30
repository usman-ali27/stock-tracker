export interface StockData {
  symbol?: string;
  currentPrice?: number | null;
  previousClose?: number | null;
  price?: number | null | undefined;
  percentChange?: number | null;
  changePercent?: number | null;
  change?: number | null; // Add change property
  lastUpdate?: number; // UNIX ms
  volume?: number;
}

export interface AlertSettings {
  id?: string;
  userId: string;
  symbol: string;
  threshold: number;
  isAbove: boolean;
  isActive: boolean;
  createdAt?: Date;
}

export interface UserStats {
  apiCalls: number;
  lastUpdated: Date;
}

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}