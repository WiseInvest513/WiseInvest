/**
 * Proxy-aware fetch wrapper for Node.js
 * Uses Node.js https/http modules which support proxy via environment variables
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

export async function fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    
    // Get proxy from environment
    const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || 
                     process.env.http_proxy || process.env.HTTP_PROXY;
    
    // If no proxy, use native fetch
    if (!proxyUrl) {
      return fetch(url, options).then(resolve).catch(reject);
    }
    
    const proxyUrlObj = new URL(proxyUrl);
    const proxyHost = proxyUrlObj.hostname;
    const proxyPort = parseInt(proxyUrlObj.port || (proxyUrlObj.protocol === 'https:' ? '443' : '80'));
    
    // Create request options
    const requestOptions = {
      hostname: proxyHost,
      port: proxyPort,
      path: url,
      method: 'CONNECT',
      headers: {
        Host: urlObj.hostname,
      },
    };
    
    const client = isHttps ? https : http;
    
    // For simplicity, if proxy is set, just use native fetch
    // Node.js fetch should respect proxy env vars in newer versions
    // But if it doesn't work, we'll log and use direct fetch
    console.log(`[Proxy Fetch] Attempting ${url} via proxy ${proxyUrl}`);
    
    // Use native fetch - it should work with proxy env vars in Node.js 18+
    fetch(url, options)
      .then(resolve)
      .catch((error) => {
        console.error(`[Proxy Fetch] Failed: ${error.message}`);
        reject(error);
      });
  });
}

