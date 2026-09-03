<?php
declare(strict_types=1);

/**
 * Timeweb shared-hosting relay for Sochi Park quiz leads.
 *
 * Install as public_html/api/lead.php. The Bitrix24 webhook must live only in
 * ../private/sochi-park-lead-config.php, outside public_html.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, max-age=0');

function respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_string(mixed $value, int $limit = 500): string {
    if (!is_string($value)) return '';
    $value = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $value) ?? '';
    return mb_substr(trim($value), 0, $limit);
}

function clean_attribution(mixed $value): array {
    $value = is_array($value) ? $value : [];
    return [
        'utmSource' => clean_string($value['utmSource'] ?? '', 200),
        'utmMedium' => clean_string($value['utmMedium'] ?? '', 200),
        'utmCampaign' => clean_string($value['utmCampaign'] ?? '', 300),
        'utmContent' => clean_string($value['utmContent'] ?? '', 300),
        'utmTerm' => clean_string($value['utmTerm'] ?? '', 300),
        'avitoCampaignId' => clean_string($value['avitoCampaignId'] ?? '', 200),
        'avitoAdGroupId' => clean_string($value['avitoAdGroupId'] ?? '', 200),
        'avitoAdId' => clean_string($value['avitoAdId'] ?? '', 200),
        'avitoClickId' => clean_string($value['avitoClickId'] ?? '', 500),
        'avitoErid' => clean_string($value['avitoErid'] ?? '', 500),
        'landingUrl' => clean_string($value['landingUrl'] ?? '', 1500),
        'referrer' => clean_string($value['referrer'] ?? '', 1500),
    ];
}

function client_ip(): string {
    return clean_string($_SERVER['REMOTE_ADDR'] ?? 'unknown', 80);
}

function rate_limited(): bool {
    $file = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sochi-park-lead-rate-limit.json';
    $key = hash('sha256', client_ip());
    $now = time();
    $handle = @fopen($file, 'c+');
    if ($handle === false) return false;

    flock($handle, LOCK_EX);
    $raw = stream_get_contents($handle);
    $entries = is_string($raw) ? json_decode($raw, true) : [];
    $entries = is_array($entries) ? $entries : [];
    foreach ($entries as $entryKey => $times) {
        $entries[$entryKey] = array_values(array_filter(is_array($times) ? $times : [], static fn ($time) => is_int($time) && $now - $time < 600));
        if (!$entries[$entryKey]) unset($entries[$entryKey]);
    }
    $entries[$key] = $entries[$key] ?? [];
    $entries[$key][] = $now;
    $limited = count($entries[$key]) > 6;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($entries));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

function normalize_phone(string $countryCode, mixed $value): string {
    $digits = preg_replace('/\D/', '', clean_string($value, 30)) ?? '';
    if ($countryCode === '+7') return preg_match('/^9\d{9}$/', $digits) ? '+7' . $digits : '';
    if (!in_array($countryCode, ['+375', '+380'], true)) return '';
    return strlen($digits) >= 7 && strlen($digits) <= 12 ? $countryCode . $digits : '';
}

function messenger_name(mixed $value): string {
    $raw = strtolower(clean_string($value, 40));
    return ['telegram' => 'Telegram', 'whatsapp' => 'WhatsApp', 'max' => 'Max'][$raw] ?? '';
}

function bitrix_text(string $value): string {
    return preg_replace('/[\x{10000}-\x{10FFFF}\x{FE0F}]/u', '', $value) ?? '';
}

function post_json(string $url, array $payload): array {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) return [0, null];
    $handle = curl_init($url);
    if ($handle === false) return [0, null];
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $json,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    $response = curl_exec($handle);
    $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    return [$status, is_string($response) ? json_decode($response, true) : null];
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(405, ['ok' => false, 'error' => 'Метод не поддерживается.']);
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 32000) respond(413, ['ok' => false, 'error' => 'Слишком большой запрос.']);
if (rate_limited()) respond(429, ['ok' => false, 'error' => 'Слишком много попыток. Попробуйте немного позже.']);

$raw = file_get_contents('php://input');
$payload = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($payload)) respond(400, ['ok' => false, 'error' => 'Некорректный формат заявки.']);
if (clean_string($payload['website'] ?? '')) respond(200, ['ok' => true]);

$leadId = clean_string($payload['leadId'] ?? '', 80);
$countryCode = clean_string($payload['countryCode'] ?? '', 5);
$phone = normalize_phone($countryCode, $payload['phone'] ?? '');
$messenger = messenger_name($payload['messenger'] ?? '');
if ($leadId === '' || $phone === '' || $messenger === '' || ($payload['consent'] ?? false) !== true) {
    respond(400, ['ok' => false, 'error' => 'Проверьте номер телефона, мессенджер и согласие на обработку данных.']);
}

$configPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'private' . DIRECTORY_SEPARATOR . 'sochi-park-lead-config.php';
if (!is_file($configPath)) {
    error_log('Sochi Park lead endpoint: private configuration is missing.');
    respond(503, ['ok' => false, 'error' => 'Сервис временно недоступен. Попробуйте ещё раз.']);
}
$config = require $configPath;
$webhook = is_array($config) ? clean_string($config['bitrix24_webhook_url'] ?? '', 1000) : '';
if ($webhook === '') {
    error_log('Sochi Park lead endpoint: Bitrix24 webhook is missing.');
    respond(503, ['ok' => false, 'error' => 'Сервис временно недоступен. Попробуйте ещё раз.']);
}

$attribution = clean_attribution($payload['attribution'] ?? []);
$createdAt = gmdate('c');
$purpose = clean_string($payload['purpose'] ?? '');
$rooms = clean_string($payload['rooms'] ?? '');
$finish = clean_string($payload['finish'] ?? '');
$promo = clean_string($payload['promo'] ?? '');
$gift = clean_string($payload['gift'] ?? '');
$block = clean_string($payload['block'] ?? '', 200) ?: 'Квиз';
$apartmentCount = min(100, max(0, (int) ($payload['apartmentCount'] ?? 0)));
$comment = implode("\n", [
    'Заявка с сайта ЖК «Сочи Парк»',
    '',
    "Lead ID: {$leadId}",
    "Дата: {$createdAt}",
    'Страница: ' . ($attribution['landingUrl'] ?: 'не определена'),
    "Блок / триггер: {$block}",
    '',
    'Цель покупки: ' . ($purpose ?: 'не указана'),
    'Комнатность: ' . ($rooms ?: 'не указана'),
    'Отделка: ' . ($finish ?: 'не указана'),
    'Выбранная акция: ' . ($promo ?: 'не указана'),
    'Подарок: ' . ($gift ?: 'нет'),
    'Найдено квартир в квизе: ' . ($apartmentCount ?: 'не указано'),
    "Мессенджер: {$messenger}",
    '',
    'UTM source: ' . ($attribution['utmSource'] ?: '—'),
    'UTM medium: ' . ($attribution['utmMedium'] ?: '—'),
    'UTM campaign: ' . ($attribution['utmCampaign'] ?: '—'),
    'UTM content: ' . ($attribution['utmContent'] ?: '—'),
    'UTM term: ' . ($attribution['utmTerm'] ?: '—'),
    'Avito campaign ID: ' . ($attribution['avitoCampaignId'] ?: '—'),
    'Avito ad group ID: ' . ($attribution['avitoAdGroupId'] ?: '—'),
    'Avito ad ID: ' . ($attribution['avitoAdId'] ?: '—'),
    'Avito click ID: ' . ($attribution['avitoClickId'] ?: '—'),
    'Avito erid: ' . ($attribution['avitoErid'] ?: '—'),
    'Referrer: ' . ($attribution['referrer'] ?: '—'),
]);

[$status, $result] = post_json(rtrim($webhook, '/') . '/crm.lead.add.json', [
    'fields' => [
        'TITLE' => bitrix_text('Заявка с сайта — ' . ($purpose ?: 'подбор квартиры')),
        'NAME' => 'Не указано',
        'PHONE' => [['VALUE' => $phone, 'VALUE_TYPE' => 'MOBILE']],
        'SOURCE_ID' => 'WEB',
        'SOURCE_DESCRIPTION' => bitrix_text('Сайт ЖК «Сочи Парк» · ' . $block),
        'COMMENTS' => bitrix_text($comment),
        'UTM_SOURCE' => bitrix_text($attribution['utmSource']),
        'UTM_MEDIUM' => bitrix_text($attribution['utmMedium']),
        'UTM_CAMPAIGN' => bitrix_text($attribution['utmCampaign']),
        'UTM_CONTENT' => bitrix_text($attribution['utmContent']),
        'UTM_TERM' => bitrix_text($attribution['utmTerm']),
        'OPENED' => 'Y',
    ],
    'params' => ['REGISTER_SONET_EVENT' => 'Y'],
]);

$bitrixLeadId = is_array($result) && isset($result['result']) ? (string) $result['result'] : '';
if ($status < 200 || $status >= 300 || $bitrixLeadId === '') {
    error_log('Sochi Park lead endpoint: Bitrix24 delivery failed for lead ' . $leadId . ' (HTTP ' . $status . ').');
    respond(502, ['ok' => false, 'error' => 'Не удалось передать заявку менеджеру. Попробуйте ещё раз.']);
}

respond(200, ['ok' => true, 'leadId' => $leadId, 'bitrixLeadId' => $bitrixLeadId]);
