import TransitHub from '../models/TransitHub.js';
import mongoose from 'mongoose';
import { auditRepository } from './auditStore.js';

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

const INITIAL_TRANSIT_HUBS = [
  {
    _id: 'hub_mta_gct',
    hubCode: 'HUB-GCT',
    name: 'Grand Central Terminal Central Hub',
    agency: 'MTA NYC Transit',
    jurisdiction: 'Metro-North & Subway Concourse Zone 1-4',
    location: { type: 'Point', coordinates: [-73.9772, 40.7527] },
    address: '89 E 42nd St, Lower Concourse, New York, NY 10017',
    contactPhone: '+1 (212) 878-7000',
    contactEmail: 'lostandfound@gct.mta.info',
    operatingHours: '24/7 Custody Counter',
    storageZones: [
      { zoneCode: 'LOCKER-CONCOURSE-A', name: 'Main Concourse Automated Pickup Bank A', securityLevel: 'STANDARD', capacity: 60, occupiedCount: 18 },
      { zoneCode: 'VAULT-SEC-01', name: 'Sub-Level 2 High Security Biometric Vault', securityLevel: 'HIGH_SECURITY', capacity: 30, occupiedCount: 7 },
      { zoneCode: 'BIN-STORAGE-GENERAL', name: 'General Apparel & Luggage Storage Area C', securityLevel: 'STANDARD', capacity: 150, occupiedCount: 42 },
    ],
    activeOfficersCount: 6,
    totalItemsStored: 67,
    transferManifests: [
      {
        manifestId: 'TR-MANIFEST-2026-001',
        itemIds: ['seed-item-2'],
        originHubId: 'HUB-PENN',
        originHubName: 'Penn Station Amtrak Lost Property Office',
        destinationHubId: 'HUB-GCT',
        destinationHubName: 'Grand Central Terminal Central Hub',
        dispatchedByOfficerName: 'Officer Marcus Wright',
        dispatchedByBadge: 'AMTK-441',
        receivedByOfficerName: 'Officer David Chen',
        receivedByBadge: 'TR-8942',
        status: 'RECEIVED',
        courierVehicleId: 'COURIER-MTA-VAN-09',
        tamperEvidentSealNumber: 'SEAL-NYC-99812',
        notes: 'Inter-agency transfer of recovered leather wallet found on express connector.',
        dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
    ],
  },
  {
    _id: 'hub_amtrak_penn',
    hubCode: 'HUB-PENN',
    name: 'Moynihan Train Hall Custody Depot',
    agency: 'Amtrak Northeast Corridor',
    jurisdiction: 'Penn Station / Moynihan Train Hall',
    location: { type: 'Point', coordinates: [-73.9935, 40.7505] },
    address: '351 W 31st St, Baggage Handling Level 1, New York, NY 10001',
    contactPhone: '+1 (800) 872-7245',
    contactEmail: 'custody@amtrak-northeast.gov',
    operatingHours: '06:00 - 23:00 EST Daily',
    storageZones: [
      { zoneCode: 'LOCKER-MOYNIHAN-B', name: 'West Concourse Smart Pickup Bank', securityLevel: 'STANDARD', capacity: 40, occupiedCount: 12 },
      { zoneCode: 'VAULT-AMTK-SEC', name: 'Federal Secured Property Strongroom', securityLevel: 'HIGH_SECURITY', capacity: 25, occupiedCount: 4 },
    ],
    activeOfficersCount: 4,
    totalItemsStored: 34,
    transferManifests: [],
  },
  {
    _id: 'hub_panynj_pabt',
    hubCode: 'HUB-PABT',
    name: 'Port Authority Bus Terminal Custody Center',
    agency: 'Port Authority of NY & NJ',
    jurisdiction: 'Midtown Bus Terminal & Lincoln Tunnel Corridors',
    location: { type: 'Point', coordinates: [-73.9903, 40.7570] },
    address: '625 8th Ave, 2nd Floor Operations Room, New York, NY 10018',
    contactPhone: '+1 (212) 502-2200',
    contactEmail: 'lostproperty@panynj.gov',
    operatingHours: '07:00 - 22:00 EST Daily',
    storageZones: [
      { zoneCode: 'LOCKER-SOUTH-WING', name: 'South Wing Traveler Locker Matrix', securityLevel: 'STANDARD', capacity: 50, occupiedCount: 15 },
    ],
    activeOfficersCount: 3,
    totalItemsStored: 26,
    transferManifests: [],
  },
  {
    _id: 'hub_tsa_jfk',
    hubCode: 'HUB-JFK',
    name: 'JFK Terminal 4 TSA Safe Custody Vault',
    agency: 'JFK & LGA Airport Security',
    jurisdiction: 'JFK International Airport Terminals 1-8',
    location: { type: 'Point', coordinates: [-73.7781, 40.6413] },
    address: 'JFK International Airport Terminal 4, Security Level 3, Queens, NY 11430',
    contactPhone: '+1 (718) 244-4444',
    contactEmail: 'property-custody@jfk-tsa.gov',
    operatingHours: '24/7 Federal Security Vault',
    storageZones: [
      { zoneCode: 'VAULT-AIR-FED-01', name: 'Federal Customs Secured Locker Depository', securityLevel: 'HIGH_SECURITY', capacity: 80, occupiedCount: 29 },
    ],
    activeOfficersCount: 8,
    totalItemsStored: 58,
    transferManifests: [],
  },
];

let inMemoryHubs = [...INITIAL_TRANSIT_HUBS];

export const hubRepository = {
  async getAll() {
    if (isMongoConnected()) {
      try {
        return await TransitHub.find().lean();
      } catch (err) {
        console.warn('Mongo getAll hubs error:', err.message);
      }
    }
    return inMemoryHubs;
  },

  async findByCode(hubCode) {
    if (isMongoConnected()) {
      try {
        return await TransitHub.findOne({ hubCode: hubCode.toUpperCase() });
      } catch (err) {
        // Fallback
      }
    }
    return inMemoryHubs.find((h) => h.hubCode === hubCode.toUpperCase()) || null;
  },

  async findById(id) {
    if (isMongoConnected()) {
      try {
        return await TransitHub.findById(id);
      } catch (err) {
        // Fallback
      }
    }
    return inMemoryHubs.find((h) => h._id === id || h.id === id) || null;
  },

  /**
   * Dispatch Transfer Manifest between two transit terminals
   */
  async createTransferManifest({
    itemIds,
    originHubCode,
    destinationHubCode,
    officerName,
    officerBadge,
    courierVehicleId = 'COURIER-MTA-VAN-14',
    tamperSealNumber,
    notes = '',
  }) {
    const origin = await this.findByCode(originHubCode);
    const destination = await this.findByCode(destinationHubCode);

    if (!origin || !destination) {
      throw new Error(`Invalid origin (${originHubCode}) or destination (${destinationHubCode})`);
    }

    const manifestId = `TR-MANIFEST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const seal = tamperSealNumber || `SEAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const manifest = {
      manifestId,
      itemIds,
      originHubId: origin.hubCode,
      originHubName: origin.name,
      destinationHubId: destination.hubCode,
      destinationHubName: destination.name,
      dispatchedByOfficerName: officerName,
      dispatchedByBadge: officerBadge,
      status: 'DISPATCHED',
      courierVehicleId,
      tamperEvidentSealNumber: seal,
      notes,
      dispatchedAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      try {
        await TransitHub.findOneAndUpdate(
          { hubCode: origin.hubCode },
          { $push: { transferManifests: manifest } }
        );
      } catch (e) {
        console.warn('Mongo transfer manifest error:', e.message);
      }
    }

    // In-memory update
    if (!origin.transferManifests) origin.transferManifests = [];
    origin.transferManifests.unshift(manifest);

    // Audit log
    await auditRepository.log({
      userId: officerBadge,
      userName: officerName,
      userRole: 'TransitOfficer',
      action: 'ITEM_HANDSHAKE_COMPLETED',
      notes: `Custody manifest ${manifestId} dispatched from ${origin.hubCode} to ${destination.hubCode}. Tamper seal: ${seal}`,
      metadata: { manifestId, origin: origin.hubCode, destination: destination.hubCode, itemsCount: itemIds.length },
    });

    return manifest;
  },

  /**
   * Acknowledge receipt of transfer manifest
   */
  async receiveTransferManifest({ manifestId, receivingOfficerName, receivingOfficerBadge }) {
    let targetManifest = null;
    let foundHub = null;

    for (const hub of inMemoryHubs) {
      const m = (hub.transferManifests || []).find((x) => x.manifestId === manifestId);
      if (m) {
        targetManifest = m;
        foundHub = hub;
        break;
      }
    }

    if (!targetManifest) {
      throw new Error(`Manifest ${manifestId} not found`);
    }

    targetManifest.status = 'RECEIVED';
    targetManifest.receivedByOfficerName = receivingOfficerName;
    targetManifest.receivedByBadge = receivingOfficerBadge;
    targetManifest.receivedAt = new Date().toISOString();

    await auditRepository.log({
      userId: receivingOfficerBadge,
      userName: receivingOfficerName,
      userRole: 'TransitOfficer',
      action: 'ITEM_HANDSHAKE_COMPLETED',
      notes: `Custody manifest ${manifestId} received and verified intact at destination station.`,
      metadata: { manifestId, status: 'RECEIVED' },
    });

    return targetManifest;
  },
};
