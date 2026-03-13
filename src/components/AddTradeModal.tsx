"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApi } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";



interface CoinResult {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    price_usd: number | null;
    change_24h: number | null;
}

interface AddTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    portfolioId: string;
    initialCoinId?: string;
    initialSymbol?: string;
    lockCoin?: boolean;
}

export function AddTradeModal({ isOpen, onClose, portfolioId, initialCoinId, initialSymbol, lockCoin = false }: AddTradeModalProps) {
    const [type, setType] = useState("BUY");
    const [symbol, setSymbol] = useState("");
    const [coinId, setCoinId] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [fee, setFee] = useState("");
    const [feeType, setFeeType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
    const [loading, setLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CoinResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const queryClient = useQueryClient();
    const api = useApi();
    const isCoinLocked = !!(lockCoin && initialCoinId && initialSymbol);
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

    const tradeValue = parseFloat(price || "0") * parseFloat(quantity || "0");
    const feeAmount = feeType === "PERCENTAGE"
        ? tradeValue * (parseFloat(fee || "0") / 100)
        : parseFloat(fee || "0");
    const feeUnits = feeType === "PERCENTAGE"
        ? parseFloat(quantity || "0") * (parseFloat(fee || "0") / 100)
        : 0;
    const totalCost = feeType === "PERCENTAGE" ? tradeValue : (tradeValue + feeAmount);

    // Debounced search
    const searchCoins = useCallback(async (query: string) => {
        if (query.length < 1) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        setIsSearching(true);
        try {
            const res = await api.get('/coins/search', { params: { q: query } });
            setSearchResults(res.data);
            setShowDropdown(res.data.length > 0);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        if (isCoinLocked) {
            setShowDropdown(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (coinId) {
            // Coin already selected, don't search
            setShowDropdown(false);
            return;
        }
        if (searchQuery.length >= 1) {
            debounceRef.current = setTimeout(() => searchCoins(searchQuery), 350);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery, searchCoins, coinId, isCoinLocked]);

    useEffect(() => {
        if (!isOpen || !initialCoinId || !initialSymbol) return;

        setCoinId(initialCoinId);
        setSymbol(initialSymbol.toUpperCase());
        setSearchQuery(initialSymbol.toUpperCase());
        setShowDropdown(false);
    }, [isOpen, initialCoinId, initialSymbol]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectCoin = (coin: CoinResult) => {
        setSymbol(coin.symbol);
        setCoinId(coin.id);
        setSearchQuery(coin.name);
        if (coin.price_usd) {
            setPrice(coin.price_usd.toString());
        }
        setShowDropdown(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const priceNum = parseFloat(price);
        const quantityNum = parseFloat(quantity);
        const feeNum = parseFloat(fee || "0");

        if (!Number.isFinite(priceNum) || !Number.isFinite(quantityNum) || priceNum <= 0 || quantityNum <= 0) {
            toast.error("Invalid trade", { description: "Price and quantity must be greater than 0." });
            return;
        }

        if (!Number.isFinite(feeNum) || feeNum < 0) {
            toast.error("Invalid fee", { description: "Fee cannot be negative." });
            return;
        }

        if (type === "BUY" && totalCost - availableCashLocal > 1e-8) {
            toast.error("Insufficient cash", {
                description: `Available: ${formatLocal(availableCashLocal)}, Required: ${formatLocal(totalCost)}`
            });
            return;
        }

        setLoading(true);

        try {
            const resolvedCoinId = coinId || symbol.toLowerCase().trim();

            await api.post('/trades', null, {
                params: {
                    portfolio_id: portfolioId,
                    coin_id: resolvedCoinId,
                    symbol: symbol.toUpperCase(),
                    type: type,
                    price: convertToUsd(priceNum),
                    quantity: quantityNum,
                    fee: feeType === "FIXED" ? convertToUsd(feeNum) : feeNum,
                    fee_type: feeType,
                }
            });

            queryClient.invalidateQueries({ queryKey: ['positions', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['summary', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['trades', portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['position-detail', portfolioId, resolvedCoinId] });
            queryClient.invalidateQueries({ queryKey: ['lots', portfolioId, resolvedCoinId] });

            toast.success(`${type} Order Executed`, {
                description: `${quantity} ${symbol} @ ${formatLocal(priceNum, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
            });

            // Reset all fields
            if (isCoinLocked && initialCoinId && initialSymbol) {
                setSymbol(initialSymbol.toUpperCase());
                setCoinId(initialCoinId);
                setSearchQuery(initialSymbol.toUpperCase());
            } else {
                setSymbol("");
                setCoinId("");
                setSearchQuery("");
            }
            setPrice("");
            setQuantity("");
            setFee("");
            setFeeType("FIXED");
            onClose();
        } catch (error: any) {
            console.error("Trade failed", error);
            const detail = error?.response?.data?.detail;
            toast.error("Trade Failed", {
                description: detail || "Please check your inputs and try again."
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number | null) => {
        if (price === null || price === undefined) return "—";
        if (price >= 1) return formatFromUsd(price);
        return formatFromUsd(price, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Trade</DialogTitle>
                </DialogHeader>

                <Tabs value={type} onValueChange={setType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="BUY">Buy</TabsTrigger>
                        <TabsTrigger value="SELL">Sell</TabsTrigger>
                    </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {isCoinLocked ? (
                        <div className="grid gap-2">
                            <Label htmlFor="coin-locked">Coin</Label>
                            <Input id="coin-locked" value={`${symbol} (${coinId})`} disabled />
                        </div>
                    ) : (
                        <div className="grid gap-2 relative" ref={dropdownRef}>
                            <Label htmlFor="coin-search">Coin</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    id="coin-search"
                                    placeholder="Search Bitcoin, ETH, Solana..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCoinId("");
                                        setSymbol("");
                                    }}
                                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                                    autoComplete="off"
                                    required={!coinId}
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {/* Selected coin badge */}
                            {coinId && (
                                <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm">
                                    <span className="font-medium">{symbol}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground text-xs">{coinId}</span>
                                </div>
                            )}

                            {/* Search Dropdown */}
                            {showDropdown && (
                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden max-h-[280px] overflow-y-auto">
                                    {searchResults.map((coin) => (
                                        <button
                                            key={coin.id}
                                            type="button"
                                            onClick={() => selectCoin(coin)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                                        >
                                            {coin.thumb && (
                                                <img src={coin.thumb} alt={coin.symbol} className="w-6 h-6 rounded-full" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-sm truncate">{coin.name}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{coin.symbol}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-medium">{formatPrice(coin.price_usd)}</div>
                                                {coin.change_24h !== null && coin.change_24h !== undefined && (
                                                    <div className={`text-xs ${coin.change_24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                        {coin.change_24h >= 0 ? "+" : ""}{coin.change_24h.toFixed(2)}%
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price ({currency})</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="50000"
                                step="any"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="0.1"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Trading Fee</Label>
                        <Tabs value={feeType} onValueChange={(v) => setFeeType(v as "FIXED" | "PERCENTAGE")} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-9">
                                <TabsTrigger value="FIXED" className="text-xs">{currency} Fixed</TabsTrigger>
                                <TabsTrigger value="PERCENTAGE" className="text-xs">% Percentage</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Input
                            id="fee"
                            type="number"
                            placeholder={feeType === "FIXED" ? "0.00" : "0.1"}
                            step="any"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                        />
                        {feeType === "PERCENTAGE" && fee && tradeValue > 0 && (
                            <p className="text-xs text-muted-foreground">
                                = {feeUnits.toLocaleString(undefined, { maximumFractionDigits: 6 })} {symbol || "units"} fee (~{formatLocal(feeAmount)}) deducted from received units
                            </p>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg text-sm">
                        <span className="text-muted-foreground">Available Cash</span>
                        <span className="font-semibold">
                            {formatFromUsd(availableCash)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg text-sm">
                        <span className="text-muted-foreground">Cash Required</span>
                        <span className="font-semibold">
                            {formatLocal(totalCost)}
                        </span>
                    </div>

                    {type === "BUY" && totalCost - availableCashLocal > 1e-8 && (
                        <p className="text-xs text-red-500">
                            Insufficient cash for this BUY order.
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading || (type === "BUY" && totalCost - availableCashLocal > 1e-8)} className={type === 'BUY' ? "w-full bg-green-600 hover:bg-green-700" : "w-full bg-red-600 hover:bg-red-700"}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {type === 'BUY' ? "Buy Asset" : "Sell Asset"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
