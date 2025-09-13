
'use client';

import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "../ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import { markNotificationsAsReadAction } from "@/app/admin/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";


export function NotificationBell() {
    const { notifications, unreadCount, isLoading } = useNotifications();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleMarkAllAsRead = () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length === 0) return;

        startTransition(async () => {
            const result = await markNotificationsAsReadAction(unreadIds);
            if (result.success) {
                toast({ title: "Success", description: "Notifications marked as read." });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-medium">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={handleMarkAllAsRead}
                            disabled={isPending}
                        >
                           <Check className="mr-1 h-3 w-3" /> Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-96">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                           {Array.from({length: 3}).map((_, i) => (
                               <div key={i} className="space-y-2">
                                   <Skeleton className="h-4 w-full" />
                                   <Skeleton className="h-3 w-2/3" />
                                   <Skeleton className="h-2 w-1/2" />
                               </div>
                           ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {notifications.map((notification) => (
                                <div key={notification.id} className="grid items-start gap-2">
                                    <div className="font-semibold text-sm flex items-center gap-2">
                                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                                        {notification.title}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                                    {notification.link && (
                                        <Link href={notification.link} className="text-xs text-blue-500 hover:underline">
                                            View Details
                                        </Link>
                                    )}
                                     <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date((notification.createdAt as any).seconds * 1000), { addSuffix: true })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2" />
                            <p>You have no new notifications.</p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

