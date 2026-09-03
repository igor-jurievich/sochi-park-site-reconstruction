import { permanentRedirect } from 'next/navigation';

export default function LegacyGiftPage() {
  permanentRedirect('/');
}
