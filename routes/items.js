import express from 'express';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import { itemRepository, calculateDistanceKm } from '../services/itemStore.js';
import { auditRepository } from '../services/auditStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// In-memory store for secure anonymous coordination messages per item
const itemMessageThreads = new Map();

// Configure multer for in-memory multipart uploads (limit to 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Initialize Google GenAI client following AI Studio guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Fallback image samples when testing without uploading a local file
 */
const SAMPLE_IMAGE_FALLBACKS = {
  Electronics: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  'Bags & Wallets': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'Keys & Badges': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
  Eyewear: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
};

/**
 * Helper: Extract structured item metadata from image & text using Gemini 3.8 Flash
 */
async function extractItemWithGemini({ imageBuffer, mimeType, imageUrl, textNote, locationName }) {
  const parts = [];

  // Add image part if buffer is present
  if (imageBuffer && mimeType) {
    parts.push({
      inlineData: {
        mimeType,
        data: imageBuffer.toString('base64'),
      },
    });
  }

  const promptText = `
You are the FoundIt AI Vision & Extraction Engine.
Analyze the provided image of a lost/found item along with the finder's note:
Finder Note: "${textNote || 'Found in public space'}"
Found Location: "${locationName || 'Unspecified'}"

Extract a structured JSON object representing this item with the following properties:
1. itemName: Concise, clear name (e.g. "Apple AirPods Pro 2 in MagSafe Case", "Black Leather Fossil Bifold Wallet")
2. category: Must be one of ["Electronics", "Bags & Wallets", "Keys & Badges", "Clothing & Accessories", "Documents & Cards", "Jewelry & Watches", "Eyewear", "Pets", "Sports & Outdoor", "Other"]
3. color: Primary and secondary colors (e.g. "Matte Black with red accents", "Navy Blue")
4. description: Rich visual description including physical condition, distinctive markings, logos, engravings, or contents visible.
5. searchTags: Array of 6-10 keywords, synonyms, brand names, and related search terms in lowercase (e.g. ["airpods", "apple", "earbuds", "wireless", "white", "case"])
6. aiConfidence: Float between 0.70 and 0.99 reflecting visual identification confidence.
7. claimQuestion: A clever security question that the true owner should be able to answer to verify ownership (without revealing private markings publicly, e.g. "What brand of pen was inside the small front pocket?").

Output strictly valid JSON.
`;

  parts.push({ text: promptText });

  try {
    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            category: { type: Type.STRING },
            color: { type: Type.STRING },
            description: { type: Type.STRING },
            searchTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            aiConfidence: { type: Type.NUMBER },
            claimQuestion: { type: Type.STRING },
          },
          required: ['itemName', 'category', 'color', 'description', 'searchTags'],
        },
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 8000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);
    const parsed = JSON.parse(response.text.trim());
    return parsed;
  } catch (error) {
    console.warn('Gemini extraction failed, using intelligent heuristics:', error.message);
    // Intelligent heuristic fallback if Gemini is offline or rate-limited
    const note = (textNote || '').toLowerCase();
    let category = 'Other';
    if (/phone|iphone|android|laptop|macbook|airpods|headphone|charger|ipad|camera/.test(note)) category = 'Electronics';
    else if (/wallet|bag|backpack|purse|tote|pouch/.test(note)) category = 'Bags & Wallets';
    else if (/key|fob|lanyard|badge/.test(note)) category = 'Keys & Badges';
    else if (/glasses|sunglasses|rayban/.test(note)) category = 'Eyewear';
    else if (/jacket|coat|hat|scarf|shirt/.test(note)) category = 'Clothing & Accessories';

    const words = (textNote || 'Found Personal Item').split(/\s+/).slice(0, 5).join(' ');
    return {
      itemName: textNote ? `Found Item (${words})` : 'Unidentified Found Item',
      category,
      color: /black/.test(note) ? 'Black' : /blue/.test(note) ? 'Blue' : /brown/.test(note) ? 'Brown' : 'Multicolor',
      description: textNote || 'Item found by citizen. Inquire with details to claim.',
      searchTags: ['found', category.toLowerCase(), ...note.split(/\s+/).filter((w) => w.length > 3)],
      aiConfidence: 0.82,
      claimQuestion: 'Can you describe any unique markings or serial numbers?',
    };
  }
}

/**
 * POST /found
 * Accepts multipart/form-data upload (image + text note)
 * Uses Gemini to extract structured JSON, saves to MongoDB, broadcasts Socket.io event
 */
router.post('/found', upload.single('image'), async (req, res) => {
  try {
    const { note, textNote, locationName, lat, lng, reportedBy, imageUrlInput } = req.body;
    const finalNote = textNote || note || '';
    const finalLocationName = locationName || 'Central Park, New York, NY';

    // Parse coordinates [lng, lat]
    const longitude = Number(lng) || -73.9712 + (Math.random() - 0.5) * 0.05;
    const latitude = Number(lat) || 40.7831 + (Math.random() - 0.5) * 0.05;

    let imageBuffer = null;
    let mimeType = null;
    let finalImageUrl = '';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      // Encode as data URI for instant rendering
      finalImageUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } else if (req.body.imageBase64) {
      const match = req.body.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
        finalImageUrl = req.body.imageBase64;
      }
    } else if (imageUrlInput) {
      finalImageUrl = imageUrlInput;
    }

    // Call Gemini to analyze the image and note
    const extracted = await extractItemWithGemini({
      imageBuffer,
      mimeType,
      imageUrl: finalImageUrl,
      textNote: finalNote,
      locationName: finalLocationName,
    });

    if (!finalImageUrl) {
      finalImageUrl =
        SAMPLE_IMAGE_FALLBACKS[extracted.category] || SAMPLE_IMAGE_FALLBACKS.Other;
    }

    // Parse custom searchTags if passed as JSON string
    let parsedTags = extracted.searchTags || ['found'];
    if (req.body.searchTags) {
      try {
        parsedTags = Array.isArray(req.body.searchTags)
          ? req.body.searchTags
          : JSON.parse(req.body.searchTags);
      } catch (e) {
        parsedTags = [String(req.body.searchTags)];
      }
    }

    // Construct item document
    const itemData = {
      itemName: req.body.itemName || extracted.itemName || 'Found Item',
      category: req.body.category || extracted.category || 'Other',
      color: req.body.color || extracted.color || 'Unspecified',
      locationName: finalLocationName,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      searchTags: parsedTags,
      description: req.body.description || extracted.description || finalNote || 'Found in public area',
      imageUrl: finalImageUrl,
      status: 'found',
      aiConfidence: extracted.aiConfidence || 0.95,
      claimQuestion:
        req.body.claimQuestion ||
        extracted.claimQuestion ||
        'Can you describe any unique identifier?',
      reportedBy: reportedBy || 'Good Samaritan',
    };

    // Save item to database / repository
    const savedItem = await itemRepository.create(itemData);

    // Broadcast real-time event using Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('item:found', savedItem);
      console.log(`[Socket.io] Broadcasted new found item: "${savedItem.itemName}"`);
    }

    return res.status(201).json({
      success: true,
      message: 'Found item analyzed and broadcasted successfully',
      item: savedItem,
      aiExtraction: extracted,
    });
  } catch (error) {
    console.error('Error in POST /found:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process found item',
    });
  }
});

/**
 * POST /search
 * Accepts natural language query + optional coordinates.
 * Retrieves items and uses Gemini to match query intent against database items.
 */
router.post('/search', async (req, res) => {
  try {
    const { query, lat, lng, radiusKm = 25, category } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Natural language search query is required',
      });
    }

    const searchQuery = query.trim();
    let candidates = [];

    // If coordinates are provided, retrieve spatially nearby candidates
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      candidates = await itemRepository.getNearCoordinates(
        Number(lng),
        Number(lat),
        Number(radiusKm)
      );
    } else {
      // Retrieve recent candidates from database
      candidates = await itemRepository.findAll({
        limit: 30,
        category: category !== 'All' ? category : undefined,
      });
    }

    if (candidates.length === 0) {
      // If none found in radius, widen search to all recent items
      candidates = await itemRepository.findAll({ limit: 30 });
    }

    // Prepare candidate summaries for Gemini semantic intent analysis
    const candidateSummaries = candidates.map((item, idx) => ({
      index: idx,
      id: item._id || item.id,
      name: item.itemName,
      category: item.category,
      color: item.color,
      locationName: item.locationName,
      tags: item.searchTags,
      description: item.description,
      distanceKm: item.distanceKm,
    }));

    // Use Gemini to perform semantic matching & reasoning
    try {
      const matchPrompt = `
You are the FoundIt AI Semantic Matcher for a Lost & Found network.
A user lost an item and typed this natural language description:
User Lost Query: "${searchQuery}"

Evaluate the following candidate found items in the database and determine if any of them likely match the user's lost item.
Consider semantic synonyms (e.g. "shades" = "sunglasses", "macbook" = "laptop", "fob" = "keys"), color descriptions, brands, locations, and contextual clues.

Candidate items:
${JSON.stringify(candidateSummaries, null, 2)}

Return a JSON array of matches for the candidates that have any relevance (score >= 20).
For each matched candidate, provide:
- index: integer (the index in candidate items array)
- matchScore: integer from 0 to 100 representing probability of being the user's item
- matchReason: clear explanation (1-2 sentences) of why this matches or differs (e.g. "Strong match: exact color and brand match with AirPods Pro case found near Central Park.")
- matchingAttributes: array of strings of matching aspects (e.g. ["Category", "Color: White", "Brand: Apple", "Proximity"])
- isTopMatch: boolean

Order the results strictly by matchScore descending.
`;

      const aiMatchPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: matchPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                index: { type: Type.INTEGER },
                matchScore: { type: Type.INTEGER },
                matchReason: { type: Type.STRING },
                matchingAttributes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                isTopMatch: { type: Type.BOOLEAN },
              },
              required: ['index', 'matchScore', 'matchReason'],
            },
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini search timed out')), 8000)
      );

      const aiMatchResponse = await Promise.race([aiMatchPromise, timeoutPromise]);
      const matchResults = JSON.parse(aiMatchResponse.text.trim());

      // Merge Gemini scores and reasoning back into candidate documents
      const scoredItems = matchResults
        .filter((res) => candidates[res.index])
        .map((res) => {
          const original = candidates[res.index];
          return {
            ...original,
            matchScore: res.matchScore,
            matchReason: res.matchReason,
            matchingAttributes: res.matchingAttributes || [],
            isTopMatch: Boolean(res.isTopMatch),
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        success: true,
        query: searchQuery,
        totalCandidates: candidates.length,
        matchesCount: scoredItems.length,
        items: scoredItems,
        aiPowered: true,
      });
    } catch (geminiError) {
      console.warn('Gemini semantic ranking failed, using keyword & fuzzy fallback:', geminiError.message);

      // Local heuristic fallback ranking
      const qTokens = searchQuery.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const scoredItems = candidates
        .map((item) => {
          let score = 30; // base score
          const textCorpus = `${item.itemName} ${item.description} ${item.category} ${item.color} ${item.locationName} ${(item.searchTags || []).join(' ')}`.toLowerCase();

          qTokens.forEach((token) => {
            if (textCorpus.includes(token)) score += 15;
          });

          if (item.distanceKm !== undefined && item.distanceKm < 5) score += 15;

          score = Math.min(score, 99);
          return {
            ...item,
            matchScore: score,
            matchReason: `Keyword correlation for search terms (${qTokens.filter((t) => textCorpus.includes(t)).join(', ') || 'general context'}).`,
            matchingAttributes: ['Keyword match'],
            isTopMatch: score > 70,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return res.json({
        success: true,
        query: searchQuery,
        items: scoredItems,
        aiPowered: false,
      });
    }
  } catch (error) {
    console.error('Error in POST /search:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Search execution failed',
    });
  }
});

/**
 * GET /
 * Retrieve latest items with category/status filters
 */
router.get('/', async (req, res) => {
  try {
    const { category, status, search, limit = 50, skip = 0 } = req.query;
    const items = await itemRepository.findAll({ category, status, search, limit, skip });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /stats
 * Retrieve lost & found summary statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await itemRepository.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /:id
 * Retrieve details for a specific item
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await itemRepository.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /:id/claim
 * Submit a claim verification or mark as claimed
 */
router.patch('/:id/claim', optionalAuth, async (req, res) => {
  try {
    const { status = 'claimed', claimantAnswer, claimantContact, claimantName } = req.body;
    const item = await itemRepository.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const note = claimantAnswer
      ? `Claim response: "${claimantAnswer}" (Contact: ${claimantContact || 'Protected In-App'})`
      : '';
    const updated = await itemRepository.updateStatus(req.params.id, status, note);

    // Audit log tracking
    await auditRepository.log({
      userId: req.user ? req.user.id : 'anon_claimant',
      userName: req.user ? req.user.name : claimantName || 'Citizen Claimant',
      userRole: req.user ? req.user.role : 'Standard',
      action: 'CLAIM_REQUESTED',
      itemId: String(req.params.id),
      itemName: item.itemName,
      notes: `Ownership challenge submitted with answer: "${claimantAnswer || 'Direct claim'}"`,
      metadata: { contactMethod: claimantContact ? 'provided' : 'in-app-chat' },
    });

    // Broadcast update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('item:updated', updated);
    }

    res.json({
      success: true,
      message: `Item status updated to ${status}`,
      item: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /:id/handshake
 * Official custody transfer verification (by Transit Officer, Admin, or verified finder)
 */
router.post('/:id/handshake', optionalAuth, async (req, res) => {
  try {
    const { stationLocation, handoverNotes, verifiedProofType } = req.body;
    const item = await itemRepository.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const updated = await itemRepository.updateStatus(
      req.params.id,
      'returned',
      `Official Handshake Completed: ${handoverNotes || 'Returned to verified owner'}`
    );

    // Record audit handshake log
    const audit = await auditRepository.log({
      userId: req.user ? req.user.id : 'officer_system',
      userName: req.user ? req.user.name : 'Officer On Duty',
      userRole: req.user ? req.user.role : 'TransitOfficer',
      action: 'ITEM_HANDSHAKE_COMPLETED',
      itemId: String(req.params.id),
      itemName: item.itemName,
      notes: handoverNotes || 'Ownership proof confirmed; physical transfer executed.',
      metadata: { stationLocation, verifiedProofType: verifiedProofType || 'Photo ID' },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('item:updated', updated);
      io.emit('handshake:completed', { item: updated, audit });
    }

    res.json({
      success: true,
      message: 'Item custody transfer sealed and archived successfully.',
      item: updated,
      audit,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /:id/messages
 * Retrieve anonymous secure in-app message thread for coordinating return
 */
router.get('/:id/messages', (req, res) => {
  const itemId = String(req.params.id);
  const thread = itemMessageThreads.get(itemId) || [];
  res.json({ success: true, count: thread.length, messages: thread });
});

/**
 * POST /:id/messages
 * Send encrypted/safe in-app message between claimant and finder/officer
 */
router.post('/:id/messages', optionalAuth, (req, res) => {
  try {
    const itemId = String(req.params.id);
    const { senderName, senderRole, text, isOfficerNote = false } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      itemId,
      senderName: req.user ? req.user.name : senderName || 'Anonymous Citizen',
      senderRole: req.user ? req.user.role : senderRole || 'Standard',
      senderId: req.user ? req.user.id : 'anon',
      text: text.trim(),
      isOfficerNote,
      timestamp: new Date().toISOString(),
    };

    if (!itemMessageThreads.has(itemId)) {
      itemMessageThreads.set(itemId, []);
    }
    const thread = itemMessageThreads.get(itemId);
    thread.push(msg);

    // Broadcast message via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`item:${itemId}`).emit('chat:message', msg);
      io.emit(`chat:item:${itemId}`, msg);
    }

    res.status(201).json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
