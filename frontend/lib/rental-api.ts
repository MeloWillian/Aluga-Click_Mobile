import Constants from "expo-constants";

import {
  OFFLINE_KEYS,
  OFFLINE_TTLS,
  StorageDecodeError,
  type PendingMutation,
  createAvailabilityKey,
  createVehicleDraftKey,
  enqueuePendingMutation,
  readCachedEntry,
  readJson,
  readPendingMutationSummary,
  removeKey,
  removePendingMutation,
  setPendingMutationStatus,
  writeCachedEntry,
  writeJson,
} from "./offline-storage";

export type { PendingMutationSummary } from "./offline-storage";
export { clearOfflineData } from "./offline-storage";

const DEFAULT_BASE_URL = "http://localhost:8080";
export const RESERVATION_OFFLINE_ERROR =
  "Sem conexão. Não é possível criar reserva offline.";

export type Categoria = {
  id: number;
  nome: string;
  descricao?: string | null;
};

export type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor?: string | null;
  quilometragem: number;
  valorDiaria: number;
  valorKM?: number | null;
  status: string;
  categoria: Categoria;
};

export type VeiculoPayload = {
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor?: string;
  quilometragem: number;
  valorDiaria: number;
  valorKM?: number | null;
  status: string;
  categoria: { id: number };
};

export type ReservaPayload = {
  dataInicio: string;
  dataFim: string;
  tipoCobranca: string;
  cliente: { id: number; tipoUsuario: "CLIENTE" };
  veiculo: { id: number };
  status?: string;
};

export type ReservaFiltro = {
  dataInicial: string;
  dataFim: string;
  categoriaId: number;
};

export type ReservaCliente = {
  id: number;
  nome?: string | null;
};

export type ReservaVeiculo = {
  id: number;
  placa?: string | null;
  modelo?: string | null;
  marca?: string | null;
  status?: string | null;
  categoria?: {
    id: number;
    nome?: string | null;
  } | null;
};

export type Reserva = {
  id: number | string;
  dataInicio: string;
  dataFim: string;
  status: string;
  tipoCobranca: string;
  cliente?: ReservaCliente | null;
  veiculo?: ReservaVeiculo | null;
  localOnly?: boolean;
  syncState?: "pending" | "synced";
  localMutationId?: string;
};

export type VehicleFormDraft = {
  placa: string;
  modelo: string;
  marca: string;
  ano: string;
  cor: string;
  quilometragem: string;
  valorDiaria: string;
  valorKM: string;
  status: string;
  categoriaId: string;
};

export type ClientSearchDraft = {
  search: {
    dataInicio: string;
    horaInicio: string;
    dataFim: string;
    horaFim: string;
    categoriaId: string;
  };
  reservation: {
    clienteId: string;
    tipoCobranca: string;
  };
  selectedVehicleId: string;
  vehicles: Veiculo[];
};

export type ClientReservationsDraft = {
  clienteId: string;
};

export type PendingSyncResult = {
  queued: true;
  mutationId: string;
  message: string;
};

export function isPendingSyncResult(
  value: unknown,
): value is PendingSyncResult {
  return Boolean(value && typeof value === "object" && "queued" in value);
}

export function readOfflineSummary(): Promise<
  import("./offline-storage").PendingMutationSummary
> {
  return readPendingMutationSummary();
}

function getBaseUrl() {
  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredBaseUrl && !/localhost|127\.0\.0\.1/.test(configuredBaseUrl)) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  const constants = Constants as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

  const hostUri =
    constants.expoConfig?.hostUri ??
    constants.expoGoConfig?.debuggerHost ??
    constants.manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const host = hostUri
      .replace(/^.*:\/\//, "")
      .split("/")[0]
      .split(":")[0];

    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080`;
    }
  }

  return (configuredBaseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

class NetworkUnavailableError extends Error {
  constructor() {
    super("Sem conexão com o servidor.");
    this.name = "NetworkUnavailableError";
  }
}

function isNetworkUnavailableError(error: unknown) {
  return error instanceof NetworkUnavailableError;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Falha inesperada.";
}

export async function checkServerConnectivity(timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(getBaseUrl(), {
      method: "GET",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  let response: Response;

  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      ...init,
    });
  } catch {
    throw new NetworkUnavailableError();
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function cacheReadOrFetch<T>(params: {
  cacheKey: string;
  ttlMs: number;
  fetcher: () => Promise<T>;
}) {
  try {
    const fresh = await params.fetcher();
    await writeCachedEntry(params.cacheKey, fresh, params.ttlMs);
    return fresh;
  } catch (error) {
    try {
      const cached = await readCachedEntry<T>(params.cacheKey);

      if (cached) {
        return cached.data;
      }
    } catch (cacheError) {
      if (cacheError instanceof StorageDecodeError) {
        throw cacheError;
      }

      throw cacheError;
    }

    throw error;
  }
}

async function writeVehicleCaches(vehicle: Veiculo) {
  await writeCachedEntry(
    OFFLINE_KEYS.veiculo(vehicle.id),
    vehicle,
    OFFLINE_TTLS.veiculo,
  );

  const fleetCache = await readCachedEntry<Veiculo[]>(OFFLINE_KEYS.frota);
  const next = fleetCache?.data ?? [];
  const updatedFleet = next.some((item) => item.id === vehicle.id)
    ? next.map((item) => (item.id === vehicle.id ? vehicle : item))
    : [...next, vehicle];

  await writeCachedEntry(OFFLINE_KEYS.frota, updatedFleet, OFFLINE_TTLS.frota);
}

function toCachedReserva(
  payload: ReservaPayload,
  reserva?: Partial<Reserva> | null,
) {
  const hasServerId = typeof reserva?.id === "number";
  const isLocalId =
    typeof reserva?.id === "string" && reserva.id.startsWith("local-");
  const id = hasServerId
    ? (reserva?.id as number)
    : typeof reserva?.id === "string"
      ? reserva.id
      : `local-${payload.cliente.id}-${Date.now()}`;

  return {
    id,
    dataInicio: payload.dataInicio,
    dataFim: payload.dataFim,
    status: reserva?.status ?? payload.status ?? "PENDENTE",
    tipoCobranca: reserva?.tipoCobranca ?? payload.tipoCobranca,
    cliente: reserva?.cliente ?? {
      id: payload.cliente.id,
    },
    veiculo: reserva?.veiculo ?? {
      id: payload.veiculo.id,
    },
    localOnly: !hasServerId || isLocalId,
    syncState: hasServerId && !isLocalId ? "synced" : "pending",
    localMutationId: reserva?.localMutationId,
  } satisfies Reserva;
}

async function upsertClientReservationsCache(
  clienteId: number,
  reserva: Reserva,
) {
  const cache = await readCachedEntry<Reserva[]>(
    OFFLINE_KEYS.reservas(clienteId),
  );
  const next = cache?.data ?? [];
  const updated = next.some(
    (item) =>
      String(item.id) === String(reserva.id) ||
      (reserva.localMutationId &&
        item.localMutationId === reserva.localMutationId),
  )
    ? next.map((item) =>
        String(item.id) === String(reserva.id) ||
        (reserva.localMutationId &&
          item.localMutationId === reserva.localMutationId)
          ? reserva
          : item,
      )
    : [reserva, ...next];

  await writeCachedEntry(
    OFFLINE_KEYS.reservas(clienteId),
    updated,
    OFFLINE_TTLS.reservas,
  );
}

async function invalidateAvailabilityCache() {
  const keys = await readJson<string[]>(OFFLINE_KEYS.disponibilidadeIndex);
  if (!keys || keys.length === 0) {
    return;
  }

  await Promise.all(keys.map((key) => removeKey(key)));
  await writeJson(OFFLINE_KEYS.disponibilidadeIndex, []);
}

async function rememberAvailabilityKey(key: string) {
  const keys =
    (await readJson<string[]>(OFFLINE_KEYS.disponibilidadeIndex)) ?? [];

  if (!keys.includes(key)) {
    keys.push(key);
    await writeJson(OFFLINE_KEYS.disponibilidadeIndex, keys);
  }
}

async function submitVehicleCreate(payload: VeiculoPayload) {
  const created = await request<Veiculo>("/api/gerente/veiculo", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  await writeVehicleCaches(created);
  return created;
}

async function submitVehicleUpdate(id: number, payload: VeiculoPayload) {
  const updated = await request<Veiculo>(`/api/gerente/veiculo/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  await writeVehicleCaches(updated);
  return updated;
}

async function submitReservation(
  payload: ReservaPayload,
  availabilityKey?: string,
  options?: { localMutationId?: string },
) {
  const created = await request<unknown>("/api/usuario/reserva", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (availabilityKey) {
    await removeKey(availabilityKey);
  }

  await invalidateAvailabilityCache();
  try {
    const cachedReserva = toCachedReserva(
      payload,
      created as Partial<Reserva> | null,
    );

    if (options?.localMutationId) {
      cachedReserva.localMutationId = options.localMutationId;
    }

    await upsertClientReservationsCache(payload.cliente.id, cachedReserva);
  } catch {
    // Keep the reservation flow working even if local storage is broken.
  }
  return created;
}

let syncPendingMutationsInFlight: Promise<{
  synced: number;
  failed: number;
}> | null = null;

export async function readCachedCategorias() {
  return readCachedEntry<Categoria[]>(OFFLINE_KEYS.categorias);
}

export async function readCachedFrota() {
  return readCachedEntry<Veiculo[]>(OFFLINE_KEYS.frota);
}

export async function readCachedVeiculo(id: number) {
  return readCachedEntry<Veiculo>(OFFLINE_KEYS.veiculo(id));
}

export async function readCachedAvailability(filtro: ReservaFiltro) {
  return readCachedEntry<Veiculo[]>(createAvailabilityKey(filtro));
}

export async function readCachedClientReservations(clienteId: number) {
  return readCachedEntry<Reserva[]>(OFFLINE_KEYS.reservas(clienteId));
}

export async function readVehicleDraft(id: number | "new") {
  return readJson<VehicleFormDraft>(createVehicleDraftKey(id));
}

export async function saveVehicleDraft(
  id: number | "new",
  draft: VehicleFormDraft,
) {
  await writeJson(createVehicleDraftKey(id), draft);
}

export async function clearVehicleDraft(id: number | "new") {
  return removeKey(createVehicleDraftKey(id));
}

export async function readClientSearchDraft() {
  return readJson<ClientSearchDraft>(OFFLINE_KEYS.clientSearchDraft);
}

export async function saveClientSearchDraft(draft: ClientSearchDraft) {
  await writeJson(OFFLINE_KEYS.clientSearchDraft, draft);
}

export async function clearClientSearchDraft() {
  return removeKey(OFFLINE_KEYS.clientSearchDraft);
}

export async function readClientReservationsDraft() {
  return readJson<ClientReservationsDraft>(
    OFFLINE_KEYS.clientReservationsDraft,
  );
}

export async function saveClientReservationsDraft(
  draft: ClientReservationsDraft,
) {
  await writeJson(OFFLINE_KEYS.clientReservationsDraft, draft);
}

export async function clearClientReservationsDraft() {
  return removeKey(OFFLINE_KEYS.clientReservationsDraft);
}

export async function listCategorias() {
  return cacheReadOrFetch<Categoria[]>({
    cacheKey: OFFLINE_KEYS.categorias,
    ttlMs: OFFLINE_TTLS.categorias,
    fetcher: () => request<Categoria[]>("/api/gerente/categorias"),
  });
}

export async function listFrota() {
  return cacheReadOrFetch<Veiculo[]>({
    cacheKey: OFFLINE_KEYS.frota,
    ttlMs: OFFLINE_TTLS.frota,
    fetcher: () => request<Veiculo[]>("/api/gerente/frota"),
  });
}

export async function getVeiculo(id: number) {
  return cacheReadOrFetch<Veiculo>({
    cacheKey: OFFLINE_KEYS.veiculo(id),
    ttlMs: OFFLINE_TTLS.veiculo,
    fetcher: () => request<Veiculo>(`/api/gerente/veiculo/${id}`),
  });
}

export async function listClientReservations(clienteId: number) {
  return cacheReadOrFetch<Reserva[]>({
    cacheKey: OFFLINE_KEYS.reservas(clienteId),
    ttlMs: OFFLINE_TTLS.reservas,
    fetcher: () => request<Reserva[]>(`/api/cliente/${clienteId}/reservas`),
  });
}

export async function createVeiculo(
  payload: VeiculoPayload,
): Promise<Veiculo | PendingSyncResult> {
  try {
    return await submitVehicleCreate(payload);
  } catch (error) {
    if (!isNetworkUnavailableError(error)) {
      throw error;
    }

    const mutation = await enqueuePendingMutation({
      type: "createVehicle",
      payload: { vehicle: payload },
    });

    return {
      queued: true,
      mutationId: mutation.id,
      message: "Veículo salvo localmente para sincronização posterior.",
    };
  }
}

export async function updateVeiculo(
  id: number,
  payload: VeiculoPayload,
): Promise<Veiculo | PendingSyncResult> {
  try {
    return await submitVehicleUpdate(id, payload);
  } catch (error) {
    if (!isNetworkUnavailableError(error)) {
      throw error;
    }

    const mutation = await enqueuePendingMutation({
      type: "updateVehicle",
      payload: { id, vehicle: payload },
    });

    return {
      queued: true,
      mutationId: mutation.id,
      message: "Atualização salva localmente para sincronização posterior.",
    };
  }
}

export async function searchAvailableVehicles(filtro: ReservaFiltro) {
  const cacheKey = createAvailabilityKey(filtro);
  await rememberAvailabilityKey(cacheKey);

  const found = await request<Veiculo[]>(
    `/api/cliente/veiculos/disponiveis?${new URLSearchParams({
      dataInicial: filtro.dataInicial,
      dataFim: filtro.dataFim,
      categoriaId: String(filtro.categoriaId),
    }).toString()}`,
  );

  await writeCachedEntry(cacheKey, found, OFFLINE_TTLS.disponibilidade);
  return found;
}

export async function createReserva(
  payload: ReservaPayload,
  options?: { availabilityFilter?: ReservaFiltro },
): Promise<unknown> {
  try {
    return await submitReservation(
      payload,
      options?.availabilityFilter
        ? createAvailabilityKey(options.availabilityFilter)
        : undefined,
    );
  } catch (error) {
    if (!isNetworkUnavailableError(error)) {
      throw error;
    }

    throw new Error(RESERVATION_OFFLINE_ERROR);
  }
}

export async function syncPendingMutations() {
  if (syncPendingMutationsInFlight) {
    return syncPendingMutationsInFlight;
  }

  syncPendingMutationsInFlight = (async () => {
    const queue = await readJson<PendingMutation[]>(OFFLINE_KEYS.queue);

    if (!queue || queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const mutation of queue) {
      if (mutation.status === "failed") {
        continue;
      }

      try {
        if (mutation.type === "createVehicle") {
          const payload = mutation.payload as { vehicle: VeiculoPayload };
          await submitVehicleCreate(payload.vehicle);
        } else if (mutation.type === "updateVehicle") {
          const payload = mutation.payload as {
            id: number;
            vehicle: VeiculoPayload;
          };
          await submitVehicleUpdate(payload.id, payload.vehicle);
        } else if (mutation.type === "createReservation") {
          const payload = mutation.payload as {
            reservation: ReservaPayload;
            availabilityFilter: ReservaFiltro | null;
          };

          await submitReservation(
            payload.reservation,
            payload.availabilityFilter
              ? createAvailabilityKey(payload.availabilityFilter)
              : undefined,
            { localMutationId: mutation.id },
          );
        }

        await removePendingMutation(mutation.id);
        synced += 1;
      } catch (error) {
        if (isNetworkUnavailableError(error)) {
          await setPendingMutationStatus(
            mutation.id,
            "pending",
            "Sem conexão com o servidor.",
          );
          break;
        }

        await setPendingMutationStatus(
          mutation.id,
          "failed",
          getErrorMessage(error),
        );
        failed += 1;
        break;
      }
    }

    return { synced, failed };
  })();

  try {
    return await syncPendingMutationsInFlight;
  } finally {
    syncPendingMutationsInFlight = null;
  }
}
