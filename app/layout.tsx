import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = 'https://sochipark23.ru';
const title = 'Квартиры в ЖК «Сочи Парк» — подборка от Объединённого отдела продаж';
const description = 'Подборка студий и 1-комнатных квартир в ЖК «Сочи Парк» в микрорайоне Бытха. Планировки, ориентиры по цене и условия покупки.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: 'ЖК «Сочи Парк»',
  authors: [{ name: 'Объединённый отдел продаж' }],
  creator: 'Объединённый отдел продаж',
  publisher: 'Объединённый отдел продаж',
  category: 'Недвижимость',
  alternates: { canonical: '/' },
  icons: { icon: '/icon.ico' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: 'ЖК «Сочи Парк»',
    title,
    description,
    images: ['/backgrounds/video-bg.webp'],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/backgrounds/video-bg.webp'] },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1438ff', colorScheme: 'light' };

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'RealEstateAgent',
      '@id': `${siteUrl}/#organization`,
      name: 'Объединённый отдел продаж',
      legalName: 'ИП Наринянц Левон Аркадьевич',
      url: siteUrl,
      logo: `${siteUrl}/logos/oop-logo-on-light.svg`,
      telephone: '+79649460713',
      address: { '@type': 'PostalAddress', streetAddress: 'Несебрская улица, 6Б', addressLocality: 'Сочи', addressRegion: 'Краснодарский край', addressCountry: 'RU' },
      areaServed: ['Сочи', 'Краснодарский край'],
    },
    {
      '@type': 'ApartmentComplex',
      '@id': `${siteUrl}/#sochi-park`,
      name: 'ЖК «Сочи Парк»',
      description,
      image: `${siteUrl}/backgrounds/video-bg.webp`,
      url: siteUrl,
      address: { '@type': 'PostalAddress', streetAddress: 'Ясногорская улица, 16', addressLocality: 'Сочи', addressRegion: 'Краснодарский край', addressCountry: 'RU' },
    },
    { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: title, inLanguage: 'ru-RU', publisher: { '@id': `${siteUrl}/#organization` } },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    {children}
  </body></html>;
}
