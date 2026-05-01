export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function alphanumericUpper(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function maskDateInput(value: string) {
  const digits = digitsOnly(value).slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length <= 6)
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export function dateInputToIsoDate(value: string) {
  const digits = digitsOnly(value);

  if (digits.length !== 8) return null;

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return `${year}-${month}-${day}`;
}

export function maskTimeInput(value: string) {
  const digits = digitsOnly(value).slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function timeInputToIsoTime(value: string) {
  const digits = digitsOnly(value);

  if (digits.length !== 4) return null;

  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4));

  if (hours > 23 || minutes > 59) return null;

  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function maskPlateInput(value: string) {
  const raw = alphanumericUpper(value).slice(0, 7);

  if (raw.length <= 3) return raw;

  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

export function normalizePlateInput(value: string) {
  return alphanumericUpper(value).slice(0, 7);
}

export function maskIntegerInput(value: string) {
  const digits = digitsOnly(value);

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseIntegerInput(value: string) {
  const digits = digitsOnly(value);
  return digits ? Number(digits) : 0;
}

export function formatCurrencyValue(value: number | string) {
  const numeric = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(numeric)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}

export function maskCurrencyInput(value: string) {
  const digits = digitsOnly(value);

  if (!digits) return "";

  return formatCurrencyValue(Number(digits) / 100);
}

export function parseCurrencyInput(value: string) {
  const digits = digitsOnly(value);
  return digits ? Number(digits) / 100 : 0;
}
