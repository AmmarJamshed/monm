# MonM Security Checklist

## MVP Status

| Feature | Status | Notes |
|---------|--------|-------|
| E2E Message Encryption | ✅ | AES-256-GCM, client-side |
| Key Derivation | ✅ | PBKDF2, deterministic for MVP |
| No plaintext storage | ✅ | Backend stores only ciphertext |
| Blockchain audit | ✅ | Message hashes on Polygon Amoy |
| JWT auth | ✅ | 7d expiry |
| CORS | ✅ | PWA origin only |
| Helmet | ✅ | Security headers |

## Production TODO

- [ ] Proper E2E key exchange (X3DH / Signal-style)
- [ ] BLOCKCHAIN_SIGNER_PRIVATE_KEY in HSM/secure vault
- [ ] Rate limiting
- [ ] CAPTCHA on signup
- [ ] Phone verification (optional)
- [ ] Invisible watermark pipeline
- [ ] SERP scan scheduler
- [ ] IPFS media + fingerprint registry

## API Key Security

- **Never** commit `.env` or real API keys
- Use environment variables in production
- Rotate keys if exposed
