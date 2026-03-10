"use client";
import { useState } from "react";
import { useApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";



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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/wallet/transaction', null, {
                params: {
                    portfolio_id: portfolioId,
                    type: action,
                    amount: parseFloat(amount),
                }
            });

            queryClient.invalidateQueries({ queryKey: ['summary', portfolioId] });

            toast.success(`${action === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Successful`, {
                description: `$${parseFloat(amount).toLocaleString()} has been ${action === 'DEPOSIT' ? 'deposited' : 'withdrawn'}.`
            });

            setAmount("");
            onClose();
        } catch (error: any) {
            console.error("Wallet transaction failed", error);
            toast.error("Transaction Failed", {
                description: "Please check your inputs and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Cash</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setAction("DEPOSIT")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${action === 'DEPOSIT' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        Deposit
                    </button>
                    <button
                        onClick={() => setAction("WITHDRAW")}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${action === 'WITHDRAW' ? 'bg-red-600/20 border-red-500 text-red-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                    >
                        Withdraw
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Amount ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="1000.00"
                            step="any"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-gray-200 font-bold py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? "Processing..." : `Confirm ${action === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
