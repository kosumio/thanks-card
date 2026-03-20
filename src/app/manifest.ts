import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "サンクスカード - 鮑屋グループ",
    short_name: "サンクスカード",
    description: "感謝を届けよう。鮑屋グループ サンクスカード",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF8F6",
    theme_color: "#8B2020",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
