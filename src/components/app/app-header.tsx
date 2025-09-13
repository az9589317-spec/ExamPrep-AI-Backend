
'use client';

import Link from "next/link";
import { BrainCircuit, Bell, User, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "./auth-provider";
import { isAdminUser } from "@/lib/auth-config";
import { UserNav } from "./user-nav";
import { NotificationBell } from "./notification-bell";

export function AppHeader() {
    const { user, isLoading } = useAuth();
    const isUserAdmin = !isLoading && user && isAdminUser(user.email);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <span className="font-bold">ExamPrep AI</span>
                    </Link>
                </div>
                <nav className="flex flex-1 items-center space-x-4">
                    {/* Add nav links here if needed */}
                </nav>
                <div className="flex items-center justify-end space-x-4">
                    <NotificationBell />
                    {isLoading ? (
                        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    ) : user ? (
                        <UserNav user={user} isAdmin={isUserAdmin} />
                    ) : (
                        <Button asChild>
                            <Link href="/admin/login">
                                <LogIn className="mr-2 h-4 w-4" />
                                Login
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
