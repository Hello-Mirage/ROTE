const DB_NAME = "rote_keystore_db";
const STORE_NAME = "keys";
const CRYPTO_KEY_ID = "aes_gcm_master";
const CIPHER_STORAGE_KEY = "rote_byok_cipher_v1";
const CHANGE_EVENT = "rote-key-change";

let memoryFallbackKey: string | null = null;

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const db = await openKeyDb();

  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(CRYPTO_KEY_ID);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });

  if (existing) {
    db.close();
    return existing;
  }

  // Non-extractable AES-GCM 256-bit key: JS cannot export raw key bytes
  const created = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(created, CRYPTO_KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return created;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function saveApiKey(rawKey: string): Promise<void> {
  const clean = rawKey.trim();
  if (!clean) return;

  memoryFallbackKey = clean;

  if (typeof window !== "undefined" && window.crypto?.subtle && window.indexedDB) {
    const master = await getOrCreateMasterKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(clean);
    const cipherBuf = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      master,
      encoded
    );

    const payload = JSON.stringify({
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(cipherBuf)),
    });
    window.localStorage.setItem(CIPHER_STORAGE_KEY, payload);
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export async function loadApiKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const rawPayload = window.localStorage.getItem(CIPHER_STORAGE_KEY);
  if (!rawPayload) {
    return memoryFallbackKey;
  }

  if (!window.crypto?.subtle || !window.indexedDB) {
    return memoryFallbackKey;
  }

  try {
    const parsed = JSON.parse(rawPayload) as { iv?: string; data?: string };
    if (!parsed.iv || !parsed.data) return null;

    const master = await getOrCreateMasterKey();
    const iv = fromBase64(parsed.iv);
    const data = fromBase64(parsed.data);

    const plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      master,
      data as BufferSource
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}

export function hasStoredApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.localStorage.getItem(CIPHER_STORAGE_KEY) || memoryFallbackKey
  );
}

export function clearApiKey(): void {
  memoryFallbackKey = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CIPHER_STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function subscribeApiKey(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
