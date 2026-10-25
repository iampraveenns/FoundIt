import { calculateDistanceKm } from '../../utils/geo.js';

/**
 * Enterprise Multi-Factor Matching & Vector Scoring Engine
 * Combines semantic text correlation, category taxonomy, color matching,
 * geospatial proximity attenuation, and temporal decay.
 */

// Comprehensive color synonyms matrix
const COLOR_SYNONYMS = {
  black: ['dark', 'charcoal', 'midnight', 'jet', 'ebony', 'matte black', 'space gray'],
  white: ['cream', 'pearl', 'ivory', 'off-white', 'silver', 'eggshell'],
  brown: ['tan', 'cognac', 'leather', 'dark brown', 'chocolate', 'caramel', 'beige'],
  blue: ['navy', 'cyan', 'teal', 'azure', 'sky blue', 'indigo', 'sapphire'],
  red: ['crimson', 'burgundy', 'maroon', 'scarlet', 'ruby'],
  green: ['emerald', 'olive', 'mint', 'forest green', 'sage'],
  yellow: ['gold', 'amber', 'mustard', 'lemon'],
  purple: ['violet', 'lavender', 'plum', 'magenta'],
  gray: ['silver', 'slate', 'graphite', 'titanium', 'ash'],
};

/**
 * Compute semantic text token overlap using Jaccard & N-gram similarity
 * @param {string} textA
 * @param {string} textB
 * @returns {number} 0.0 to 1.0
 */
export function computeTextSimilarity(textA = '', textB = '') {
  if (!textA || !textB) return 0;
  const cleanA = textA.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const cleanB = textB.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  const tokensA = new Set(cleanA.split(/\s+/).filter((t) => t.length > 2));
  const tokensB = new Set(cleanB.split(/\s+/).filter((t) => t.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    } else {
      // Check substring matches
      for (const tB of tokensB) {
        if (token.includes(tB) || tB.includes(token)) {
          intersection += 0.6;
          break;
        }
      }
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return Math.min(Math.max(intersection / (union || 1), 0), 1);
}

/**
 * Compute color similarity taking synonyms into account
 * @param {string} colorA
 * @param {string} colorB
 * @returns {number} 0.0 to 1.0
 */
export function computeColorSimilarity(colorA = '', colorB = '') {
  const cA = colorA.toLowerCase().trim();
  const cB = colorB.toLowerCase().trim();

  if (!cA || !cB || cA === 'unspecified' || cB === 'unspecified') return 0.5;
  if (cA === cB || cA.includes(cB) || cB.includes(cA)) return 1.0;

  for (const [baseColor, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    const aMatches = cA.includes(baseColor) || synonyms.some((s) => cA.includes(s));
    const bMatches = cB.includes(baseColor) || synonyms.some((s) => cB.includes(s));
    if (aMatches && bMatches) return 0.85;
  }

  return 0.1;
}

/**
 * Compute exponential geospatial distance attenuation
 * Score drops gracefully as distance increases beyond radiusKm
 * @param {number} distKm
 * @param {number} maxRadiusKm
 * @returns {number} 0.0 to 1.0
 */
export function computeGeoScore(distKm, maxRadiusKm = 25) {
  if (distKm <= 0.5) return 1.0;
  if (distKm <= maxRadiusKm) {
    // Linear to quadratic drop within radius
    return Math.max(1.0 - Math.pow(distKm / maxRadiusKm, 1.3), 0.2);
  }
  // Exponential tail outside radius
  return Math.max(0.2 * Math.exp(-(distKm - maxRadiusKm) / 10), 0.01);
}

/**
 * Multi-Factor Scoring Engine
 * Evaluates match confidence between a Lost Report and a Found Item
 * @param {Object} lostReport
 * @param {Object} foundItem
 * @returns {{ overallScore: number; breakdown: Object; isConfidentMatch: boolean; rationale: string }}
 */
export function evaluateItemMatch(lostReport, foundItem) {
  // 1. Category Score (20% weight)
  const catA = (lostReport.category || '').toLowerCase();
  const catB = (foundItem.category || '').toLowerCase();
  let categoryScore = 0.2;
  if (catA === catB) categoryScore = 1.0;
  else if (catA === 'other' || catB === 'other') categoryScore = 0.5;

  // 2. Text Semantic Score (40% weight)
  const lostText = `${lostReport.itemName} ${lostReport.detailedDescription} ${(lostReport.searchTags || []).join(' ')} ${lostReport.brandOrManufacturer || ''}`;
  const foundText = `${foundItem.itemName} ${foundItem.description} ${(foundItem.searchTags || []).join(' ')}`;
  const textScore = computeTextSimilarity(lostText, foundText);

  // 3. Color Score (15% weight)
  const colorScore = computeColorSimilarity(lostReport.primaryColor, foundItem.color);

  // 4. Geospatial Proximity Score (15% weight)
  const [lostLng, lostLat] = lostReport.lastSeenCoordinates?.coordinates || [-73.98, 40.75];
  const [foundLng, foundLat] = foundItem.location?.coordinates || [-73.98, 40.75];
  const distanceKm = calculateDistanceKm(lostLat, lostLng, foundLat, foundLng);
  const geoScore = computeGeoScore(distanceKm, lostReport.searchRadiusKm || 20);

  // 5. Temporal Decay Score (10% weight)
  let temporalScore = 0.8;
  if (lostReport.lostDate && foundItem.createdAt) {
    const diffHours = Math.abs(new Date(foundItem.createdAt).getTime() - new Date(lostReport.lostDate).getTime()) / (1000 * 3600);
    if (diffHours < 24) temporalScore = 1.0;
    else if (diffHours < 72) temporalScore = 0.85;
    else if (diffHours < 168) temporalScore = 0.7;
    else temporalScore = 0.4;
  }

  // Calculate Weighted Composite Score
  const overallScore = Math.min(
    Math.max(
      textScore * 0.40 +
      categoryScore * 0.20 +
      colorScore * 0.15 +
      geoScore * 0.15 +
      temporalScore * 0.10,
      0
    ),
    1
  );

  const isConfidentMatch = overallScore >= 0.72;

  // Construct match rationale
  const rationaleParts = [];
  if (categoryScore >= 0.9) rationaleParts.push(`Identical category: ${foundItem.category}`);
  if (textScore >= 0.5) rationaleParts.push(`Strong vocabulary correlation (${Math.round(textScore * 100)}%)`);
  if (colorScore >= 0.8) rationaleParts.push(`Color profile matches (${foundItem.color})`);
  if (distanceKm <= 5.0) rationaleParts.push(`Found only ${distanceKm.toFixed(1)} km from reported loss location`);
  else rationaleParts.push(`Located ${distanceKm.toFixed(1)} km away`);

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown: {
      textScore: Math.round(textScore * 100),
      categoryScore: Math.round(categoryScore * 100),
      colorScore: Math.round(colorScore * 100),
      geoScore: Math.round(geoScore * 100),
      temporalScore: Math.round(temporalScore * 100),
      distanceKm: Math.round(distanceKm * 10) / 10,
    },
    isConfidentMatch,
    rationale: rationaleParts.join(' • '),
  };
}
