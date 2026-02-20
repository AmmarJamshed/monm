# MonM — Secure Messaging PWA

**"People say WhatsApp me → People say MonM me"**

Privacy-first, traceable, anti-leak messaging. Zero blockchain exposure for users.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Configure Environment
```powershell
# Copy .env.example to .env (or edit D:\monm\.env)
# Add your API keys: POLYGON_RPC_KEY, WEB3_STORAGE_TOKEN, GROQ_API_KEY, SERP_API_KEY
# Optional: BLOCKCHAIN_SIGNER_PRIVATE_KEY for audit logging
```

### 2. Install & Run
```powershell
# Initialize database
cd D:\monm\backend
npm install
node scripts/init-db.js

# Start backend (Terminal 1)
npm run dev

# Start frontend (Terminal 2)
cd D:\monm\frontend
npm install
npm run dev
```

### 3. Open PWA
Navigate to `http://localhost:3000` — Sign up with name + phone, then install as PWA when prompted.

---

## Project Structure

```
monm/
├── frontend/     # Next.js PWA
├── backend/      # Node.js API + WebSocket
├── contracts/    # Solidity (Polygon Amoy)
├── ai-engine/    # Groq + SERP pipelines
├── deployment/   # Deploy scripts
└── docs/         # Architecture, API, security
```

---

## Security

- **No wallets** — Users never see blockchain
- **Custodial signing** — Server holds audit keys
- **E2E encryption** — AES-256 for messages
- **Zero plaintext** — Encrypted at rest

---

## License

Proprietary — MonM MVP
