const DB_NAME = 'RoadGuardDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('trips')) {
        const trips = db.createObjectStore('trips', { keyPath: 'trip_id' });
        trips.createIndex('status', 'status', { unique: false });
        trips.createIndex('start_time', 'start_time', { unique: false });
      }
      if (!db.objectStoreNames.contains('locations')) {
        const locs = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true });
        locs.createIndex('trip_id', 'trip_id', { unique: false });
        locs.createIndex('sync_status', 'sync_status', { unique: false });
        locs.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('hazards')) {
        const haz = db.createObjectStore('hazards', { keyPath: 'id', autoIncrement: true });
        haz.createIndex('trip_id', 'trip_id', { unique: false });
        haz.createIndex('sync_status', 'sync_status', { unique: false });
        haz.createIndex('hazard_type', 'hazard_type', { unique: false });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        const sq = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        sq.createIndex('status', 'status', { unique: false });
        sq.createIndex('record_type', 'record_type', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbOp(store: string, mode: IDBTransactionMode, cb: (store: IDBObjectStore) => IDBRequest<any>): Promise<any> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = cb(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  }));
}

export interface DbTrip {
  trip_id: string;
  driver_id: string;
  start_time: string;
  end_time?: string;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  start_address?: string;
  end_address?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ABORTED';
  risk_score?: number;
  total_distance?: number;
  avg_speed?: number;
  max_speed?: number;
}

export interface DbLocation {
  id?: number;
  trip_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

export interface DbHazard {
  id?: number;
  trip_id: string;
  hazard_type: string;
  severity: string;
  latitude: number;
  longitude: number;
  image_path?: string;
  timestamp: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

export interface DbSyncQueue {
  id?: number;
  record_type: 'location' | 'hazard' | 'trip';
  record_id: string | number;
  retry_count: number;
  status: 'pending' | 'processing' | 'synced' | 'failed';
  created_at: string;
}

// Trip operations
export async function saveTripDB(trip: DbTrip) {
  const exists = await dbOp('trips', 'readonly', s => s.get(trip.trip_id));
  if (exists) {
    return dbOp('trips', 'readwrite', s => s.put(trip));
  }
  return dbOp('trips', 'readwrite', s => s.add(trip));
}

export async function getTripDB(tripId: string) {
  return dbOp('trips', 'readonly', s => s.get(tripId));
}

export async function getAllTripsDB(): Promise<DbTrip[]> {
  return dbOp('trips', 'readonly', s => s.getAll());
}

// Location operations
export async function saveLocationDB(loc: Omit<DbLocation, 'id'>) {
  return dbOp('locations', 'readwrite', s => s.add(loc));
}

export async function getPendingLocationsDB(): Promise<DbLocation[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('locations', 'readonly');
    const idx = tx.objectStore('locations').index('sync_status');
    const req = idx.getAll('pending');
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  }));
}

export async function markLocationsSyncedDB(ids: number[]) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('locations', 'readwrite');
    ids.forEach(id => {
      const req = tx.objectStore('locations').get(id);
      req.onsuccess = () => {
        const loc = req.result;
        if (loc) { loc.sync_status = 'synced'; tx.objectStore('locations').put(loc); }
      };
    });
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  }));
}

// Hazard operations
export async function saveHazardDB(haz: Omit<DbHazard, 'id'>) {
  return dbOp('hazards', 'readwrite', s => s.add(haz));
}

export async function getPendingHazardsDB(): Promise<DbHazard[]> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('hazards', 'readonly');
    const idx = tx.objectStore('hazards').index('sync_status');
    const req = idx.getAll('pending');
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  }));
}

export async function markHazardsSyncedDB(ids: number[]) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('hazards', 'readwrite');
    ids.forEach(id => {
      const req = tx.objectStore('hazards').get(id);
      req.onsuccess = () => {
        const h = req.result;
        if (h) { h.sync_status = 'synced'; tx.objectStore('hazards').put(h); }
      };
    });
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  }));
}

// Sync Queue
export async function addToSyncQueue(entry: Omit<DbSyncQueue, 'id'>) {
  return dbOp('sync_queue', 'readwrite', s => s.add(entry));
}

export async function getPendingSyncQueue() {
  return openDB().then(db => new Promise((resolve: (v: DbSyncQueue[]) => void, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const idx = tx.objectStore('sync_queue').index('status');
    const req = idx.getAll('pending');
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  }));
}

export async function updateSyncQueueStatus(id: number, status: string, retryCount?: number) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const req = tx.objectStore('sync_queue').get(id);
    req.onsuccess = () => {
      const entry = req.result;
      if (entry) { entry.status = status; if (retryCount !== undefined) entry.retry_count = retryCount; tx.objectStore('sync_queue').put(entry); }
    };
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  }));
}

// Sync orchestrator
export async function syncPendingRecords() {
  const online = navigator.onLine;
  if (!online) return { synced: 0, pending: 0 };

  let synced = 0;
  let pending = 0;

  const pendingLocs = await getPendingLocationsDB();
  for (const loc of pendingLocs) {
    try {
      const res = await fetch('/api/gps/location', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      });
      if (res.ok) { synced++; }
      else { pending++; }
    } catch { pending++; }
  }
  if (pendingLocs.length > 0) {
    const syncedIds = pendingLocs.slice(0, synced).map(l => l.id!).filter(Boolean);
    if (syncedIds.length > 0) await markLocationsSyncedDB(syncedIds);
  }

  const pendingHazards = await getPendingHazardsDB();
  let hazSynced = 0;
  for (const haz of pendingHazards) {
    try {
      const res = await fetch('/api/hazards/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(haz),
      });
      if (res.ok) hazSynced++;
    } catch {}
  }
  if (pendingHazards.length > 0) {
    const syncedHazIds = pendingHazards.slice(0, hazSynced).map(h => h.id!).filter(Boolean);
    if (syncedHazIds.length > 0) await markHazardsSyncedDB(syncedHazIds);
  }

  return { synced: synced + hazSynced, pending: pending + (pendingHazards.length - hazSynced) };
}
