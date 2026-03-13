"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

export const SUPPORTED_CURRENCIES = ["USD", "INR", "KWD", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const DEFAULT_CURRENCY: SupportedCurrency = "USD";
const STORAGE_KEY = "crpt:selected-currency";
const FALLBACK_RATES: Record<SupportedCurrency, number> = {
    USD: 1,
    INR: 83,
    KWD: 0.307,
    EUR: 0.92,
};

interface FxRatesResponse {
    base: string;
    rates: Partial<Record<SupportedCurrency, number>>;
    source?: string;
    timestamp?: number;
}

function isSupportedCurrency(value: string): value is SupportedCurrency {
    return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

function formatWithCurrency(
    currency: SupportedCurrency,
    amount: number,
    minimumFractionDigits: number,
    maximumFractionDigits: number
): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(amount);
}

export function useCurrency() {
    const api = useApi();
    const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isSupportedCurrency(saved)) {
            setCurrencyState(saved);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, currency);
    }, [currency]);

    const { data: fxData } = useQuery({
        queryKey: ["fx-rates"],
        queryFn: async () => {
            const res = await api.get<FxRatesResponse>("/fx/rates");
            return res.data;
        },
        staleTime: 25_000,
        refetchInterval: 30_000,
    });

    const rates = useMemo<Record<SupportedCurrency, number>>(() => {
        const merged = { ...FALLBACK_RATES };
        const remoteRates = fxData?.rates || {};

        for (const code of SUPPORTED_CURRENCIES) {
            const nextRate = Number(remoteRates[code]);
            if (Number.isFinite(nextRate) && nextRate > 0) {
                merged[code] = nextRate;
            }
        }

        return merged;
    }, [fxData?.rates]);

    const rate = rates[currency] || 1;

    const setCurrency = useCallback((next: string) => {
        if (!isSupportedCurrency(next)) return;
        setCurrencyState(next);
    }, []);

    const convertFromUsd = useCallback(
        (usdAmount: number) => {
            const value = Number(usdAmount);
            if (!Number.isFinite(value)) return 0;
            return value * rate;
        },
        [rate]
    );

    const convertToUsd = useCallback(
        (localAmount: number) => {
            const value = Number(localAmount);
            if (!Number.isFinite(value)) return 0;
            if (rate <= 0) return value;
            return value / rate;
        },
        [rate]
    );

    const formatFromUsd = useCallback(
        (
            usdAmount: number,
            options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
        ) => {
            const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
            const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
            return formatWithCurrency(
                currency,
                convertFromUsd(usdAmount),
                minimumFractionDigits,
                maximumFractionDigits
            );
        },
        [currency, convertFromUsd]
    );

    const formatLocal = useCallback(
        (
            localAmount: number,
            options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
        ) => {
            const minimumFractionDigits = options?.minimumFractionDigits ?? 2;
            const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
            return formatWithCurrency(currency, localAmount, minimumFractionDigits, maximumFractionDigits);
        },
        [currency]
    );

    return {
        currency,
        setCurrency,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        rates,
        rate,
        convertFromUsd,
        convertToUsd,
        formatFromUsd,
        formatLocal,
    };
}
