// "use client";
// import { useEffect, useRef, useState, useCallback } from "react";
// import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
// import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
// import { useApi } from "@/lib/api";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// interface CandlestickChartProps {
//     coinId: string;
//     symbol: string;
// }

// const TIME_RANGES = [
//     { label: "1D", days: 1 },
//     { label: "7D", days: 7 },
//     { label: "14D", days: 14 },
//     { label: "1M", days: 30 },
//     { label: "3M", days: 90 },
//     { label: "1Y", days: 365 },
// ];

// export function CandlestickChart({ coinId, symbol }: CandlestickChartProps) {
//     const chartContainerRef = useRef<HTMLDivElement>(null);
//     const chartRef = useRef<IChartApi | null>(null);
//     const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
//     const api = useApi();
//     const [days, setDays] = useState(7);
//     const [lastPrice, setLastPrice] = useState<number | null>(null);
//     const [priceChange, setPriceChange] = useState<number | null>(null);

//     const fetchAndSetData = useCallback(async (series: ISeriesApi<"Candlestick">, chart: IChartApi) => {
//         try {
//             const res = await api.get(`/coins/${coinId}/ohlc`, { params: { days } });
//             const data = res.data as CandlestickData<Time>[];
//             console.log(`Fetched ${data?.length || 0} items for ${coinId}`);
//             if (data && data.length > 0) {
//                 series.setData(data);
//                 chart.timeScale().fitContent();

//                 const latest = data[data.length - 1];
//                 const first = data[0];
//                 setLastPrice(latest.close as number);
//                 const openPrice = first.open as number;
//                 const closePrice = latest.close as number;
//                 setPriceChange(((closePrice - openPrice) / openPrice) * 100);
//             }
//         } catch (err) {
//             console.error("Failed to fetch OHLC data:", err);
//         }
//     }, [api, coinId, days]);

//     // Single effect: create chart + fetch data + set up polling
//     useEffect(() => {
//         const container = chartContainerRef.current;
//         if (!container) return;

//         // Create chart
//         const chart = createChart(container, {
//             layout: {
//                 background: { type: ColorType.Solid, color: "transparent" },
//                 textColor: "#9ca3af",
//                 fontSize: 12,
//             },
//             grid: {
//                 vertLines: { color: "rgba(255, 255, 255, 0.04)" },
//                 horzLines: { color: "rgba(255, 255, 255, 0.04)" },
//             },
//             crosshair: {
//                 vertLine: { color: "rgba(255, 255, 255, 0.1)", labelBackgroundColor: "#374151" },
//                 horzLine: { color: "rgba(255, 255, 255, 0.1)", labelBackgroundColor: "#374151" },
//             },
//             rightPriceScale: {
//                 borderColor: "rgba(255, 255, 255, 0.08)",
//             },
//             timeScale: {
//                 borderColor: "rgba(255, 255, 255, 0.08)",
//                 timeVisible: days <= 1,
//                 secondsVisible: false,
//             },
//             width: container.clientWidth,
//             height: 350,
//         });

//         // Use the new API for version 5.x
//         const series = chart.addSeries(CandlestickSeries, {
//             upColor: "#22c55e",
//             downColor: "#ef4444",
//             borderUpColor: "#22c55e",
//             borderDownColor: "#ef4444",
//             wickUpColor: "#22c55e",
//             wickDownColor: "#ef4444",
//         });

//         chartRef.current = chart;
//         seriesRef.current = series;

//         // Initial data fetch
//         fetchAndSetData(series, chart);

//         // Auto-refresh every 20s
//         const interval = setInterval(() => {
//             fetchAndSetData(series, chart);
//         }, 20000);

//         // Resize observer
//         const resizeObserver = new ResizeObserver((entries) => {
//             for (const entry of entries) {
//                 chart.applyOptions({ width: entry.contentRect.width });
//             }
//         });
//         resizeObserver.observe(container);

//         return () => {
//             clearInterval(interval);
//             resizeObserver.disconnect();
//             chart.remove();
//             chartRef.current = null;
//             seriesRef.current = null;
//         };
//     }, [coinId, days, fetchAndSetData]);

//     const formatPrice = (p: number) => {
//         if (p >= 1) return `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
//         return `$${p.toPrecision(4)}`;
//     };

//     return (
//         <Card>
//             <CardHeader className="pb-3">
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         <CardTitle className="text-lg">{symbol} Chart</CardTitle>
//                         {lastPrice !== null && (
//                             <span className="text-xl font-bold">{formatPrice(lastPrice)}</span>
//                         )}
//                         {priceChange !== null && (
//                             <span className={`text-sm font-medium px-2 py-0.5 rounded ${priceChange >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
//                                 {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
//                             </span>
//                         )}
//                     </div>
//                     <div className="flex gap-1">
//                         {TIME_RANGES.map((range) => (
//                             <button
//                                 key={range.days}
//                                 onClick={() => setDays(range.days)}
//                                 className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${days === range.days
//                                     ? "bg-primary text-primary-foreground"
//                                     : "text-muted-foreground hover:bg-accent hover:text-foreground"
//                                     }`}
//                             >
//                                 {range.label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//             </CardHeader>
//             <CardContent className="p-0 px-4 pb-4">
//                 <div
//                     ref={chartContainerRef}
//                     className="w-full"
//                     style={{ minHeight: '350px' }}
//                 />
//             </CardContent>
//         </Card>
//     );
// }
