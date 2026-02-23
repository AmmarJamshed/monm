# Media Storage — MonM

## Current Setup

- **Files**: Stored on the backend's persistent disk (`UPLOAD_PATH`, default `uploads/`).
- **Database**: SQLite. Media metadata in `media` table with `file_path` pointing to the file on disk.
- **Flow**: Upload → backend saves file → returns `media_id` → frontend sends message with encrypted ref → no base64 in payload (fixes stack overflow).

## Neon / Alternative Storage (Future)

**Neon** (neon.tech) is serverless Postgres — it's separate from Netlify. To use Neon:

1. **Database**: Migrate from SQLite to Neon Postgres for users, messages, conversations.
2. **File blobs**: Neon can store `bytea` but is not ideal for large videos. Better options:
   - **Netlify Blob** (netlify.com/products/blobs) — for files if frontend/API on Netlify
   - **Cloudflare R2** / **AWS S3** — object storage for files
   - Keep files on Render disk (current) — works with Starter plan persistent disk

**NoSQL** (e.g. MongoDB) is optional. For media metadata + file references, a relational DB (Postgres/Neon or SQLite) is sufficient. NoSQL helps if you need flexible schemas or very high write throughput.
