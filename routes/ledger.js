import express from 'express';
import { municipalLedger } from '../services/audit-ledger/ledger.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/ledger/chain
 * Retrieve all cryptographically sealed blocks
 */
router.get('/chain', (req, res) => {
  const chain = municipalLedger.getChain();
  const integrity = municipalLedger.verifyChainIntegrity();

  res.json({
    success: true,
    totalBlocks: chain.length,
    integrity,
    chain,
  });
});

/**
 * GET /api/ledger/verify
 * Perform rigorous cryptographic verification of hash pointers and Merkle trees
 */
router.get('/verify', (req, res) => {
  const result = municipalLedger.verifyChainIntegrity();
  res.json({
    success: true,
    ...result,
  });
});

/**
 * POST /api/ledger/record
 * Record custody transfer transaction and mine/seal into new block
 */
router.post('/record', optionalAuth, (req, res) => {
  try {
    const { action, itemId, itemName, fromHubId, toHubId, tamperEvidentSealNumber, notes } = req.body;

    const initiatorName = req.user ? req.user.name : 'Officer David Chen';
    const initiatorId = req.user ? req.user.id : 'user_officer_01';
    const initiatorRole = req.user ? req.user.role : 'TransitOfficer';

    const tx = municipalLedger.recordTransaction({
      action: action || 'CUSTODY_TRANSFERRED',
      itemId: itemId || 'seed-item-1',
      itemName: itemName || 'Apple AirPods Pro 2 in MagSafe Case',
      initiatorId,
      initiatorName,
      initiatorRole,
      fromHubId: fromHubId || 'HUB-GCT',
      toHubId: toHubId || 'HUB-PENN',
      tamperEvidentSealNumber: tamperEvidentSealNumber || `SEAL-NYC-${Math.floor(10000 + Math.random() * 90000)}`,
      notes: notes || 'Inter-agency custody transfer recorded on blockchain ledger.',
    });

    const latestBlock = municipalLedger.getLatestBlock();

    // Broadcast over socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('ledger:block_mined', latestBlock);
    }

    res.status(201).json({
      success: true,
      message: `Block #${latestBlock.index} mined and cryptographically sealed with SHA-256`,
      block: latestBlock,
      transaction: tx,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/ledger/tx/:txId
 * Get transaction receipt and Merkle verification proof
 */
router.get('/tx/:txId', (req, res) => {
  const receipt = municipalLedger.getTransactionReceipt(req.params.txId);
  res.json({ success: receipt.found, receipt });
});

export default router;
