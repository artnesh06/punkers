# NFT Management API

API endpoints untuk mengelola NFT dalam game Punkers Survival.

## Endpoints

### 1. GET /api/nft/health

Mendapatkan status health NFT.

**Query Parameters:**
- `tokenId` (required): Token ID dari NFT

**Response:**
```json
{
  "tokenId": "123",
  "health": 85,
  "status": "healthy",
  "isDead": false,
  "isStaked": true,
  "lastAudit": "2024-01-15T10:30:00Z",
  "causeOfDeath": null,
  "deathDate": null,
  "owner": "0x...",
  "collection": {
    "name": "Punkers",
    "contractAddress": "0x..."
  }
}
```

**Status Values:**
- `healthy`: Health >= 60%
- `warning`: Health 30-59%
- `critical`: Health < 30%
- `dead`: Health = 0%
- `unknown`: NFT not found

---

### 2. GET /api/nft/dead

Mendapatkan daftar NFT yang sudah mati untuk address tertentu.

**Query Parameters:**
- `address` (required): Ethereum address

**Response:**
```json
{
  "deadNFTs": [
    {
      "tokenId": "123",
      "collectionName": "Punkers",
      "causeOfDeath": "Audit Failure",
      "deathDate": "2024-01-15T10:30:00Z",
      "daysAlive": 45,
      "pointsLost": 450,
      "penaltiesPaid": 0.01,
      "metadata": {
        "name": "Punker #123",
        "image": "https://..."
      }
    }
  ],
  "totalDeaths": 1,
  "totalPointsLost": 450,
  "averageDaysAlive": 45,
  "totalPenaltiesPaid": 0.01
}
```

---

### 3. POST /api/nft/kill

Menandai NFT sebagai mati (admin/game mechanics endpoint).

**Request Body:**
```json
{
  "tokenId": "123",
  "causeOfDeath": "Audit Failure",
  "pointsLost": 100,
  "penaltyPaid": 0.01
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT #123 has been marked as dead"
}
```

**Causes of Death:**
- `Audit Failure`: Gagal membayar audit tax dalam 24 jam
- `Multiple Penalties`: Terlalu banyak penalty points
- `Health Depletion`: Health turun ke 0%
- `Special Event`: Eliminated during special game events

---

### 4. POST /api/nft/update-health

Update health NFT (admin/game mechanics endpoint).

**Request Body:**
```json
{
  "tokenId": "123",
  "healthChange": -10,
  "reason": "Penalty applied"
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": "123",
  "newHealth": 75,
  "message": "NFT #123 health updated to 75%"
}
```

**Notes:**
- `healthChange` bisa positif (heal) atau negatif (damage)
- Health akan di-clamp antara 0-100
- Jika health mencapai 0, NFT otomatis mati

---

### 5. POST /api/nft/audit

Record audit untuk NFT (admin/game mechanics endpoint).

**Request Body:**
```json
{
  "tokenId": "123",
  "passed": true,
  "penaltyPaid": 0.01
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audit recorded for NFT #123",
  "passed": true
}
```

**Notes:**
- Jika `passed: false`, health NFT akan berkurang 20%
- `lastAudit` timestamp akan di-update
- `penaltyPaid` akan ditambahkan ke total penalties

---

### 6. POST /api/nft/update-owner

Update ownership NFT dari blockchain ke database.

**Request Body:**
```json
{
  "address": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "updatedCount": 5,
  "message": "Successfully updated 5 NFTs for address 0x..."
}
```

**Notes:**
- Fetch NFT ownership dari blockchain
- Hanya membuat record baru, tidak overwrite staking status yang sudah ada
- Digunakan saat user pertama kali connect wallet

---

## Error Responses

Semua endpoint menggunakan format error yang konsisten:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation error)
- `404`: Not Found
- `500`: Internal Server Error

---

## Game Mechanics

### Health System
- Semua NFT mulai dengan health 100%
- Health berkurang karena:
  - Failed audit: -20%
  - Penalties: varies
  - Special events: varies
- Health bisa di-restore dengan special items/events
- Health 0% = NFT mati

### Death System
- NFT yang mati:
  - Tidak bisa earn points lagi
  - Otomatis unstaked
  - Tetap di wallet owner
  - Masuk ke graveyard
- Points yang sudah earned sebelum mati tetap dihitung
- Penalty paid akan tercatat

### Audit System
- Random audit untuk staked NFTs
- Harus bayar audit tax dalam 24 jam
- Gagal bayar = health -20% atau langsung mati
- Audit history tercatat di `lastAudit`
