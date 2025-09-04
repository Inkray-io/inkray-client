"use client"

interface ArticleImageProps {
  src: string
  alt: string
  caption?: string
}

export function ArticleImage({ src, alt, caption }: ArticleImageProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="space-y-3">
        <div className="rounded-lg overflow-hidden">
          <img 
            src={src} 
            alt={alt} 
            className="w-full h-auto object-cover"
          />
        </div>
        
        {caption && (
          <p className="text-sm text-black/60 text-center italic">
            {caption}
          </p>
        )}
      </div>
    </div>
  )
}