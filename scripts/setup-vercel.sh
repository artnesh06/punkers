#!/bin/bash

# Punkers Survival - Vercel Setup Script
# This script helps you set up the project for Vercel deployment

echo "🚀 Punkers Survival - Vercel Setup"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI installed"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created"
    echo "⚠️  Please edit .env.local with your actual values"
    echo ""
else
    echo "✅ .env.local already exists"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Add Vercel-specific dependencies
echo "📦 Installing Vercel-specific packages..."
npm install @vercel/kv @upstash/ratelimit

echo "✅ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Check database connection
echo "🔍 Checking database connection..."
if npx prisma db pull --force 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed"
    echo "   Please check your DATABASE_URL in .env.local"
fi
echo ""

# Run migrations
echo "🔄 Running database migrations..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Migrations completed"
else
    echo "⚠️  Migrations failed or no migrations to run"
fi
echo ""

# Test build
echo "🏗️  Testing build..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    echo "   Please fix errors before deploying"
    exit 1
fi
echo ""

# Summary
echo "=================================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your actual values"
echo "2. Test locally: npm run dev"
echo "3. Deploy to Vercel: vercel --prod"
echo ""
echo "For detailed instructions, see VERCEL_DEPLOYMENT.md"
echo ""
