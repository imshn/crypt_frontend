"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { ArrowUpRight, Wallet } from "lucide-react";
import { AddTradeModal } from "@/components/AddTradeModal";
import { WalletModal } from "@/components/WalletModal";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



export default function PortfolioDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const api = useApi();
    const { currency, setCurrency, supportedCurrencies, formatFromUsd } = useCurrency();

    const isAxiosNotFound = (error: any) => error?.response?.status === 404;

    // Fetch Summary
    const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery({
        queryKey: ['summary', id],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${id}/summary`);
            return res.data;
        },
        refetchInterval: 20000
    });

    // Fetch Positions
    const { data: positions, isLoading: isPositionsLoading, error: positionsError } = useQuery({
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

    if (isSummaryLoading || isPositionsLoading) {
        return (
            <DashboardShell title={`Portfolio #${id}`} description="Loading portfolio data">
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>
            </DashboardShell>
        );
    }

    if (isAxiosNotFound(summaryError) || isAxiosNotFound(positionsError)) {
        return (
            <DashboardShell title={`Portfolio #${id}`} description="Portfolio unavailable">
                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio not found</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            This portfolio was likely removed during DB flush. Create a new one from the portfolios page.
                        </p>
                        <Button onClick={() => router.push('/portfolios')}>Go to Portfolios</Button>
                    </CardContent>
                </Card>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            title={`Portfolio #${id}`}
            description="Manage your assets and track performance"
            actions={
                <div className="flex items-center gap-2">
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {supportedCurrencies.map((code) => (
                                <SelectItem key={code} value={code}>{code}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setIsWalletModalOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Manage Cash
                    </Button>
                    <Button onClick={() => setIsTradeModalOpen(true)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Add Trade
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="sm:hidden">
                    <Button variant="outline" onClick={() => setIsWalletModalOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Manage Cash
                    </Button>
                </div>

                {/* Summary Metrics */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-5">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Available Cash</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(summary.cash_balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(summary.metrics.total_invested)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">P/L</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${summary.metrics.total_unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {formatFromUsd(summary.metrics.total_unrealized_pnl)}
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
                                <div className="text-2xl font-bold">{formatFromUsd(summary.metrics.total_value)}</div>
                            </CardContent>
                        </Card>
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
                                    <div className="overflow-x-auto">
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
                                                    const avgOpen = p.units > 0 ? (p.invested_value / p.units) : 0;

                                                    return (
                                                        <TableRow
                                                            key={i}
                                                            className="cursor-pointer hover:bg-muted/50"
                                                            onClick={() => router.push(`/portfolio/${id}/position/${p.id}`)}
                                                        >
                                                            <TableCell className="font-bold">
                                                                {p.symbol}
                                                            </TableCell>
                                                            <TableCell>{formatFromUsd(p.invested_value)}</TableCell>
                                                            <TableCell>{formatFromUsd(avgOpen, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</TableCell>
                                                            <TableCell className="text-muted-foreground font-mono text-xs">{formatFromUsd(p.fees || 0)}</TableCell>
                                                            <TableCell className="font-medium">{formatFromUsd(p.current_value)}</TableCell>
                                                            <TableCell className={p.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                                {p.unrealized_pnl >= 0 ? "+" : ""}{formatFromUsd(Math.abs(p.unrealized_pnl))}
                                                            </TableCell>
                                                            <TableCell className={pnlPct >= 0 ? "text-green-500" : "text-red-500"}>
                                                                <span className="font-medium">{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
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
                                    <div className="overflow-x-auto">
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
                                                {trades.map((t: any, i: number) => {
                                                    const isPercentageFee = String(t.fee_type || "").toUpperCase() === "PERCENTAGE";
                                                    const feeUnits = isPercentageFee ? (t.quantity || 0) * ((t.fee || 0) / 100) : 0;
                                                    const feeValue = isPercentageFee ? (t.price || 0) * feeUnits : (t.fee || 0);

                                                    return (
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
                                                        <TableCell>{formatFromUsd(t.price, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</TableCell>
                                                        <TableCell>{t.quantity}</TableCell>
                                                        <TableCell>
                                                            {isPercentageFee ? (
                                                                <div className="flex flex-col">
                                                                    <span>{feeUnits.toLocaleString(undefined, { maximumFractionDigits: 6 })} {t.symbol}</span>
                                                                    <span className="text-xs text-muted-foreground">~{formatFromUsd(feeValue)}</span>
                                                                </div>
                                                            ) : (
                                                                formatFromUsd(t.fee)
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {t.realized_pnl !== null && t.realized_pnl !== undefined ? (
                                                                <span className={t.realized_pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                                    {t.realized_pnl >= 0 ? "+" : ""}{formatFromUsd(Math.abs(t.realized_pnl))}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatFromUsd(t.price * t.quantity)}
                                                        </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">No trades yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

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

        </DashboardShell>
    );
}

