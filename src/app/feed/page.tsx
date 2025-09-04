"use client"

import { AppLayout, RightSidebar } from "@/components/layout"
import { FeedPost } from "@/components/feed/FeedPost"
import { TopWriters } from "@/components/widgets/TopWriters"
import { PopularComments } from "@/components/widgets/PopularComments"

export default function FeedPage() {
  return (
    <AppLayout 
      currentPage="feed"
      rightSidebar={
        <RightSidebar>
          <TopWriters />
          <PopularComments />
        </RightSidebar>
      }
    >
      <div className="space-y-5">
        <FeedPost
          author={{
            name: "Walrus",
            avatar: "/hero_section/walrus.jpeg",
            mintedBy: 101,
            date: "Aug 12, 2025",
            readTime: "2 min"
          }}
          title="WAL Stakers Rewarded with Walrus NFT Airdrop"
          description="Walrus community members who have been staking WAL tokens are able to claim WAL tokens today."
        />

        <FeedPost
          author={{
            name: "SUI Foundation",
            avatar: "/placeholder-logo.svg",
            mintedBy: 245,
            date: "Aug 12, 2025",
            readTime: "1 min"
          }}
          title="SUI Now Listed on Robinhood, Expanding its Reach to Millions of Users"
          description="The SUI token is available to trade for US customers on Robinhood starting today, in landmark moment of maturation and access for the Sui ecosystem."
          image="/hero_section/article_image.jpeg"
          hasReadMore={true}
          engagement={{
            likes: 269,
            comments: 9,
            views: 120
          }}
        />

        <FeedPost
          author={{
            name: "Inkray",
            avatar: "/logo.svg",
            mintedBy: 101,
            date: "Aug 12, 2025",
            readTime: "2 min"
          }}
          title="Why we're building the future of publishing on web3"
          description="As founders, we believe stories should live forever, belong to their creators, and thrive in open ecosystems."
        />
      </div>
    </AppLayout>
  )
}