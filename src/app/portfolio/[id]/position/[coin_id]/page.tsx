"use client";
import { useState, use } from "react";
import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { CandlestickChart } from "@/components/CandlestickChart";
import { SellLotModal } from "@/components/SellLotModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";

export default function PositionDetails({ params }: { params: Promise<{ id: string, coin_id: string }> }) {
    const { id: portfolioId, coin_id: coinId } = use(params);
    const api = useApi();

    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);

    // Fetch Position Detail (including summary for this coin)
    const { data: position, isLoading: isPositionLoading } = useQuery({
        queryKey: ['position-detail', portfolioId, coinId],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${portfolioId}/positions/${coinId}`);
            return res.data;
        }
    });

    // Fetch Lots (Open trades)
    const { data: lots, isLoading: isLotsLoading } = useQuery({
        queryKey: ['lots', portfolioId, coinId],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${portfolioId}/positions/${coinId}/lots`);
            return res.data;
        }
    });

    if (isPositionLoading || isLotsLoading) {
        return <div className="p-8 text-center">Loading position details...</div>;
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <main className="ml-64 flex-1 p-8 space-y-8">

                {/* Breadcrumb / Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/portfolio/${portfolioId}`} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ChevronLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            {position?.symbol || "—"} Details
                            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">{coinId}</span>
                        </h1>
                        <p className="text-muted-foreground">Detailed breakdown of your {position?.symbol} holdings.</p>
                    </div>
                </div>

                {/* Summary Metrics */}
                {position && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{position.units.toLocaleString()} {position.symbol}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${position.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                <div className={`text-sm flex items-center gap-1 mt-1 ${position.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {position.unrealized_pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    ${Math.abs(position.unrealized_pnl).toLocaleString()} ({position.pnl_percent.toFixed(2)}%)
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Purchase Price</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${position.avg_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Chart Section */}
                <CandlestickChart coinId={coinId} symbol={position?.symbol || "—"} />

                {/* Open Lots (Trades) Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Open Trades (Lots)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLotsLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading lots...</div>
                        ) : lots && lots.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Token</TableHead>
                                        <TableHead>Lot ID</TableHead>
                                        <TableHead>Units Left</TableHead>
                                        <TableHead>At Price</TableHead>
                                        <TableHead>Remaining Invested</TableHead>
                                        <TableHead>Fees in $</TableHead>
                                        <TableHead>Net Value</TableHead>
                                        <TableHead>Profit and Loss</TableHead>
                                        <TableHead>Profit and Loss %</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lots.map((lot: any, idx: number) => {
                                        const openQty = lot.remaining_qty;
                                        const currentPrice = position?.current_price || 0;
                                        const atPrice = lot.purchase_price;
                                        const remainingInvested = openQty * atPrice;
                                        const netValue = openQty * currentPrice;
                                        const feesInDollar = (openQty / lot.original_qty) * (lot.fee || 0);
                                        const pnl = netValue - remainingInvested;
                                        const pnlPct = remainingInvested > 0 ? (pnl / remainingInvested) * 100 : 0;

                                        const lotId = `${position?.symbol}-${(idx + 1).toString().padStart(2, '0')}`;

                                        return (
                                            <TableRow key={lot.id}>
                                                <TableCell className="font-bold">{position?.symbol}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs font-mono">{lotId}</TableCell>
                                                <TableCell>{openQty.toLocaleString(undefined, { maximumFractionDigits: 5 })}</TableCell>
                                                <TableCell>${atPrice.toLocaleString(undefined, { minimumFractionDigits: 5 })}</TableCell>
                                                <TableCell>${remainingInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="text-muted-foreground">${feesInDollar.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="font-medium">${netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                    {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className={pnlPct >= 0 ? "text-green-500" : "text-red-500"}>
                                                    {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLot(lot);
                                                            setIsSellModalOpen(true);
                                                        }}
                                                    >
                                                        Sell
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No open trades found for this asset.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Sell Modal */}
                {selectedLot && (
                    <SellLotModal
                        isOpen={isSellModalOpen}
                        onClose={() => {
                            setIsSellModalOpen(false);
                            setSelectedLot(null);
                        }}
                        portfolioId={portfolioId}
                        coinId={coinId}
                        symbol={position?.symbol || ""}
                        lot={selectedLot}
                    />
                )}
            </main>
        </div>
    );
}
