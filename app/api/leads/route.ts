type Attribution = {
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  utmTerm?: unknown;
  avitoCampaignId?: unknown;
  avitoAdGroupId?: unknown;
  avitoAdId?: unknown;
  avitoClickId?: unknown;
  avitoErid?: unknown;
  landingUrl?: unknown;
  referrer?: unknown;
};

type IncomingLead = {
  leadId?: unknown;
  purpose?: unknown;
  rooms?: unknown;
  finish?: unknown;
  promo?: unknown;
  gift?: unknown;
  messenger?: unknown;
  countryCode?: unknown;
  phone?: unknown;
  name?: unknown;
  block?: unknown;
  apartmentCount?: unknown;
  consent?: unknown;
  isTest?: unknown;
  attribution?: Attribution;
};

const rateBuckets = new Map<string, number[]>();
const rateWindowMs = 10 * 60 * 1000;
const rateLimit = 6;

function cleanText(value: unknown, maxLength = 500) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength) : '';
}

function normalizeMessenger(value: unknown) {
  const messenger = cleanText(value, 40).toLowerCase();
  return ({ telegram: 'Telegram', whatsapp: 'WhatsApp', max: 'Max' } as Record<string, string>)[messenger] || cleanText(value, 40);
}

function bitrixText(value: string) {
  return Array.from(value).filter((character) => (character.codePointAt(0) || 0) <= 0xFFFF && character !== '\uFE0F').join('');
}

function maskIp(value: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return value.split('.').slice(0, 3).concat('0').join('.');
  if (value.includes(':')) return `${value.split(':').slice(0, 4).join(':')}::`;
  return '';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateBuckets.get(ip) || []).filter((time) => now - time < rateWindowMs);
  recent.push(now);
  rateBuckets.set(ip, recent);
  return recent.length > rateLimit;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

function normalizeLead(body: IncomingLead) {
  const countryCode = cleanText(body.countryCode, 5);
  const phone = cleanText(body.phone, 15).replace(/\D/g, '');
  const rawAttribution = body.attribution || {};
  return {
    leadId: cleanText(body.leadId, 80),
    purpose: cleanText(body.purpose), rooms: cleanText(body.rooms), finish: cleanText(body.finish), promo: cleanText(body.promo),
    gift: cleanText(body.gift), messenger: normalizeMessenger(body.messenger), countryCode, phone,
    fullPhone: `${countryCode}${phone}`,
    name: cleanText(body.name, 120), block: cleanText(body.block, 200),
    apartmentCount: Number.isFinite(Number(body.apartmentCount)) ? Math.max(0, Math.min(100, Number(body.apartmentCount))) : 0,
    consent: body.consent === true,
    isTest: body.isTest === true,
    attribution: {
      utmSource: cleanText(rawAttribution.utmSource, 200), utmMedium: cleanText(rawAttribution.utmMedium, 200),
      utmCampaign: cleanText(rawAttribution.utmCampaign, 300), utmContent: cleanText(rawAttribution.utmContent, 300),
      utmTerm: cleanText(rawAttribution.utmTerm, 300), avitoCampaignId: cleanText(rawAttribution.avitoCampaignId, 200),
      avitoAdGroupId: cleanText(rawAttribution.avitoAdGroupId, 200), avitoAdId: cleanText(rawAttribution.avitoAdId, 200),
      avitoClickId: cleanText(rawAttribution.avitoClickId, 500), avitoErid: cleanText(rawAttribution.avitoErid, 500),
      landingUrl: cleanText(rawAttribution.landingUrl, 1500), referrer: cleanText(rawAttribution.referrer, 1500),
    },
  };
}

function buildComment(data: ReturnType<typeof normalizeLead>, createdAt: string) {
  const a = data.attribution;
  return [
    'Заявка с сайта ЖК «Сочи Парк»', '',
    `Lead ID: ${data.leadId}`,
    `Дата: ${createdAt}`,
    `Страница: ${a.landingUrl || 'не определена'}`,
    `Блок / триггер: ${data.block || 'не определён'}`, '',
    `Цель покупки: ${data.purpose || 'не указана'}`,
    `Комнатность: ${data.rooms || 'не указана'}`,
    `Отделка: ${data.finish || 'не указана'}`,
    `Выбранная акция: ${data.promo || 'не указана'}`,
    `Подарок: ${data.gift || 'нет'}`,
    `Найдено квартир в квизе: ${data.apartmentCount || 'не указано'}`,
    `Мессенджер: ${data.messenger || 'не указан'}`, '',
    `UTM source: ${a.utmSource || '—'}`,
    `UTM medium: ${a.utmMedium || '—'}`,
    `UTM campaign: ${a.utmCampaign || '—'}`,
    `UTM content: ${a.utmContent || '—'}`,
    `UTM term: ${a.utmTerm || '—'}`,
    `Avito campaign ID: ${a.avitoCampaignId || '—'}`,
    `Avito ad group ID: ${a.avitoAdGroupId || '—'}`,
    `Avito ad ID: ${a.avitoAdId || '—'}`,
    `Avito click ID: ${a.avitoClickId || '—'}`,
    `Avito erid: ${a.avitoErid || '—'}`,
    `Referrer: ${a.referrer || '—'}`,
  ].join('\n');
}

async function createBitrixLead(data: ReturnType<typeof normalizeLead>, comment: string) {
  const base = process.env.BITRIX24_WEBHOOK_URL?.trim();
  if (!base) throw new Error('Bitrix24 webhook is not configured');
  const url = `${base.replace(/\/+$/, '')}/crm.lead.add.json`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      fields: {
        TITLE: bitrixText(`${data.isTest ? '[ТЕСТ] ' : ''}Заявка с сайта — ${data.purpose || 'подбор квартиры'}`),
        NAME: bitrixText(data.name || 'Не указано'),
        PHONE: [{ VALUE: data.fullPhone, VALUE_TYPE: 'MOBILE' }],
        SOURCE_ID: 'WEB',
        SOURCE_DESCRIPTION: bitrixText(`Сайт ЖК «Сочи Парк» · ${data.block || 'квиз'}`),
        COMMENTS: bitrixText(comment),
        UTM_SOURCE: bitrixText(data.attribution.utmSource),
        UTM_MEDIUM: bitrixText(data.attribution.utmMedium),
        UTM_CAMPAIGN: bitrixText(data.attribution.utmCampaign),
        UTM_CONTENT: bitrixText(data.attribution.utmContent),
        UTM_TERM: bitrixText(data.attribution.utmTerm),
        OPENED: 'Y',
      },
      params: { REGISTER_SONET_EVENT: 'Y' },
    }),
  });
  const result = await response.json().catch(() => null) as { result?: number | string; error?: string; error_description?: string } | null;
  if (!response.ok || !result?.result) throw new Error(result?.error_description || result?.error || `Bitrix24 HTTP ${response.status}`);
  return String(result.result);
}

async function appendGoogleSheet(row: string[]) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();
  if (!url || !secret) return { configured: false, ok: false };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ secret, row }),
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
  if (!response.ok || !result?.ok) throw new Error(result?.error || `Google Sheets HTTP ${response.status}`);
  return { configured: true, ok: true };
}

function logLeadEvent(event: string, details: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ scope: 'lead-delivery', event, ...details }));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    logLeadEvent('request_rejected', { reason: 'origin' });
    return Response.json({ ok: false, error: 'Недопустимый источник запроса' }, { status: 403 });
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 32_000) {
    logLeadEvent('request_rejected', { reason: 'payload_too_large', contentLength });
    return Response.json({ ok: false, error: 'Слишком большой запрос' }, { status: 413 });
  }

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    logLeadEvent('request_rejected', { reason: 'rate_limit' });
    return Response.json({ ok: false, error: 'Слишком много запросов. Попробуйте позже.' }, { status: 429 });
  }

  let body: IncomingLead;
  try { body = await request.json() as IncomingLead; } catch {
    logLeadEvent('request_rejected', { reason: 'invalid_json' });
    return Response.json({ ok: false, error: 'Некорректный запрос' }, { status: 400 });
  }
  const data = normalizeLead(body);
  logLeadEvent('request_received', { leadId: data.leadId, block: data.block || 'не определён', hasAvitoClickId: Boolean(data.attribution.avitoClickId) });
  if (!data.leadId || !data.consent || !/^\+\d{8,15}$/.test(data.fullPhone)) {
    logLeadEvent('request_rejected', { leadId: data.leadId, reason: 'validation' });
    return Response.json({ ok: false, error: 'Проверьте номер телефона и согласие на обработку данных' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const comment = buildComment(data, createdAt);
  let bitrixLeadId = '';
  let bitrixError = '';
  const bitrixConfigured = Boolean(process.env.BITRIX24_WEBHOOK_URL?.trim());
  if (bitrixConfigured) {
    try {
      bitrixLeadId = await createBitrixLead(data, comment);
      logLeadEvent('bitrix_created', { leadId: data.leadId, bitrixLeadId });
    } catch (error) {
      bitrixError = errorMessage(error, 'Неизвестная ошибка Bitrix24');
      logLeadEvent('bitrix_failed', { leadId: data.leadId, error: bitrixError });
    }
  }

  const device = `${maskIp(ip)} · ${cleanText(request.headers.get('user-agent'), 350)}`;
  const a = data.attribution;
  const row = [
    data.leadId, createdAt, bitrixLeadId ? 'Создан в Bitrix24' : bitrixConfigured ? 'Ошибка Bitrix24' : 'Bitrix24 не настроен', bitrixLeadId,
    data.name, data.fullPhone, data.messenger, a.landingUrl, data.block, data.purpose, data.rooms, data.finish,
    data.promo, data.gift, a.utmSource, a.utmMedium, a.utmCampaign, a.utmContent, a.utmTerm,
    a.avitoCampaignId, a.avitoAdGroupId, a.avitoAdId, a.avitoClickId, a.referrer, device,
    bitrixError || comment,
  ];

  let sheetStored = false;
  let sheetConfigured = false;
  try {
    const sheetResult = await appendGoogleSheet(row);
    sheetStored = sheetResult.ok;
    sheetConfigured = sheetResult.configured;
    logLeadEvent(sheetStored ? 'sheet_stored' : 'sheet_not_configured', { leadId: data.leadId, bitrixLeadId });
  } catch (error) {
    logLeadEvent('sheet_failed', { leadId: data.leadId, bitrixLeadId, error: errorMessage(error, 'Неизвестная ошибка Google Sheets') });
  }

  if (!bitrixLeadId && !sheetStored) {
    logLeadEvent('request_failed', { leadId: data.leadId, bitrixConfigured, sheetConfigured, sheetStored });
    return Response.json({ ok: false, error: 'Не удалось передать заявку менеджеру. Попробуйте ещё раз.', leadId: data.leadId, sheetStored }, { status: 502 });
  }

  logLeadEvent('request_succeeded', { leadId: data.leadId, bitrixLeadId, sheetStored });
  return Response.json({ ok: true, leadId: data.leadId, bitrixLeadId, sheetStored });
}
