'use client';
import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AppLayout } from "@/components/layout";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const { notifications, isLoading, error, total, limit, markAllAsRead } = useNotifications(page);

    // Calculate pagination states
    const hasPrevious = page > 1;
    const hasNext = page * limit < total;

    return (
        <RequireAuth redirectTo="/">
            <AppLayout
                currentPage="notifications"
            >
                <div className="max-w-2xl mx-auto py-8 px-4">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    </div>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[ ...Array(5) ].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full"/>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-red-500">Failed to load notifications.</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-gray-500">No notifications yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <Card key={notification.id}
                                      className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{notification.title}</div>
                                        {notification.body && (
                                            <div
                                                className="text-sm text-gray-600 mt-1">{notification.body}</div>
                                        )}
                                        {notification.sentAt && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.sentAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    {!notification.readAt && (
                                        <span
                                            className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                    {/* Pagination controls (if needed) */}
                    {total > limit && (
                        <div className="flex justify-center mt-8">
                            <Button disabled={!hasPrevious} onClick={() => hasPrevious && setPage(page - 1)}>Previous</Button>
                            <span className="mx-4">Page {page}</span>
                            <Button disabled={!hasNext} onClick={() => hasNext && setPage(page + 1)}>Next</Button>
                        </div>
                    )}
                </div>
            </AppLayout>
        </RequireAuth>
    );
}
