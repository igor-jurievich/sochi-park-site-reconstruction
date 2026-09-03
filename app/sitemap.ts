import type { MetadataRoute } from 'next';

const siteUrl = 'https://sochipark23.ru';
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
