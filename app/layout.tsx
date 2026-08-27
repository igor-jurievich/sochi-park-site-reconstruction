import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Квартиры в ЖК «Сочи Парк» — Объединённый отдел продаж',
  description: 'Подборка студий, 1- и 2-комнатных квартир в ЖК «Сочи Парк». Планировки, актуальные цены и условия покупки.',
  icons: { icon: '/icon.ico' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    title: 'Квартиры в ЖК «Сочи Парк» — Объединённый отдел продаж',
    description: 'Студии, 1- и 2-комнатные квартиры: планировки, актуальные цены и условия покупки.',
    images: ['/backgrounds/video-bg.webp'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
