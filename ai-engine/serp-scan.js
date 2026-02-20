/**
 * MonM SERP Leak Scanner — Real-time web scan for leaked content
 */
import 'dotenv/config';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const SERP_API = 'https://serpapi.com/search';
const API_KEY = process.env.SERP_API_KEY;
const DATA_ROOT = process.env.DATA_ROOT || 'D:\\monm';
const LOG_PATH = path.join(DATA_ROOT, 'logs', 'serp-scan.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(msg);
}

export async function searchLeaks(query) {
  if (!API_KEY) return { results: [], error: 'no_api_key' };
  try {
    const url = `${SERP_API}?q=${encodeURIComponent(query)}&api_key=${API_KEY}&engine=google&num=10`;
    const res = await fetch(url);
    const data = await res.json();
    const results = (data.organic_results || []).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));
    return { results };
  } catch (e) {
    log('SERP error: ' + e.message);
    return { results: [], error: e.message };
  }
}

/**
 * Build search query from user + content fingerprint
 */
export function buildSearchQuery(userName, userPhone, contentHash) {
  const parts = [];
  if (userName) parts.push(`"${userName}"`);
  if (userPhone) parts.push(userPhone.replace(/\D/g, '').slice(-6));
  if (contentHash) parts.push(contentHash.slice(0, 12));
  return parts.join(' ');
}

// CLI: node serp-scan.js "search query"
if (process.argv[2]) {
  searchLeaks(process.argv[2]).then(r => console.log(JSON.stringify(r, null, 2)));
}
