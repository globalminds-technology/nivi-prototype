export type Sku = string;

export function toSku(value: string): Sku {
  return value.trim().toUpperCase();
}

