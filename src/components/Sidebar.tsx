import Link from "next/link";
import { LayoutDashboard, Wallet, Settings, LogOut } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Sidebar() {
    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    CryptoTracker
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </Link>
                <Link href="/portfolios" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                    <Wallet size={20} />
                    <span>Portfolios</span>
                </Link>
                <div className="pt-4 mt-4 border-t border-gray-800">
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white">
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-4 py-3">
                    <UserButton />
                    <span className="text-sm text-gray-400">Account</span>
                </div>
            </div>
        </div>
    );
}
