"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";



interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string;
}

export function WalletModal({ isOpen, onClose, portfolioId }: WalletModalProps) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [action, setAction] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT");
    const queryClient = useQueryClient();
    const api = useApi();
    const { currency, convertFromUsd, convertToUsd, formatFromUsd, formatLocal } = useCurrency();

    const { data: summary } = useQuery({
        queryKey: ['summary', portfolioId],
        queryFn: async () => {
            const res = await api.get(`/portfolio/${portfolioId}/summary`);
            return res.data;
        },
        enabled: isOpen,
    });

    const availableCash = summary?.cash_balance ?? 0;
    const availableCashLocal = convertFromUsd(availableCash);

    useEffect(() => {
        if (!isOpen) return;
        setAction("DEPOSIT");
        setAmount("");
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amountNum = parseFloat(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            toast.error("Invalid amount", { description: "Enter an amount greater than 0." });
            return;
        }

        if (action === "WITHDRAW" && amountNum - availableCashLocal > 1e-8) {
            toast.error("Insufficient cash", {
                description: `Available: ${formatLocal(availableCashLocal)}`
            });
            return;
        }

        setLoading(true);

        try {
            await api.post('/wallet/transaction', null, {
                params: {
                    portfolio_id: portfolioId,
                    type: action,
                    amount: convertToUsd(amountNum),
                }
            });

            queryClient.invalidateQueries({ queryKey: ['summary', portfolioId] });

            toast.success(`${action === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Successful`, {
                description: `${formatLocal(amountNum)} has been ${action === 'DEPOSIT' ? 'deposited' : 'withdrawn'}.`
            });

            setAmount("");
            onClose();
        } catch (error: any) {
            console.error("Wallet transaction failed", error);
            const detail = error?.response?.data?.detail;
            toast.error("Transaction Failed", {
                description: detail || "Please check your inputs and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    const enteredAmount = parseFloat(amount || "0");
    const isWithdrawInsufficient = action === "WITHDRAW" && enteredAmount - availableCashLocal > 1e-8;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>Manage Cash</DialogTitle>
                </DialogHeader>

                <Tabs value={action} onValueChange={(value) => setAction(value as "DEPOSIT" | "WITHDRAW")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="DEPOSIT">Deposit</TabsTrigger>
                        <TabsTrigger value="WITHDRAW">Withdraw</TabsTrigger>
                    </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                        Available: {formatFromUsd(availableCash)}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="wallet-amount">Amount ({currency})</Label>
                        <Input
                            id="wallet-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="1000.00"
                            step="any"
                            required
                        />
                    </div>

                    {isWithdrawInsufficient && (
                        <p className="text-xs text-destructive">Insufficient cash for this withdrawal.</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            variant={action === "WITHDRAW" ? "destructive" : "default"}
                            disabled={loading || isWithdrawInsufficient}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Processing..." : `Confirm ${action === "DEPOSIT" ? "Deposit" : "Withdrawal"}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
