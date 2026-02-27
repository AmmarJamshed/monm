const hre = require('hardhat');
const path = require('path');
const fs = require('fs');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const MessageHashRegistry = await hre.ethers.getContractFactory('MessageHashRegistry');
  const FileFingerprintRegistry = await hre.ethers.getContractFactory('FileFingerprintRegistry');
  const KilledFingerprintRegistry = await hre.ethers.getContractFactory('KilledFingerprintRegistry');
  const ForwardTraceRegistry = await hre.ethers.getContractFactory('ForwardTraceRegistry');
  const LeakEvidenceRegistry = await hre.ethers.getContractFactory('LeakEvidenceRegistry');

  const msgRegistry = await MessageHashRegistry.deploy();
  await msgRegistry.waitForDeployment();
  const msgAddr = await msgRegistry.getAddress();
  console.log('MessageHashRegistry:', msgAddr);

  const fileRegistry = await FileFingerprintRegistry.deploy();
  await fileRegistry.waitForDeployment();
  const fileAddr = await fileRegistry.getAddress();
  console.log('FileFingerprintRegistry:', fileAddr);

  const killedRegistry = await KilledFingerprintRegistry.deploy();
  await killedRegistry.waitForDeployment();
  const killedAddr = await killedRegistry.getAddress();
  console.log('KilledFingerprintRegistry:', killedAddr);

  const forwardRegistry = await ForwardTraceRegistry.deploy();
  await forwardRegistry.waitForDeployment();
  const forwardAddr = await forwardRegistry.getAddress();
  console.log('ForwardTraceRegistry:', forwardAddr);

  const leakRegistry = await LeakEvidenceRegistry.deploy();
  await leakRegistry.waitForDeployment();
  const leakAddr = await leakRegistry.getAddress();
  console.log('LeakEvidenceRegistry:', leakAddr);

  const deployPath = path.join(__dirname, '../../backend/src/config/contract-addresses.json');
  const dir = path.dirname(deployPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(deployPath, JSON.stringify({
    MessageHashRegistry: msgAddr,
    FileFingerprintRegistry: fileAddr,
    KilledFingerprintRegistry: killedAddr,
    ForwardTraceRegistry: forwardAddr,
    LeakEvidenceRegistry: leakAddr,
    network: 'amoy',
    deployedAt: new Date().toISOString()
  }, null, 2));
  console.log('Addresses written to', deployPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
