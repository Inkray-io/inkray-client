export enum NotificationType {
    ARTICLE_TIP = 'ARTICLE_TIP',
    ARTICLE_LIKED = 'ARTICLE_LIKED',
    ARTICLE_COMMENTED = 'ARTICLE_COMMENTED',
    ARTICLE_BOOKMARKED = 'ARTICLE_BOOKMARKED',
    NEW_FOLLOWER = 'NEW_FOLLOWER',
    NEW_SUBSCRIBER = 'NEW_SUBSCRIBER',
    ARTICLE_PUBLISHED = 'ARTICLE_PUBLISHED',
    SCHEDULED_ARTICLE_PUBLISHED = 'SCHEDULED_ARTICLE_PUBLISHED',
    SCHEDULED_ARTICLE_FAILED = 'SCHEDULED_ARTICLE_FAILED',
    INVITE_REDEEMED = 'INVITE_REDEEMED',
    INVITE_CODES_GRANTED = 'INVITE_CODES_GRANTED',
    TIER_PROMOTED = 'TIER_PROMOTED',
    COMMUNITY_APPLICATION = 'COMMUNITY_APPLICATION',
    COMMUNITY_APPLICATION_ACCEPTED = 'COMMUNITY_APPLICATION_ACCEPTED',
    COMMUNITY_APPLICATION_REJECTED = 'COMMUNITY_APPLICATION_REJECTED',
    COMMUNITY_INVITE = 'COMMUNITY_INVITE',
    COMMUNITY_INVITE_ACCEPTED = 'COMMUNITY_INVITE_ACCEPTED',
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
