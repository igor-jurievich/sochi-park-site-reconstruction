export type LeadPayload = {
  purpose: string;
  rooms: string;
  finish: string;
  promo: string;
  gift: string;
  messenger: string;
  countryCode: string;
  phone: string;
  block: string;
  apartmentCount: number;
  consent: boolean;
};

type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  avitoCampaignId: string;
  avitoAdGroupId: string;
  avitoAdId: string;
  avitoClickId: string;
  avitoErid: string;
  landingUrl: string;
  referrer: string;
};

const attributionStorageKey = 'oop-first-touch-attribution-v1';
const attributionMaxAgeMs = 90 * 24 * 60 * 60 * 1000;

function readAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const current: Attribution = {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmContent: params.get('utm_content') || '',
    utmTerm: params.get('utm_term') || '',
    avitoCampaignId: params.get('avito_campaign_id') || params.get('campaign_id') || '',
    avitoAdGroupId: params.get('avito_adgroup_id') || params.get('adgroup_id') || '',
    avitoAdId: params.get('avito_ad_id') || params.get('ad_id') || '',
    avitoClickId: params.get('avito_click_id') || params.get('click_id') || '',
    avitoErid: params.get('avito_erid') || params.get('erid') || '',
    landingUrl: window.location.href,
    referrer: document.referrer,
  };

  try {
    const saved = JSON.parse(window.localStorage.getItem(attributionStorageKey) || 'null') as { savedAt?: number; data?: Attribution } | null;
    if (saved?.savedAt && saved.data && Date.now() - saved.savedAt < attributionMaxAgeMs) return saved.data;
    window.localStorage.setItem(attributionStorageKey, JSON.stringify({ savedAt: Date.now(), data: current }));
  } catch {
    // Privacy-focused WebViews can disable storage. Current URL attribution
    // remains available for this submission.
  }

  return current;
}

function leadEndpoint() {
  if (process.env.NEXT_PUBLIC_LEAD_ENDPOINT) return process.env.NEXT_PUBLIC_LEAD_ENDPOINT;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname === 'sochipark23.ru' || hostname === 'www.sochipark23.ru' || hostname.endsWith('.tw1.ru')) return '/api/lead.php';
  return '/api/leads';
}

export async function submitLead(payload: LeadPayload) {
  const response = await fetch(leadEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...payload,
      leadId: crypto.randomUUID(),
      attribution: readAttribution(),
    }),
  });

  const result = await response.json().catch(() => null) as { ok?: boolean; error?: string; leadId?: string; bitrixLeadId?: string } | null;
  if (!response.ok || !result?.ok) throw new Error(result?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
  return result;
}
