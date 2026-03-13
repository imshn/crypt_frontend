"use client";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import Link from "next/link";
import { Plus, Loader2, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";



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
        <>
            <DashboardShell
                title="Portfolios"
                description="Create and manage all your crypto portfolios"
                actions={
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Portfolio
                    </Button>
                }
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : portfolios.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-14 text-center">
                            <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="mb-4 text-sm text-muted-foreground">No portfolios yet. Create your first one.</p>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Portfolio
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {portfolios.map((p: any) => (
                            <Link href={`/portfolio/${p.id}`} key={p.id} className="block">
                                <Card className="h-full border-border/70 transition-colors hover:border-primary/40">
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-lg">{p.name}</CardTitle>
                                            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                #{p.id}
                                            </span>
                                        </div>
                                        <CardDescription>Portfolio details and holdings</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Created</span>
                                            <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </DashboardShell>

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
        </>
    );
}
