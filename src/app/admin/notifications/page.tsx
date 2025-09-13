

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTransition, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Check, Loader2, Send, Trash2, MoreHorizontal, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendNotificationAction, markNotificationsAsReadAction, deleteNotificationAction } from '@/app/admin/actions';
import { useNotifications } from '@/hooks/use-notifications';
import type { Notification } from '@/lib/data-structures';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const sendNotificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  link: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

function NotificationForm({
  initialData,
  onFinished,
}: {
  initialData?: Notification;
  onFinished: () => void;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof sendNotificationSchema>>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: initialData || {
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
        onFinished();
      }
    });
  };

  return (
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
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {initialData ? 'Save Changes' : 'Send Notification'}
            </Button>
        </div>
      </form>
    </Form>
  );
}

function NotificationList() {
  const { notifications, unreadCount, isLoading, refetch } = useNotifications();
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | undefined>(undefined);
  const { toast } = useToast();

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if(unreadIds.length === 0) return;

    startTransition(async () => {
        const result = await markNotificationsAsReadAction(unreadIds);
        if(result.success) {
            toast({ title: "Success", description: "Notifications marked as read."});
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }
  
  const handleDelete = (notificationId: string) => {
    startTransition(async () => {
      const result = await deleteNotificationAction({ notificationId });
      if (result.success) {
        toast({ title: "Success", description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };
  
  const handleOpenForm = (notification?: Notification) => {
    setSelectedNotification(notification);
    setIsFormOpen(true);
  }

  const handleFormFinished = () => {
    setIsFormOpen(false);
    setSelectedNotification(undefined);
    refetch();
  }

  return (
    <>
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
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleOpenForm(notification)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete this notification.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(notification.id)} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                                          {isPending ? 'Deleting...' : 'Delete'}
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </DropdownMenuContent>
                  </DropdownMenu>
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
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification ? 'Edit Notification' : 'Send a New Notification'}</DialogTitle>
              <DialogDescription>
                {selectedNotification ? 'Make changes to your notification below.' : 'Broadcast a message to all users. It will appear in their notification panel.'}
              </DialogDescription>
            </DialogHeader>
            <NotificationForm 
              initialData={selectedNotification}
              onFinished={handleFormFinished}
            />
          </DialogContent>
      </Dialog>
    </>
  )
}

export default function NotificationsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { refetch } = useNotifications();

  const handleFormFinished = () => {
    setIsFormOpen(false);
    refetch();
  }

  return (
    <div className="grid flex-1 items-start gap-8">
       <div className="flex items-center justify-between">
         <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Send and manage broadcast notifications.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" /> Send Notification
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Send a New Notification</DialogTitle>
                    <DialogDescription>
                        Broadcast a message to all users. It will appear in their notification panel.
                    </DialogDescription>
                </DialogHeader>
                <NotificationForm onFinished={handleFormFinished} />
            </DialogContent>
        </Dialog>
       </div>
        <NotificationList />
    </div>
  );
}
