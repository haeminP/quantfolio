"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  LineChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

const API_BASE = "http://localhost:8000";

type IndicatorKey = "bbp" | "momentum" | "sma" | "macd" | "stochastic";

const INDICATOR_META: Record<
  IndicatorKey,
  { label: string; color: string; description: string; signal: string }
> = {
  bbp: {
    label: "Bollinger Band %",
    color: "#565e74",
    description:
      "Measures where the price sits relative to upper and lower Bollinger Bands (SMA +/- 2 standard deviations, 20-day window). Quantifies overbought/oversold conditions at precise price levels.",
    signal: "BUY when BBP < 0 (oversold, price below lower band) | SELL when BBP > 1 (overbought, price above upper band)",
  },
  sma: {
    label: "Price / SMA",
    color: "#605c78",
    description:
      "Ratio of current price to its 20-day Simple Moving Average. SMA filters out noise to reveal the underlying trend. A large diversion from SMA suggests a mean-reversion opportunity.",
    signal: "BUY when ratio < 0.95 (price significantly below trend) | SELL when ratio > 1.05 (price significantly above trend)",
  },
  momentum: {
    label: "Momentum",
    color: "#006b62",
    description:
      "Rate of price change relative to N days ago (10-day lookback). Shows when the rate of change is accelerating — the strategy is 'buy high, sell higher' or 'sell low, buy lower'.",
    signal: "BUY when momentum crosses above 0 (uptrend starts) | SELL when momentum crosses below 0 (downtrend starts)",
  },
  macd: {
    label: "MACD",
    color: "#9f403d",
    description:
      "Difference between 12-day and 26-day EMA. The MACD histogram (MACD line minus 9-day signal line) reveals trend direction and momentum strength. Effective for identifying trend reversals.",
    signal: "BUY when MACD crosses above 0 (bullish crossover) | SELL when MACD crosses below 0 (bearish crossover)",
  },
  stochastic: {
    label: "Stochastic %K",
    color: "#4a5268",
    description:
      "Shows where the closing price stands relative to the high-low range over 14 days. Based on the assumption that prices close near highs in uptrends and near lows in downtrends.",
    signal: "BUY when %K < 20 (oversold) | SELL when %K > 80 (overbought)",
  },
};

// Signal detection functions based on P6 report trading rules
function computeSignals(
  chartData: Record<string, string | number | null>[],
  activeIndicators: Set<IndicatorKey>
): { buyIndices: Set<number>; sellIndices: Set<number> } {
  const buyIndices = new Set<number>();
  const sellIndices = new Set<number>();

  for (let i = 1; i < chartData.length; i++) {
    for (const key of activeIndicators) {
      const curr = chartData[i][key] as number | null;
      const prev = chartData[i - 1][key] as number | null;
      if (curr === null || prev === null) continue;

      switch (key) {
        case "bbp":
          if (curr < 0) buyIndices.add(i);
          if (curr > 1) sellIndices.add(i);
          break;
        case "sma":
          if (curr < 0.95) buyIndices.add(i);
          if (curr > 1.05) sellIndices.add(i);
          break;
        case "momentum":
          if (prev < 0 && curr >= 0) buyIndices.add(i);
          if (prev > 0 && curr <= 0) sellIndices.add(i);
          break;
        case "macd":
          if (prev < 0 && curr >= 0) buyIndices.add(i);
          if (prev > 0 && curr <= 0) sellIndices.add(i);
          break;
        case "stochastic":
          if (curr < 20) buyIndices.add(i);
          if (curr > 80) sellIndices.add(i);
          break;
      }
    }
  }
  return { buyIndices, sellIndices };
}

type ApiResponse = {
  dates: string[];
  prices: number[];
  [key: string]: number[] | string[] | null[];
};

export default function IndicatorExplorer() {
  const [symbol, setSymbol] = useState("JPM");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(
    new Set(["bbp", "momentum"])
  );
  const [showSignals, setShowSignals] = useState(true);
  const [focusedIndicator, setFocusedIndicator] = useState<IndicatorKey | null>("bbp");
  const [startDate, setStartDate] = useState("2008-01-01");
  const [endDate, setEndDate] = useState("2009-12-31");
  const [dataSource, setDataSource] = useState<"csv" | "yahoo">("csv");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const CSV_PRESETS: { label: string; start: string; end: string }[] = [
    { label: "2008", start: "2008-01-01", end: "2008-12-31" },
    { label: "2009", start: "2009-01-01", end: "2009-12-31" },
    { label: "08–09", start: "2008-01-01", end: "2009-12-31" },
    { label: "2010", start: "2010-01-01", end: "2010-12-31" },
    { label: "2011", start: "2011-01-01", end: "2011-12-31" },
    { label: "All", start: "2000-01-01", end: "2012-12-31" },
  ];

  const YAHOO_PRESETS: { label: string; start: string; end: string }[] = [
    { label: "1M", start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
    { label: "3M", start: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
    { label: "6M", start: new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
    { label: "1Y", start: new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
    { label: "5Y", start: new Date(Date.now() - 5 * 365 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
  ];

  const DATE_PRESETS = dataSource === "csv" ? CSV_PRESETS : YAHOO_PRESETS;

  // Fetch available CSV symbols on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/indicators/symbols`)
      .then((r) => r.json())
      .then((d) => setSymbols(d.symbols))
      .catch(() => {});
  }, []);

  // Search Yahoo Finance symbols (debounced)
  useEffect(() => {
    if (dataSource !== "yahoo" || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/indicators/search?q=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.results || []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, dataSource]);

  // Reset defaults when switching data source
  const switchSource = (src: "csv" | "yahoo") => {
    setDataSource(src);
    if (src === "csv") {
      setSymbol("JPM");
      setStartDate("2008-01-01");
      setEndDate("2009-12-31");
    } else {
      setSymbol("AAPL");
      setStartDate(new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  // Fetch indicator data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        symbol,
        start: startDate,
        end: endDate,
        source: dataSource,
      });
      const allIndicators: IndicatorKey[] = ["bbp", "momentum", "sma", "macd", "stochastic"];
      allIndicators.forEach((i) => params.append("indicators", i));
      const res = await fetch(`${API_BASE}/api/indicators/calculate?${params}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      console.error("Failed to fetch indicators");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when symbol, date range, or source changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, startDate, endDate, dataSource]);

  const toggleIndicator = (key: IndicatorKey) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build chart data
  const rawChartData = data
    ? data.dates.map((date, i) => {
        const point: Record<string, string | number | null> = {
          date: startDate.slice(0, 4) !== endDate.slice(0, 4) ? date.slice(2, 10) : date.slice(5), // YY-MM-DD if multi-year, else MM-DD
          fullDate: date,
          price: data.prices[i],
        };
        for (const key of Object.keys(INDICATOR_META) as IndicatorKey[]) {
          const arr = data[key] as (number | null)[] | undefined;
          point[key] = arr ? arr[i] : null;
        }
        return point;
      })
    : [];

  // Compute signals and add to chart data
  const { buyIndices, sellIndices } = computeSignals(rawChartData, activeIndicators);
  const chartData = rawChartData.map((point, i) => ({
    ...point,
    buySignal: showSignals && buyIndices.has(i) ? point.price : null,
    sellSignal: showSignals && sellIndices.has(i) ? point.price : null,
  }));

  const latestPrice = data ? data.prices[data.prices.length - 1] : null;
  const prevPrice = data && data.prices.length > 1 ? data.prices[data.prices.length - 2] : null;
  const priceChange =
    latestPrice && prevPrice
      ? (((latestPrice - prevPrice) / prevPrice) * 100).toFixed(2)
      : null;

  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono">
              Ticker: {symbol}
            </div>
            {priceChange && (
              <div
                className={`font-mono text-sm font-semibold ${
                  Number(priceChange) >= 0 ? "text-secondary" : "text-error"
                }`}
              >
                {Number(priceChange) >= 0 ? "+" : ""}
                {priceChange}%
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface">
            Indicator Explorer
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Technical analysis of {symbol} market dynamics.
          </p>
        </div>
        {latestPrice && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-on-surface-variant">
              Last Close
            </p>
            <p className="text-3xl font-mono font-medium text-primary">
              ${latestPrice.toFixed(2)}
            </p>
          </div>
        )}
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Price Chart */}
        <div className="col-span-12 lg:col-span-9 self-start bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                Price Action + Indicators
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm font-medium">{symbol} Adjusted Close</p>
                {activeIndicators.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-on-surface-variant/40">|</span>
                    {[...activeIndicators].map((key) => (
                      <div key={key} className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: INDICATOR_META[key].color }}
                        />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                          {INDICATOR_META[key].label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-[400px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant/40 text-sm">
                Loading {symbol} data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#a9b4b9"
                    strokeOpacity={0.15}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }}
                    stroke="#566166"
                    interval={Math.floor(chartData.length / 8)}
                  />
                  <YAxis
                    yAxisId="price"
                    tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    stroke="#566166"
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    yAxisId="indicator"
                    orientation="right"
                    hide
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(12px)",
                      border: "none",
                      borderRadius: "0.75rem",
                      boxShadow: "0px 4px 20px rgba(42,52,57,0.08)",
                      fontFamily: "JetBrains Mono",
                      fontSize: 11,
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload?.fullDate) return payload[0].payload.fullDate;
                      return "";
                    }}
                    formatter={(value, name) => {
                      if (typeof value !== "number") return value;
                      if (name === "Price") return `$${value.toFixed(2)}`;
                      if (name === "BUY Signal" || name === "SELL Signal") return `$${value.toFixed(2)}`;
                      return value.toFixed(4);
                    }}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="price"
                    stroke="#2a3439"
                    strokeWidth={2}
                    dot={false}
                    name="Price"
                  />
                  {[...activeIndicators].map((key) => (
                    <Line
                      key={key}
                      yAxisId="indicator"
                      type="monotone"
                      dataKey={key}
                      stroke={INDICATOR_META[key].color}
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                      dot={false}
                      name={INDICATOR_META[key].label}
                      connectNulls
                    />
                  ))}
                  {showSignals && (
                    <>
                      <Scatter
                        yAxisId="price"
                        dataKey="buySignal"
                        name="BUY Signal"
                        fill="#006b62"
                        shape="triangle"
                        legendType="none"
                      />
                      <Scatter
                        yAxisId="price"
                        dataKey="sellSignal"
                        name="SELL Signal"
                        fill="#9f403d"
                        shape="diamond"
                        legendType="none"
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Data Source Toggle */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">database</span>
              Data Source
            </h3>
            <div className="flex rounded-lg bg-surface-container-highest p-1 mb-4">
              {(["csv", "yahoo"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => switchSource(src)}
                  className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                    dataSource === src
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {src === "csv" ? "Course Data" : "Yahoo Finance"}
                </button>
              ))}
            </div>

            {/* Symbol selection */}
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">search</span>
              Symbol
            </h3>
            {dataSource === "csv" ? (
              <div className="relative">
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm font-mono font-medium appearance-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  {symbols.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                  expand_more
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker (e.g. AAPL)"
                  className="w-full bg-surface-container-highest border-none rounded-xl py-3 px-4 text-sm font-mono font-medium focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                />
                {searching && (
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 animate-spin text-sm">
                    progress_activity
                  </span>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 overflow-hidden">
                    {searchResults.map((r) => (
                      <button
                        key={r.symbol}
                        onClick={() => {
                          setSymbol(r.symbol);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-mono font-bold text-on-surface">
                          {r.symbol}
                        </span>
                        <span className="text-[10px] text-on-surface-variant truncate ml-2 max-w-[120px]">
                          {r.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {symbol && dataSource === "yahoo" && (
                  <p className="text-[10px] font-mono text-on-surface-variant mt-2">
                    Selected: <strong className="text-primary">{symbol}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">date_range</span>
              Period
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {DATE_PRESETS.map((p) => {
                const isActive = startDate === p.start && endDate === p.end;
                return (
                  <button
                    key={p.label}
                    onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                        : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-2 px-2.5 text-[11px] font-mono focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface-container-highest border-none rounded-lg py-2 px-2.5 text-[11px] font-mono focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Indicator Toggles */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                settings_input_component
              </span>
              Indicators
            </h3>
            <div className="space-y-1">
              {(Object.entries(INDICATOR_META) as [IndicatorKey, typeof INDICATOR_META.bbp][]).map(
                ([key, meta]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 transition-all cursor-pointer ${
                      focusedIndicator === key
                        ? "bg-primary-container/40"
                        : "hover:bg-surface-container-highest/60"
                    }`}
                    onClick={() => setFocusedIndicator(focusedIndicator === key ? null : key)}
                  >
                    <input
                      type="checkbox"
                      checked={activeIndicators.has(key)}
                      onChange={(e) => { e.stopPropagation(); toggleIndicator(key); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-none bg-surface-container-highest text-primary focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className={`text-sm font-medium transition-colors ${
                        focusedIndicator === key ? "text-primary" : "text-on-surface"
                      }`}>
                        {meta.label}
                      </span>
                    </div>
                    {focusedIndicator === key && (
                      <span className="material-symbols-outlined text-primary text-sm">
                        chevron_right
                      </span>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Signal Toggle */}
            <div className="mt-6 pt-6 border-t border-outline-variant/20">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">
                    candlestick_chart
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Show Signals
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showSignals}
                    onChange={(e) => setShowSignals(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${showSignals ? "bg-secondary" : "bg-surface-container-highest"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${showSignals ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                  </div>
                </div>
              </label>
              {showSignals && (
                <div className="mt-3 flex items-center gap-4 text-[10px] text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-secondary" />
                    <span>BUY</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-error rotate-45" />
                    <span>SELL</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Focused Indicator Info */}
          {focusedIndicator && (
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: INDICATOR_META[focusedIndicator].color }}
                />
                <h4 className="text-sm font-bold text-on-surface">
                  {INDICATOR_META[focusedIndicator].label}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant mb-3">
                {INDICATOR_META[focusedIndicator].description}
              </p>
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Signal Rule
                </p>
                <p className="text-[10px] leading-relaxed text-on-surface-variant font-mono bg-surface-container-low rounded-lg px-3 py-2">
                  {INDICATOR_META[focusedIndicator].signal}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sub-Charts for each active indicator */}
        {[...activeIndicators].map((key) => {
          const meta = INDICATOR_META[key];
          const latestVal = data
            ? (() => {
                const arr = data[key] as (number | null)[] | undefined;
                if (!arr) return null;
                for (let i = arr.length - 1; i >= 0; i--) {
                  if (arr[i] !== null) return arr[i];
                }
                return null;
              })()
            : null;

          // MACD uses bar chart
          if (key === "macd") {
            return (
              <div
                key={key}
                className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                    {meta.label}
                  </h4>
                  {latestVal !== null && (
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        latestVal >= 0 ? "text-secondary" : "text-error"
                      }`}
                    >
                      {latestVal >= 0 ? "+" : ""}
                      {latestVal.toFixed(4)}
                    </span>
                  )}
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-60)}>
                      <XAxis dataKey="date" tick={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }}
                        stroke="#a9b4b9"
                        width={45}
                      />
                      <ReferenceLine y={0} stroke="#a9b4b9" strokeOpacity={0.5} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "none",
                          borderRadius: "0.75rem",
                          fontFamily: "JetBrains Mono",
                          fontSize: 10,
                        }}
                        formatter={(value) =>
                          typeof value === "number" ? value.toFixed(4) : value
                        }
                      />
                      <Bar dataKey="macd" name="MACD">
                        {chartData.slice(-60).map((entry, i) => {
                          const val = (entry as Record<string, unknown>).macd as number ?? 0;
                          return (
                            <Cell
                              key={i}
                              fill={
                                val >= 0
                                  ? "rgba(0,107,98,0.6)"
                                  : "rgba(159,64,61,0.6)"
                              }
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          }

          // Line chart for other indicators
          return (
            <div
              key={key}
              className="col-span-12 md:col-span-6 lg:col-span-4 bg-surface-container-low rounded-xl p-6 border border-outline-variant/10"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  {meta.label}
                </h4>
                {latestVal !== null && (
                  <span className="text-[10px] font-mono font-semibold text-primary">
                    {latestVal.toFixed(4)}
                  </span>
                )}
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 9, fontFamily: "JetBrains Mono" }}
                      stroke="#a9b4b9"
                      domain={["auto", "auto"]}
                      width={45}
                    />
                    {(key === "bbp" || key === "stochastic") && (
                      <>
                        <ReferenceLine
                          y={key === "bbp" ? 1 : 80}
                          stroke="#a9b4b9"
                          strokeDasharray="4 4"
                          strokeOpacity={0.5}
                        />
                        <ReferenceLine
                          y={key === "bbp" ? 0 : 20}
                          stroke="#a9b4b9"
                          strokeDasharray="4 4"
                          strokeOpacity={0.5}
                        />
                      </>
                    )}
                    {key === "sma" && (
                      <ReferenceLine
                        y={1}
                        stroke="#a9b4b9"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                      />
                    )}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "none",
                        borderRadius: "0.75rem",
                        fontFamily: "JetBrains Mono",
                        fontSize: 10,
                      }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(4) : value
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey={key}
                      stroke={meta.color}
                      strokeWidth={2}
                      dot={false}
                      name={meta.label}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
