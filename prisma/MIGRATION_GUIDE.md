# Database Migration Guide

Guide untuk melakukan migration database setelah update schema.

## Changes Made

Schema `mst_staker` telah ditambahkan field-field baru untuk mendukung fitur survival game:

### New Fields:
- `isDead` (Boolean): Status apakah NFT sudah mati
- `health` (Int): Health NFT (0-100)
- `causeOfDeath` (String): Penyebab kematian NFT
- `deathDate` (DateTime): Tanggal NFT mati
- `lastAudit` (DateTime): Tanggal audit terakhir
- `penaltiesPaid` (Decimal): Total penalties yang sudah dibayar

## Migration Steps

### 1. Generate Migration

```bash
npx prisma migrate dev --name add_survival_fields
```

Ini akan:
- Generate migration file di `prisma/migrations/`
- Apply migration ke database
- Regenerate Prisma Client

### 2. Verify Migration

Check apakah migration berhasil:

```bash
npx prisma migrate status
```

### 3. Update Existing Data (Optional)

Jika ada data existing, jalankan script untuk set default values:

```sql
-- Set default values untuk existing records
UPDATE mst_staker 
SET 
  isDead = false,
  health = 100,
  penaltiesPaid = 0
WHERE isDead IS NULL;
```

### 4. Regenerate Prisma Client

```bash
npx prisma generate
```

## Rollback (if needed)

Jika ada masalah, rollback migration:

```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

## Production Deployment

### Before Deploy:
1. Backup database
2. Test migration di staging environment
3. Review migration SQL

### Deploy Steps:
```bash
# 1. Push schema changes
npx prisma db push

# OR use migrate deploy for production
npx prisma migrate deploy
```

## Troubleshooting

### Error: Column already exists
Jika field sudah ada di database:
```bash
npx prisma db pull
npx prisma generate
```

### Error: Type mismatch
Check tipe data di database vs schema:
```bash
npx prisma validate
```

### Error: Migration failed
Reset database (DEVELOPMENT ONLY):
```bash
npx prisma migrate reset
```

## Testing

Setelah migration, test endpoints berikut:

1. GET /api/nft/health?tokenId=123
2. GET /api/nft/dead?address=0x...
3. POST /api/nft/kill
4. POST /api/nft/update-health
5. POST /api/nft/audit

## Notes

- Field `penaltiesPaid` menggunakan Decimal untuk precision ETH amounts
- Default health adalah 100 (full health)
- Default isDead adalah false
- Nullable fields: causeOfDeath, deathDate, lastAudit
