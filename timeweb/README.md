# Timeweb release for sochipark23.ru

Run `npm run build:timeweb`. Upload the *contents* of `out/` into the site's
`public_html` directory.

The Bitrix24 webhook is deliberately not part of that build. On Timeweb, create
a directory named `private` next to `public_html`, copy
`timeweb/private/sochi-park-lead-config.php.example` to
`private/sochi-park-lead-config.php`, and set the existing `bitrix24_webhook_url`
there. The public endpoint is `https://sochipark23.ru/api/lead.php`.

Only issue the free SSL certificate before uploading `.htaccess`: it enforces
HTTPS and redirects `www` to the canonical domain.
