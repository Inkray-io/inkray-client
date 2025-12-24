import { MetadataRoute } from "next";
import { CONFIG } from "@/lib/config";


export const dynamic = 'force-static'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: CONFIG.APP_NAME,
    short_name: CONFIG.APP_NAME,
    display: 'minimal-ui',
    theme_color: '#015FFC',
    orientation: 'portrait',
    start_url: '/feed',
    icons: [
      {
        src: '/logo-icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/logo-icon-160.png',
        sizes: '192x192',
        type: 'image/png'
      }
    ],
  }
};
