# MonM Setup Guide

## 1. Add API Keys to `.env`

Edit `D:\monm\.env` and add your keys:

```
POLYGON_RPC_KEY=your_key
WEB3_STORAGE_TOKEN=your_token
GROQ_API_KEY=your_key
SERP_API_KEY=your_key
```

For blockchain audit logging (optional):

```
BLOCKCHAIN_SIGNER_PRIVATE_KEY=0x...
```

You need a Polygon Amoy testnet wallet with MATIC. Create one at https://faucet.polygon.technology/

## 2. Deploy Smart Contracts (Optional)

```powershell
cd D:\monm\contracts
npm install
npx hardhat compile
# Add DEPLOYER_PRIVATE_KEY to .env
npx hardhat run scripts/deploy.js --network amoy
```

This creates `backend/src/config/contract-addresses.json` with deployed addresses.

## 3. Run Development

**Terminal 1 – Backend:**
```powershell
cd D:\monm\backend
node scripts/init-db.js   # First time only
npm run dev
```

**Terminal 2 – Frontend:**
```powershell
cd D:\monm\frontend
npm run dev
```

**Browser:** Open http://localhost:3000

## 4. Test Flow

1. Sign up with name + phone (e.g. "Alice", "+1234567890")
2. In another browser/incognito, sign up as "Bob", "+0987654321"
3. As Alice: New Chat → Search "Bob" → Start Chat
4. Send encrypted messages
5. Log in as Bob in the other window to see the conversation

## Data Locations (D:\monm\)

| Path | Purpose |
|------|---------|
| db/ | SQLite database |
| logs/ | Application logs |
| uploads/ | Temporary upload buffers |
| tmp/ | Temp files |
| keys/ | Server-side keys (when used) |
