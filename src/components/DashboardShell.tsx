"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Menu, WalletCards } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardShellProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
}

const navItems = [
    {
        href: "/",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        href: "/portfolios",
        label: "Portfolios",
        icon: WalletCards,
    },
];

function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return onNavigate ? (
                    <SheetClose asChild key={item.href}>
                        <Link
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    </SheetClose>
                ) : (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function DashboardShell({ title, description, actions, children }: DashboardShellProps) {
    return (
        <div className="min-h-screen bg-muted/30">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
                <div className="border-b px-6 py-4">
                    <Link href="/" className="text-base font-semibold tracking-tight">
                        Crypto Tracker
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">Portfolio command center</p>
                </div>

                <div className="flex-1 px-3 py-4">
                    <DashboardNav />
                </div>

                <div className="border-t px-4 py-4">
                    <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                        <div>
                            <p className="text-xs font-medium">Signed in</p>
                            <p className="text-[11px] text-muted-foreground">Manage account</p>
                        </div>
                        <UserButton />
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen flex-col md:pl-64">
                <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
                    <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon" className="md:hidden">
                                        <Menu className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[280px] bg-sidebar p-0 text-sidebar-foreground">
                                    <SheetHeader className="border-b px-6 py-4 text-left">
                                        <SheetTitle>Crypto Tracker</SheetTitle>
                                        <SheetDescription>Portfolio command center</SheetDescription>
                                    </SheetHeader>
                                    <div className="px-3 py-4">
                                        <DashboardNav />
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <div>
                                <h1 className="text-base font-semibold sm:text-lg">{title}</h1>
                                {description ? (
                                    <p className="text-xs text-muted-foreground sm:text-sm">{description}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {actions}
                            <ThemeToggle />
                            <div className="md:hidden">
                                <UserButton />
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
