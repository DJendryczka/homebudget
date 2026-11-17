import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const pending = new Map();

async function copyOldExpenses(uid, homeId) {
  const oldSnap = await getDocs(collection(db, "users", uid, "expenses"));
  if (oldSnap.empty) return;

  let batch = writeBatch(db);
  let count = 0;

  for (const item of oldSnap.docs) {
    batch.set(doc(db, "homes", homeId, "expenses", item.id), {
      ...item.data(),
      createdBy: uid,
    });
    count += 1;
    if (count === 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) await batch.commit();
}

async function ensureHomeOnce(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const existing = userSnap.exists() ? userSnap.data() : null;

  if (existing?.homeId) {
    if (!existing.migrated) {
      await copyOldExpenses(user.uid, existing.homeId);
      await setDoc(userRef, { migrated: true }, { merge: true });
    }
    const homeSnap = await getDoc(doc(db, "homes", existing.homeId));
    return {
      id: existing.homeId,
      name: homeSnap.exists() ? homeSnap.data().name || "Home" : "Home",
    };
  }

  const homeRef = doc(collection(db, "homes"));
  const homeId = homeRef.id;
  const name = "Home";
  const batch = writeBatch(db);

  batch.set(homeRef, {
    name,
    ownerUid: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "homes", homeId, "members", user.uid), {
    role: "owner",
    email: user.email || "",
    name: user.displayName || "",
    joinedAt: serverTimestamp(),
  });
  batch.set(userRef, {
    email: user.email || "",
    name: user.displayName || "",
    homeId,
    migrated: false,
  });

  await batch.commit();
  await copyOldExpenses(user.uid, homeId);
  await setDoc(userRef, { migrated: true }, { merge: true });

  return { id: homeId, name };
}

export function ensureHome(user) {
  const current = pending.get(user.uid);
  if (current) return current;

  const job = ensureHomeOnce(user).finally(() => {
    pending.delete(user.uid);
  });
  pending.set(user.uid, job);
  return job;
}
