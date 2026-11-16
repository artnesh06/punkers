#!/bin/bash

# Certificate Migration Script
# This script will:
# 1. Create the certificate table in database
# 2. Run tests to verify migration
# 3. Show status

set -e

echo "🚀 Certificate Migration Script"
echo "================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

echo "✅ Database URL found"
echo ""

# Step 1: Run Prisma migration
echo "📦 Step 1: Running Prisma migration..."
npx prisma migrate dev --name add_certificate_table --skip-generate
echo "✅ Migration completed"
echo ""

# Step 2: Generate Prisma Client
echo "🔧 Step 2: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 3: Run tests
echo "🧪 Step 3: Running migration tests..."
npx ts-node scripts/test-certificate-migration.ts
echo "✅ Tests passed"
echo ""

# Step 4: Show table info
echo "📊 Step 4: Certificate table info..."
npx prisma db execute --stdin <<SQL
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'mst_certificate'
ORDER BY ordinal_position;
SQL
echo ""

echo "🎉 Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy the updated code to production"
echo "2. Monitor API endpoints: /api/certificate/*"
echo "3. Check CERTIFICATE_MIGRATION.md for more details"
echo ""
