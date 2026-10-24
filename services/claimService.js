import Claim, { CLAIM_STATES } from '../models/Claim.js';
import mongoose from 'mongoose';
import { GoogleGenAI, Type } from '@google/genai';
import { itemRepository } from './itemStore.js';
import { auditRepository } from './auditStore.js';

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    apiVersion: 'v1alpha',
  },
});

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Initial seed claims demonstrating each state machine phase
const INITIAL_SEED_CLAIMS = [
  {
    _id: 'claim_seed_101',
    itemId: 'seed-item-1',
    itemName: 'Apple AirPods Pro (2nd Gen) in MagSafe Case',
    claimantId: 'user_std_01',
    claimantName: 'Sarah Connor',
    claimantEmail: 'sarah@citizen.org',
    claimantPhone: '+1 (555) 234-5678',
    state: CLAIM_STATES.AI_APPROVED,
    ownershipProof: {
      challengeAnswer: 'It has a sky blue silicone carabiner strap with a small brass ring attached.',
      purchaseReceiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49017a1430?auto=format&fit=crop&w=600&q=80',
      serialNumberOrEngraving: 'Serial ending in 8X92, small ding on rear hinge',
      identifyingMarks: 'Small scratch on back hinge',
      lossDate: '2026-10-24',
      lossLocationDescription: 'Jogging near Central Park Strawberry Fields',
    },
    aiVerification: {
      confidenceScore: 0.94,
      matchAssessment: 'High-confidence correlation across accessory, color, and specific hinge physical wear mark.',
      recommendation: 'APPROVE',
      verifiedAttributes: ['Blue silicone strap', 'Brass ring attachment', 'Hinge scratch confirmed'],
      discrepancies: [],
      reasoning: 'The claimant precisely described the unpublicized blue silicone strap with carabiner and exact scratch location on the hinge.',
      evaluatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    officerReview: {
      reviewedByOfficerId: 'user_officer_01',
      officerName: 'Officer David Chen',
      officerBadgeNumber: 'TR-8942',
      officerDecision: 'APPROVED',
      officerNotes: 'AI match confirmed. Scheduled for concourse locker pickup.',
      reviewedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    handshakeSchedule: {
      assignedHubId: 'HUB-GCT',
      assignedHubName: 'Grand Central Lost & Found Hub',
      pickupLockerBin: 'LOCKER-CONCOURSE-A12',
      scheduledDateTime: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      governmentIdTypeVerified: 'NY Driver License',
    },
    stateHistory: [
      { fromState: 'DRAFT', toState: 'SUBMITTED', changedBy: 'Sarah Connor', reason: 'Claim intake', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      { fromState: 'SUBMITTED', toState: 'AI_EVALUATING', changedBy: 'System Pipeline', reason: 'Gemini Verification Triggered', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
      { fromState: 'AI_EVALUATING', toState: 'AI_APPROVED', changedBy: 'Gemini 3.8 Flash', reason: 'Score 0.94 > threshold 0.85', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { fromState: 'AI_APPROVED', toState: 'OFFICER_REVIEW', changedBy: 'System Pipeline', reason: 'Officer assignment', timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { fromState: 'OFFICER_REVIEW', toState: 'SCHEDULED_PICKUP', changedBy: 'Officer David Chen', reason: 'Physical locker assigned', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: 'claim_seed_102',
    itemId: 'seed-item-2',
    itemName: 'Vintage Brown Leather Bifold Wallet',
    claimantId: 'user_std_02',
    claimantName: 'Marcus Vance',
    claimantEmail: 'marcus.v@columbia.edu',
    claimantPhone: '+1 (555) 912-3344',
    state: CLAIM_STATES.OFFICER_REVIEW,
    ownershipProof: {
      challengeAnswer: 'Columbia University School of Engineering student ID card in the front card window.',
      purchaseReceiptUrl: '',
      serialNumberOrEngraving: 'Initials MV embossed on interior fold',
      identifyingMarks: 'Worn edges with cream stitch',
      lossDate: '2026-10-24',
      lossLocationDescription: 'Dropped near Grand Central info kiosk during morning commute',
    },
    aiVerification: {
      confidenceScore: 0.96,
      matchAssessment: 'Decisive match on institutional identification card and leather stitch pattern.',
      recommendation: 'APPROVE',
      verifiedAttributes: ['Columbia University transit card', 'Brown full-grain leather', 'Cream stitching'],
      discrepancies: [],
      reasoning: 'The security question explicitly checked for the university name on the student transit card. Claimant answered Columbia University with matching student record.',
      evaluatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    officerReview: {
      reviewedByOfficerId: '',
      officerName: '',
      officerBadgeNumber: '',
      officerDecision: 'PENDING',
      officerNotes: '',
    },
    handshakeSchedule: {
      assignedHubId: 'HUB-GCT',
      assignedHubName: 'Grand Central Lost & Found Hub',
      pickupLockerBin: 'PENDING_ASSIGNMENT',
    },
    stateHistory: [
      { fromState: 'DRAFT', toState: 'SUBMITTED', changedBy: 'Marcus Vance', reason: 'Claim intake', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
      { fromState: 'SUBMITTED', toState: 'AI_EVALUATING', changedBy: 'System Pipeline', reason: 'Gemini Verification Triggered', timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
      { fromState: 'AI_EVALUATING', toState: 'OFFICER_REVIEW', changedBy: 'Gemini 3.8 Flash', reason: 'Awaiting Officer Verification Signoff', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: 'claim_seed_103',
    itemId: 'seed-item-3',
    itemName: 'Patagonia Black Hole Pack 25L (Navy Blue)',
    claimantId: 'user_std_03',
    claimantName: 'Elena Gilbert',
    claimantEmail: 'elena.g@gmail.com',
    claimantPhone: '+1 (555) 678-9012',
    state: CLAIM_STATES.AI_FLAGGED,
    ownershipProof: {
      challengeAnswer: 'There is a Hydro Flask bottle with an REI mountain sticker.',
      purchaseReceiptUrl: '',
      serialNumberOrEngraving: 'None',
      identifyingMarks: 'Black zipper pulls',
      lossDate: '2026-10-23',
      lossLocationDescription: 'Bryant Park outdoor lawn area',
    },
    aiVerification: {
      confidenceScore: 0.62,
      matchAssessment: 'Partial match on water bottle presence, but item metadata notes plain stainless steel bottle without sticker description.',
      recommendation: 'FLAG_FOR_OFFICER',
      verifiedAttributes: ['Navy backpack model', 'Water bottle present'],
      discrepancies: ['Sticker description does not match intake notes', 'Location slightly differs (reading room vs lawn)'],
      reasoning: 'Potential match, but requires manual officer inspection of the physical water bottle in storage before handover.',
      evaluatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    officerReview: {
      reviewedByOfficerId: '',
      officerName: '',
      officerBadgeNumber: '',
      officerDecision: 'PENDING',
      officerNotes: '',
    },
    handshakeSchedule: {},
    stateHistory: [
      { fromState: 'SUBMITTED', toState: 'AI_EVALUATING', changedBy: 'System Pipeline', reason: 'Intake analysis', timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
      { fromState: 'AI_EVALUATING', toState: 'AI_FLAGGED', changedBy: 'Gemini 3.8 Flash', reason: 'Discrepancy detected in water bottle description', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
];

let inMemoryClaims = [...INITIAL_SEED_CLAIMS];

/**
 * Secondary Gemini AI Verification Pipeline
 * Evaluates claimant proof submission against item metadata
 */
export async function evaluateClaimProofWithGemini(item, ownershipProof) {
  try {
    const prompt = `
You are the Senior Verification Officer for an enterprise Lost & Found transit authority.
Perform a rigorous forensic match assessment between the claimant's submitted proof of ownership and the verified found item's intake record.

FOUND ITEM METADATA:
- Item Name: ${item.itemName}
- Category: ${item.category}
- Color: ${item.color}
- Intake Description: ${item.description}
- Search Tags: ${(item.searchTags || []).join(', ')}
- Location Found: ${item.locationName}
- Hidden Challenge Question: ${item.claimQuestion || 'Describe unique attributes'}

CLAIMANT'S SUBMITTED PROOF:
- Challenge Answer: ${ownershipProof.challengeAnswer || 'Not provided'}
- Serial Number / Engraving: ${ownershipProof.serialNumberOrEngraving || 'None stated'}
- Identifying Marks: ${ownershipProof.identifyingMarks || 'None stated'}
- Loss Context / Location: ${ownershipProof.lossLocationDescription || 'Not provided'}
- Loss Date: ${ownershipProof.lossDate || 'Not provided'}

TASK:
1. Compare the claimant's answer with the true item metadata and secret challenge question.
2. Calculate a confidenceScore between 0.0 and 1.0 (where 1.0 is absolute certainty of ownership).
3. Identify verifiedAttributes (attributes confirmed matching).
4. Identify any discrepancies (contradictions or implausible details).
5. Set recommendation:
   - "APPROVE": If score >= 0.85 and key unique traits match.
   - "FLAG_FOR_OFFICER": If score is between 0.50 and 0.84, or minor ambiguities exist.
   - "REJECT": If score < 0.50, or answers directly contradict ground truth.
6. Provide concise forensic reasoning.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            matchAssessment: { type: Type.STRING },
            recommendation: {
              type: Type.STRING,
              enum: ['APPROVE', 'FLAG_FOR_OFFICER', 'REJECT'],
            },
            verifiedAttributes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            discrepancies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            reasoning: { type: Type.STRING },
          },
          required: [
            'confidenceScore',
            'matchAssessment',
            'recommendation',
            'verifiedAttributes',
            'discrepancies',
            'reasoning',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      confidenceScore: Math.min(Math.max(parsed.confidenceScore, 0), 1),
      matchAssessment: parsed.matchAssessment || 'Gemini multi-stage analysis complete',
      recommendation: parsed.recommendation || 'FLAG_FOR_OFFICER',
      verifiedAttributes: parsed.verifiedAttributes || [],
      discrepancies: parsed.discrepancies || [],
      reasoning: parsed.reasoning || 'Evaluated against intake record',
      evaluatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('[Gemini AI Verification Pipeline] API notice:', err.message);
    // Intelligent heuristic fallback
    const answer = (ownershipProof.challengeAnswer || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    const isKeywordMatched = answer.length > 5 && (
      itemDesc.includes(answer) ||
      (item.searchTags || []).some(t => answer.includes(t.toLowerCase()))
    );

    return {
      confidenceScore: isKeywordMatched ? 0.88 : 0.65,
      matchAssessment: 'Rule-based verification heuristic assessment',
      recommendation: isKeywordMatched ? 'APPROVE' : 'FLAG_FOR_OFFICER',
      verifiedAttributes: isKeywordMatched ? ['Intake keyword correlation confirmed'] : ['Basic claim details submitted'],
      discrepancies: isKeywordMatched ? [] : ['Requires human officer confirmation at station'],
      reasoning: 'Forensic evaluation evaluated user description against item metadata records.',
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export const claimRepository = {
  async getAll(filter = {}) {
    if (isMongoConnected()) {
      try {
        return await Claim.find(filter).sort({ createdAt: -1 }).lean();
      } catch (err) {
        console.warn('Mongo claim getAll error:', err.message);
      }
    }
    return inMemoryClaims.filter((c) => {
      if (filter.state && c.state !== filter.state) return false;
      if (filter.claimantId && c.claimantId !== filter.claimantId) return false;
      if (filter.itemId && c.itemId !== filter.itemId) return false;
      return true;
    });
  },

  async findById(id) {
    if (isMongoConnected()) {
      try {
        return await Claim.findById(id);
      } catch (err) {
        // Fallback
      }
    }
    return inMemoryClaims.find((c) => c._id === id || c.id === id) || null;
  },

  async createClaim({
    itemId,
    itemName,
    claimantId,
    claimantName,
    claimantEmail,
    claimantPhone,
    ownershipProof,
  }) {
    // 1. Fetch item to compare against
    const item = await itemRepository.findById(itemId);
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    // 2. Run Secondary Gemini Verification Pipeline
    const aiEvaluation = await evaluateClaimProofWithGemini(item, ownershipProof);

    // 3. Determine initial state based on AI pipeline
    let initialState = CLAIM_STATES.SUBMITTED;
    if (aiEvaluation.recommendation === 'APPROVE') {
      initialState = CLAIM_STATES.AI_APPROVED;
    } else if (aiEvaluation.recommendation === 'FLAG_FOR_OFFICER') {
      initialState = CLAIM_STATES.AI_FLAGGED;
    } else if (aiEvaluation.recommendation === 'REJECT') {
      initialState = CLAIM_STATES.REJECTED;
    }

    const stateHistory = [
      {
        fromState: CLAIM_STATES.DRAFT,
        toState: CLAIM_STATES.SUBMITTED,
        changedBy: claimantName,
        reason: 'Ownership claim submitted',
        timestamp: new Date().toISOString(),
      },
      {
        fromState: CLAIM_STATES.SUBMITTED,
        toState: initialState,
        changedBy: 'Gemini AI Verification Engine',
        reason: `AI Score: ${Math.round(aiEvaluation.confidenceScore * 100)}% (${aiEvaluation.recommendation})`,
        timestamp: new Date().toISOString(),
      },
    ];

    const claimDoc = {
      itemId,
      itemName: item.itemName || itemName,
      claimantId,
      claimantName,
      claimantEmail,
      claimantPhone: claimantPhone || '',
      state: initialState,
      ownershipProof,
      aiVerification: aiEvaluation,
      officerReview: {
        officerDecision: 'PENDING',
        officerNotes: '',
      },
      handshakeSchedule: {
        assignedHubId: 'HUB-GCT',
        assignedHubName: 'Grand Central Lost & Found Hub',
        pickupLockerBin: 'LOCKER-PENDING',
      },
      stateHistory,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const doc = new Claim(claimDoc);
        return await doc.save();
      } catch (err) {
        console.warn('Mongo create claim error, fallback to memory:', err.message);
      }
    }

    const memoryDoc = {
      _id: 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      ...claimDoc,
    };
    inMemoryClaims.unshift(memoryDoc);

    // Audit log entry
    await auditRepository.log({
      userId: claimantId,
      userName: claimantName,
      userRole: 'Standard',
      action: 'CLAIM_REQUESTED',
      itemId,
      itemName: item.itemName,
      notes: `AI State Machine assigned ${initialState} (Confidence: ${Math.round(aiEvaluation.confidenceScore * 100)}%)`,
      metadata: { aiConfidence: aiEvaluation.confidenceScore, recommendation: aiEvaluation.recommendation },
    });

    return memoryDoc;
  },

  /**
   * Transition Claim State Machine
   */
  async transitionState(claimId, targetState, actor = { name: 'Officer', role: 'TransitOfficer', id: 'usr' }, notes = '', additionalPayload = {}) {
    const validStates = Object.values(CLAIM_STATES);
    if (!validStates.includes(targetState)) {
      throw new Error(`Invalid target state: ${targetState}`);
    }

    let claim = await this.findById(claimId);
    if (!claim) {
      throw new Error(`Claim ${claimId} not found`);
    }

    const fromState = claim.state;
    const historyEntry = {
      fromState,
      toState: targetState,
      changedBy: `${actor.name} (${actor.role})`,
      reason: notes || `Transitioned to ${targetState}`,
      timestamp: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        const updateObj = {
          state: targetState,
          $push: { stateHistory: historyEntry },
          ...additionalPayload,
        };
        const updated = await Claim.findByIdAndUpdate(claimId, updateObj, { new: true });
        return updated;
      } catch (err) {
        // Fallback
      }
    }

    // In-Memory update
    claim.state = targetState;
    if (!claim.stateHistory) claim.stateHistory = [];
    claim.stateHistory.push(historyEntry);

    if (additionalPayload.officerReview) {
      claim.officerReview = { ...claim.officerReview, ...additionalPayload.officerReview };
    }
    if (additionalPayload.handshakeSchedule) {
      claim.handshakeSchedule = { ...claim.handshakeSchedule, ...additionalPayload.handshakeSchedule };
    }

    // Audit log
    await auditRepository.log({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: targetState === CLAIM_STATES.HANDSHAKE_COMPLETED ? 'ITEM_HANDSHAKE_COMPLETED' : 'STATUS_OVERRIDE',
      itemId: claim.itemId,
      itemName: claim.itemName,
      notes: `Claim state transitioned from ${fromState} to ${targetState}. ${notes}`,
      metadata: { claimId, fromState, toState: targetState },
    });

    return claim;
  },
};
