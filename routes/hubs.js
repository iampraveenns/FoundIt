import express from 'express';
import { hubRepository } from '../services/hubService.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/hubs
 * List all municipal and transit agency hubs
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const hubs = await hubRepository.getAll();
    res.json({
      success: true,
      count: hubs.length,
      hubs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hubs/transfers/all
 * Retrieve all active and historical transfer manifests across hubs
 */
router.get('/transfers/all', optionalAuth, async (req, res) => {
  try {
    const hubs = await hubRepository.getAll();
    const allManifests = [];
    for (const hub of hubs) {
      if (Array.isArray(hub.transferManifests)) {
        allManifests.push(...hub.transferManifests);
      }
    }
    allManifests.sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());

    res.json({
      success: true,
      count: allManifests.length,
      transfers: allManifests,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hubs/:code
 * Retrieve details for a specific transit hub by code
 */
router.get('/:code', optionalAuth, async (req, res) => {
  try {
    const hub = await hubRepository.findByCode(req.params.code);
    if (!hub) {
      return res.status(404).json({ success: false, error: 'Hub not found' });
    }
    res.json({ success: true, hub });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hubs/transfers/dispatch
 * Dispatch terminal transfer manifest
 */
router.post('/transfers/dispatch', optionalAuth, async (req, res) => {
  try {
    const {
      itemIds,
      originHubCode,
      destinationHubCode,
      officerName,
      officerBadge,
      courierVehicleId,
      tamperSealNumber,
      notes,
    } = req.body;

    if (!itemIds || !originHubCode || !destinationHubCode) {
      return res.status(400).json({
        success: false,
        error: 'itemIds array, originHubCode, and destinationHubCode are required.',
      });
    }

    const finalOfficerName = req.user ? req.user.name : officerName || 'Officer on Duty';
    const finalOfficerBadge = req.user?.badgeNumber || officerBadge || 'TR-8942';

    const manifest = await hubRepository.createTransferManifest({
      itemIds: Array.isArray(itemIds) ? itemIds : [itemIds],
      originHubCode,
      destinationHubCode,
      officerName: finalOfficerName,
      officerBadge: finalOfficerBadge,
      courierVehicleId,
      tamperSealNumber,
      notes,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('transfer:dispatched', manifest);
    }

    res.status(201).json({
      success: true,
      message: `Manifest ${manifest.manifestId} dispatched successfully from ${originHubCode} to ${destinationHubCode}`,
      manifest,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hubs/transfers/receive
 * Acknowledge receipt of transfer manifest
 */
router.post('/transfers/receive', optionalAuth, async (req, res) => {
  try {
    const { manifestId, receivingOfficerName, receivingOfficerBadge } = req.body;
    if (!manifestId) {
      return res.status(400).json({ success: false, error: 'manifestId is required' });
    }

    const finalOfficerName = req.user ? req.user.name : receivingOfficerName || 'Receiving Officer';
    const finalOfficerBadge = req.user?.badgeNumber || receivingOfficerBadge || 'TR-9110';

    const updatedManifest = await hubRepository.receiveTransferManifest({
      manifestId,
      receivingOfficerName: finalOfficerName,
      receivingOfficerBadge: finalOfficerBadge,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('transfer:received', updatedManifest);
    }

    res.json({
      success: true,
      message: `Manifest ${manifestId} marked as RECEIVED. Custody transfer logged.`,
      manifest: updatedManifest,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
