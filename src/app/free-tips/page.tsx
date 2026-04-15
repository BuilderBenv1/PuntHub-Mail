import type { Metadata } from "next";
import { FreeTipsLanding } from "./free-tips-landing";

export const metadata: Metadata = {
  title: "Free Daily Racing Tips | PuntHub",
  description:
    "Get expert horse racing tips delivered to your inbox every morning. Completely free, no card required. Join thousands of winning punters today.",
};

export default function FreeTipsPage() {
  return <FreeTipsLanding />;
}
