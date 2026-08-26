export type LeadPayload = {
  purpose: string;
  rooms: string;
  finish: string;
  promo: string;
  messenger: string;
  countryCode: string;
  phone: string;
  name?: string;
};

export async function submitLead(payload: LeadPayload) {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return { ok: true, payload, mode: 'local-mock' as const };
}
