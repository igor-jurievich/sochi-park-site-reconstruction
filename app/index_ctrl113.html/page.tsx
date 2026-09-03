import { permanentRedirect } from 'next/navigation';

export default function LegacyControlPage() {
  permanentRedirect('/');
}
