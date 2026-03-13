"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/DashboardShell";
import { SellLotModal } from "@/components/SellLotModal";
import { AddTradeModal } from "@/components/AddTradeModal";
import { EditLotModal } from "@/components/EditLotModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useCurrency } from "@/lib/currency";

export default function PositionDetails({ params }: { params: Promise<{ id: string, coin_id: string }> }) {
    const { id: portfolioId, coin_id: coinId } = use(params);
    const api = useApi();

    const [selectedLot, setSelectedLot] = useState<any>(null);
    const [editingLot, setEditingLot] = useState<any>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isEditLotModalOpen, setIsEditLotModalOpen] = useState(false);
    const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
    const { currency, setCurrency, supportedCurrencies, formatFromUsd } = useCurrency();

    const { data: position, isLoading: isPositionLoading } = useQuery({
        queryKey: ["position-detail", portfolioId, coinId],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${portfolioId}/positions/${coinId}`);
            return res.data;
        },
    });

    const { data: lots, isLoading: isLotsLoading } = useQuery({
        queryKey: ["lots", portfolioId, coinId],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${portfolioId}/positions/${coinId}/lots`);
            return res.data;
        },
    });

    if (isPositionLoading || isLotsLoading) {
        return (
            <DashboardShell title="Position Details" description="Loading position details">
                <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                    Loading position details...
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            title={`${position?.symbol || "Asset"} Details`}
            description={`Detailed breakdown of your ${position?.symbol || coinId.toUpperCase()} holdings`}
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

                    <Button onClick={() => setIsAddTradeModalOpen(true)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Add Trade
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Link href={`/portfolio/${portfolioId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Portfolio
                    </Link>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">{coinId}</span>
                </div>

                {position && (
                    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Invested</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(position.invested_value)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Current Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(position.current_value)}</div>
                                <div className={`mt-1 flex items-center gap-1 text-sm ${position.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {position.unrealized_pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {formatFromUsd(Math.abs(position.unrealized_pnl))} ({position.pnl_percent.toFixed(2)}%)
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Fees</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(position.fees)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Purchase Price</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatFromUsd(position.avg_price, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Open Trades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{lots?.length || 0}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Open Trades (Lots)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLotsLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading lots...</div>
                        ) : lots && lots.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Token</TableHead>
                                            <TableHead>Lot ID</TableHead>
                                            <TableHead>Units Left</TableHead>
                                            <TableHead>At Price</TableHead>
                                            <TableHead>Invested</TableHead>
                                            <TableHead>Fees</TableHead>
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
                                            const isPercentageFee = String(lot.fee_type || "").toUpperCase() === "PERCENTAGE";
                                            const totalFeeValue = (lot.fee_value ?? (isPercentageFee
                                                ? ((lot.original_qty || 0) * ((lot.fee || 0) / 100) * atPrice)
                                                : (lot.fee || 0)));
                                            const feesInDollar = lot.original_qty > 0
                                                ? (openQty / lot.original_qty) * totalFeeValue
                                                : 0;
                                            const pnl = netValue - remainingInvested;
                                            const pnlPct = remainingInvested > 0 ? (pnl / remainingInvested) * 100 : 0;
                                            const isPartiallyClosed = openQty < (lot.original_qty - 1e-8);
                                            const lotId = `${position?.symbol}-${(idx + 1).toString().padStart(2, "0")}`;

                                            return (
                                                <TableRow key={lot.id}>
                                                    <TableCell className="font-bold">{position?.symbol}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{lotId}</TableCell>
                                                    <TableCell>{openQty.toLocaleString(undefined, { maximumFractionDigits: 3 })}</TableCell>
                                                    <TableCell>{formatFromUsd(atPrice, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</TableCell>
                                                    <TableCell>{formatFromUsd(remainingInvested)}</TableCell>
                                                    <TableCell className="text-muted-foreground">{formatFromUsd(feesInDollar)}</TableCell>
                                                    <TableCell className="font-medium">{formatFromUsd(netValue)}</TableCell>
                                                    <TableCell className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                                                        {pnl >= 0 ? "+" : ""}{formatFromUsd(Math.abs(pnl))}
                                                    </TableCell>
                                                    <TableCell className={pnlPct >= 0 ? "text-green-500" : "text-red-500"}>
                                                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={isPartiallyClosed}
                                                                onClick={() => {
                                                                    setEditingLot(lot);
                                                                    setIsEditLotModalOpen(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedLot(lot);
                                                                    setIsSellModalOpen(true);
                                                                }}
                                                            >
                                                                Close
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No open trades found for this asset.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

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

            {editingLot && (
                <EditLotModal
                    isOpen={isEditLotModalOpen}
                    onClose={() => {
                        setIsEditLotModalOpen(false);
                        setEditingLot(null);
                    }}
                    portfolioId={portfolioId}
                    coinId={coinId}
                    lot={editingLot}
                />
            )}

            <AddTradeModal
                isOpen={isAddTradeModalOpen}
                onClose={() => setIsAddTradeModalOpen(false)}
                portfolioId={portfolioId}
                initialCoinId={coinId}
                initialSymbol={position?.symbol}
                lockCoin
            />
        </DashboardShell>
    );
}
