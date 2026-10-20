# Node.js API starter (Fastify)

[![Deploy on Weblines](https://img.shields.io/badge/Deploy%20on-Weblines-25e07a?style=for-the-badge)](https://console.weblines.ir/deploy?repo=https://github.com/weblines-cloud/node-api)

A minimal Node.js + Fastify starter, ready to deploy on [Weblines Cloud](https://weblines.ir).

- Listens on `0.0.0.0` and the `PORT` env var (default `3000`), which is what Weblines expects.
- `GET /health` answers `200` for health checks.
- Builds from the `Dockerfile` in this repo.
- Set `GREETING` in the app's environment variables to see `/api/greeting` change.
## Deploy

Click **Deploy on Weblines** above, or in the console: **New service → Custom app → Git repo**, paste `https://github.com/weblines-cloud/node-api`, keep port `3000`.

## Run locally

```bash
npm install
npm run dev
```

---

<div dir="rtl">

## قالبِ API با Node.js (Fastify)

قالبِ آماده‌ی Node.js + Fastify برای دیپلوی روی [ابر وب‌لاینز](https://weblines.ir).

- روی `0.0.0.0` و پورتِ متغیرِ `PORT` گوش می‌دهد (پیش‌فرض `3000`)؛ همان چیزی که وب‌لاینز انتظار دارد.
- مسیرِ `/health` برای بررسیِ سلامت جوابِ `200` می‌دهد.
- با `Dockerfile` ِ همین ریپو build می‌شود.
- متغیرِ `GREETING` را در تنظیماتِ اپ بگذارید تا خروجیِ `/api/greeting` عوض شود.
### دیپلوی

روی دکمه‌ی **Deploy on Weblines** بزنید، یا در کنسول: **سرویس جدید ← اپلیکیشن ← گیت**، آدرسِ `https://github.com/weblines-cloud/node-api` را بدهید و پورت را `3000` بگذارید.

</div>

