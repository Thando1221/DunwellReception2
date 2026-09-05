import axios from "axios";
import { toast } from "sonner";
import { API_BASE } from "./config";

export interface QueuedPatientData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
}

export interface QueuedAppointmentData {
  PatientID: number | string;
  StartTime: string;
  EndTime: string | null;
  UserID: number | null;
  ServiceName: string;
  ServicePrice?: number | null;
  PaymentMethod: string | null;
  IsStudent: boolean;
  Status: string;
  Booking_Type?: string;
  MedicalAidNumber?: string | null;
  MedicalAidName?: string | null;
  MedicalAid_MainMember?: string | null;
  MainMember__IDNo?: string | null;
  MedicalAid_option?: string | null;
  FinalPrice?: number | null;
  patientName?: string;
  ConsentSignature?: string;
}

export interface QueueItem {
  id: string; // unique UUID or timestamp
  type: "ADD_PATIENT" | "ADD_APPOINTMENT" | "EDIT_APPOINTMENT" | "EDIT_PATIENT";
  tempId?: string; // temporary ID used for linking
  data: any;
  createdAt: number;
  retryCount: number;
}

const STORAGE_KEY_QUEUE = "dunwell_offline_queue";
const STORAGE_KEY_PATIENTS = "dunwell_cached_patients";
const STORAGE_KEY_BOOKINGS = "dunwell_cached_bookings";
const STORAGE_KEY_CATALOGUE = "dunwell_cached_catalogue";
const STORAGE_KEY_NURSES = "dunwell_cached_nurses";
const STORAGE_KEY_STATS = "dunwell_cached_stats";

// Helper: safe localStorage access
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("LocalStorage setItem failed:", err);
  }
}

// ---------------------------------------------
// Queue Management
// ---------------------------------------------
export function getOfflineQueue(): QueueItem[] {
  return getStorage<QueueItem[]>(STORAGE_KEY_QUEUE, []);
}

export function saveOfflineQueue(queue: QueueItem[]): void {
  setStorage(STORAGE_KEY_QUEUE, queue);
  window.dispatchEvent(new CustomEvent("dunwell_queue_changed", { detail: { count: queue.length } }));
}

export function getPendingQueueCount(): number {
  return getOfflineQueue().length;
}

// ---------------------------------------------
// Cached Data Management
// ---------------------------------------------
export function getCachedPatients(): any[] {
  return getStorage<any[]>(STORAGE_KEY_PATIENTS, []);
}

export function setCachedPatients(patients: any[]): void {
  setStorage(STORAGE_KEY_PATIENTS, patients);
}

export function getCachedBookings(): any[] {
  return getStorage<any[]>(STORAGE_KEY_BOOKINGS, []);
}

export function setCachedBookings(bookings: any[]): void {
  setStorage(STORAGE_KEY_BOOKINGS, bookings);
}

export function getCachedCatalogue(): any[] {
  const catalogue = getStorage<any[]>(STORAGE_KEY_CATALOGUE, []);
  if (catalogue.length === 0) {
    const defaultCatalogue = [
      { CatalougeID: 1, Name: "General Consultation", Price: 350, discount: 50 },
      { CatalougeID: 2, Name: "Follow-up Consultation", Price: 250, discount: 50 },
      { CatalougeID: 3, Name: "Family Planning", Price: 180, discount: 30 },
      { CatalougeID: 4, Name: "HIV Screening & Counselling", Price: 0, discount: 0 },
      { CatalougeID: 5, Name: "Immunisation / Vaccine", Price: 220, discount: 40 },
      { CatalougeID: 6, Name: "Blood Pressure & Vitals", Price: 120, discount: 20 },
      { CatalougeID: 7, Name: "Minor Wound Dressing", Price: 280, discount: 40 },
    ];
    setStorage(STORAGE_KEY_CATALOGUE, defaultCatalogue);
    return defaultCatalogue;
  }
  return catalogue;
}

export function setCachedCatalogue(catalogue: any[]): void {
  setStorage(STORAGE_KEY_CATALOGUE, catalogue);
}

export function getCachedNurses(): any[] {
  const nurses = getStorage<any[]>(STORAGE_KEY_NURSES, []);
  if (nurses.length === 0) {
    const defaultNurses = [
      { UserID: 1, Name: "Sister", Surname: "Dlamini" },
      { UserID: 2, Name: "Nurse", Surname: "Moyo" },
      { UserID: 3, Name: "Dr.", Surname: "Khumalo" },
      { UserID: 4, Name: "Nurse", Surname: "Sibanda" },
    ];
    setStorage(STORAGE_KEY_NURSES, defaultNurses);
    return defaultNurses;
  }
  return nurses;
}

export function setCachedNurses(nurses: any[]): void {
  setStorage(STORAGE_KEY_NURSES, nurses);
}

export function getCachedStats(): any {
  return getStorage<any>(STORAGE_KEY_STATS, null);
}

export function setCachedStats(stats: any): void {
  setStorage(STORAGE_KEY_STATS, stats);
}

// Check real connectivity
export function isDeviceOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// ---------------------------------------------
// Add Patient (Online or Queued Offline)
// ---------------------------------------------
export async function addPatientWithOfflineSync(patientData: QueuedPatientData): Promise<{ success: boolean; offline: boolean; message: string; tempId?: string }> {
  const online = isDeviceOnline();

  if (online) {
    try {
      const res = await axios.post(`${API_BASE}/patients/add`, patientData);
      // Try to re-fetch and refresh cache in the background
      refreshPatientsCache().catch(() => {});
      return { success: true, offline: false, message: res.data?.message || "Patient added successfully!" };
    } catch (err: any) {
      // If network failed, fall through to offline save
      if (!err.response || err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        console.warn("Network error encountered. Saving patient offline.");
      } else {
        // Server validation error
        throw err;
      }
    }
  }

  // Save Offline
  const tempId = `offline-pat-${Date.now()}`;
  const offlinePatient = {
    PatientID: tempId,
    PatientName: patientData.name,
    PatientSurname: patientData.surname,
    Patient_Email: patientData.email,
    Patient_ContactNo: patientData.phone,
    DOB: patientData.dob || null,
    Gender: patientData.gender,
    Address: patientData.address,
    CreatedDate: new Date().toISOString(),
    _isOffline: true,
  };

  // Add to cached patients so it immediately appears everywhere in UI
  const existingPatients = getCachedPatients();
  setCachedPatients([offlinePatient, ...existingPatients]);

  // Add to sync queue
  const queue = getOfflineQueue();
  const queueItem: QueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: "ADD_PATIENT",
    tempId,
    data: patientData,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(queueItem);
  saveOfflineQueue(queue);

  window.dispatchEvent(new CustomEvent("dunwell_data_updated", { detail: { type: "PATIENT_ADDED_OFFLINE" } }));

  return {
    success: true,
    offline: true,
    tempId,
    message: "Offline: Patient saved locally on device. Will automatically sync to database once online!",
  };
}

// ---------------------------------------------
// Book Appointment (Online or Queued Offline)
// ---------------------------------------------
export async function bookAppointmentWithOfflineSync(appointmentData: QueuedAppointmentData): Promise<{ success: boolean; offline: boolean; message: string }> {
  const online = isDeviceOnline();
  const normalizedData: QueuedAppointmentData = {
    ...appointmentData,
    Booking_Type: appointmentData.Booking_Type || "Inclinic_Booking",
  };

  if (online) {
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create appointment");
      }

      refreshBookingsCache().catch(() => {});
      return { success: true, offline: false, message: "Appointment booked successfully!" };
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.message?.includes("NetworkError") || !isDeviceOnline()) {
        console.warn("Network error encountered. Saving booking offline.");
      } else {
        throw err;
      }
    }
  }

  // Save Offline
  const tempBookingId = `offline-book-${Date.now()}`;
  const offlineBooking = {
    id: tempBookingId,
    AppointID: tempBookingId,
    PatientID: normalizedData.PatientID,
    patientName: normalizedData.patientName || "Patient (Offline)",
    ServiceName: normalizedData.ServiceName || "General Consultation",
    Booking_Type: normalizedData.Booking_Type || "Inclinic_Booking",
    StartTime: normalizedData.StartTime,
    EndTime: normalizedData.EndTime,
    Status: "Scheduled",
    PaymentMethod: normalizedData.PaymentMethod,
    FinalPrice: normalizedData.FinalPrice,
    isFollow_Up: "No",
    _isOffline: true,
  };

  // Add to cached bookings
  const existingBookings = getCachedBookings();
  setCachedBookings([offlineBooking, ...existingBookings]);

  // Add to sync queue
  const queue = getOfflineQueue();
  const queueItem: QueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: "ADD_APPOINTMENT",
    tempId: tempBookingId,
    data: normalizedData,
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(queueItem);
  saveOfflineQueue(queue);

  window.dispatchEvent(new CustomEvent("dunwell_data_updated", { detail: { type: "BOOKING_ADDED_OFFLINE" } }));

  return {
    success: true,
    offline: true,
    message: "Offline: Appointment saved locally on device. Will automatically sync to database once online!",
  };
}

// ---------------------------------------------
// Update Booking (Online or Queued Offline)
// ---------------------------------------------
export async function updateAppointmentWithOfflineSync(
  appointmentId: string | number,
  payload: any
): Promise<{ success: boolean; offline: boolean; message: string }> {
  const online = isDeviceOnline();

  if (online) {
    try {
      const res = await fetch(`${API_BASE}/bookings/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update appointment (${res.status})`);
      }

      // Update cached bookings with the latest values
      const existing = getCachedBookings();
      const updated = existing.map((b) => {
        if (String(b.id) === String(appointmentId) || String(b.AppointID) === String(appointmentId)) {
          return { ...b, ...payload, id: b.id, AppointID: b.AppointID };
        }
        return b;
      });
      setCachedBookings(updated);
      refreshBookingsCache().catch(() => {});

      return { success: true, offline: false, message: "Appointment updated successfully!" };
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.message?.includes("NetworkError") || !isDeviceOnline()) {
        console.warn("Network error encountered during booking update. Saving update offline.");
      } else {
        throw err;
      }
    }
  }

  // Save Offline
  // 1. Update local cache immediately
  const existingBookings = getCachedBookings();
  const updatedBookings = existingBookings.map((b) => {
    if (String(b.id) === String(appointmentId) || String(b.AppointID) === String(appointmentId)) {
      return {
        ...b,
        ...payload,
        id: b.id,
        AppointID: b.AppointID,
        _isOfflineEdited: true,
      };
    }
    return b;
  });
  setCachedBookings(updatedBookings);

  // 2. Check if this booking is already in the offline queue (as ADD_APPOINTMENT)
  const queue = getOfflineQueue();
  const existingQueueIndex = queue.findIndex(
    (q) => q.type === "ADD_APPOINTMENT" && String(q.tempId) === String(appointmentId)
  );

  if (existingQueueIndex >= 0) {
    // Merge into the existing creation queue item
    queue[existingQueueIndex].data = {
      ...queue[existingQueueIndex].data,
      ...payload,
    };
  } else {
    // Check if an EDIT_APPOINTMENT already exists for this appointmentId
    const existingEditIndex = queue.findIndex(
      (q) => q.type === "EDIT_APPOINTMENT" && String(q.tempId) === String(appointmentId)
    );
    if (existingEditIndex >= 0) {
      queue[existingEditIndex].data = {
        appointmentId,
        payload: { ...queue[existingEditIndex].data.payload, ...payload },
      };
    } else {
      // Add new edit task to queue
      queue.push({
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: "EDIT_APPOINTMENT",
        tempId: String(appointmentId),
        data: { appointmentId, payload },
        createdAt: Date.now(),
        retryCount: 0,
      });
    }
  }

  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent("dunwell_data_updated", { detail: { type: "BOOKING_EDITED_OFFLINE", appointmentId } }));

  return {
    success: true,
    offline: true,
    message: "Offline: Booking changes saved locally on device. Will automatically sync to database once online!",
  };
}

// ---------------------------------------------
// Update Patient (Online or Queued Offline)
// ---------------------------------------------
export async function updatePatientWithOfflineSync(
  patientId: string | number,
  payload: any
): Promise<{ success: boolean; offline: boolean; message: string }> {
  const online = isDeviceOnline();

  if (online) {
    try {
      await axios.put(`${API_BASE}/patients/${patientId}`, payload);
      const cached = getCachedPatients();
      const updated = cached.map((p) => {
        if (String(p.PatientID) === String(patientId)) {
          return { ...p, ...payload };
        }
        return p;
      });
      setCachedPatients(updated);
      refreshPatientsCache().catch(() => {});
      return { success: true, offline: false, message: "Patient updated successfully!" };
    } catch (err: any) {
      if (!err.response || err.code === "ERR_NETWORK" || err.message?.includes("Network Error")) {
        console.warn("Network error during patient update. Saving offline.");
      } else {
        throw err;
      }
    }
  }

  // Save Offline
  const cached = getCachedPatients();
  const updated = cached.map((p) => {
    if (String(p.PatientID) === String(patientId)) {
      return { ...p, ...payload, _isOfflineEdited: true };
    }
    return p;
  });
  setCachedPatients(updated);

  const queue = getOfflineQueue();
  const existingQueueIndex = queue.findIndex(
    (q) => q.type === "ADD_PATIENT" && String(q.tempId) === String(patientId)
  );

  if (existingQueueIndex >= 0) {
    queue[existingQueueIndex].data = {
      ...queue[existingQueueIndex].data,
      name: payload.PatientName || queue[existingQueueIndex].data.name,
      surname: payload.PatientSurname || queue[existingQueueIndex].data.surname,
      email: payload.Patient_Email || queue[existingQueueIndex].data.email,
      phone: payload.Patient_ContactNo || queue[existingQueueIndex].data.phone,
      dob: payload.DOB || queue[existingQueueIndex].data.dob,
      gender: payload.Gender || queue[existingQueueIndex].data.gender,
      address: payload.Address || queue[existingQueueIndex].data.address,
    };
  } else {
    queue.push({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: "EDIT_PATIENT",
      tempId: String(patientId),
      data: { patientId, payload },
      createdAt: Date.now(),
      retryCount: 0,
    });
  }

  saveOfflineQueue(queue);
  window.dispatchEvent(new CustomEvent("dunwell_data_updated", { detail: { type: "PATIENT_EDITED_OFFLINE", patientId } }));

  return {
    success: true,
    offline: true,
    message: "Offline: Patient updated locally. Will sync to database once online!",
  };
}

// ---------------------------------------------
// Background Cache Refreshers
// ---------------------------------------------
export async function refreshPatientsCache(): Promise<any[]> {
  try {
    const res = await axios.get(`${API_BASE}/patients`, { timeout: 8000 });
    if (Array.isArray(res.data)) {
      // Merge with any still-pending offline patients
      const queue = getOfflineQueue();
      const offlinePatientIds = new Set(queue.filter(q => q.type === "ADD_PATIENT").map(q => q.tempId));
      const oldCached = getCachedPatients();
      const stillPendingOffline = oldCached.filter(p => p._isOffline && offlinePatientIds.has(p.PatientID));

      const merged = [...stillPendingOffline, ...res.data];
      setCachedPatients(merged);
      return merged;
    }
  } catch (err) {
    console.debug("Could not refresh patients from network:", err);
  }
  return getCachedPatients();
}

export async function refreshBookingsCache(): Promise<any[]> {
  try {
    const res = await axios.get(`${API_BASE}/bookings`, { timeout: 8000 });
    if (Array.isArray(res.data)) {
      const queue = getOfflineQueue();
      const offlineBookingIds = new Set(queue.filter(q => q.type === "ADD_APPOINTMENT").map(q => q.tempId));
      const oldCached = getCachedBookings();
      const stillPendingOffline = oldCached.filter(b => b._isOffline && offlineBookingIds.has(b.id));

      const merged = [...stillPendingOffline, ...res.data];
      setCachedBookings(merged);
      return merged;
    }
  } catch (err) {
    console.debug("Could not refresh bookings from network:", err);
  }
  return getCachedBookings();
}

// ---------------------------------------------
// Auto-Sync Queue Processor
// ---------------------------------------------
let isSyncing = false;

export async function syncPendingQueue(): Promise<{ syncedCount: number; errors: number }> {
  if (isSyncing) return { syncedCount: 0, errors: 0 };
  if (!isDeviceOnline()) return { syncedCount: 0, errors: 0 };

  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: 0 };

  isSyncing = true;
  window.dispatchEvent(new CustomEvent("dunwell_sync_status", { detail: { isSyncing: true } }));

  let syncedCount = 0;
  let errorCount = 0;
  const remainingQueue: QueueItem[] = [];

  // Temporary ID map: tempPatientId -> real server PatientID
  const patientIdMap = new Map<string, number>();

  // Process ADD_PATIENT first so we obtain integer IDs for any subsequent appointments
  const patientItems = queue.filter(q => q.type === "ADD_PATIENT");
  const otherItems = queue.filter(q => q.type !== "ADD_PATIENT");

  for (const item of patientItems) {
    try {
      await axios.post(`${API_BASE}/patients/add`, item.data, { timeout: 10000 });
      syncedCount++;

      // Re-fetch patients list to find the newly inserted integer PatientID
      try {
        const pRes = await axios.get(`${API_BASE}/patients`, { timeout: 8000 });
        if (Array.isArray(pRes.data)) {
          const matched = pRes.data.find(
            (p: any) =>
              p.Patient_Email?.toLowerCase() === item.data.email?.toLowerCase() ||
              (p.PatientName?.toLowerCase() === item.data.name?.toLowerCase() &&
               p.PatientSurname?.toLowerCase() === item.data.surname?.toLowerCase())
          );
          if (matched && matched.PatientID && item.tempId) {
            patientIdMap.set(item.tempId, matched.PatientID);
          }
        }
      } catch {
        // Continue if fetch fails
      }
    } catch (err: any) {
      console.error("Failed to sync patient item:", item, err);
      errorCount++;
      item.retryCount = (item.retryCount || 0) + 1;
      remainingQueue.push(item);
    }
  }

  // Process ADD_APPOINTMENT items
  for (const item of otherItems) {
    if (item.type === "ADD_APPOINTMENT") {
      try {
        const appointmentPayload = {
          ...item.data,
          Booking_Type: item.data.Booking_Type || "Inclinic_Booking",
        };

        // If this appointment references an offline-created patient, map to real ID
        if (typeof appointmentPayload.PatientID === "string" && appointmentPayload.PatientID.startsWith("offline-pat-")) {
          const mappedId = patientIdMap.get(appointmentPayload.PatientID);
          if (mappedId) {
            appointmentPayload.PatientID = mappedId;
          } else {
            // Attempt to search cached or live patients
            const livePatients = await refreshPatientsCache();
            const matched = livePatients.find(
              (p: any) => !p._isOffline && (
                p.Patient_Email === appointmentPayload.patientEmail ||
                `${p.PatientName} ${p.PatientSurname}`.toLowerCase() === (appointmentPayload.patientName || "").toLowerCase()
              )
            );
            if (matched && matched.PatientID) {
              appointmentPayload.PatientID = matched.PatientID;
            }
          }
        }

        const res = await fetch(`${API_BASE}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentPayload),
        });

        if (!res.ok) {
          throw new Error(`Appointment sync responded with status ${res.status}`);
        }

        syncedCount++;
      } catch (err) {
        console.error("Failed to sync appointment item:", item, err);
        errorCount++;
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
      }
    } else if (item.type === "EDIT_APPOINTMENT") {
      try {
        const res = await fetch(`${API_BASE}/bookings/${item.data.appointmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data.payload),
        });

        if (!res.ok) {
          throw new Error(`Appointment edit responded with status ${res.status}`);
        }

        syncedCount++;
      } catch (err) {
        console.error("Failed to sync edit appointment item:", item, err);
        errorCount++;
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
      }
    } else if (item.type === "EDIT_PATIENT") {
      try {
        await axios.put(`${API_BASE}/patients/${item.data.patientId}`, item.data.payload, { timeout: 10000 });
        syncedCount++;
      } catch (err) {
        console.error("Failed to sync edit patient item:", item, err);
        errorCount++;
        item.retryCount = (item.retryCount || 0) + 1;
        remainingQueue.push(item);
      }
    } else {
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);
  isSyncing = false;
  window.dispatchEvent(new CustomEvent("dunwell_sync_status", { detail: { isSyncing: false } }));

  if (syncedCount > 0) {
    // Refresh all caches
    await Promise.allSettled([
      refreshPatientsCache(),
      refreshBookingsCache(),
    ]);

    toast.success(`Online Sync: ${syncedCount} offline record${syncedCount > 1 ? "s" : ""} synced to database! ✅`);
    window.dispatchEvent(new CustomEvent("dunwell_data_synced", { detail: { syncedCount } }));
  }

  if (errorCount > 0) {
    toast.warning(`${errorCount} record(s) failed to sync. Will retry automatically.`);
  }

  return { syncedCount, errors: errorCount };
}

// ---------------------------------------------
// Auto-Sync Listeners & Interval Setup
// ---------------------------------------------
let syncListenersInitialized = false;

export function checkAndSyncImmediately(): void {
  if (isDeviceOnline() && getPendingQueueCount() > 0 && !isSyncing) {
    syncPendingQueue();
  }
}

export function initOfflineSyncEngine(): void {
  if (typeof window === "undefined" || syncListenersInitialized) return;
  syncListenersInitialized = true;

  // Sync immediately when browser reports online or data connection restored
  window.addEventListener("online", () => {
    console.log("🌐 Network connection restored. Triggering offline sync immediately...");
    toast.info("Internet connection restored! Syncing offline records to database...");
    setTimeout(() => {
      syncPendingQueue();
    }, 800);
  });

  window.addEventListener("offline", () => {
    console.log("⚠️ Device went offline. Local offline storage active.");
    toast.warning("You are currently offline. New patients, new bookings, and booking edits will be saved on your device and sent immediately when online.");
  });

  // When user returns to tab or window regains focus, check and sync immediately
  window.addEventListener("focus", () => {
    if (isDeviceOnline() && getPendingQueueCount() > 0) {
      syncPendingQueue();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && isDeviceOnline() && getPendingQueueCount() > 0) {
      syncPendingQueue();
    }
  });

  // Continuous background check every 8 seconds to send pending items immediately if online
  setInterval(() => {
    if (isDeviceOnline() && getPendingQueueCount() > 0 && !isSyncing) {
      syncPendingQueue();
    }
  }, 8000);

  // Initial sync check on app startup
  if (isDeviceOnline() && getPendingQueueCount() > 0) {
    setTimeout(() => {
      syncPendingQueue();
    }, 1500);
  }
}
