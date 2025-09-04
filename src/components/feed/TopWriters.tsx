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
    <div className="bg-white rounded-2xl p-5">
      <h3 className="font-medium text-black mb-4">Top writers</h3>
      
      <div className="space-y-4">
        {displayWriters.map((writer) => (
          <div key={writer.rank} className="flex items-center gap-3">
            <div className="w-6 text-center">
              <span className="text-black font-normal">{writer.rank}</span>
            </div>
            <div className="size-10 rounded-full bg-gray-200 overflow-hidden">
              <img src={writer.avatar} alt={writer.name} className="size-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-black">{writer.name}</div>
              <div className="text-sm text-black/70">{writer.subscribers}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-primary font-medium cursor-pointer hover:underline">
        View the entire list
      </div>
    </div>
  )
}