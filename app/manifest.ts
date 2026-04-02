import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alɔdó - Plateforme d'inclusion financière",
    short_name: "Alodo",
    description: "Plateforme intelligente d'inclusion financière pour l'économie informelle",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a3c6b",
    orientation: "portrait-primary",
    scope: "/",
    lang: "fr",
    dir: "ltr",
    categories: ["business", "finance"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
      },
    ],
  };
}