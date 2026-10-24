import express from 'express';
import { claimRepository, evaluateClaimProofWithGemini } from '../services/claimService.js';
import { itemRepository } from '../services/itemStore.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { CLAIM_STATES } from '../models/Claim.js';

const router = express.Router();

/**
 * GET /api/claims
 * Retrieve claims with optional filtering by state, itemId, or claimantId
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { state, itemId, claimantId } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (itemId) filter.itemId = itemId;
    if (claimantId) filter.claimantId = claimantId;

    const claims = await claimRepository.getAll(filter);
    res.json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/claims/:id
 * Retrieve full forensic claim dossier
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const claim = await claimRepository.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }
    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/claims
 * Submit new claim and execute Secondary Gemini AI Verification Pipeline
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      itemId,
      itemName,
      claimantName,
      claimantEmail,
      claimantPhone,
      ownershipProof,
    } = req.body;

    if (!itemId || !ownershipProof || !ownershipProof.challengeAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required claim parameters: itemId and ownershipProof.challengeAnswer are required.',
      });
    }

    const claimantId = req.user ? req.user.id : 'user_citizen_' + Date.now();
    const finalClaimantName = req.user ? req.user.name : claimantName || 'Citizen Claimant';
    const finalClaimantEmail = req.user ? req.user.email : claimantEmail || 'claimant@citizen.org';

    const claim = await claimRepository.createClaim({
      itemId,
      itemName,
      claimantId,
      claimantName: finalClaimantName,
      claimantEmail: finalClaimantEmail,
      claimantPhone,
      ownershipProof,
    });

    // Broadcast live event over Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('claim:created', claim);
      io.emit(`claim:item:${itemId}`, claim);
    }

    res.status(201).json({
      success: true,
      message: `Claim created in state: ${claim.state}. Gemini forensic assessment score: ${Math.round(
        (claim.aiVerification?.confidenceScore || 0) * 100
      )}%`,
      claim,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/claims/:id/transition
 * Transition claim through state machine stages (Officer / Admin review, scheduling, handshake)
 */
router.patch('/:id/transition', optionalAuth, async (req, res) => {
  try {
    const { targetState, notes, lockerBin, hubId, officerDecision } = req.body;
    if (!targetState) {
      return res.status(400).json({ success: false, error: 'targetState is required' });
    }

    const actor = req.user
      ? { name: req.user.name, role: req.user.role, id: req.user.id }
      : { name: 'Officer on Duty', role: 'TransitOfficer', id: 'officer_sys' };

    const additionalPayload = {};
    if (officerDecision) {
      additionalPayload.officerReview = {
        reviewedByOfficerId: actor.id,
        officerName: actor.name,
        officerBadgeNumber: req.user?.badgeNumber || 'TR-8942',
        officerDecision,
        officerNotes: notes || '',
        reviewedAt: new Date().toISOString(),
      };
    }

    if (lockerBin || hubId) {
      additionalPayload.handshakeSchedule = {
        assignedHubId: hubId || 'HUB-GCT',
        assignedHubName: 'Grand Central Lost & Found Hub',
        pickupLockerBin: lockerBin || 'LOCKER-CONCOURSE-A',
        scheduledDateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      };
    }

    const updatedClaim = await claimRepository.transitionState(
      req.params.id,
      targetState,
      actor,
      notes,
      additionalPayload
    );

    // If handshake is completed, update item repository status to 'returned'
    if (targetState === CLAIM_STATES.HANDSHAKE_COMPLETED) {
      await itemRepository.updateStatus(
        updatedClaim.itemId,
        'returned',
        `Custody transfer completed by ${actor.name}. Verified by ${actor.role}.`
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('claim:updated', updatedClaim);
      io.emit(`claim:item:${updatedClaim.itemId}`, updatedClaim);
    }

    res.json({
      success: true,
      message: `Claim transitioned to ${targetState}`,
      claim: updatedClaim,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/claims/:id/reevaluate
 * Re-run Gemini AI Verification Pipeline on demand
 */
router.post('/:id/reevaluate', optionalAuth, async (req, res) => {
  try {
    const claim = await claimRepository.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    const item = await itemRepository.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Associated item not found' });
    }

    const aiEvaluation = await evaluateClaimProofWithGemini(item, claim.ownershipProof);
    claim.aiVerification = aiEvaluation;

    res.json({
      success: true,
      message: 'Gemini re-evaluation complete',
      aiVerification: aiEvaluation,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
