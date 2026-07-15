import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inkray for AI Agents — Let an agent publish under your account (MCP)",
  description:
    "Connect Claude, ChatGPT, Cursor, or your own agents to Inkray over MCP. They can read the platform and publish articles under your account — authorized by your Sui wallet, no API keys. Scoped, rate-limited, revocable.",
  keywords: [
    "Inkray MCP",
    "Model Context Protocol",
    "MCP server",
    "AI agent publishing",
    "Claude MCP",
    "publish with AI",
    "Sui wallet OAuth",
    "agent API no keys",
  ],
  alternates: {
    canonical: "https://inkray.xyz/mcp-for-agents",
  },
  openGraph: {
    type: "website",
    url: "https://inkray.xyz/mcp-for-agents",
    title: "Inkray for AI Agents — publish under your account over MCP",
    description:
      "Connect your AI assistant to Inkray. It reads and publishes under your account, authorized by your Sui wallet — no API keys.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkray for AI Agents (MCP)",
    description:
      "Give your AI agent a byline. Connect over MCP, authorize with your wallet, publish on Sui — owned by you.",
  },
}

export default function McpForAgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
