export interface PublicOrderRef {
  id: string;
  token: string;
  savedAt: string;
}

const STORAGE_KEY = "publicOrderRefs";

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeRefs(refs: PublicOrderRef[]) {
  const deduped = new Map<string, PublicOrderRef>();
  for (const ref of refs) {
    if (!ref.id || !ref.token) continue;
    deduped.set(ref.id, ref);
  }

  return [...deduped.values()]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    .slice(0, 25);
}

export function readPublicOrderRefs(): PublicOrderRef[] {
  if (!canUseStorage()) return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const safe = parsed
      .map((item) => ({
        id: typeof item?.id === "string" ? item.id : "",
        token: typeof item?.token === "string" ? item.token : "",
        savedAt:
          typeof item?.savedAt === "string" && item.savedAt
            ? item.savedAt
            : new Date().toISOString(),
      }))
      .filter((item) => item.id && item.token);

    return normalizeRefs(safe);
  } catch {
    return [];
  }
}

export function savePublicOrderRef(id: string, token: string) {
  if (!canUseStorage()) return;
  if (!id || !token) return;

  const next = normalizeRefs([
    { id, token, savedAt: new Date().toISOString() },
    ...readPublicOrderRefs(),
  ]);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
