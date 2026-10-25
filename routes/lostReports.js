import express from 'express';
import { lostReportRepository } from '../services/lostReportStore.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/lost-reports
 * List lost property notices
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category, reporterId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (reporterId) filter.reporterId = reporterId;

    const reports = await lostReportRepository.getAll(filter);
    res.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lost-reports/:id
 * Get single lost report with ranked potential matches
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await lostReportRepository.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Lost report not found' });
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lost-reports
 * File a missing property report with automated vector matching
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      itemName,
      category,
      primaryColor,
      brandOrManufacturer,
      serialNumberOrIMEI,
      identifyingMarks,
      detailedDescription,
      searchTags,
      lastSeenLocationName,
      lat,
      lng,
      searchRadiusKm,
      lostDate,
      rewardAmount,
      reporterName,
      reporterEmail,
      reporterPhone,
    } = req.body;

    if (!itemName || !category || !detailedDescription) {
      return res.status(400).json({
        success: false,
        error: 'itemName, category, and detailedDescription are required fields.',
      });
    }

    const reporterId = req.user ? req.user.id : `user_citizen_${Date.now()}`;
    const finalReporterName = req.user ? req.user.name : reporterName || 'Citizen Reporter';
    const finalReporterEmail = req.user ? req.user.email : reporterEmail || 'citizen@foundit.org';

    const coordinates = [
      Number(lng) || -73.9772 + (Math.random() - 0.5) * 0.05,
      Number(lat) || 40.7527 + (Math.random() - 0.5) * 0.05,
    ];

    let tags = [];
    if (searchTags) {
      tags = Array.isArray(searchTags) ? searchTags : String(searchTags).split(',').map((t) => t.trim());
    }

    const report = await lostReportRepository.create({
      reporterId,
      reporterName: finalReporterName,
      reporterEmail: finalReporterEmail,
      reporterPhone: reporterPhone || '',
      itemName,
      category,
      primaryColor: primaryColor || 'Unspecified',
      brandOrManufacturer: brandOrManufacturer || '',
      serialNumberOrIMEI: serialNumberOrIMEI || '',
      identifyingMarks: identifyingMarks || '',
      detailedDescription,
      searchTags: tags,
      lastSeenLocationName: lastSeenLocationName || 'Midtown Transit Corridor',
      lastSeenCoordinates: { type: 'Point', coordinates },
      searchRadiusKm: Number(searchRadiusKm) || 15,
      lostDate: lostDate ? new Date(lostDate) : new Date(),
      rewardAmount: Number(rewardAmount) || 0,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('lost_report:created', report);
    }

    res.status(201).json({
      success: true,
      message: `Lost property report #${report.reportNumber} registered. Found ${report.potentialMatches.length} candidate matches.`,
      report,
      topMatches: report.potentialMatches.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lost-reports/:id/rematch
 * Re-run multi-factor matching algorithm on demand
 */
router.post('/:id/rematch', optionalAuth, async (req, res) => {
  try {
    const report = await lostReportRepository.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Lost report not found' });
    }

    const matches = await lostReportRepository.runAutoMatch(report);
    res.json({
      success: true,
      message: `Re-matched against found catalog. Found ${matches.length} candidate matches.`,
      matches,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
