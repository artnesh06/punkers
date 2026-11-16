# API Routes Documentation

This directory contains all API routes for the Punkers Survival Next.js application.

## Endpoints

### 1. Health Check

**GET** `/api/health`

Checks the health of the application and database connectivity.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

**Status Codes:**

- `200`: Application is healthy
- `503`: Service unavailable (database connection failed)

---

### 2. Update NFT Owner

**POST** `/api/nft/update-owner`

Updates NFT ownership in the database based on current blockchain state.

**Request Body:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
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

**Status Codes:**

- `200`: Successfully updated
- `400`: Invalid address format
- `500`: Internal server error

---

### 3. Get Total Points

**GET** `/api/points/total?address=0x...`

Get total points for a user address with detailed breakdown.

**Query Parameters:**

- `address` (required): Ethereum address

**Response:**

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "totalPoints": 1500,
  "breakdown": {
    "nftPoints": 1000,
    "attributeBonus": 200,
    "transactionPoints": 300
  }
}
```

**Status Codes:**

- `200`: Successfully calculated
- `400`: Invalid address or missing parameter
- `500`: Internal server error

---

### 4. Get Leaderboard

**GET** `/api/leaderboard?page=1&limit=50`

Get leaderboard with pagination, ordered by points descending.

**Query Parameters:**

- `page` (optional, default: 1): Page number (must be >= 1)
- `limit` (optional, default: 50): Items per page (must be 1-100)

**Response:**

```json
{
  "entries": [
    {
      "rank": 1,
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "points": 5000,
      "nftCount": 10
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalEntries": 500,
    "hasMore": true
  }
}
```

**Status Codes:**

- `200`: Successfully fetched
- `400`: Invalid pagination parameters
- `500`: Internal server error

---

## Error Handling

All API routes implement consistent error handling:

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400
}
```

### Error Types

- **Validation Error** (400): Invalid input parameters
- **Not Found** (404): Resource not found
- **Internal Server Error** (500): Database or server errors
- **Blockchain Error** (502): Blockchain communication failures
- **Service Unavailable** (503): Service is down

---

## Validation

All endpoints validate inputs before processing:

### Ethereum Address Validation

- Must match format: `0x[a-fA-F0-9]{40}`
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Pagination Validation

- `page`: Must be integer >= 1
- `limit`: Must be integer between 1 and 100

---

## Logging

All API routes log:

- Request details (method, URL)
- Success operations with context
- Errors with stack traces
- Sensitive data is automatically filtered

Log format:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "INFO",
  "message": "API Request",
  "context": {
    "endpoint": "/api/points/total",
    "method": "GET"
  }
}
```

---

## Testing

To test the API endpoints:

1. **Health Check:**

   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Get Points:**

   ```bash
   curl "http://localhost:3000/api/points/total?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
   ```

3. **Get Leaderboard:**

   ```bash
   curl "http://localhost:3000/api/leaderboard?page=1&limit=10"
   ```

4. **Update NFT Owner:**
   ```bash
   curl -X POST http://localhost:3000/api/nft/update-owner \
     -H "Content-Type: application/json" \
     -d '{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
   ```
