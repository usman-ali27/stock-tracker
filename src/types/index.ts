export interface StockData {
  symbol?: string;
  currentPrice?: number | null;
  previousClose?: number | null;
  price?: number | null | undefined;
  percentChange?: number | null;
  changePercent?: number | null;
  lastUpdate?: number; // UNIX ms
  volume?: number;
}


export interface AlertSettings {
  id: string; // Make id required
  userId: string;
  symbol: string;
  threshold: number;
  isAbove: boolean;
  isActive: boolean;
  createdAt?:any;
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