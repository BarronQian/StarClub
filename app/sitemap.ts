import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    'https://www.starclubsc.com'

  const routes = [
    '',
    '/about',
    '/archive',
    '/changelog',
    '/community',
    '/events',
    '/gallery',
    '/guides',
    '/hall-of-fame',
    '/market',
    '/partners',
    '/rules',
    '/sponsors',
    '/team',
    '/tools',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency:
      route === ''
        ? 'daily'
        : 'weekly',
    priority:
      route === ''
        ? 1
        : route === '/community' ||
            route === '/events' ||
            route === '/gallery' ||
            route === '/guides' ||
            route === '/market'
          ? 0.9
          : 0.7,
  }))
}