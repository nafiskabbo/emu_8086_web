# Share API

Anonymous time-limited share links for emu8086web assembly programs.

## Endpoints

### Create share

`POST /api/share`

```json
{ "source": "mov ax, 1\nint 20h", "expiresInDays": 3 }
```

`expiresInDays` must be `1`, `3`, or `7`. Source max 65536 UTF-8 bytes.

Response:

```json
{
  "code": "a1b2c3d4",
  "url": "https://emu8086web.vercel.app/s/a1b2c3d4",
  "expiresAt": "2026-07-27T12:00:00.000Z",
  "ttlDays": 3,
  "reused": false
}
```

Identical source + TTL reuses an existing non-expired code.

### Fetch share

`GET /api/share/{code}`

Returns `{ source, expiresAt, ttlDays, code }` or 404/410 when missing/expired.

### Open in IDE

Visit `/s/{code}` — loads the program into the IDE.

## Limits

- No authentication
- Rate limited create (~10 / IP / hour)
- No list endpoint
- Expired rows are deleted by scheduled cleanup
