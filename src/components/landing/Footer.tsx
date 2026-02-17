"use client"

import { FaXTwitter } from "react-icons/fa6"
import { ROUTES } from "@/constants/routes"

const LINKS = [
  { label: "Feed", href: ROUTES.FEED },
  { label: "Create", href: ROUTES.CREATE },
  { label: "About", href: ROUTES.ABOUT },
  { label: "Rules", href: ROUTES.RULES },
]

export function Footer() {
  return (
    <footer className="bg-[#080F1A] border-t border-white/[0.06] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <img
              src="/logo.svg"
              alt="Inkray"
              className="h-7 brightness-0 invert"
            />
            <p className="text-[#4A5A72] text-sm leading-relaxed max-w-xs">
              True digital ownership for creators. Publish effortlessly, own
              permanently.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={ROUTES.EXTERNAL.TWITTER}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#4A5A72] hover:text-white hover:bg-white/[0.1] transition-colors"
              >
                <FaXTwitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[#4A5A72] hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              Built with
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/sui_icon.svg" alt="Sui" className="h-4 brightness-0 invert opacity-40" />
                <span className="text-sm text-[#4A5A72]">Sui Blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src="/hero_section/walrus.svg"
                  alt="Walrus"
                  className="h-4 brightness-0 invert opacity-40"
                />
                <span className="text-sm text-[#4A5A72]">Walrus Storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-[#4A5A72]">
            &copy; {new Date().getFullYear()} Inkray. All rights reserved.
          </span>
          <span className="text-xs text-[#4A5A72]">
            Built with care by the Inkray team
          </span>
        </div>
      </div>
    </footer>
  )
}
