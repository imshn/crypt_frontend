"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";

interface EditableLot {
    id: number;
    trade_id: number;
    symbol: string;
    purchase_price: number;
    original_qty: number;
    remaining_qty: number;
    fee: number;
}

interface EditLotModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string;
    coinId: string;
    lot: EditableLot | null;
}

export function EditLotModal({ isOpen, onClose, portfolioId, coinId, lot }: EditLotModalProps) {
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [fee, setFee] = useState("");
    const [loading, setLoading] = useState(false);

    const queryClient = useQueryClient();
    const api = useApi();
    const { currency, convertFromUsd, convertToUsd } = useCurrency();

    useEffect(() => {
        if (!lot || !isOpen) return;
        setPrice(String(convertFromUsd(lot.purchase_price ?? 0)));
        setQuantity(String(lot.original_qty ?? ""));
        setFee(String(convertFromUsd(lot.fee ?? 0)));
    }, [lot, isOpen, convertFromUsd]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lot) return;

        setLoading(true);
        try {
            await api.patch(`/trades/${lot.trade_id}`, null, {
                params: {
                    portfolio_id: portfolioId,
                    price: convertToUsd(parseFloat(price)),
                    quantity: parseFloat(quantity),
                    fee: convertToUsd(parseFloat(fee || "0")),
                }
            });

            queryClient.invalidateQueries({ queryKey: ["positions", portfolioId] });
            queryClient.invalidateQueries({ queryKey: ["summary", portfolioId] });
            queryClient.invalidateQueries({ queryKey: ["trades", portfolioId] });
            queryClient.invalidateQueries({ queryKey: ["lots", portfolioId, coinId] });
            queryClient.invalidateQueries({ queryKey: ["position-detail", portfolioId, coinId] });

            toast.success("Trade lot updated", {
                description: `Updated ${lot.symbol} lot #${lot.id}`
            });
            onClose();
        } catch (error: any) {
            const detail = error?.response?.data?.detail;
            toast.error("Unable to update lot", {
                description: detail || "Please verify the new values and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trade Lot (#{lot?.id})</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Token</span>
                            <span className="font-medium">{lot?.symbol || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Units Left</span>
                            <span className="font-medium">{lot?.remaining_qty ?? 0}</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-price">Buy Price ({currency})</Label>
                        <Input
                            id="edit-price"
                            type="number"
                            step="any"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-quantity">Original Quantity</Label>
                        <Input
                            id="edit-quantity"
                            type="number"
                            step="any"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit-fee">Fee ({currency})</Label>
                        <Input
                            id="edit-fee"
                            type="number"
                            step="any"
                            min="0"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
