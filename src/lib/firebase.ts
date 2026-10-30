// Firebase initialization and small helpers
import { initializeApp } from 'firebase/app';
import { getAuth, type User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  runTransaction,
  updateDoc,
  deleteDoc,
  DocumentData,
} from 'firebase/firestore';

// Firebase config (provided)
const firebaseConfig = {
  apiKey: "AIzaSyAfntTShojZAFY3FrIuY8KU5bVCNDFChpM",
  authDomain: "coolza-ce9af.firebaseapp.com",
  projectId: "coolza-ce9af",
  storageBucket: "coolza-ce9af.firebasestorage.app",
  messagingSenderId: "903259556727",
  appId: "1:903259556727:web:5b4a281bc054eb12702f72",
  measurementId: "G-8RR6QKB404"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export type { FirebaseUser };

export async function createUserProfile(userId: string, name: string, email: string, role: string) {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, {
    id: userId,
    name,
    email,
    role,
    created_at: new Date().toISOString(),
  });
}

export async function getUserProfile(userId: string) {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data();
}

// Helper to add a booking record to Firestore
export async function addBooking(booking: DocumentData) {
  const bookingsCol = collection(db, 'bookings');
  const res = await addDoc(bookingsCol, { ...booking, created_at: new Date().toISOString() });
  return res.id;
}

// Add other helpers as needed (listings, queries, etc.)
export async function getAvailableStorage() {
  const col = collection(db, 'storage_units');
  // Firestore requires that if you use an inequality on a field (available_space > 0)
  // you must order first by that same field. We order by available_space first
  // then sort by created_at client-side to avoid requiring composite indexes in dev.
  const q = query(col, where('available_space', '>', 0), orderBy('available_space', 'desc'));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
  // secondary sort by created_at descending
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return items;
}

export async function getUsersByIds(ids: string[]) {
  const users = await Promise.all(ids.map(async (id) => {
    const d = await getDoc(doc(db, 'users', id));
    return d.exists() ? d.data() : null;
  }));
  return users.filter(Boolean);
}

export async function getStorageUnitById(id: string) {
  const d = await getDoc(doc(db, 'storage_units', id));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as DocumentData) };
}

export async function getBookingsForFarmer(farmerId: string) {
  // Using orderBy together with certain filters can require a composite index.
  // To avoid forcing the developer to immediately create an index during dev,
  // fetch matching docs by equality and sort locally by created_at.
  const col = collection(db, 'bookings');
  const q = query(col, where('farmer_id', '==', farmerId));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { id: string; created_at?: string }));
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return items as Array<DocumentData & { id: string; created_at?: string }>;
}

export function subscribeToAvailableStorage(cb: (data: DocumentData[]) => void) {
  const col = collection(db, 'storage_units');
  // Ensure we order by the inequality field first to satisfy Firestore rules.
  const q = query(col, where('available_space', '>', 0), orderBy('available_space', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
    // client-side secondary sort to avoid composite index requirement
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    cb(items);
  });
  return unsub;
}

export function subscribeToBookingsForFarmer(farmerId: string, cb: (data: DocumentData[]) => void) {
  const col = collection(db, 'bookings');
  // Query by equality and sort client-side to avoid composite-index requirements during development.
  const q = query(col, where('farmer_id', '==', farmerId));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { id: string; created_at?: string }));
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    cb(items);
  });
  return unsub;
}

export async function createBookingWithTransaction(farmerId: string, storageId: string, quantity: number) {
  const storageRef = doc(db, 'storage_units', storageId);
  const bookingsCol = collection(db, 'bookings');

  const bookingId = await runTransaction(db, async (transaction) => {
    const storageSnap = await transaction.get(storageRef);
    if (!storageSnap.exists()) throw new Error('Storage does not exist');
  const storageData: DocumentData = storageSnap.data();
  const available = Number(storageData.available_space || 0);
    if (available < quantity) throw new Error('Not enough available space');

    const newAvailable = available - quantity;
    const newBookingRef = doc(bookingsCol); // auto id
    const price = Number(storageData.price_per_kg || 0);
    transaction.set(newBookingRef, {
      farmer_id: farmerId,
      storage_id: storageId,
      owner_id: storageData.owner_id || null,
      storage_name: storageData.name || '',
      storage_location: storageData.location || '',
      price_per_kg: price,
      total_cost: price * quantity,
      quantity,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    transaction.update(storageRef, { available_space: newAvailable });
    return { id: newBookingRef.id, ownerId: storageData.owner_id as string, name: storageData.name as string };
  });

  await createNotification(bookingId.ownerId, 'New booking request', `${quantity} kg requested at ${bookingId.name}`, 'n_newBooking', { qty: quantity, name: bookingId.name });
  return bookingId.id;
}

export async function uploadStorageImage(file: File): Promise<string> {
  // Images are compressed in the browser and stored inline in Firestore,
  // so the app works without a Firebase Storage bucket (Blaze plan).
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Unsupported image format'));
    i.src = dataUrl;
  });
  const max = 900;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  let quality = 0.75;
  let out = canvas.toDataURL('image/jpeg', quality);
  while (out.length > 700_000 && quality > 0.3) {
    quality -= 0.1;
    out = canvas.toDataURL('image/jpeg', quality);
  }
  return out;
}

export async function createNotification(recipientId: string, title: string, body: string, key?: string, params?: Record<string, unknown>) {
  if (!recipientId) return;
  try {
    await addDoc(collection(db, 'notifications'), {
      recipient_id: recipientId,
      title,
      body,
      key: key || null,
      params: params || null,
      read: false,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Notification failed', e);
  }
}

export async function createStorageUnit(data: DocumentData) {
  const col = collection(db, 'storage_units');
  const res = await addDoc(col, { ...data, created_at: new Date().toISOString() });
  return res.id;
}

export async function updateStorageUnit(id: string, data: Partial<DocumentData>) {
  const refDoc = doc(db, 'storage_units', id);
  await updateDoc(refDoc, data as DocumentData);
}

export async function deleteStorageUnit(id: string) {
  await deleteDoc(doc(db, 'storage_units', id));
}

export async function getStorageUnitsByOwner(ownerId: string) {
  const col = collection(db, 'storage_units');
  // Use equality query and sort client-side to avoid composite-index requirements.
  const q = query(col, where('owner_id', '==', ownerId));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return items;
}

export async function getBookingsForOwner(ownerId: string) {
  // Get owner's storage units then fetch bookings with storage_id in list (Firestore 'in' supports up to 10)
  const storages = await getStorageUnitsByOwner(ownerId);
  const storageIds = storages.map((s: DocumentData) => s.id as string);
  if (storageIds.length === 0) return [];

  const col = collection(db, 'bookings');
  // If <=10 use a single 'in' query
  if (storageIds.length <= 10) {
    // Use an 'in' query without server ordering and sort client-side to avoid
    // composite-index requirements during development.
    const q = query(col, where('storage_id', 'in', storageIds));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    return items;
  }

  // Otherwise fetch per-storage and concat
  const results: DocumentData[] = [];
  for (const sid of storageIds) {
    const q = query(col, where('storage_id', '==', sid));
    const snap = await getDocs(q);
    results.push(...snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string })));
  }
  // sort by created_at desc
  results.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return results;
}

export async function updateBookingStatus(bookingId: string, status: string) {
  let notify: { farmer: string; qty: number; name: string } | null = null;
  // Use a transaction to update booking status and adjust storage available_space
  // when a booking is rejected so the quantity returns to the storage unit.
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists()) throw new Error('Booking not found');
    const bookingData = bookingSnap.data() as DocumentData;
    const prevStatus = bookingData.status as string;
    // If nothing to change, return early
    if (prevStatus === status) return;

    // If rejecting and it wasn't previously rejected, return the quantity to storage
    const releases = ['rejected', 'completed', 'cancelled'];
    if (releases.includes(status) && !releases.includes(prevStatus)) {
      const storageId = bookingData.storage_id as string;
      const qty = Number(bookingData.quantity || 0);
      if (storageId && qty > 0) {
        const storageRef = doc(db, 'storage_units', storageId);
        const storageSnap = await transaction.get(storageRef);
        if (!storageSnap.exists()) throw new Error('Storage not found');
        const storageData = storageSnap.data() as DocumentData;
        const available = Number(storageData.available_space || 0);
        const newAvailable = available + qty;
        transaction.update(storageRef, { available_space: newAvailable });
      }
    }

    // Update booking status
    transaction.update(bookingRef, { status, updated_at: new Date().toISOString() });
    notify = { farmer: bookingData.farmer_id as string, qty: Number(bookingData.quantity || 0), name: (bookingData.storage_name as string) || 'storage' };
  });
  if (notify) {
    const n = notify as { farmer: string; qty: number; name: string };
    await createNotification(n.farmer, `Booking ${status}`, `Your booking of ${n.qty} kg at ${n.name} was ${status}.`, 'n_status', { qty: n.qty, name: n.name, status });
  }
}

export async function cancelBookingByFarmer(bookingId: string) {
  let info: { owner: string; qty: number; name: string } | null = null;
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const snap = await transaction.get(bookingRef);
    if (!snap.exists()) throw new Error('Booking not found');
    const b = snap.data() as DocumentData;
    if (b.status !== 'pending') throw new Error('Only pending bookings can be cancelled');
    const storageRef = doc(db, 'storage_units', b.storage_id as string);
    const sSnap = await transaction.get(storageRef);
    if (sSnap.exists()) {
      const avail = Number((sSnap.data() as DocumentData).available_space || 0);
      transaction.update(storageRef, { available_space: avail + Number(b.quantity || 0) });
    }
    transaction.update(bookingRef, { status: 'cancelled', updated_at: new Date().toISOString() });
    info = { owner: (b.owner_id as string) || '', qty: Number(b.quantity || 0), name: (b.storage_name as string) || 'storage' };
  });
  if (info) {
    const i = info as { owner: string; qty: number; name: string };
    await createNotification(i.owner, 'Booking cancelled', `A farmer cancelled ${i.qty} kg at ${i.name}.`, 'n_cancel', { qty: i.qty, name: i.name });
  }
}

export function subscribeToOwnerStorage(ownerId: string, cb: (data: DocumentData[]) => void) {
  const q = query(collection(db, 'storage_units'), where('owner_id', '==', ownerId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    cb(items);
  });
}

export function subscribeToOwnerBookings(ownerId: string, cb: (data: DocumentData[]) => void) {
  const q = query(collection(db, 'bookings'), where('owner_id', '==', ownerId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) } as DocumentData & { created_at?: string }));
    items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    cb(items);
  });
}
