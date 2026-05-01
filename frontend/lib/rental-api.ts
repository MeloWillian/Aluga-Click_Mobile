import Constants from "expo-constants";

const DEFAULT_BASE_URL = "http://localhost:8080";

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
    const host = hostUri.replace(/^.*:\/\//, "").split("/")[0].split(":")[0];

    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080`;
    }
  }

  return (configuredBaseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function listCategorias() {
  return request<Categoria[]>("/api/gerente/categorias");
}

export function listFrota() {
  return request<Veiculo[]>("/api/gerente/frota");
}

export function getVeiculo(id: number) {
  return request<Veiculo>(`/api/gerente/veiculo/${id}`);
}

export function createVeiculo(payload: VeiculoPayload) {
  return request<Veiculo>("/api/gerente/veiculo", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVeiculo(id: number, payload: VeiculoPayload) {
  return request<Veiculo>(`/api/gerente/veiculo/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function searchAvailableVehicles(filtro: ReservaFiltro) {
  const params = new URLSearchParams({
    dataInicial: filtro.dataInicial,
    dataFim: filtro.dataFim,
    categoriaId: String(filtro.categoriaId),
  });

  return request<Veiculo[]>(
    `/api/cliente/veiculos/disponiveis?${params.toString()}`,
  );
}

export function createReserva(payload: ReservaPayload) {
  return request<unknown>("/api/usuario/reserva", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
