# MonM API Reference

Base URL: `http://localhost:3001`

## Auth

### POST /api/auth/signup
- Body: `{ name, phone }`
- Response: `{ token, user: { id, name, phone } }`

### POST /api/auth/login
- Body: `{ phone }`
- Response: `{ token, user: { id, name, phone } }`

## Conversations

### GET /api/conversations
- Headers: `Authorization: Bearer <token>`
- Response: `[{ id, type, participants: [{ id, name }] }]`

### POST /api/conversations/create
- Body: `{ participantIds: string[] }`
- Response: `{ id, type }`

## Messages

### GET /api/messages/:conversationId
- Response: `[{ id, sender_id, payload_encrypted, iv, auth_tag, created_at }]`

### POST /api/messages/send
- Body: `{ conversationId, payloadEncrypted, iv, authTag }`
- Response: Message object

## WebSocket

- URL: `ws://localhost:3001/ws?token=<jwt>`
- Incoming: `{ type: 'new_message', conversationId, message }`
- Outgoing: `{ type: 'typing', conversationId }`
