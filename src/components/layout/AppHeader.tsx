"use client"

import { HiMagnifyingGlass, HiBell, HiPlus, HiBars3 } from "react-icons/hi2"
import { Button } from "@/components/ui/button"
import { MobileMenu } from "./MobileMenu"

interface AppHeaderProps {
  currentPage?: string
}

export function AppHeader({ currentPage = "feed" }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 lg:px-[120px] xl:px-[160px] py-6 lg:py-10 max-w-[1600px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto w-full">
      {/* Left side - Logo and Mobile Menu */}
      <div className="flex items-center gap-4">
        <img src="/logo.svg" alt="Inkray" className="h-8 lg:h-10" />
        
        {/* Mobile Menu Button - Only visible on mobile/tablet */}
        <div className="lg:hidden">
          <MobileMenu currentPage={currentPage}>
            <Button variant="ghost" size="icon" className="size-8">
              <HiBars3 className="size-5" />
            </Button>
          </MobileMenu>
        </div>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Desktop Actions - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4">
          <Button variant="ghost" size="icon" className="size-10">
            <HiMagnifyingGlass className="size-6" />
          </Button>
          <Button variant="ghost" size="icon" className="size-10">
            <HiBell className="size-6" />
          </Button>
          <div className="size-10 rounded-full bg-gray-300 overflow-hidden">
            <img 
              src="/placeholder-user.jpg" 
              alt="User avatar" 
              className="size-full object-cover"
            />
          </div>
        </div>
        
        {/* Create Button - Always visible but responsive */}
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2 text-sm lg:text-base px-3 lg:px-4">
          <HiPlus className="size-4 lg:size-5" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </div>
    </header>
  )
}