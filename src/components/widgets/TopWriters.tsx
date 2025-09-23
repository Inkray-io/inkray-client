"use client"

interface Writer {
  rank: number
  name: string
  subscribers: string
  avatar: string
}

interface TopWritersProps {
  writers?: Writer[]
}

export function TopWriters({ writers }: TopWritersProps) {
  const defaultWriters: Writer[] = [
    { rank: 1, name: "QuillSeeker", subscribers: "4504 subscribers", avatar: "/placeholder-user.jpg" },
    { rank: 2, name: "SilentType", subscribers: "7602 subscribers", avatar: "/placeholder-user.jpg" },
    { rank: 3, name: "LedgerLines", subscribers: "3240 subscribers", avatar: "/placeholder-user.jpg" }
  ]

  const displayWriters = writers || defaultWriters

  return (
    <div className="bg-white rounded-2xl p-4">
      <h3 className="font-medium text-black mb-3 text-sm">Top writers</h3>
      
      <div className="space-y-2.5">
        {displayWriters.map((writer) => (
          <div key={writer.rank} className="flex items-center gap-2">
            <div className="w-5 text-center">
              <span className="text-black font-normal text-xs">{writer.rank}</span>
            </div>
            <div className="size-7 rounded-full bg-gray-200 overflow-hidden">
              <img src={writer.avatar} alt={writer.name} className="size-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-black text-sm">{writer.name}</div>
              <div className="text-xs text-black/70">{writer.subscribers}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-primary font-medium cursor-pointer hover:underline text-xs">
        View the entire list
      </div>
    </div>
  )
}