import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { getCollectionNFTs, getNFTDetails } from '@/lib/services/opensea-service';

/**
 * GET /api/opensea/snapshot?slug=megarebel&output=megarebel_wallet.txt
 * Snapshots all holders of a collection via OpenSea API.
 * Requires ADMIN_API_KEY in x-api-key header.
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'megarebel';
    const outputFile = searchParams.get('output') || 'megarebel_wallet.txt';

    // Step 1: List all NFTs to get identifiers, contract, and chain
    const nfts: { identifier: string; contract: string; chain: string }[] = [];
    let next: string | undefined;

    do {
      const data = await getCollectionNFTs(slug, 200, next);
      for (const nft of data.nfts) {
        let chain = 'ethereum';
        const match = nft.opensea_url?.match(/\/assets\/([^/]+)\//);
        if (match) chain = match[1];
        nfts.push({ identifier: nft.identifier, contract: nft.contract, chain });
      }
      next = data.next || undefined;
      if (next) await new Promise((r) => setTimeout(r, 500));
    } while (next);

    // Step 2: Fetch owner for each NFT
    const owners = new Set<string>();

    for (const nft of nfts) {
      try {
        const detail = await getNFTDetails(nft.contract, nft.identifier, nft.chain);
        for (const o of detail?.owners || []) {
          const addr = (typeof o === 'string' ? o : o.address || '').toLowerCase();
          if (addr && addr !== '0x0000000000000000000000000000000000000000') {
            owners.add(addr);
          }
        }
      } catch {
        // skip failed fetches
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    const sorted = Array.from(owners).sort();

    // Write to file
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, sorted.join('\n') + '\n', 'utf-8');

    return NextResponse.json({
      success: true,
      collection: slug,
      totalNfts: nfts.length,
      uniqueHolders: sorted.length,
      outputFile,
    });
  } catch (error: any) {
    console.error('Snapshot error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Snapshot failed' },
      { status: 500 }
    );
  }
}
