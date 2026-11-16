# Staking API Endpoints

These endpoints implement soft-staking functionality where all staking operations are managed in the database without blockchain transactions.

## POST /api/staking/stake

Stake an NFT (database-only operation).

### Request Body
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "tokenId": "1234"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "NFT staked successfully",
  "staker": {
    "id": "uuid",
    "tokenId": "1234",
    "isStaked": true,
    "stakedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "NFT is already staked"
}
```

### Status Codes
- `200` - Success
- `400` - Invalid input or NFT already staked
- `500` - Internal server error

## POST /api/staking/unstake

Unstake an NFT (database-only operation).

### Request Body
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "tokenId": "1234"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "NFT unstaked successfully",
  "staker": {
    "id": "uuid",
    "tokenId": "1234",
    "isStaked": false,
    "unstakedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "NFT is not staked"
}
```

### Status Codes
- `200` - Success
- `400` - Invalid input or NFT not staked
- `500` - Internal server error

## Important Notes

### Soft-Staking Approach
- **No blockchain transactions**: All operations update the database only
- **Instant updates**: No waiting for blockchain confirmations
- **No gas fees**: Free for users
- **Database as source of truth**: Staking state managed in PostgreSQL

### Validation
- Ethereum address must be valid (checksummed or lowercase)
- Token ID must be a non-empty string
- User must exist in database
- NFT must be owned by the user

### Error Handling
- Invalid addresses return 400
- Missing parameters return 400
- Database errors return 500
- User-friendly error messages provided
