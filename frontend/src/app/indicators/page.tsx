"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  { label: string; color: string; description: string }
> = {
  bbp: {
    label: "Bollinger Band %",
    color: "#565e74",
    description:
      "Measures where the price sits relative to Bollinger Bands. Above 1.0 = overbought, below 0.0 = oversold.",
  },
  sma: {
    label: "Price / SMA",
    color: "#605c78",
    description:
      "Ratio of current price to its Simple Moving Average. Above 1.0 = price above trend, below 1.0 = price below trend.",
  },
  momentum: {
    label: "Momentum",
    color: "#006b62",
    description:
      "Rate of price change over the lookback period. Positive = uptrend, negative = downtrend.",
  },
  macd: {
    label: "MACD",
    color: "#9f403d",
    description:
      "Moving Average Convergence Divergence — measures the relationship between two EMAs. Crossovers signal trend changes.",
  },
  stochastic: {
    label: "Stochastic %K",
    color: "#4a5268",
    description:
      "Compares closing price to its price range over the lookback period. Above 80 = overbought, below 20 = oversold.",
  },
};

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

  // Fetch available symbols on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/indicators/symbols`)
      .then((r) => r.json())
      .then((d) => setSymbols(d.symbols))
      .catch(() => {});
  }, []);

  // Fetch indicator data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ symbol, start: "2008-01-01", end: "2009-12-31" });
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

  // Fetch on mount and symbol change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const toggleIndicator = (key: IndicatorKey) => {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build chart data
  const chartData = data
    ? data.dates.map((date, i) => {
        const point: Record<string, string | number | null> = {
          date: date.slice(5), // MM-DD format
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
        <div className="col-span-12 lg:col-span-9 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
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
                <LineChart data={chartData}>
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
                  {activeIndicators.size > 0 && (
                    <YAxis
                      yAxisId="indicator"
                      orientation="right"
                      hide
                      domain={["auto", "auto"]}
                    />
                  )}
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
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Symbol Selector */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">search</span>
              Symbol
            </h3>
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
          </div>

          {/* Indicator Toggles */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-on-surface-variant mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                settings_input_component
              </span>
              Indicators
            </h3>
            <div className="space-y-4">
              {(Object.entries(INDICATOR_META) as [IndicatorKey, typeof INDICATOR_META.bbp][]).map(
                ([key, meta]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={activeIndicators.has(key)}
                      onChange={() => toggleIndicator(key)}
                      className="w-4 h-4 rounded border-none bg-surface-container-highest text-primary focus:ring-0"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="text-sm font-medium text-on-surface">
                        {meta.label}
                      </span>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Active Indicator Info */}
          {activeIndicators.size > 0 && (
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  info
                </span>
                <h4 className="text-sm font-bold text-on-surface">
                  Indicator Guide
                </h4>
              </div>
              <div className="space-y-3">
                {[...activeIndicators].map((key) => (
                  <div key={key}>
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      <strong className="text-on-surface">
                        {INDICATOR_META[key].label}:
                      </strong>{" "}
                      {INDICATOR_META[key].description}
                    </p>
                  </div>
                ))}
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
                        {chartData.slice(-60).map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              (entry.macd as number) >= 0
                                ? "rgba(0,107,98,0.6)"
                                : "rgba(159,64,61,0.6)"
                            }
                          />
                        ))}
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
