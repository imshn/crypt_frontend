"use client";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import Link from "next/link";
import { Plus, Loader2, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";



export default function PortfoliosPage() {
    const queryClient = useQueryClient();
    const api = useApi();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");

    const { data: portfolios = [], isLoading } = useQuery({
        queryKey: ['portfolios'],
        queryFn: async () => {
            const res = await api.get('/portfolios');
            return res.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await api.post('/portfolios', null, {
                params: { name }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portfolios'] });
            toast.success("Portfolio Created");
            setNewName("");
            setIsCreateOpen(false);
        },
        onError: () => {
            toast.error("Failed to create portfolio");
        }
    });

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            <Sidebar />
            <main className="ml-64 flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Portfolios</h1>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Portfolio
                    </Button>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : portfolios.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-gray-700 rounded-xl">
                        <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">No portfolios yet. Create your first one!</p>
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Portfolio
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((p: any) => (
                            <Link href={`/portfolio/${p.id}`} key={p.id} className="block group">
                                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 group-hover:border-blue-500 transition-colors h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-semibold">{p.name}</h3>
                                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                                                #{p.id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Created</span>
                                        <span className="text-gray-300 text-sm">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Create Portfolio Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Create New Portfolio</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate(newName.trim()); }} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="portfolio-name">Portfolio Name</Label>
                                <Input
                                    id="portfolio-name"
                                    placeholder="e.g. Main Portfolio"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Portfolio
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
