import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Crypto Portfolio Tracker",
    description: "Track your crypto investments with precision.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
                    <Providers>
                        {children}
                        <Toaster />
                    </Providers>
                </body>
            </html>
        </ClerkProvider>
    );
}
