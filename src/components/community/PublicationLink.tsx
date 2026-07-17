'use client';

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

/** Links to a publication's page; stops propagation so it works inside rows. */
export function PublicationLink({
  publicationId,
  className = '',
  children,
}: {
  publicationId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={ROUTES.PUBLICATION_WITH_ID(publicationId)}
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </Link>
  );
}
