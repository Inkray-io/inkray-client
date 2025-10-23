"use client"

export function FeedSidebar() {
  const topics = [
    { name: "Protocols", color: "bg-purple-400" },
    { name: "DeFi", color: "bg-yellow-300" },
    { name: "AI", color: "bg-green-400" },
    { name: "Governance", color: "bg-orange-300" },
    { name: "Investments", color: "bg-pink-500" },
    { name: "Community", color: "bg-blue-900" },
    { name: "Markets", color: "bg-purple-500" },
    { name: "Builders", color: "bg-orange-500" },
    { name: "Events", color: "bg-red-500" }
  ]

  return (
    <div className="w-[300px] bg-white rounded-2xl p-5 h-fit">
      <div className="space-y-6">
        {/* Navigation */}
        <div className="space-y-1">
          <div className="bg-white px-3 py-2.5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="size-6 text-orange-500">👑</div>
              <span className="font-medium text-black">Popular</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="px-3 py-2.5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="size-6 text-yellow-500">⚡</div>
                <span className="font-medium text-black">Fresh</span>
              </div>
            </div>
            <div className="size-2 bg-primary rounded"></div>
          </div>

          <div className="px-3 py-2.5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="size-6">🖱️</div>
              <span className="font-medium text-black">My feed</span>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="space-y-1">
          <div className="px-3 py-2.5">
            <h3 className="font-medium text-black">Topics</h3>
          </div>

          <div className="space-y-0.5">
            {topics.map((topic) => (
              <div key={topic.name} className="px-3 py-2.5 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`size-6 rounded-xl ${topic.color}`} />
                  <span className="font-medium text-black">{topic.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inkray.io */}
        <div className="space-y-1">
          <div className="px-3 py-2.5">
            <h3 className="font-medium text-black">Inkray.xyz</h3>
          </div>

          <div className="space-y-0.5">
            <div className="px-3 py-2.5 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="size-6">ℹ️</div>
                <span className="font-medium text-black">About the project</span>
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="size-6">📋</div>
                <span className="font-medium text-black">Rules</span>
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="size-6">⭐</div>
                <span className="font-medium text-black">Advertising</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}