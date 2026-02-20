# MonM Database Schema

**Location:** `D:\monm\db\monm.db` (SQLite)

---

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| name | TEXT | Display name |
| phone | TEXT | Phone number (hashed for search) |
| phone_hash | TEXT | SHA256(phone) for lookup |
| created_at | DATETIME | Registration time |
| rsa_public | TEXT | Server-stored RSA public key |

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Session token |
| user_id | TEXT | FK → users |
| expires_at | DATETIME | Expiry |
| created_at | DATETIME | |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| conversation_id | TEXT | FK → conversations |
| sender_id | TEXT | FK → users |
| payload_encrypted | BLOB | AES-256-GCM ciphertext |
| iv | BLOB | Initialization vector |
| auth_tag | BLOB | GCM auth tag |
| blockchain_tx | TEXT | Polygon tx hash (audit) |
| created_at | DATETIME | |

### conversations
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| type | TEXT | 'direct' | 'group' |
| created_at | DATETIME | |

### conversation_participants
| Column | Type | Description |
|--------|------|-------------|
| conversation_id | TEXT | FK → conversations |
| user_id | TEXT | FK → users |
| role | TEXT | 'member' | 'admin' |
| joined_at | DATETIME | |

### media
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| message_id | TEXT | FK → messages |
| ipfs_cid | TEXT | IPFS content ID |
| fingerprint_hash | TEXT | SHA256 fingerprint |
| mime_type | TEXT | image/png, etc. |
| created_at | DATETIME | |

### forward_traces
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| original_message_id | TEXT | FK → messages |
| forwarded_by | TEXT | FK → users |
| target_conversation_id | TEXT | FK → conversations |
| permission_granted | BOOLEAN | |
| blockchain_tx | TEXT | Polygon tx |
| created_at | DATETIME | |

### leak_reports
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | FK → users |
| media_id | TEXT | FK → media (optional) |
| source_url | TEXT | Where leak found |
| confidence | REAL | 0–1 |
| blockchain_tx | TEXT | LeakEvidenceRegistry tx |
| created_at | DATETIME | |

### scheduled_scans
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| user_id | TEXT | FK → users |
| query_hash | TEXT | Search query fingerprint |
| last_run | DATETIME | |
| next_run | DATETIME | |
| interval_hours | INTEGER | |
