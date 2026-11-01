const hre = require("hardhat");
const { ethers } = hre;
const crypto = require("crypto");

function sha256Hex(content) {
  return "0x" + crypto.createHash("sha256").update(content).digest("hex");
}

async function main() {
  console.log("==========================================================");
  console.log(" EXECUTING SOLIDITY SMART CONTRACT: DocumentRegistry.sol");
  console.log("==========================================================");

  // 1. Compile and deploy contract
  const [deployer, researcher1, researcher2] = await ethers.getSigners();
  console.log("\n[1] Deployer address:", deployer.address);

  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const registry = await DocumentRegistry.deploy();
  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();
  console.log("[✓] DocumentRegistry deployed to address:", contractAddress);

  // 2. Register first document (Genesis Document Block #0)
  console.log("\n[2] Registering Document Block #0 (Genesis Block)...");
  const doc1Content = "Decentralized consensus algorithms ensure state machine replication across untrusted nodes.";
  const doc1Hash = sha256Hex(doc1Content);
  const doc1ReportHash = sha256Hex(`${doc1Hash}|4250|Thesis|Alice`);

  const tx1 = await registry.connect(researcher1).registerDocument(
    doc1Hash,
    doc1ReportHash,
    "Decentralized Consensus Research Paper",
    "Alice Student",
    4250, // 42.50% similarity
    1     // RiskLevel.Moderate
  );
  await tx1.wait();
  console.log("[✓] Block #0 registered successfully!");
  console.log("    - Tx Hash:", tx1.hash);
  console.log("    - Unique Document Hash:", doc1Hash);
  console.log("    - Report Hash:", doc1ReportHash);

  // 3. Register second document (Chained Block #1)
  console.log("\n[3] Registering Document Block #1 (Chained to Block #0)...");
  const doc2Content = "Quantum computing applications in cryptographic hash analysis and lattice cryptography.";
  const doc2Hash = sha256Hex(doc2Content);
  const doc2ReportHash = sha256Hex(`${doc2Hash}|0200|Quantum Paper|Bob`);

  const tx2 = await registry.connect(researcher2).registerDocument(
    doc2Hash,
    doc2ReportHash,
    "Quantum Cryptanalysis Survey",
    "Dr. Bob",
    200, // 2.00% similarity
    0    // RiskLevel.Clean
  );
  await tx2.wait();
  console.log("[✓] Block #1 registered successfully!");
  console.log("    - Tx Hash:", tx2.hash);
  console.log("    - Unique Document Hash:", doc2Hash);
  console.log("    - Report Hash:", doc2ReportHash);

  // 4. Register third document (Chained Block #2)
  console.log("\n[4] Registering Document Block #2 (Chained to Block #1)...");
  const doc3Content = "Neural network hallucination detection via semantic consistency evaluation.";
  const doc3Hash = sha256Hex(doc3Content);
  const doc3ReportHash = sha256Hex(`${doc3Hash}|8950|Neural Paper|Carol`);

  const tx3 = await registry.connect(researcher1).registerDocument(
    doc3Hash,
    doc3ReportHash,
    "Neural Model Hallucination Audit",
    "Carol Researcher",
    8950, // 89.50% similarity
    2     // RiskLevel.High
  );
  await tx3.wait();
  console.log("[✓] Block #2 registered successfully!");
  console.log("    - Tx Hash:", tx3.hash);
  console.log("    - Unique Document Hash:", doc3Hash);
  console.log("    - Report Hash:", doc3ReportHash);

  // 5. Query total block count
  const count = await registry.blockCount();
  console.log(`\n[5] Total Document Blocks in Blockchain: ${count.toString()}`);

  // 6. Verify Blockchain Integrity on-chain
  const isValid = await registry.verifyChain();
  console.log(`[6] On-chain verifyChain() check result: ${isValid ? "VALID ✓ (All prevHash links verified)" : "INVALID ✗"}`);

  // 7. Inspect blocks stored in the contract
  console.log("\n[7] Querying all stored blocks from smart contract mapping:");
  const riskLabels = ["Clean", "Moderate", "High"];

  for (let i = 0; i < count; i++) {
    const block = await registry.getBlock(i);
    console.log(`\n    ================ Block #${block.blockIndex.toString()} ================`);
    console.log(`    Title:          ${block.title}`);
    console.log(`    Author:         ${block.author}`);
    console.log(`    Submitter:      ${block.submitter}`);
    console.log(`    Similarity:     ${Number(block.similarityPct) / 100}%`);
    console.log(`    Risk Level:     ${riskLabels[Number(block.riskLevel)]}`);
    console.log(`    Document Hash:  ${block.docHash}`);
    console.log(`    Report Hash:    ${block.reportHash}`);
    console.log(`    Previous Hash:  ${block.prevHash}`);
    console.log(`    Timestamp:      ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
  }

  // 8. Test lookups
  console.log("\n[8] Testing fast lookup by document hash:");
  const lookupIndex = await registry.docHashToIndex(doc2Hash);
  console.log(`    docHashToIndex(${doc2Hash.slice(0, 16)}...) -> Block #${lookupIndex.toString()}`);

  console.log("\n==========================================================");
  console.log(" SMART CONTRACT EXECUTION COMPLETED SUCCESSFULLY");
  console.log("==========================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Execution failed:", err);
    process.exit(1);
  });
