"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="shrink-0" disabled>
                <Sun className="h-4 w-4" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
