"use client"

import { useRef, useEffect, useState } from 'react'
import { Crepe } from '@milkdown/crepe'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import '../../styles/milkdown.css'

interface ArticleEditorProps {
  initialValue?: string
  onChange?: (markdown: string) => void
  placeholder?: string
  className?: string
}

export function ArticleEditor({ 
  initialValue = '', 
  onChange, 
  placeholder = 'Start writing your article...', 
  className = '' 
}: ArticleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Use useRef to store the latest onChange callback
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  
  // Store initial value to prevent re-initialization
  const initialValueRef = useRef(initialValue)

  useEffect(() => {
    if (!editorRef.current) return
    
    const initializeEditor = async () => {
      try {
        setIsLoading(true)
        
        // Create Crepe instance with listener configuration
        const crepe = new Crepe({
          root: editorRef.current!,
          defaultValue: initialValueRef.current,
          placeholder,
        })
        
        // Configure the listener before creating the editor
        if (onChangeRef.current) {
          crepe.editor.use(listener)
          
          crepe.editor.config((ctx) => {
            const listenerManager = ctx.get(listenerCtx)
            
            listenerManager.markdownUpdated((_, markdown) => {
              // Use the ref to get the latest onChange callback
              if (onChangeRef.current) {
                onChangeRef.current(markdown)
              }
            })
          })
        }
        
        // Initialize the editor after configuration
        await crepe.create()
        
        // Store reference for cleanup
        crepeRef.current = crepe
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize Milkdown editor:', error)
        setIsLoading(false)
      }
    }
    
    initializeEditor()
    
    // Cleanup on unmount
    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy()
        crepeRef.current = null
      }
    }
  }, [placeholder]) // Only re-initialize if placeholder changes
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-gray-600">Loading editor...</div>
        </div>
      )}
      <div 
        ref={editorRef}
        className="min-h-[500px] w-full"
      />
    </div>
  )
}