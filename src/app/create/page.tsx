"use client"

import { AppLayout } from '@/components/layout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequirePublication } from '@/components/auth/RequirePublication'
import { PublicationCompletionPrompt } from '@/components/publication/PublicationCompletionPrompt'
import { ImportWritingBanner } from '@/components/publication/ImportWritingBanner'
import { Suspense } from "react";
import ArticleCreationPage from "@/components/article/ArticleCreationPage";


export default function CreateArticlePage() {

  return (
      <RequireAuth redirectTo="/">
        <RequirePublication redirectTo="/create-publication">
          <AppLayout currentPage="create">
            <ImportWritingBanner />
            <Suspense>
              <ArticleCreationPage/>
            </Suspense>
            <PublicationCompletionPrompt />
          </AppLayout>
        </RequirePublication>
      </RequireAuth>
  )
}
