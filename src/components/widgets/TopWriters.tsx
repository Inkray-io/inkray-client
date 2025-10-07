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
    { 
      rank: 1, 
      name: "QuillSeeker", 
      subscribers: "4504 subscribers", 
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
    },
    { 
      rank: 2, 
      name: "SilentType", 
      subscribers: "7602 subscribers", 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    { 
      rank: 3, 
      name: "LedgerLines", 
      subscribers: "3240 subscribers", 
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    }
  ]

  const displayWriters = writers || defaultWriters

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center h-[22px] mb-4">
        <h3 className="font-medium text-black text-sm leading-[22px]">Top writers</h3>
      </div>
      
      <div className="space-y-4">
        {displayWriters.map((writer) => (
          <div key={writer.rank} className="flex items-center gap-3">
            {/* Rank number with proper spacing */}
            <div className="w-6 text-center">
              <span className="text-black font-normal text-sm leading-[22px] font-['Roboto'] font-variation-settings-wdth-100">
                {writer.rank}
              </span>
            </div>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <img 
                src={writer.avatar} 
                alt={writer.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' rx='20' fill='%23E5E7EB'/%3E%3Cpath d='M20 10C22.2091 10 24 11.7909 24 14C24 16.2091 22.2091 18 20 18C17.7909 18 16 16.2091 16 14C16 11.7909 17.7909 10 20 10ZM20 20C24.4183 20 28 22.2386 28 25V30H12V25C12 22.2386 15.5817 20 20 20Z' fill='%239CA3AF'/%3E%3C/svg%3E`;
                }}
              />
            </div>
            {/* Writer info */}
            <div className="flex-1 space-y-px leading-[0]">
              <div className="font-semibold text-black text-sm leading-[1.4]">
                {writer.name}
              </div>
              <div className="font-normal text-black text-xs leading-[1.3]">
                {writer.subscribers}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-[#005efc] font-medium cursor-pointer hover:underline text-base leading-[1.35] min-w-full pt-4" style={{width: "min-content"}}>
        View the entire list
      </div>
    </div>
  )
}