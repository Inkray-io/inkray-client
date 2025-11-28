'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { HiBell } from "react-icons/hi2";
import { useNotificationsCount } from '@/hooks/useNotificationsCount';

export default function NotificationsBell() {
    const { count, isLoading } = useNotificationsCount();

    return (
        <Link href="/notifications" passHref>
            <Button variant="ghost" size="icon" className="size-10 relative">
                <HiBell className="size-6"/>
                {count > 0 && !isLoading && (
                    <span
                        className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center shadow"
                        data-testid="notifications-count"
                    >
                        {count}
                    </span>
                )}
            </Button>
        </Link>
    );
};
