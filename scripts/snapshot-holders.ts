/**
 * Snapshot Holders Script
 * Fetches all NFT holders from OpenSea by collection slug.
 *
 * Usage: npx tsx scripts/snapshot-holders.ts [collectionSlug] [outputFile]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

async function openSeaRequest(endpoint: string, maxRetries = 5): Promise<any> {
  if (!OPENSEA_API_KEY) throw new Error('OPENSEA_API_KEY not set in .env');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(`${OPENSEA_BASE_URL}${endpoint}`, {
      headers: { 'X-API-KEY': OPENSEA_API_KEY, Accept: 'application/json' },
    });

    if (response.status === 429) {
      const wait = Math.min(5000 * (attempt + 1), 30000);
      console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      throw new Error(`OpenSea API error (${response.status}): ${await response.text()}`);
    }
    return response.json();
  }
  throw new Error(`Max retries exceeded for ${endpoint}`);
}

async function listAllNFTs(slug: string) {
  const nfts: { identifier: string; contract: string; chain: string }[] = [];
  let next: string | null = null;

  do {
    let endpoint = `/collection/${slug}/nfts?limit=200`;
    if (next) endpoint += `&next=${next}`;

    const data = await openSeaRequest(endpoint);
    for (const nft of data.nfts || []) {
      let chain = 'ethereum';
      const match = nft.opensea_url?.match(/\/assets\/([^/]+)\//);
      if (match) chain = match[1];
      nfts.push({ identifier: nft.identifier, contract: nft.contract, chain });
    }
    console.log(`  Listed ${nfts.length} NFTs...`);
    next = data.next || null;
    if (next) await new Promise((r) => setTimeout(r, 500));
  } while (next);

  return nfts;
}

async function main() {
  const slug = process.argv[2] || 'megarebel';
  const outputFile = process.argv[3] || 'megarebel_wallet.txt';
  const outputPath = path.resolve(process.cwd(), outputFile);

  console.log(`\n📸 Snapshot holders: ${slug}\n`);

  // Step 1: List all NFTs
  console.log('Step 1: Listing NFTs...');
  const nfts = await listAllNFTs(slug);
  console.log(`  Total: ${nfts.length}, Chain: ${nfts[0]?.chain}, Contract: ${nfts[0]?.contract}\n`);

  // Step 2: Fetch owners one by one with proper delays
  console.log('Step 2: Fetching owners...');
  const owners = new Set<string>();

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    try {
      const data = await openSeaRequest(
        `/chain/${nft.chain}/contract/${nft.contract}/nfts/${nft.identifier}`
      );
      for (const o of data.nft?.owners || []) {
        const addr = (typeof o === 'string' ? o : o.address || '').toLowerCase();
        if (addr && addr !== '0x0000000000000000000000000000000000000000') {
          owners.add(addr);
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠ #${nft.identifier}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0 || i === nfts.length - 1) {
      console.log(`  ${i + 1}/${nfts.length} — ${owners.size} unique holders`);
    }

    // 500ms delay between each request
    await new Promise((r) => setTimeout(r, 500));
  }

  const sorted = Array.from(owners).sort();
  fs.writeFileSync(outputPath, sorted.join('\n') + '\n', 'utf-8');
  console.log(`\n✅ ${sorted.length} unique holders written to ${outputFile}`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
