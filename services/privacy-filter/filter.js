/**
 * Enterprise PII & Privacy Redaction Pipeline
 * Inspects item descriptions, intake notes, and image transcripts
 * for sensitive personal data before persistence or public display.
 */

// Luhn algorithm validator for credit cards
function isValidLuhn(digits) {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export const PRIVACY_PATTERNS = {
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  PHONE: /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
  STREET_ADDRESS: /\b\d{1,5}\s+[A-Za-z0-9\s.,]{3,35}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
};

export class PrivacyFilterService {
  /**
   * Scan and redact PII from text
   * @param {string} text
   * @returns {{ sanitizedText: string; piiDetected: boolean; redactionCount: number; details: Object }}
   */
  redactText(text = '') {
    if (!text || typeof text !== 'string') {
      return { sanitizedText: '', piiDetected: false, redactionCount: 0, details: {} };
    }

    let sanitized = text;
    let totalRedactions = 0;
    const details = {
      creditCardsMasked: 0,
      ssnMasked: 0,
      phonesMasked: 0,
      emailsMasked: 0,
      addressesMasked: 0,
    };

    // 1. Redact Credit Cards (with Luhn check)
    sanitized = sanitized.replace(PRIVACY_PATTERNS.CREDIT_CARD, (match) => {
      const stripped = match.replace(/[\s-]/g, '');
      if (stripped.length >= 13 && stripped.length <= 16 && isValidLuhn(stripped)) {
        totalRedactions++;
        details.creditCardsMasked++;
        return `[REDACTED_CREDIT_CARD_••••${stripped.slice(-4)}]`;
      }
      return match;
    });

    // 2. Redact Social Security Numbers
    sanitized = sanitized.replace(PRIVACY_PATTERNS.SSN, () => {
      totalRedactions++;
      details.ssnMasked++;
      return '[REDACTED_SSN_•••-••-••••]';
    });

    // 3. Redact Phone Numbers
    sanitized = sanitized.replace(PRIVACY_PATTERNS.PHONE, () => {
      totalRedactions++;
      details.phonesMasked++;
      return '[REDACTED_PHONE_•••-•••-••••]';
    });

    // 4. Redact Email Addresses (preserve domain suffix)
    sanitized = sanitized.replace(PRIVACY_PATTERNS.EMAIL, (match) => {
      totalRedactions++;
      details.emailsMasked++;
      const [user, domain] = match.split('@');
      return `${user.substring(0, 1)}•••@${domain}`;
    });

    // 5. Redact Physical Street Addresses
    sanitized = sanitized.replace(PRIVACY_PATTERNS.STREET_ADDRESS, () => {
      totalRedactions++;
      details.addressesMasked++;
      return '[REDACTED_MUNICIPAL_RESIDENCE]';
    });

    return {
      sanitizedText: sanitized,
      piiDetected: totalRedactions > 0,
      redactionCount: totalRedactions,
      details,
    };
  }

  /**
   * Process and sanitize image metadata and notes prior to storage
   * @param {Object} itemPayload
   */
  sanitizeItemPayload(itemPayload) {
    const textNoteResult = this.redactText(itemPayload.description || itemPayload.textNote || '');
    const titleResult = this.redactText(itemPayload.itemName || '');

    return {
      ...itemPayload,
      itemName: titleResult.sanitizedText,
      description: textNoteResult.sanitizedText,
      privacyCompliance: {
        scannedAt: new Date().toISOString(),
        redactionPassApplied: textNoteResult.piiDetected || titleResult.piiDetected,
        totalMaskedElements: textNoteResult.redactionCount + titleResult.redactionCount,
        details: { ...textNoteResult.details },
      },
    };
  }
}

export const privacyFilter = new PrivacyFilterService();
