import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    env: {
      https_proxy: process.env.https_proxy,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      HTTP_PROXY: process.env.HTTP_PROXY,
      all_proxy: process.env.all_proxy,
      ALL_PROXY: process.env.ALL_PROXY,
    },
    nodeVersion: process.version,
    platform: process.platform,
  });
}

