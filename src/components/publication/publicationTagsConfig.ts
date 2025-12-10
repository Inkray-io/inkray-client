/**
 * Publication tags configuration
 *
 * These tags are specific to publication content categories,
 * different from user skills which focus on expertise areas.
 */

export interface TagConfig {
  name: string;
  gradient: string;
  iconBg: string;
}

export const PUBLICATION_TAGS: Record<string, TagConfig> = {
  'defi': {
    name: 'DeFi',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconBg: 'bg-emerald-500',
  },
  'nfts': {
    name: 'NFTs',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconBg: 'bg-purple-500',
  },
  'gaming': {
    name: 'Gaming',
    gradient: 'from-red-500/10 to-orange-500/10',
    iconBg: 'bg-red-500',
  },
  'tutorials': {
    name: 'Tutorials',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconBg: 'bg-blue-500',
  },
  'news': {
    name: 'News & Updates',
    gradient: 'from-slate-500/10 to-gray-500/10',
    iconBg: 'bg-slate-500',
  },
  'developer-guides': {
    name: 'Developer Guides',
    gradient: 'from-indigo-500/10 to-violet-500/10',
    iconBg: 'bg-indigo-500',
  },
  'research': {
    name: 'Research',
    gradient: 'from-amber-500/10 to-yellow-500/10',
    iconBg: 'bg-amber-500',
  },
  'opinion': {
    name: 'Opinion',
    gradient: 'from-rose-500/10 to-pink-500/10',
    iconBg: 'bg-rose-500',
  },
  'project-updates': {
    name: 'Project Updates',
    gradient: 'from-sky-500/10 to-blue-500/10',
    iconBg: 'bg-sky-500',
  },
  'community': {
    name: 'Community',
    gradient: 'from-green-500/10 to-lime-500/10',
    iconBg: 'bg-green-500',
  },
};

export const PUBLICATION_TAG_LIST = Object.entries(PUBLICATION_TAGS).map(([slug, config]) => ({
  slug,
  ...config,
}));

export const MAX_PUBLICATION_TAGS = 10;
