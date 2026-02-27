import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let provider = null;
let signer = null;
let contracts = {};

const ABI = {
  MessageHashRegistry: ['function logMessageHash(bytes32 messageId, bytes32 messageHash) external'],
  FileFingerprintRegistry: ['function registerFingerprint(bytes32 fingerprint, string ipfsCid) external'],
  KilledFingerprintRegistry: ['function killFingerprint(bytes32 fingerprint) external', 'function isKilled(bytes32 fingerprint) view returns (bool)'],
  ForwardTraceRegistry: ['function traceForward(bytes32 originalMessageId, bytes32 forwardId, bool permissionGranted) external'],
  LeakEvidenceRegistry: ['function reportLeak(bytes32 reportId, bytes32 fingerprint, string sourceUrl) external'],
};

async function loadAddresses() {
  const addrPath = path.join(__dirname, '../config/contract-addresses.json');
  if (fs.existsSync(addrPath)) {
    return JSON.parse(fs.readFileSync(addrPath, 'utf8'));
  }
  return {};
}

export async function initBlockchain() {
  const pk = process.env.BLOCKCHAIN_SIGNER_PRIVATE_KEY;
  if (!pk) {
    console.warn('BLOCKCHAIN_SIGNER_PRIVATE_KEY not set — blockchain audit disabled');
    return false;
  }

  const rpcUrl = config.polygon.rpcUrl + (config.polygon.rpcKey ? `/${config.polygon.rpcKey}` : '');
  provider = new ethers.JsonRpcProvider(rpcUrl);
  signer = new ethers.Wallet(pk, provider);
  const addrs = await loadAddresses();

  for (const [name, addr] of Object.entries(addrs)) {
    if (addr && typeof addr === 'string' && ABI[name]) {
      contracts[name] = new ethers.Contract(addr, ABI[name], signer);
    }
  }
  return Object.keys(contracts).length > 0;
}

function toBytes32(hexOrStr) {
  if (typeof hexOrStr !== 'string') hexOrStr = String(hexOrStr);
  const hex = hexOrStr.startsWith('0x') ? hexOrStr.slice(2) : Buffer.from(hexOrStr, 'utf8').toString('hex');
  return ethers.zeroPadValue('0x' + hex.padStart(64, '0').slice(-64), 32);
}

export async function logMessageHash(messageId, messageHash) {
  const c = contracts.MessageHashRegistry;
  if (!c) return null;
  try {
    const tx = await c.logMessageHash(toBytes32(messageId), toBytes32(messageHash));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('logMessageHash error:', e.message);
    return null;
  }
}

export async function registerFingerprint(fingerprint, ipfsCid) {
  const c = contracts.FileFingerprintRegistry;
  if (!c) return null;
  try {
    const tx = await c.registerFingerprint(toBytes32(fingerprint), ipfsCid);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('registerFingerprint error:', e.message);
    return null;
  }
}

export async function traceForward(originalMessageId, forwardId, permissionGranted) {
  const c = contracts.ForwardTraceRegistry;
  if (!c) return null;
  try {
    const tx = await c.traceForward(toBytes32(originalMessageId), toBytes32(forwardId), permissionGranted);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('traceForward error:', e.message);
    return null;
  }
}

export async function killFingerprint(fingerprint) {
  const c = contracts.KilledFingerprintRegistry;
  if (!c) return null;
  try {
    const tx = await c.killFingerprint(toBytes32(fingerprint));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('killFingerprint error:', e.message);
    return null;
  }
}

export async function isFingerprintKilledOnChain(fingerprint) {
  const c = contracts.KilledFingerprintRegistry;
  if (!c) return false;
  try {
    return await c.isKilled(toBytes32(fingerprint));
  } catch {
    return false;
  }
}

export async function reportLeak(reportId, fingerprint, sourceUrl) {
  const c = contracts.LeakEvidenceRegistry;
  if (!c) return null;
  try {
    const tx = await c.reportLeak(toBytes32(reportId), toBytes32(fingerprint), sourceUrl.substring(0, 500));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (e) {
    console.error('reportLeak error:', e.message);
    return null;
  }
}
