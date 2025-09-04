"use client"

import { HiMagnifyingGlass, HiBell, HiPlus } from "react-icons/hi2"
import { Button } from "@/components/ui/button"

export function FeedHeader() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 lg:px-[296px] py-6 lg:py-10">
      <div className="flex items-center">
        <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10" />
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon" className="size-8 lg:size-10">
            <HiMagnifyingGlass className="size-5 lg:size-6" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 lg:size-10">
            <HiBell className="size-5 lg:size-6" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="size-8 lg:size-10 rounded-full bg-gray-300 overflow-hidden">
            <img 
              src="/placeholder-user.jpg" 
              alt="User avatar" 
              className="size-full object-cover"
            />
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm lg:text-base px-3 lg:px-4">
            <HiPlus className="size-4 lg:size-5" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </div>
      </div>
    </header>
  )
}