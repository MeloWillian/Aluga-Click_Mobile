import AsyncStorage from "@react-native-async-storage/async-storage";

export const OFFLINE_STORAGE_VERSION = 1;
const STORAGE_PREFIX = `aluga-click:offline:v${OFFLINE_STORAGE_VERSION}`;
const MAX_QUEUE_SIZE = 20;

export const OFFLINE_TTLS = {
  categorias: 24 * 60 * 60 * 1000,
  frota: 15 * 60 * 1000,
  veiculo: 24 * 60 * 60 * 1000,
  disponibilidade: 5 * 60 * 1000,
  reservas: 15 * 60 * 1000,
  rascunho: 30 * 24 * 60 * 60 * 1000,
} as const;

export const OFFLINE_KEYS = {
  categorias: `${STORAGE_PREFIX}:cache:categorias`,
  frota: `${STORAGE_PREFIX}:cache:frota`,
  veiculo: (id: number) => `${STORAGE_PREFIX}:cache:veiculo:${id}`,
  disponibilidade: (key: string) =>
    `${STORAGE_PREFIX}:cache:disponibilidade:${key}`,
  disponibilidadeIndex: `${STORAGE_PREFIX}:cache:disponibilidade-index`,
  reservas: (clienteId: number) =>
    `${STORAGE_PREFIX}:cache:reservas:${clienteId}`,
  vehicleDraft: (key: string) => `${STORAGE_PREFIX}:draft:vehicle:${key}`,
  clientSearchDraft: `${STORAGE_PREFIX}:draft:client-search`,
  clientReservationsDraft: `${STORAGE_PREFIX}:draft:client-reservations`,
  queue: `${STORAGE_PREFIX}:queue`,
} as const;

export type CacheEnvelope<T> = {
  version: number;
  savedAt: number;
  ttlMs: number;
  data: T;
};

export type CachedEntry<T> = CacheEnvelope<T> & {
  isStale: boolean;
  isExpired: boolean;
};

export type PendingMutationType =
  | "createVehicle"
  | "updateVehicle"
  | "createReservation";

export type PendingMutation = {
  id: string;
  type: PendingMutationType;
  createdAt: number;
  retryCount: number;
  status: "pending" | "failed";
  lastError?: string;
  payload: unknown;
};

export type PendingMutationSummary = {
  total: number;
  pending: number;
  failed: number;
  hasPending: boolean;
};

export class StorageDecodeError extends Error {
  constructor(key: string) {
    super(`Cache local corrompido em ${key}.`);
    this.name = "StorageDecodeError";
  }
}

export function createVehicleDraftKey(id: number | "new") {
  return OFFLINE_KEYS.vehicleDraft(String(id));
}

export function createAvailabilityKey(filter: {
  dataInicial: string;
  dataFim: string;
  categoriaId: number;
}) {
  return OFFLINE_KEYS.disponibilidade(
    encodeURIComponent(
      `${filter.dataInicial}|${filter.dataFim}|${filter.categoriaId}`,
    ),
  );
}

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function readJsonStrict<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new StorageDecodeError(key);
  }
}

export async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readCachedEntry<T>(
  key: string,
): Promise<CachedEntry<T> | null> {
  const entry = await readJsonStrict<CacheEnvelope<T>>(key);

  if (!entry || entry.version !== OFFLINE_STORAGE_VERSION) {
    return null;
  }

  const age = Date.now() - entry.savedAt;

  return {
    ...entry,
    isStale: age > entry.ttlMs,
    isExpired: age > entry.ttlMs,
  };
}

export async function writeCachedEntry<T>(key: string, data: T, ttlMs: number) {
  await writeJson(key, {
    version: OFFLINE_STORAGE_VERSION,
    savedAt: Date.now(),
    ttlMs,
    data,
  } satisfies CacheEnvelope<T>);
}

export async function removeKey(key: string) {
  await AsyncStorage.removeItem(key);
}

export async function enqueuePendingMutation(
  mutation: Omit<PendingMutation, "id" | "createdAt" | "retryCount" | "status">,
) {
  const queue = await readPendingMutations();
  const next: PendingMutation = {
    ...mutation,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  };

  const boundedQueue = [...queue, next].slice(-MAX_QUEUE_SIZE);
  await writeJson(OFFLINE_KEYS.queue, boundedQueue);

  return next;
}

export async function readPendingMutations() {
  return (await readJson<PendingMutation[]>(OFFLINE_KEYS.queue)) ?? [];
}

export async function setPendingMutationStatus(
  id: string,
  status: PendingMutation["status"],
  lastError?: string,
) {
  const queue = await readPendingMutations();
  const next = queue.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          lastError,
          retryCount: item.retryCount + 1,
        }
      : item,
  );

  await writeJson(OFFLINE_KEYS.queue, next);
  return next;
}

export async function removePendingMutation(id: string) {
  const queue = await readPendingMutations();
  const next = queue.filter((item) => item.id !== id);
  await writeJson(OFFLINE_KEYS.queue, next);
  return next;
}

export async function readPendingMutationSummary(): Promise<PendingMutationSummary> {
  const queue = await readPendingMutations();

  return {
    total: queue.length,
    pending: queue.filter((item) => item.status === "pending").length,
    failed: queue.filter((item) => item.status === "failed").length,
    hasPending: queue.length > 0,
  };
}

export async function clearOfflineData() {
  const keys = await AsyncStorage.getAllKeys();
  const offlineKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));

  if (offlineKeys.length > 0) {
    await Promise.all(offlineKeys.map((key) => AsyncStorage.removeItem(key)));
  }
}
