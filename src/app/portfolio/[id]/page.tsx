"use client";
import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ArrowUpRight, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { AddTradeModal } from "@/components/AddTradeModal";
import { WalletModal } from "@/components/WalletModal";
import { CandlestickChart } from "@/components/CandlestickChart";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";



export default function PortfolioDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    console.log("Portfolio ID:", id);

    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [selectedChartCoin, setSelectedChartCoin] = useState<string>("");
    const api = useApi();

    // Fetch Summary
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['summary', id],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${id}/summary`);
            return res.data;
        },
        refetchInterval: 20000
    });

    // Fetch Positions
    const { data: positions, isLoading: isPositionsLoading } = useQuery({
        queryKey: ['positions', id],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${id}/positions`);
            return res.data;
        },
        refetchInterval: 20000
    });

    // Fetch Trades
    const { data: trades, isLoading: isTradesLoading } = useQuery({
        queryKey: ['trades', id],
        queryFn: async () => {
            const res = await api.get(`/trades?portfolio_id=${id}`);
            return res.data;
        },
        refetchInterval: 20000
    });

    if (isSummaryLoading || isPositionsLoading) return <div className="flex min-h-screen bg-background text-foreground items-center justify-center">Loading...</div>;

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="ml-64 flex-1 p-8 space-y-8">

                {/* Header Area */}
                <div className="flex justify-between items-end pb-6 border-b">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight">Portfolio #{id}</h1>
                        </div>
                        <p className="text-muted-foreground">Manage your assets and track performance.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsWalletModalOpen(true)}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Manage Cash
                        </Button>
                        <Button onClick={() => setIsTradeModalOpen(true)}>
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Add Trade
                        </Button>
                    </div>
                </div>

                {/* Summary Metrics */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-5">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avilible cash</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${summary.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${summary.metrics.total_invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">P/L</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${summary.metrics.total_unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    ${summary.metrics.total_unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">P/L %</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const totalInvested = summary.metrics.total_invested;
                                    const totalPnL = summary.metrics.total_unrealized_pnl;
                                    const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
                                    return (
                                        <div className={`text-2xl font-bold ${pnlPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                                            {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${summary.metrics.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Candlestick Chart */}
                {positions && positions.length > 0 && (
                    <div className="space-y-3">
                        {positions.length > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Chart:</span>
                                <div className="flex gap-1.5">
                                    {positions.map((p: any) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedChartCoin(p.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${(selectedChartCoin || positions[0].id) === p.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground hover:bg-accent"
                                                }`}
                                        >
                                            {p.symbol}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <CandlestickChart
                            coinId={selectedChartCoin || positions[0].id}
                            symbol={(positions.find((p: any) => p.id === (selectedChartCoin || positions[0].id)) || positions[0]).symbol}
                        />
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="holdings" className="w-full">
                    <TabsList>
                        <TabsTrigger value="holdings">Holdings</TabsTrigger>
                        <TabsTrigger value="trades">Trade History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="holdings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Holdings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {positions && positions.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Asset</TableHead>
                                                <TableHead>Invested</TableHead>
                                                <TableHead>Avg Open</TableHead>
                                                <TableHead>Fees</TableHead>
                                                <TableHead>Net Value</TableHead>
                                                <TableHead>P/L</TableHead>
                                                <TableHead>P/L %</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {positions.map((p: any, i: number) => {
                                                const pnlPct = p.invested_value > 0 ? (p.unrealized_pnl / p.invested_value) * 100 : 0;

                                                return (
                                                    <TableRow
                                                        key={i}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => router.push(`/portfolio/${id}/position/${p.id}`)}
                                                    >
                                                        <TableCell className="font-bold">
                                                            {p.symbol}
                                                        </TableCell>
                                                        <TableCell>${p.invested_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell>${(p.invested_value / p.units).toLocaleString(undefined, { minimumFractionDigits: 5 })}</TableCell>
                                                        <TableCell className="text-muted-foreground font-mono text-xs">${p.fees?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell className="font-medium">${p.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                        <TableCell className={p.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                            {p.unrealized_pnl >= 0 ? "+" : ""}${p.unrealized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </TableCell>
                                                        <TableCell className={pnlPct >= 0 ? "text-green-500" : "text-red-500"}>
                                                            <span className="font-medium">{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No holdings yet. Add a trade to get started!</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trades">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trade History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trades && trades.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Asset</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Fee</TableHead>
                                                <TableHead>Realized P/L</TableHead>
                                                <TableHead className="text-right">Total Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trades.map((t: any, i: number) => (
                                                <TableRow
                                                    key={i}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => router.push(`/portfolio/${id}/position/${t.coin_id || t.symbol.toLowerCase()}`)}
                                                >
                                                    <TableCell>{new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString()}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                                            {t.type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-primary">
                                                        <div className="flex flex-col">
                                                            <span>{t.symbol}</span>
                                                            {t.target_lot_id && (
                                                                <span className="text-[10px] text-muted-foreground bg-muted w-fit px-1 rounded uppercase">Targeted</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>${t.price.toLocaleString()}</TableCell>
                                                    <TableCell>{t.quantity}</TableCell>
                                                    <TableCell>${t.fee.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {t.realized_pnl !== null && t.realized_pnl !== undefined ? (
                                                            <span className={t.realized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                                {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        ${(t.price * t.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No trades yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Modals */}
                <AddTradeModal
                    isOpen={isTradeModalOpen}
                    onClose={() => setIsTradeModalOpen(false)}
                    portfolioId={id}
                />

                <WalletModal
                    isOpen={isWalletModalOpen}
                    onClose={() => setIsWalletModalOpen(false)}
                    portfolioId={id}
                />

            </main>
        </div>
    );
}

