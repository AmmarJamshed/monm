# MonM System Architecture

**MonM** — Privacy-first, traceable, anti-leak secure messaging PWA.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MONM PWA (Next.js)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│  │   Chats     │ │   Media    │ │   Settings  │ │   Leak Alerts       │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │
│                              │                                           │
│                    WebSocket │ HTTPS                                     │
└──────────────────────────────┼───────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS API GATEWAY                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                   │
│  │ REST APIs     │ │ WebSocket     │ │ Auth Layer    │                   │
│  └───────────────┘ └───────────────┘ └───────────────┘                   │
│                              │                                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                   │
│  │ Encryption    │ │ IPFS Client   │ │ Blockchain    │                   │
│  │ (AES/RSA)     │ │ (web3.storage)│ │ Signer        │                   │
│  └───────────────┘ └───────────────┘ └───────────────┘                   │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────────┐    ┌───────────────────┐
│ SQLite/       │    │ AI Moderation      │    │ SERP Leak          │
│ PostgreSQL    │    │ (Groq API)         │    │ Scanner            │
│ D:\monm\db\   │    │                    │    │ (SERP API)        │
└───────────────┘    └───────────────────┘    └───────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              POLYGON AMOY TESTNET (Invisible to Users)                   │
│  MessageHashRegistry | FileFingerprintRegistry                           │
│  ForwardTraceRegistry | LeakEvidenceRegistry                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Message Send Flow
1. User types message → PWA
2. Client generates AES session key (or uses existing)
3. Message encrypted (AES-256-GCM)
4. WebSocket sends to backend
5. Backend hashes message → logs to blockchain
6. Backend stores encrypted payload in DB
7. Recipient receives via WebSocket, decrypts locally

### Media Upload Flow
1. User selects file/photo
2. Client encrypts blob
3. Upload to IPFS (web3.storage)
4. Fingerprint computed → blockchain registry
5. Invisible watermark embedded (steganography)

### Leak Detection Flow
1. Scheduled SERP scans (user phone/name/content hashes)
2. AI matching (Groq) for relevance
3. On match → LeakEvidenceRegistry on blockchain
4. User notified in-app

---

## Security Layers

| Layer | Technology |
|-------|------------|
| Transport | TLS 1.3, WSS |
| Message | AES-256-GCM |
| Key Exchange | RSA-2048 |
| Storage | Encrypted SQLite |
| Audit | Polygon Amoy (immutable) |
| Fingerprint | Steganographic watermark |

---

## File System Policy

All runtime data **ONLY** at `D:\monm\`:

- `db/` — SQLite database
- `logs/` — Application logs
- `uploads/` — Temporary upload buffers
- `tmp/` — Temp files
- `keys/` — Server-side custodial keys (encrypted)

**NEVER** use `C:\` for data storage.
