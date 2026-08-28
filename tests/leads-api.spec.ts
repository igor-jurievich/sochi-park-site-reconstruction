import { expect, test } from '@playwright/test';
import { POST } from '../app/api/leads/route';

test('an autofilled legacy honeypot never causes a silent successful drop', async () => {
  const originalFetch = globalThis.fetch;
  const originalBitrixUrl = process.env.BITRIX24_WEBHOOK_URL;
  const originalSheetUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const originalSheetSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  const calls: string[] = [];

  process.env.BITRIX24_WEBHOOK_URL = 'https://bitrix.test/rest/';
  process.env.GOOGLE_SHEETS_WEBHOOK_URL = 'https://sheets.test/exec';
  process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = 'test-secret';
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('https://bitrix.test/')) {
      return Response.json({ result: 987654 });
    }
    if (url === 'https://sheets.test/exec') {
      return Response.json({ ok: true });
    }
    return Response.json({ error: 'unexpected URL' }, { status: 500 });
  };

  try {
    const request = new Request('https://landing.test/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://landing.test', host: 'landing.test' },
      body: JSON.stringify({
        leadId: 'mobile-autofill-test', purpose: 'Жить на море', rooms: 'Студия', finish: 'Ремонт',
        promo: 'Без первого взноса', gift: 'Турция — отель 5★ на неделю', messenger: 'telegram',
        countryCode: '+7', phone: '9123456789', name: 'Тест', block: 'Первый экран / Для жизни',
        apartmentCount: 13, consent: true, website: 'autofilled-by-mobile-browser.example', attribution: {},
      }),
    });
    const response = await POST(request);
    const result = await response.json() as { ok: boolean; bitrixLeadId?: string; sheetStored?: boolean };

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true, bitrixLeadId: '987654', sheetStored: true });
    expect(calls).toEqual([
      'https://bitrix.test/rest/crm.lead.add.json',
      'https://sheets.test/exec',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.BITRIX24_WEBHOOK_URL = originalBitrixUrl;
    process.env.GOOGLE_SHEETS_WEBHOOK_URL = originalSheetUrl;
    process.env.GOOGLE_SHEETS_WEBHOOK_SECRET = originalSheetSecret;
  }
});
