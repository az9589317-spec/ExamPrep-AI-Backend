// src/components/app/user-nav.tsx
'use client';

import Link from "next/link";
import { LayoutDashboard, User, Trophy } from "lucide-react";
import { Button } from "../ui/button";

export function UserNav({ user, isAdmin }: { user: any, isAdmin: boolean }) {
    // This is a placeholder. You'd typically use a dropdown menu here.
    return (
        <div className="flex items-center gap-4">
            {isAdmin && (
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin">
                       <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin
                    </Link>
                </Button>
            )}
             <Button asChild variant="ghost" size="sm">
                <Link href="/leaderboard">
                    <Trophy className="mr-2 h-4 w-4" />
                    Leaderboard
                </Link>
             </Button>
             <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                    <User className="h-5 w-5" />
                </Link>
             </Button>
        </div>
    )
}
