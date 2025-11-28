export enum NotificationType {
    ARTICLE_TIP = 'ARTICLE_TIP',
    ARTICLE_LIKED = 'ARTICLE_LIKED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_SUBSCRIBER = 'NEW_SUBSCRIBER',
    ARTICLE_PUBLISHED = 'ARTICLE_PUBLISHED',
}

export type Notification = {
    id: string;
    userId: string;
    title: string;
    body: string | null;
    type: NotificationType;
    channel: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date | null;
    readAt?: Date | null;
    payload: Record<string, any>;
}

export interface PaginatedNotifications {
    notifications: Notification[];
    total: number;
    limit: number;
    page: number;
}
