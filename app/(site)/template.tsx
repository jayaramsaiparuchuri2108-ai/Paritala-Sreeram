import { PageTransition } from "@/components/layout/PageTransition";

// A template re-mounts on every navigation, which replays the page-enter animation.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
