# Certificate API Endpoints

API endpoints untuk mengelola certificate system.

## Endpoints

### 1. GET `/api/certificate/sync`
Mengambil data certificate dari database berdasarkan wallet address.

**Query Parameters:**
- `address` (required): Wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "totalXp": 150,
    "level": 6,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response (No Data):**
```json
{
  "success": true,
  "data": null
}
```

### 2. POST `/api/certificate/sync`
Sync data dari localStorage ke database (untuk migrasi).

**Request Body:**
```json
{
  "address": "0x1234...",
  "totalXp": 150
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "totalXp": 150,
    "level": 6,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. PATCH `/api/certificate/sync`
Menambah XP saat user tap certificate.

**Request Body:**
```json
{
  "address": "0x1234...",
  "xpToAdd": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "totalXp": 151,
    "level": 6,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

**400 Bad Request:**
```json
{
  "error": "Address is required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch certificate data"
}
```

## Level Calculation

Level dihitung otomatis dari totalXp:

| Level | XP Required | Cumulative XP |
|-------|-------------|---------------|
| 1     | 10          | 10            |
| 2     | 20          | 30            |
| 3     | 35          | 65            |
| 4     | 55          | 120           |
| 5     | 80          | 200           |
| 6     | 110         | 310           |
| 7     | 150         | 460           |
| 8     | 200         | 660           |
| 9     | 260         | 920           |
| 10+   | 999 each    | Unlimited     |

## Usage Example

```typescript
// Load certificate
const response = await fetch('/api/certificate/sync?address=0x123...');
const { data } = await response.json();

// Sync localStorage to database
await fetch('/api/certificate/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    address: '0x123...', 
    totalXp: 150 
  })
});

// Add XP (tap)
await fetch('/api/certificate/sync', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    address: '0x123...', 
    xpToAdd: 1 
  })
});
```

## Notes

- User akan otomatis dibuat jika belum ada di database
- Level dihitung otomatis dari totalXp
- Data selalu di-sync dengan localStorage
- API bersifat idempotent (aman untuk retry)
