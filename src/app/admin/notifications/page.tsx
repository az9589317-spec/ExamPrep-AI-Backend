

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Check, Loader2, Send, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationAction, markNotificationsAsReadAction } from '@/app/admin/actions';
import { useNotifications } from '@/hooks/use-notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

const sendNotificationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  link: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

function SendNotificationForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof sendNotificationSchema>>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      title: '',
      description: '',
      link: '',
      imageUrl: '',
    },
  });

  const onSubmit = (data: z.infer<typeof sendNotificationSchema>) => {
    startTransition(async () => {
      const result = await sendNotificationAction(data);
      if (result.errors && Object.keys(result.errors).length > 0) {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      } else {
        toast({ title: 'Success', description: result.message });
        form.reset();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a New Notification</CardTitle>
        <CardDescription>
          Broadcast a message to all users. It will appear in their notification panel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., New Mock Test Available" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the notification in detail..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormDescription>An image to display with the notification.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourapp.com/some-page" {...field} />
                  </FormControl>
                  <FormDescription>A URL to redirect users to when they click the notification.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Notification
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function NotificationList() {
  const { notifications, unreadCount, isLoading, refetch } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if(unreadIds.length === 0) return;

    startTransition(async () => {
        const result = await markNotificationsAsReadAction(unreadIds);
        if(result.success) {
            toast({ title: "Success", description: "Notifications marked as read."});
            refetch();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>A log of recent system and broadcast notifications.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isPending || unreadCount === 0}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <div key={notification.id} className="flex items-start gap-4">
                <div className={`mt-1 h-2 w-2 rounded-full ${notification.isRead ? 'bg-muted' : 'bg-primary animate-pulse'}`} />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  {notification.imageUrl && (
                    <div className="mt-2">
                        <Image
                            src={notification.imageUrl}
                            alt={notification.title}
                            width={400}
                            height={200}
                            className="rounded-md object-cover"
                        />
                    </div>
                  )}
                  {notification.link && <Link href={notification.link} className="text-sm text-blue-500 hover:underline">View Details</Link>}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date((notification.createdAt as any).seconds * 1000), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12" />
                <p className="mt-4">No notifications yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function NotificationsPage() {
  return (
    <div className="grid flex-1 items-start gap-8 p-4 sm:px-6 sm:py-0 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <SendNotificationForm />
        </div>
        <div className="lg:col-span-2">
            <NotificationList />
        </div>
    </div>
  );
}

    