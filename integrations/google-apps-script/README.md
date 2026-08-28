# Google Sheets backup endpoint

The site sends each lead to Bitrix24 first and then posts the same record to a protected Google Apps Script web app. The script appends exactly 26 cells to the `Заявки сайта` tab in spreadsheet `1SomD-zVVvQ6zD_1A1avW0RXoT9ID1GQxs2TlNEwIPUE`.

## One-time deployment

1. Open the spreadsheet and choose **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of this folder's `Code.gs`.
3. In **Project settings → Script properties**, add `INGEST_SECRET` with a long random value.
4. Choose **Deploy → New deployment → Web app**.
5. Execute as the spreadsheet owner; allow access to anyone who has the endpoint.
6. Copy the final `/exec` URL.
7. Store the URL as `GOOGLE_SHEETS_WEBHOOK_URL` and the same secret as `GOOGLE_SHEETS_WEBHOOK_SECRET` in the hosting environment.

The secret must never be placed in browser code. Formula-like values are escaped before appending to prevent spreadsheet formula injection.
