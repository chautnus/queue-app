// Client-side device fingerprint utilities
// This module is intended for client-side use only

export function getStorageKey(queueId: string): string {
  return `dq_${queueId}_device`;
}

export function getStoredDeviceId(queueId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(getStorageKey(queueId));
}

export function storeDeviceId(queueId: string, deviceId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(queueId), deviceId);
}

// Generate a stable device fingerprint using available browser signals
export async function generateDeviceId(): Promise<string> {
  const components: string[] = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.platform ?? "",
    String(navigator.hardwareConcurrency ?? ""),
  ];

  // Canvas fingerprint
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Queue🎫", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Queue🎫", 4, 17);
      components.push(canvas.toDataURL());
    }
  } catch {
    // Canvas blocked, skip
  }

  const raw = components.join("|");
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Format as UUID-like string for consistency
  return [
    hashHex.slice(0, 8),
    hashHex.slice(8, 12),
    "4" + hashHex.slice(13, 16),
    ((parseInt(hashHex[16], 16) & 0x3) | 0x8).toString(16) +
      hashHex.slice(17, 20),
    hashHex.slice(20, 32),
  ].join("-");
}

export async function getOrCreateDeviceId(queueId: string): Promise<string> {
  const stored = getStoredDeviceId(queueId);
  if (stored) return stored;

  const newId = await generateDeviceId();
  storeDeviceId(queueId, newId);
  return newId;
}
