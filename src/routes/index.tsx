import { createFileRoute } from "@tanstack/react-router";
import { VeriPlagApp } from "@/vp/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comet — Original Source Similarity Checker" },
      {
        name: "description",
        content: "Compare papers with your uploaded original sources, review matches and download certificates and teacher-ready Word reports.",
      },
      { property: "og:title", content: "Comet — Original Source Similarity Checker" },
      {
        property: "og:description",
        content: "Compare papers with your original-source library and download similarity reports for teacher submission.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VeriPlagApp,
});
