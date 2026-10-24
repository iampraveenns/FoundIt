export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface FoundItem {
  _id?: string;
  id?: string;
  itemName: string;
  category: string;
  color: string;
  locationName: string;
  location: LocationPoint;
  searchTags: string[];
  description: string;
  imageUrl: string;
  status: 'found' | 'claimed' | 'returned';
  aiConfidence?: number;
  claimQuestion?: string;
  reportedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  distanceKm?: number;
  matchScore?: number;
  matchReason?: string;
  matchingAttributes?: string[];
  isTopMatch?: boolean;
}

export interface Stats {
  totalFound: number;
  claimed: number;
  active: number;
  successRate: number;
}

export interface SearchResultResponse {
  success: boolean;
  query: string;
  totalCandidates: number;
  matchesCount: number;
  items: FoundItem[];
  aiPowered?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Standard' | 'TransitOfficer' | 'Admin';
  badgeNumber?: string;
  stationOrJurisdiction?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  _id?: string;
  id?: string;
  userId: string;
  userName: string;
  userRole: 'Standard' | 'TransitOfficer' | 'Admin';
  action: string;
  itemId?: string;
  itemName?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
