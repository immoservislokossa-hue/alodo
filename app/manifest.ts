import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ALODO - Plateforme de Financement Intelligent',
    short_name: 'ALODO',
    description: 'Plateforme de mise en relation entre micro-entreprises et institutions financières au Bénin',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#008751',
    background_color: '#ffffff',
    categories: ['finance', 'business'],
    screenshots: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        form_factor: 'narrow',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
      },
    ],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Opportunités',
        short_name: 'Opportunités',
        description: 'Accédez aux opportunités de financement',
        url: '/opportunites',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'Portefeuille',
        short_name: 'Wallet',
        description: 'Gérez votre portefeuille',
        url: '/wallet',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
  }
}
