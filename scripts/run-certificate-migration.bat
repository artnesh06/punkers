@echo off
REM Certificate Migration Script for Windows
REM This script will:
REM 1. Create the certificate table in database
REM 2. Run tests to verify migration
REM 3. Show status

echo.
echo 🚀 Certificate Migration Script
echo ================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ❌ Error: DATABASE_URL environment variable is not set
    echo Please set DATABASE_URL in your .env file
    exit /b 1
)

echo ✅ Database URL found
echo.

REM Step 1: Run Prisma migration
echo 📦 Step 1: Running Prisma migration...
call npx prisma migrate dev --name add_certificate_table --skip-generate
if errorlevel 1 (
    echo ❌ Migration failed
    exit /b 1
)
echo ✅ Migration completed
echo.

REM Step 2: Generate Prisma Client
echo 🔧 Step 2: Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Prisma Client generation failed
    exit /b 1
)
echo ✅ Prisma Client generated
echo.

REM Step 3: Run tests
echo 🧪 Step 3: Running migration tests...
call npx ts-node scripts/test-certificate-migration.ts
if errorlevel 1 (
    echo ❌ Tests failed
    exit /b 1
)
echo ✅ Tests passed
echo.

echo 🎉 Migration completed successfully!
echo.
echo Next steps:
echo 1. Deploy the updated code to production
echo 2. Monitor API endpoints: /api/certificate/*
echo 3. Check CERTIFICATE_MIGRATION.md for more details
echo.

pause
