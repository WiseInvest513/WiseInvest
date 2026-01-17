import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic'; // Prevent static caching issues

type AirdropItem = {
  id: string;
  exchange: 'Binance' | 'OKX';
  title: string;
  tokenSymbol: string;
  link: string;
  pubDate: string;
  type: 'Launchpool' | 'Megadrop' | 'Jumpstart' | 'Listing';
};

const parser = new Parser({
  timeout: 5000, // 5s timeout to prevent hanging
});

export async function GET() {
  const BINANCE_RSS = 'https://rsshub.app/binance/news/english/48';
  const OKX_RSS = 'https://rsshub.app/okx/announcements/section/new-listings';

  try {
    // Fetch both feeds in parallel
    const [binanceFeed, okxFeed] = await Promise.allSettled([
      parser.parseURL(BINANCE_RSS),
      parser.parseURL(OKX_RSS),
    ]);

    let results: AirdropItem[] = [];

    // --- Process Binance ---
    if (binanceFeed.status === 'fulfilled') {
      const keywords = ['Launchpool', 'Megadrop', 'Launchpad'];
      binanceFeed.value.items?.forEach(item => {
        const title = item.title || '';
        // Check if title contains any keyword
        const matchedKeyword = keywords.find(k => title.includes(k));
        
        if (matchedKeyword) {
          // Extract Symbol e.g., "Introducing Portal (PORTAL)..."
          const symbolMatch = title.match(/\(([^)]+)\)/);
          results.push({
            id: item.guid || item.link || Math.random().toString(),
            exchange: 'Binance',
            title: title,
            tokenSymbol: symbolMatch ? symbolMatch[1] : 'NEW',
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            type: matchedKeyword as 'Launchpool' | 'Megadrop' | 'Listing'
          });
        }
      });
    }

    // --- Process OKX ---
    if (okxFeed.status === 'fulfilled') {
      okxFeed.value.items?.forEach(item => {
        const title = item.title || '';
        if (title.includes('Jumpstart')) {
          // Extract Symbol logic for OKX if possible, else default
          const symbolMatch = title.match(/([A-Z]+)\s+to/); // Heuristic
          results.push({
            id: item.guid || item.link || Math.random().toString(),
            exchange: 'OKX',
            title: title,
            tokenSymbol: symbolMatch ? symbolMatch[1] : 'JUMP',
            link: item.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            type: 'Jumpstart'
          });
        }
      });
    }

    // Sort by Date (Newest first)
    results.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return NextResponse.json({ success: true, data: results });

  } catch (error) {
    console.error('RSS Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to fetch feeds' 
    }, { status: 500 });
  }
}

