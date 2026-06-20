import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import { socket } from "../socket";
import { formatDate } from "../utils/helpers";

export interface StockRow {
  sl: string;
  TRADING_CODE: string;
  LTP: string;
  HIGH: string;
  LOW: string;
  CLOSEP: string;
  YCP: string;
  CHANGE: string;
  TRADE: string;
  VALUE: string;
  VOLUME: string;
}

interface SocketDataContextValue {
  stocks: StockRow[];
  isConnected: boolean;
  lastUpdated: string;
}

const SocketDataContext = createContext<SocketDataContextValue | undefined>(undefined);

interface SocketDataProviderProps {
  children: ReactNode;
  /** Optional initial data to show before the first server_update arrives (e.g. SSR seed / fixture). */
  initialStocks?: StockRow[];
}

export function SocketDataProvider({ children, initialStocks = [] }: SocketDataProviderProps) {
  const [stocks, setStocks] = useState<StockRow[]>(initialStocks);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onServerUpdate(data: any) {
      if (data?.data?.table) {
        setStocks(data.data.table);
        const latestDate = data?.data?.lastUpdateTime ?? "";
        const now: Date = new Date(latestDate);
        if(now)
        setLastUpdated(formatDate(now, "DD/MM/YYYY HH:mm"));
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("server_update", onServerUpdate);

    // In case the socket connected before this provider mounted.
    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("server_update", onServerUpdate);
    };
  }, []);

  const value = useMemo(
    () => ({ stocks, isConnected, lastUpdated }),
    [stocks, isConnected, lastUpdated]
  );

  return (
    <SocketDataContext.Provider value={value}>
      {children}
    </SocketDataContext.Provider>
  );
}

export function useSocketData(): SocketDataContextValue {
  const ctx = useContext(SocketDataContext);
  if (!ctx) {
    throw new Error("useSocketData must be used within a SocketDataProvider");
  }
  return ctx;
}
