import { useState, useMemo } from "react";
import { useSocketData, StockRow } from "../context/SocketDataContext";

type ColumnKey = keyof StockRow;

interface ColumnDef {
  key: ColumnKey;
  label: string;
  numeric: boolean;
}

type SortDir = "asc" | "desc";

const COLUMNS: ColumnDef[] = [
  { key: "sl", label: "#", numeric: true },
  { key: "TRADING_CODE", label: "Symbol", numeric: false },
  { key: "LTP", label: "LTP", numeric: true },
  { key: "HIGH", label: "High", numeric: true },
  { key: "LOW", label: "Low", numeric: true },
  { key: "CLOSEP", label: "Close", numeric: true },
  { key: "YCP", label: "Prev Close", numeric: true },
  { key: "CHANGE", label: "Change", numeric: true },
  { key: "TRADE", label: "Trades", numeric: true },
  { key: "VALUE", label: "Value (M)", numeric: true },
  { key: "VOLUME", label: "Volume", numeric: false },
];

function parseNum(val: string | undefined): number | null {
  if (val === undefined || val === "--" || val === "") return null;
  return parseFloat(String(val).replace(/,/g, ""));
}

export default function DSETable() {
  const { stocks, isConnected, lastUpdated } = useSocketData();



  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<ColumnKey>("sl");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 25;

  const handleSort = (key: ColumnKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    console.log({stocks});
    
    const q = search.trim().toLowerCase();
    return stocks.filter(r =>
      !q || r.TRADING_CODE.toLowerCase().includes(q)
    );
  }, [stocks, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const col = COLUMNS.find(c => c.key === sortKey);
      if (col?.numeric) {
        const av = parseNum(a[sortKey]) ?? -Infinity;
        const bv = parseNum(b[sortKey]) ?? -Infinity;
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const av = String(a[sortKey]);
      const bv = String(b[sortKey]);
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const gainers = stocks.filter(r => (parseNum(r.CHANGE) ?? 0) > 0).length;
  const losers = stocks.filter(r => (parseNum(r.CHANGE) ?? 0) < 0).length;
  const unchanged = stocks.length - gainers - losers;

  return (
    <div className="min-h-screen bg-green-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-green-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-green-900 tracking-tight">DSE Market Data</h1>
              <p className="text-sm text-green-600 mt-0.5 flex items-center gap-2">
                Dhaka Stock Exchange — {stocks.length} securities
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${isConnected ? "text-green-600" : "text-red-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${isConnected ? "bg-green-500" : "bg-red-400"}`}></span>
                  {isConnected ? "Live" : "Disconnected"}
                </span>
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                {gainers} Up
              </span>
              <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                {losers} Down
              </span>
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block"></span>
                {unchanged} Flat
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-5">
        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search symbol…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 w-full rounded-lg border border-green-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            />
          </div>
          <span className="text-sm text-green-700">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          <span className="text-sm text-green-700">Last updated: {lastUpdated}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-100 border-b border-green-200">
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`px-3 py-3 text-left font-semibold text-green-800 cursor-pointer select-none whitespace-nowrap hover:bg-green-200 transition-colors ${col.numeric ? "text-right" : "text-left"}`}
                    >
                      <span className="flex items-center gap-1 justify-between">
                        <span className={col.numeric ? "ml-auto" : ""}>{col.label}</span>
                        <span className="text-green-500 w-3">
                          {sortKey === col.key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => {
                  const change = parseNum(row.CHANGE) ?? 0;
                  const isUp = change > 0;
                  const isDown = change < 0;
                  return (
                    <tr
                      key={row.sl}
                      className={`border-b border-green-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-green-50/40"} hover:bg-green-100/60`}
                    >
                      <td className="px-3 py-2.5 text-right text-gray-400 font-mono text-xs">{row.sl}</td>
                      <td className="px-3 py-2.5 font-semibold text-green-900 tracking-wide">{row.TRADING_CODE}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-800">{row.LTP}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{row.HIGH}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{row.LOW}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-700">{row.CLOSEP}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500">{row.YCP}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">
                        <span className={`${isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-gray-400"}`}>
                          {isUp ? "+" : ""}{row.CHANGE}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{row.TRADE}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{row.VALUE}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500 text-xs">{row.VOLUME}</td>
                    </tr>
                  );
                })}
                {pageData.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">No results found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-green-700">
              Page {page} of {totalPages} · rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-green-200 bg-white text-green-700 disabled:opacity-40 hover:bg-green-100 transition-colors"
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-green-200 bg-white text-green-700 disabled:opacity-40 hover:bg-green-100 transition-colors"
              >‹ Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return p <= totalPages ? (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${p === page ? "bg-green-600 text-white border-green-600 font-semibold" : "border-green-200 bg-white text-green-700 hover:bg-green-100"}`}
                  >{p}</button>
                ) : null;
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-green-200 bg-white text-green-700 disabled:opacity-40 hover:bg-green-100 transition-colors"
              >Next ›</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-green-200 bg-white text-green-700 disabled:opacity-40 hover:bg-green-100 transition-colors"
              >»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
