# Deploy

## Recommended Host

Use Render for this app. It runs the Node server directly and supports a custom domain later.

## Why

- This site is not static-only. It needs the Node server in `server.js`.
- Lead submissions write to `data/leads.ndjson`, so production needs persistent storage.

## Render Steps

1. Push this repo to GitHub.
2. In Render, create a new Blueprint and point it at this repo.
3. Render will read `render.yaml`.
4. Deploy the web service.
5. After deploy, open the Render URL and verify:
   - `/`
   - `/listings.html`
   - `/health`
   - a test form submission
6. Add your custom domain later from the Render dashboard.

## Notes

- `LEADS_FILE` is configured to `/var/data/leads.ndjson` in `render.yaml`.
- The Render disk mount keeps leads across restarts and deploys.
- If you want email/CRM delivery instead of file storage later, that can be added separately.
