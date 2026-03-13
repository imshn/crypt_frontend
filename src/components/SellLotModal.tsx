"use client";
import { useState } from "react";
import { useApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";

interface SellLotModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string;
    coinId: string;
    symbol: string;
    lot: {
        id: number;
        remaining_qty: number;
        purchase_price: number;
    } | null;
}

export function SellLotModal({ isOpen, onClose, portfolioId, coinId, symbol, lot }: SellLotModalProps) {
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [fee, setFee] = useState("");
    const [feeType, setFeeType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
    const [loading, setLoading] = useState(false);

    const queryClient = useQueryClient();
    const api = useApi();
    const { currency, convertToUsd, formatFromUsd, formatLocal } = useCurrency();

    const tradeValue = parseFloat(price || "0") * parseFloat(quantity || "0");
    const feeAmount = feeType === "PERCENTAGE"
        ? tradeValue * (parseFloat(fee || "0") / 100)
        : parseFloat(fee || "0");
    const feeUnits = feeType === "PERCENTAGE"
        ? parseFloat(quantity || "0") * (parseFloat(fee || "0") / 100)
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lot) return;

        setLoading(true);
        try {
            await api.post('/trades', null, {
                params: {
                    portfolio_id: portfolioId,
                    coin_id: coinId,
                    symbol: symbol.toUpperCase(),
                    type: "SELL",
                    price: convertToUsd(parseFloat(price)),
                    quantity: parseFloat(quantity),
                    target_lot_id: lot.id,
                    fee: feeType === "FIXED" ? convertToUsd(parseFloat(fee || "0")) : parseFloat(fee || "0"),
                    fee_type: feeType,
                }
            });

            queryClient.invalidateQueries({ queryKey: ['positions', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['summary', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['lots', portfolioId, coinId] });

            toast.success(`Lot Sale Executed`, {
                description: `Sold ${quantity} from lot purchased at ${formatFromUsd(lot.purchase_price, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
            });

            setPrice("");
            setQuantity("");
            setFee("");
            setFeeType("FIXED");
            onClose();
        } catch (error: any) {
            console.error("Sale failed", error);
            const detail = error?.response?.data?.detail;
            toast.error("Sale Failed", {
                description: detail || "Please check your inputs and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sell from Lot (#{lot?.id})</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Lot Remaining</span>
                            <span className="font-medium">{lot?.remaining_qty} {symbol}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Price</span>
                            <span className="font-medium">{formatFromUsd(lot?.purchase_price || 0, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="sell-price">Sell Price ({currency})</Label>
                        <Input
                            id="sell-price"
                            type="number"
                            placeholder="Current market price..."
                            step="any"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="sell-qty">Quantity to Sell</Label>
                            <button
                                type="button"
                                onClick={() => setQuantity((lot?.remaining_qty || 0).toString())}
                                className="text-xs text-primary hover:underline"
                            >
                                Sell Full Lot
                            </button>
                        </div>
                        <Input
                            id="sell-qty"
                            type="number"
                            placeholder="Amount..."
                            step="any"
                            max={lot?.remaining_qty}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Trading Fee</Label>
                        <Tabs value={feeType} onValueChange={(v: any) => setFeeType(v as "FIXED" | "PERCENTAGE")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-9">
                                <TabsTrigger value="FIXED" className="text-xs">{currency} Fixed</TabsTrigger>
                                <TabsTrigger value="PERCENTAGE" className="text-xs">% Percentage</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Input
                            id="sell-fee"
                            type="number"
                            placeholder={feeType === "FIXED" ? "0.00" : "0.1"}
                            step="any"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                        />
                        {feeType === "PERCENTAGE" && fee && tradeValue > 0 && (
                            <p className="text-xs text-muted-foreground">
                                = {feeUnits.toLocaleString(undefined, { maximumFractionDigits: 6 })} {symbol} fee (~{formatLocal(feeAmount)})
                            </p>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg text-sm">
                        <span className="text-muted-foreground">Net Proceeds</span>
                        <span className="font-semibold text-green-500">
                            {formatLocal(tradeValue - feeAmount)}
                        </span>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Sale
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
