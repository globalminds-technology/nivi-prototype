export interface ProductInputDto {
  name: string;
  sku: string;
  description: string;
  priceMinor: number;
  costPriceMinor?: number | null;
  stock: number;
  category?: string | null;
  tags?: string[];
  primaryImageUrl?: string | null;
  gallery?: string[];
  status?: "active" | "inactive";
}

