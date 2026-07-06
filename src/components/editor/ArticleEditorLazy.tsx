"use client"

import type { Ref, ComponentProps } from "react"
import { ArticleEditor, type ArticleEditorRef } from "./ArticleEditor"

type Props = ComponentProps<typeof ArticleEditor> & {
  /** Ref passed as a plain prop — next/dynamic can't forward real refs */
  editorRef?: Ref<ArticleEditorRef>
}

export default function ArticleEditorLazy({ editorRef, ...props }: Props) {
  return <ArticleEditor ref={editorRef} {...props} />
}
