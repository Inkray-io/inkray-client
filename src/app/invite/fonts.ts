import { Newsreader } from "next/font/google";

// Editorial serif used only for the invite hero — an on-brand nod to publishing.
export const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
