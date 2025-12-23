# Narrafied Frontend

Landing experience for Narrafied: upload books, dramatize them into cinematic audio, and stream anywhere. Built with HTML5, CSS3, and TypeScript.

## Quick start

```bash
npm install
npm run build
npx http-server .   # or serve index.html with your preferred static server
```

The compiled JS lives in `dist/main.js`. Rebuild after making changes in `src/`.

## Project structure

- `index.html` — landing page + auth modals
- `styles.css` — theme and layout
- `src/main.ts` — API client, modal/auth handlers, UI interactions
- `dist/` — compiled JS (ignored in git; generated via `npm run build`)
- `FRONTEND_API_ARCHITECTURE.md` — backend endpoint reference

## Deployment (GitHub Actions + SSH)

A lightweight CI/CD pipeline is included at `.github/workflows/deploy.yml`. It:
1) Checks out code
2) Installs deps + builds TypeScript
3) Bundles `index.html`, `styles.css`, and `dist/`
4) Ships them to the server via SSH/SCP

### Required GitHub secrets

Add these in the repo settings (`Settings → Secrets and variables → Actions`):
- `DO_SSH_HOST` — e.g. `68.183.22.205`
- `DO_SSH_USER` — e.g. `root`
- `DO_SSH_KEY` — private key with access to the server (matching the public key on the box)
- Optional: `DEPLOY_PATH` — target directory (default `/var/www/narrafied`)

### Server expectations

The workflow will create the deploy path if missing (defaults to `/var/www/narrafied`) and extract files there. Nginx should serve that directory. Update the path in the workflow if you prefer a different location.

### Manual deploy

If you need to deploy manually:
```bash
npm run build
tar -czf site.tar.gz index.html styles.css dist
scp site.tar.gz root@68.183.22.205:/var/www/narrafied/
ssh root@68.183.22.205 "cd /var/www/narrafied && tar -xzf site.tar.gz && rm site.tar.gz"
```

## API base

The frontend auto-targets:
- `http://localhost:8080` when running locally
- `https://narrafied.com` in production

## License

MIT
