"use client"

import { useSearchParams } from "next/navigation"
import { AppLayout, RightSidebar } from "@/components/layout"
import { TopWriters } from "@/components/widgets/TopWriters"
import { PopularComments } from "@/components/widgets/PopularComments"
import { ArticleHeader } from "@/components/article/ArticleHeader"
import { ArticleContent } from "@/components/article/ArticleContent"
import { ArticleImage } from "@/components/article/ArticleImage"
import { ArticleFooter } from "@/components/article/ArticleFooter"
import { SubscribeSection } from "@/components/article/SubscribeSection"

export default function ArticlePage() {
  const searchParams = useSearchParams()
  const articleId = searchParams.get('id') || ''

  // For now, we'll use static content that matches the Figma design
  // In the future, this would fetch article data based on articleId
  const articleData = {
    author: {
      name: "SUI Foundation",
      avatar: "/placeholder-logo.svg",
      mintedBy: 245,
      date: "Aug 12, 2025",
      readTime: "1 min"
    },
    title: "SUI Now Listed on Robinhood, Expanding its Reach to Millions of Users",
    description: "This paper targets the idea that developers or dev-minded people in the space lack inspiration where users are desperate for innovation.",
    heroImage: "/hero_section/article_image.jpeg",
    content: `SUI has officially launched on Robinhood, and now millions of Robinhood users can trade SUI. The inclusion of SUI on the Robinhood platform represents a significant increase in access to the Sui ecosystem, particularly for retail users who are new to crypto and interested in the technology, but prioritize ease of use and trusted custodial infrastructure.

The addition of Sui further cements the Sui ecosystem's position as a cornerstone of the crypto industry and significantly expands its surface area to new potential SUI based users and community members.

The launch of SUI on Robinhood continues the trajectory of the Sui ecosystem's expanded reach and visibility beyond crypto-native audiences. The Sui ecosystem continues to grow across several key metrics, including $5B in Total Value Locked (TVL), over $759M in stablecoin market cap, and 30-day DEX volume of over $1.8B, up over 70% from the prior 30-day period.

There are now two publicly launched applications within the Sui token, from 2Shares and Canary Capital. And in late July, the first publicly listed SUI treasury vehicle was formed, which currently holds a balance sheet of $450M in Sui.`,
    engagement: {
      likes: 33,
      comments: 16,
      views: 120
    },
    subscribeInfo: {
      author: "SUI Foundation",
      description: "Receive the latest updates"
    }
  }

  return (
    <AppLayout 
      currentPage="article"
      rightSidebar={
        <RightSidebar>
          <TopWriters />
          <PopularComments />
        </RightSidebar>
      }
    >
      <div className="space-y-6">
        <ArticleHeader
          author={articleData.author}
          articleId={articleId}
        />
        
        <ArticleContent
          title={articleData.title}
          description={articleData.description}
        />
        
        <ArticleImage
          src={articleData.heroImage}
          alt={articleData.title}
        />
        
        <ArticleContent
          body={articleData.content}
          expandable={true}
        />
        
        <SubscribeSection
          author={articleData.subscribeInfo.author}
          description={articleData.subscribeInfo.description}
        />
        
        <ArticleFooter
          engagement={articleData.engagement}
          articleId={articleId}
        />
      </div>
    </AppLayout>
  )
}