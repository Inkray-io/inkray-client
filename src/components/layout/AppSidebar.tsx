"use client"

import { cn } from "@/lib/utils"

interface AppSidebarProps {
  currentPage?: string
  className?: string
}

export function AppSidebar({ currentPage = "feed", className }: AppSidebarProps) {
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

  const navigationItems = [
    { 
      id: "popular", 
      label: "Popular", 
      icon: "👑", 
      active: currentPage === "popular",
      href: "/feed?filter=popular" 
    },
    { 
      id: "fresh", 
      label: "Fresh", 
      icon: "⚡", 
      active: currentPage === "fresh",
      href: "/feed?filter=fresh",
      hasNotification: true 
    },
    { 
      id: "my-feed", 
      label: "My feed", 
      icon: "🖱️", 
      active: currentPage === "my-feed",
      href: "/feed?filter=my-feed" 
    }
  ]

  const inkrayLinks = [
    { 
      id: "about", 
      label: "About the project", 
      icon: "ℹ️", 
      href: "/about" 
    },
    { 
      id: "rules", 
      label: "Rules", 
      icon: "📋", 
      href: "/rules" 
    },
    { 
      id: "advertising", 
      label: "Advertising", 
      icon: "⭐", 
      href: "/advertising" 
    }
  ]

  return (
    <div className={cn("w-[300px] bg-white rounded-2xl p-5 h-fit", className)}>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <button
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors",
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-gray-50 text-black"
                )}
              >
                <div className="size-6">{item.icon}</div>
                <span className="font-medium">{item.label}</span>
              </button>
              {item.hasNotification && (
                <div className="size-2 bg-primary rounded mr-3"></div>
              )}
            </div>
          ))}
        </div>

        {/* Topics */}
        <div className="space-y-1">
          <div className="px-3 py-2.5">
            <h3 className="font-medium text-black">Topics</h3>
          </div>
          
          <div className="space-y-0.5">
            {topics.map((topic) => (
              <button
                key={topic.name}
                className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`size-6 rounded-xl ${topic.color}`} />
                  <span className="font-medium text-black">{topic.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inkray.io */}
        <div className="space-y-1">
          <div className="px-3 py-2.5">
            <h3 className="font-medium text-black">Inkray.io</h3>
          </div>
          
          <div className="space-y-0.5">
            {inkrayLinks.map((link) => (
              <button
                key={link.id}
                className="w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-6">{link.icon}</div>
                  <span className="font-medium text-black">{link.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}