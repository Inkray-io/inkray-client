"use client"

import { motion, useReducedMotion } from "framer-motion"
import { HiChevronRight } from "react-icons/hi2"

const BRAND_BLUE = "#005EFC"
// Just the paper-plane shape (the two "wing" sub-paths from the Inkray mark, which
// are normally carved out of the disc as negative space). Filling this white over a
// solid-blue square gives a clean iOS app icon with no disc seam.
const PLANE_PATH =
  "M5.95532 19.1326C9.21366 20.3116 12.1808 19.6968 14.9242 17.6842C15.9245 16.9474 16.8235 16.1011 17.6845 15.2042C18.4653 14.3916 19.2883 13.6295 20.3055 13.1158C20.6727 12.9305 21.0568 12.7874 21.4746 12.7958C22.0064 12.8084 22.2976 13.12 22.2681 13.6547C22.2554 13.8863 22.2006 14.1179 22.0866 14.3158C21.4831 15.3726 21.3353 16.5263 21.3396 17.7095C21.3396 17.9453 21.2636 18.08 21.061 18.1979C18.9507 19.4147 16.7602 20.4337 14.3502 20.9137C10.7753 21.6295 7.52962 20.9011 4.61738 18.7074C4.55829 18.6611 4.48654 18.6274 4.46544 18.5263C4.96769 18.7326 5.45307 18.9516 5.9511 19.1326H5.95532ZM33.5077 12.72C32.3259 14.7368 31.2327 16.7916 30.5026 19.0232C30.0974 20.2653 29.8104 21.5284 29.8652 22.8505C29.8906 23.4526 30.013 24.0379 30.2493 24.5937C30.2958 24.7032 30.3802 24.7747 30.4224 24.8211L31.8954 26.3453C32.0093 26.4674 32.8957 27.4274 32.6846 27.7137C32.5622 27.8779 31.9756 27.9284 31.5282 27.7853C31.4311 27.7516 31.2707 27.6884 31.1525 27.7642C31.0723 27.8147 31.0259 27.9242 31.009 28.1095C30.95 28.6905 30.8233 29.2674 30.6418 29.8274C30.4477 30.4379 30.2113 30.5137 29.7133 30.1137C29.1351 29.6463 28.7257 29.0484 28.4302 28.3747C28.1854 27.8232 27.9997 27.7347 27.4173 27.92C26.9783 28.0589 26.5436 28.2105 26.1047 28.3368C24.5894 28.7663 23.0447 28.8968 21.4746 28.8632C18.6637 28.8 15.9371 28.3116 13.3457 27.1832C12.5606 26.8421 11.7587 26.5095 11.0665 26.0168C8.37375 24.1053 5.68098 22.1853 4.03493 19.2C3.83234 18.8337 3.61709 18.48 3.47359 18.0505C3.65507 18.0589 3.7015 18.1937 3.78591 18.2737C5.59235 19.9495 7.64358 21.1537 10.1 21.6C12.0246 21.9495 13.9197 21.7811 15.7936 21.2674C18.7903 20.4463 21.4324 18.9053 23.9648 17.1621C25.9443 15.8021 27.7929 14.2695 29.7217 12.8421C30.5954 12.1937 31.5493 11.7221 32.6213 11.5158C32.9927 11.4442 33.419 11.3095 33.6849 11.6884C33.9339 12.0463 33.6934 12.4042 33.5077 12.72Z"

/**
 * Invite banner for the private iOS (TestFlight) beta, shown only to eligible
 * creators (see useMobileAccess). Styled as an iOS lock-screen push notification
 * because that's exactly where it lives — an iPhone — so tapping it to open
 * TestFlight mirrors tapping a real notification.
 */
export function TestFlightBanner({ url }: { url: string }) {
  const reduceMotion = useReducedMotion()

  return (
    // The "lock screen": a dark strip the notification sits on.
    <div className="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-br from-[#0B1220] to-[#131C31] p-2.5 sm:p-3">
      {/* Ambient wallpaper glow behind the app icon. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 -top-10 size-44 rounded-full bg-[#005EFC]/25 blur-3xl"
      />

      {/* The notification itself — the whole card opens TestFlight. */}
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={reduceMotion ? false : { y: -10 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/10 p-3 pr-9 backdrop-blur-xl transition-colors hover:bg-white/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005EFC]/70"
      >
        {/* App icon: a solid-blue iOS squircle with the white paper-plane on top. */}
        <span className="relative block size-11 shrink-0 overflow-hidden rounded-[13px] shadow-lg shadow-black/30 ring-1 ring-white/15">
          <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
            <rect width="40" height="40" fill={BRAND_BLUE} />
            <path d={PLANE_PATH} fill="#ffffff" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/55">
            <span>Inkray</span>
            <span className="text-white/25">·</span>
            <span className="font-normal normal-case tracking-normal text-white/40">
              now
            </span>
          </div>
          <div className="mt-0.5 truncate text-[15px] font-semibold leading-tight text-white">
            You&apos;re in the iOS beta
          </div>
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/70">
            Install Inkray on your iPhone
            <span className="sm:hidden">.</span>
            <span className="hidden sm:inline"> — early access via TestFlight.</span>
          </div>
        </div>

        <HiChevronRight className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-white/35 transition-all group-hover:translate-x-0.5 group-hover:text-white/70" />
      </motion.a>
    </div>
  )
}
