# NYTO Venue Portal (`venue-web`)

Partner floor for approved venues: **Tonight · Door · Nights · Menus**.

- Port **3002**
- Auth: email OTP · role `VENUE_STAFF` (or `ADMIN`)
- Tenancy: only venues assigned via `VenueStaff`
- API: `GET/POST /venue/*` (backend)

## Demo (mock — no API required)

```bash
cd venue-web
npm install
# .env.local already has NEXT_PUBLIC_AUTH_MODE=mock
npm run dev
```

Open http://localhost:3002  
Login: `venue@nyto.app` · code `123456`  
Door demo codes: `AK7M2P`, `CX1N8T`, `DH3W5Y`

## Live against backend

```bash
# backend .env — add venue OTP destination:
# OTP_TEST_DESTINATIONS="...,venue@nyto.app:123456"

cd backend && npm run seed   # attaches venue@nyto.app → Ameerpet Kitchen (PARTNER)
cd ../venue-web
# set NEXT_PUBLIC_AUTH_MODE=live in .env.local
npm run dev
```
