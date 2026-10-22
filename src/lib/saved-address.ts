"use client";

const ADDRESS_KEY = "yijia-saved-address";

export interface SavedAddress {
  name: string;
  phone: string;
  address: string;
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(ADDRESS_KEY);
  } catch {
    return null;
  }
}

function parseSavedAddress(raw: string | null): SavedAddress | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedAddress>;
    const name = typeof parsed.name === "string" ? parsed.name : "";
    const phone = typeof parsed.phone === "string" ? parsed.phone : "";
    const address = typeof parsed.address === "string" ? parsed.address : "";
    if (!name && !phone && !address) return null;
    return { name, phone, address };
  } catch {
    return null;
  }
}

export function readSavedAddress(): SavedAddress | null {
  if (typeof window === "undefined") return null;
  return parseSavedAddress(readRaw());
}

let savedAddressRaw = "";
let savedAddressSnapshot: SavedAddress | null = null;

export function subscribeSavedAddress(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("yijia-address", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("yijia-address", onChange);
  };
}

export function getSavedAddressSnapshot(): SavedAddress | null {
  const raw = readRaw() ?? "";
  if (raw === savedAddressRaw) return savedAddressSnapshot;
  savedAddressRaw = raw;
  savedAddressSnapshot = parseSavedAddress(raw);
  return savedAddressSnapshot;
}

export function getSavedAddressServerSnapshot(): SavedAddress | null {
  return null;
}

function notifySavedAddress(): void {
  window.dispatchEvent(new Event("yijia-address"));
}

export function writeSavedAddress(address: SavedAddress): void {
  try {
    localStorage.setItem(
      ADDRESS_KEY,
      JSON.stringify({
        name: address.name,
        phone: address.phone,
        address: address.address,
      }),
    );
    notifySavedAddress();
  } catch {
    // 隐私模式或禁用 localStorage 时忽略
  }
}

export function clearSavedAddress(): void {
  try {
    localStorage.removeItem(ADDRESS_KEY);
    notifySavedAddress();
  } catch {
    // ignore
  }
}
