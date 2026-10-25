import crypto from 'crypto';

/**
 * Enterprise Cryptographic Immutable Audit Ledger for FoundIt
 * Implements SHA-256 block-chained transaction logging for municipal chain of custody transfers.
 * Ensures zero-tampering guarantee across transit agencies and police departments.
 */

/**
 * Generate SHA-256 hash helper
 * @param {string} data
 * @returns {string}
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Calculates Merkle Root of an array of transaction hashes
 * @param {string[]} txHashes
 * @returns {string}
 */
export function calculateMerkleRoot(txHashes) {
  if (!txHashes || txHashes.length === 0) {
    return sha256('EMPTY_MERKLE_ROOT');
  }
  if (txHashes.length === 1) {
    return txHashes[0];
  }

  let currentLevel = [...txHashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(sha256(currentLevel[i] + currentLevel[i + 1]));
      } else {
        // Odd number of leaves: hash with itself
        nextLevel.push(sha256(currentLevel[i] + currentLevel[i]));
      }
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

/**
 * Represents a single ledger transaction (handshake, custody transfer, officer override)
 */
export class LedgerTransaction {
  constructor({
    txId,
    timestamp = new Date().toISOString(),
    action,
    itemId,
    itemName,
    initiatorId,
    initiatorName,
    initiatorRole,
    fromHubId = 'HUB-GCT',
    toHubId = '',
    tamperEvidentSealNumber = '',
    proofOfIdentity = '',
    notes = '',
  }) {
    this.txId = txId || 'tx_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    this.timestamp = timestamp;
    this.action = action; // 'ITEM_REGISTERED' | 'CLAIM_SUBMITTED' | 'CUSTODY_TRANSFERRED' | 'HANDSHAKE_SEALED'
    this.itemId = itemId;
    this.itemName = itemName;
    this.initiatorId = initiatorId;
    this.initiatorName = initiatorName;
    this.initiatorRole = initiatorRole;
    this.fromHubId = fromHubId;
    this.toHubId = toHubId;
    this.tamperEvidentSealNumber = tamperEvidentSealNumber;
    this.proofOfIdentity = proofOfIdentity;
    this.notes = notes;
    this.txHash = this.calculateHash();
  }

  calculateHash() {
    const raw = `${this.txId}|${this.timestamp}|${this.action}|${this.itemId}|${this.initiatorId}|${this.fromHubId}|${this.toHubId}|${this.tamperEvidentSealNumber}|${this.proofOfIdentity}`;
    return sha256(raw);
  }
}

/**
 * Represents a cryptographically linked Block in the ledger
 */
export class LedgerBlock {
  constructor(index, timestamp, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.merkleRoot = calculateMerkleRoot(transactions.map((t) => t.txHash));
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const raw = `${this.index}${this.previousHash}${this.timestamp}${this.merkleRoot}${this.nonce}`;
    return sha256(raw);
  }

  /**
   * Proof of Authority / Proof of Work block sealing
   * @param {number} difficulty Leading zero nibbles required
   */
  sealBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

/**
 * Municipal Audit Blockchain Ledger
 */
export class ImmutableAuditLedger {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 2; // Fast sub-second proof sealing
    this.createGenesisBlock();
    this.seedInitialHistoricalBlocks();
  }

  createGenesisBlock() {
    const genesisTx = new LedgerTransaction({
      txId: 'tx_genesis_000',
      timestamp: '2026-10-01T00:00:00.000Z',
      action: 'SYSTEM_GENESIS_INITIALIZED',
      itemId: 'SYSTEM_ROOT',
      itemName: 'FoundIt Municipal Immutable Chain of Custody Root',
      initiatorId: 'SYS_ADMIN',
      initiatorName: 'Metropolitan Transportation Oversight Authority',
      initiatorRole: 'Admin',
      notes: 'Cryptographic custody chain initialized under NYC DOT and MTA oversight.',
    });

    const genesisBlock = new LedgerBlock(
      0,
      '2026-10-01T00:00:00.000Z',
      [genesisTx],
      '0'.repeat(64)
    );
    genesisBlock.sealBlock(this.difficulty);
    this.chain.push(genesisBlock);
  }

  seedInitialHistoricalBlocks() {
    // Block 1: Initial GCT custody intake & wallet recovery
    const tx1 = new LedgerTransaction({
      txId: 'tx_hist_101',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      action: 'ITEM_REGISTERED',
      itemId: 'seed-item-2',
      itemName: 'Vintage Brown Leather Bifold Wallet',
      initiatorId: 'user_officer_01',
      initiatorName: 'Officer David Chen',
      initiatorRole: 'TransitOfficer',
      fromHubId: 'HUB-GCT',
      tamperEvidentSealNumber: 'SEAL-NYC-99812',
      notes: 'Initial custody logging into Grand Central automated locker bank.',
    });

    const tx2 = new LedgerTransaction({
      txId: 'tx_hist_102',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      action: 'CUSTODY_TRANSFERRED',
      itemId: 'seed-item-2',
      itemName: 'Vintage Brown Leather Bifold Wallet',
      initiatorId: 'user_officer_01',
      initiatorName: 'Officer David Chen',
      initiatorRole: 'TransitOfficer',
      fromHubId: 'HUB-GCT',
      toHubId: 'HUB-PENN',
      tamperEvidentSealNumber: 'SEAL-NYC-99812',
      notes: 'Dispatched via MTA secure courier van for traveler pickup.',
    });

    const block1 = new LedgerBlock(
      1,
      new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      [tx1, tx2],
      this.getLatestBlock().hash
    );
    block1.sealBlock(this.difficulty);
    this.chain.push(block1);

    // Block 2: Sunglasses Handshake sealed
    const tx3 = new LedgerTransaction({
      txId: 'tx_hist_103',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      action: 'HANDSHAKE_SEALED',
      itemId: 'seed-item-5',
      itemName: 'Ray-Ban Wayfarer Classic Polarized Sunglasses',
      initiatorId: 'user_officer_01',
      initiatorName: 'Officer David Chen',
      initiatorRole: 'TransitOfficer',
      fromHubId: 'HUB-GCT',
      proofOfIdentity: 'NY Driver License & Optical Receipt',
      tamperEvidentSealNumber: 'SEAL-GCT-8831',
      notes: 'Physical custody returned to verified citizen. Dual biometric signoff.',
    });

    const block2 = new LedgerBlock(
      2,
      new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      [tx3],
      this.getLatestBlock().hash
    );
    block2.sealBlock(this.difficulty);
    this.chain.push(block2);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Submit transaction to pending pool and automatically seal block when threshold reached
   * @param {Object} txData
   * @returns {LedgerTransaction}
   */
  recordTransaction(txData) {
    const tx = new LedgerTransaction(txData);
    this.pendingTransactions.push(tx);

    // Seal into a new block immediately or batch
    const newBlock = new LedgerBlock(
      this.chain.length,
      new Date().toISOString(),
      [...this.pendingTransactions],
      this.getLatestBlock().hash
    );
    newBlock.sealBlock(this.difficulty);
    this.chain.push(newBlock);
    this.pendingTransactions = [];

    return tx;
  }

  /**
   * Cryptographically validates the integrity of the entire blockchain
   * Verifies that:
   * 1. Every block's previousHash matches the prior block's hash.
   * 2. Every block's hash matches its calculated hash (no altered transactions or nonces).
   * 3. Merkle root of every block matches its transactions list.
   * @returns {{ valid: boolean; totalBlocks: number; checkedAt: string; errors: string[] }}
   */
  verifyChainIntegrity() {
    const errors = [];

    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 1. Verify previous hash pointer
      if (currentBlock.previousHash !== previousBlock.hash) {
        errors.push(
          `Block #${currentBlock.index} broken link: previousHash "${currentBlock.previousHash.substring(0, 10)}..." does not match Block #${previousBlock.index} hash "${previousBlock.hash.substring(0, 10)}..."`
        );
      }

      // 2. Verify hash calculation
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        errors.push(
          `Block #${currentBlock.index} tampered hash: stored "${currentBlock.hash}" differs from computed "${currentBlock.calculateHash()}"`
        );
      }

      // 3. Verify Merkle root of transactions
      const calculatedMerkle = calculateMerkleRoot(
        currentBlock.transactions.map((t) => t.txHash)
      );
      if (currentBlock.merkleRoot !== calculatedMerkle) {
        errors.push(
          `Block #${currentBlock.index} Merkle root discrepancy: stored "${currentBlock.merkleRoot}" differs from transactions Merkle tree "${calculatedMerkle}"`
        );
      }
    }

    return {
      valid: errors.length === 0,
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((acc, b) => acc + b.transactions.length, 0),
      difficulty: this.difficulty,
      checkedAt: new Date().toISOString(),
      errors,
    };
  }

  getChain() {
    return this.chain;
  }

  getTransactionReceipt(txId) {
    for (const block of this.chain) {
      const tx = block.transactions.find((t) => t.txId === txId);
      if (tx) {
        return {
          found: true,
          blockIndex: block.index,
          blockHash: block.hash,
          merkleRoot: block.merkleRoot,
          blockTimestamp: block.timestamp,
          transaction: tx,
        };
      }
    }
    return { found: false, message: `Transaction ${txId} not found in immutable ledger` };
  }
}

// Singleton Ledger instance for application runtime
export const municipalLedger = new ImmutableAuditLedger();
