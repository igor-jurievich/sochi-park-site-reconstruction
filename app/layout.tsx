import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Квартиры в ЖК Сочи Парк от застройщика Еврострой, студии, одно и двух комнатные квартиры с ремонтом и без',
  description: 'Квартиры в Сочи от 8 млн ₽ — ЖК Сочи Парк. Море в 10 минутах, ремонт от застройщика, рассрочка от 20 000 ₽/мес. Акция — всего 5 квартир!',
  icons: { icon: '/icon.ico' },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    title: 'Квартиры в ЖК Сочи Парк от застройщика Еврострой',
    description: 'Студии, 1- и 2-комнатные квартиры с ремонтом и без. Рассрочка от 20 000 ₽/мес.',
    images: ['/backgrounds/video-bg.webp'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
