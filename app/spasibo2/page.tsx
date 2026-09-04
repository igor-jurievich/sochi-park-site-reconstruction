import { ThankYouPage } from '@/components/ThankYouPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  alternates: { canonical: '/' },
};

export default function AutoQuizThankYou() {
  return <ThankYouPage />;
}
