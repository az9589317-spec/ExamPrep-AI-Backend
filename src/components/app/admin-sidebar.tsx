
'use client';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
  } from '@/components/ui/sidebar';
import Link from 'next/link';
import { BrainCircuit, LayoutDashboard, Users, LogOut, MoreHorizontal, Bell, Trophy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { signOut } from '@/services/auth';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '../ui/badge';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { unreadCount } = useNotifications();
    const isActive = (path: string) => pathname === path || (path !== '/admin' && pathname.startsWith(path));

    const handleLogout = async () => {
        await signOut();
        // The layout's useEffect will handle the redirect to /admin/login
    };

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarHeader>
                    <div className="flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2 whitespace-nowrap">
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <span className="font-headline text-xl">ExamPrep AI</span>
                        </Link>
                        <SidebarTrigger className="md:hidden"/>
                    </div>
                </SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/admin">
                            <SidebarMenuButton isActive={isActive('/admin')} tooltip={{children: 'Dashboard'}}>
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/users">
                            <SidebarMenuButton isActive={isActive('/admin/users')} tooltip={{children: 'Users'}}>
                                <Users />
                                <span>Users</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/admin/leaderboard">
                            <SidebarMenuButton isActive={isActive('/admin/leaderboard')} tooltip={{children: 'Leaderboard'}}>
                                <Trophy />
                                <span>Leaderboard</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/admin/notifications">
                            <SidebarMenuButton isActive={isActive('/admin/notifications')} tooltip={{children: 'Notifications'}}>
                                <div className="relative">
                                    <Bell />
                                    {unreadCount > 0 && (
                                        <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 justify-center rounded-full p-0 text-xs">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </div>
                                <span>Notifications</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter>
                {user && (
                    <div className="flex items-center gap-2 p-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'user'} />
                            <AvatarFallback>{user.displayName?.charAt(0) ?? 'A'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-semibold">{user.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" className="w-48">
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
