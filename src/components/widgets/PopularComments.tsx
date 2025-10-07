"use client"

interface Comment {
  id: string
  author: {
    name: string
    avatar: string
  }
  date: string
  content: string
  reactions: number
  reactionTypes?: string[]
}

interface PopularCommentsProps {
  comments?: Comment[]
}

export function PopularComments({ comments }: PopularCommentsProps) {
  // Default comments matching Figma design
  const defaultComments: Comment[] = [
    {
      id: "1",
      author: {
        name: "AnonInk",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
      },
      date: "14 Aug",
      content: "Every chain pumps adoption news. Robinhood is big exposure, but let's see if it translates into actual usage of Sui tech.",
      reactions: 11,
      reactionTypes: ["👍", "❤️", "🚀"]
    },
    {
      id: "2",
      author: {
        name: "SilentType", 
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
      },
      date: "15 Aug",
      content: "In a world where technology evolves rapidly, embracing innovation is key to staying ahead. We are committed to pushing boundaries in",
      reactions: 20,
      reactionTypes: ["👍", "🚀"]
    },
    {
      id: "3",
      author: {
        name: "VoidWriter",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
      },
      date: "15 Aug",
      content: "Mom, can we get ETH?\" – \"We have ETH at home.\" – ETH at home: SUI on Robinhood.\"\n\"SUI Army W!",
      reactions: 20,
      reactionTypes: ["👍", "🚀"]
    }
  ]

  const displayComments = comments || defaultComments

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center h-[22px] mb-4">
        <h3 className="font-medium text-black text-sm leading-[22px]">Popular comments</h3>
      </div>
      
      <div className="space-y-4">
        {displayComments.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Author Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img 
                  src={comment.author.avatar} 
                  alt={comment.author.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='20' fill='%23E5E7EB'/%3E%3Cpath d='M20 10C22.2091 10 24 11.7909 24 14C24 16.2091 22.2091 18 20 18C17.7909 18 16 16.2091 16 14C16 11.7909 17.7909 10 20 10ZM20 20C24.4183 20 28 22.2386 28 25V30H12V25C12 22.2386 15.5817 20 20 20Z' fill='%239CA3AF'/%3E%3C/svg%3E`;
                  }}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-black text-sm font-semibold leading-[1.4]">
                  {comment.author.name}
                </span>
                <div className="w-0.5 h-0.5 bg-black/50 rounded-full"></div>
                <span className="text-black/50 text-xs leading-[1.3]">
                  {comment.date}
                </span>
              </div>
            </div>

            {/* Comment Content */}
            <div className="space-y-1.5">
              <p className="text-black text-sm leading-[1.4] whitespace-pre-line min-w-full" style={{width: "min-content"}}>
                {comment.content}
              </p>
              
              {/* Reactions */}
              <div className="flex items-center gap-1.5 h-[26px] rounded-full">
                <div className="flex gap-0.5">
                  {comment.reactionTypes?.map((reaction, index) => (
                    <div 
                      key={index}
                      className="w-[18px] h-[18px] rounded bg-no-repeat bg-center bg-cover flex items-center justify-center text-xs"
                      style={{
                        backgroundImage: `url('data:image/svg+xml;base64,${btoa(`<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="18" height="18" rx="4" fill="#FEF3C7"/></svg>`)}')`
                      }}
                    >
                      {reaction}
                    </div>
                  ))}
                </div>
                <span className="text-[#595959] text-[13px] leading-[18px] pl-0.5">
                  {comment.reactions} reactions
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Spacer at bottom to match Figma */}
      <div className="h-28"></div>
    </div>
  )
}