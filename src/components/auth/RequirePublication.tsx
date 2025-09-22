"use client"

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useArticleCreation } from '@/hooks/useArticleCreation'
import { useToast } from '@/hooks/use-toast'
import { Loader2, BookOpen } from 'lucide-react'

interface RequirePublicationProps {
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  showRedirectMessage?: boolean
}

/**
 * Component that ensures the user has a publication before rendering children
 * Similar to RequireAuth but for publication requirements
 */
export function RequirePublication({ 
  children, 
  fallback,
  redirectTo = '/create-publication',
  showRedirectMessage = true
}: RequirePublicationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getUserPublication } = useArticleCreation()
  
  const [hasPublication, setHasPublication] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const checkPublication = async () => {
      try {
        setIsLoading(true)
        const publication = await getUserPublication()
        const hasValidPublication = !!publication
        
        setHasPublication(hasValidPublication)
        
        if (!hasValidPublication && showRedirectMessage) {
          setIsRedirecting(true)
          
          toast({
            title: "Publication Required",
            description: "You need to create a publication before writing articles.",
          })
          
          // Delay redirect to allow toast to show
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        }
      } catch {
        // Failed to check publication - treat as no publication
        setHasPublication(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkPublication()
  }, [getUserPublication, router, toast, redirectTo, showRedirectMessage])

  // Loading state - don't redirect yet, just show loading
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking your publication...</p>
        </div>
      </div>
    )
  }

  // No publication found - show redirect message
  if (hasPublication === false) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold">Publication Required</h1>
          <p className="text-muted-foreground">
            You need to create a publication before writing articles.
            {isRedirecting && (
              <>
                <br />
                Redirecting you to publication setup...
              </>
            )}
          </p>
          {isRedirecting && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
        </div>
      </div>
    )
  }

  // Has publication - render children
  return <>{children}</>
}