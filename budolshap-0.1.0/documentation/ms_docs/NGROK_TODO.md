# TODO: Ngrok & Local Development Setup

## ✅ Completed
- [x] Install Ngrok binary (`c:\laragon\bin\ngrok\ngrok.exe`).
- [x] Add Ngrok auth token (`35sssFR77x8M1hvEcJj4xsBB2Nj_Zg24C18JHDFr2Asfooi5`).
- [x] Verify Next.js dev server runs on `http://localhost:3000`.
- [x] Start Ngrok tunnel (`c:\laragon\bin\ngrok\ngrok.exe http 3000`).
- [x] Verify public URL (`https://<random>.ngrok-free.dev`).
- [x] Check Ngrok web UI at `http://127.0.0.1:4040`.

## 🔧 Pending / Future Tasks
### 1️⃣ Automation & Scripts
- [ ] Create an npm script `npm run tunnel` that launches Ngrok automatically after the dev server starts.
- [ ] Add a Windows batch file `start-dev-and-tunnel.bat` to open two terminals (dev server + Ngrok) with a single click.

### 2️⃣ Production & Deployment
- [ ] Set up a permanent Ngrok subdomain (requires paid plan) for stable webhook URLs.
- [ ] Add environment variable `NGROK_URL` to `.env` and populate it dynamically after tunnel starts.
- [ ] Update CI/CD pipeline to spin up Ngrok for integration tests.

### 3️⃣ Security & Monitoring
- [ ] Restrict Ngrok tunnel access with HTTP basic auth (`ngrok http 3000 --auth "user:pass"`).
- [ ] Enable request logging to a file for audit purposes.
- [ ] Configure Ngrok alerts for unexpected traffic spikes.

### 4️⃣ Documentation & Knowledge Transfer
- [ ] Add a section in `README.md` linking to this TODO file.
- [ ] Record a short screen‑capture video of the full workflow (dev server → Ngrok → public URL).
- [ ] Create a Confluence page (or internal wiki) summarizing the steps for new team members.

### 5️⃣ Cleanup & Maintenance
- [ ] Periodically prune old Ngrok tunnels (`ngrok kill` or `ngrok disconnect`).
- [ ] Review and update the auth token if it expires or is rotated.
- [ ] Verify that the `NGROK_SETUP.md` documentation stays in sync with any script changes.

---


