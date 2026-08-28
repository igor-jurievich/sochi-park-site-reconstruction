const SPREADSHEET_ID = '1SomD-zVVvQ6zD_1A1avW0RXoT9ID1GQxs2TlNEwIPUE';
const SHEET_NAME = 'Заявки сайта';
const COLUMN_COUNT = 26;

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function safeCell(value) {
  const stringValue = value == null ? '' : String(value).slice(0, 5000);
  return /^[=+\-@]/.test(stringValue) ? "'" + stringValue : stringValue;
}

function doPost(event) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const payload = JSON.parse((event && event.postData && event.postData.contents) || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('INGEST_SECRET');
    if (!expectedSecret || payload.secret !== expectedSecret) return jsonResponse({ ok: false, error: 'unauthorized' });
    if (!Array.isArray(payload.row) || payload.row.length !== COLUMN_COUNT) return jsonResponse({ ok: false, error: 'invalid_row' });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) return jsonResponse({ ok: false, error: 'sheet_not_found' });
    sheet.appendRow(payload.row.map(safeCell));
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message || error).slice(0, 300) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'sochi-park-leads' });
}
