import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alɔdó",
    short_name: "Alodo",
    description: "Plateforme intelligente pour découvrir et postuler aux opportunités",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a3c6b",
    orientation: "portrait",
    scope: "/",
    lang: "fr",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}