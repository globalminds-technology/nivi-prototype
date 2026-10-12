import type { Metadata } from "next";
import { connection } from "next/server";
import { OfferManager, type AdminProductItem } from "@/components/admin/offer-manager";
import { categoryRepository } from "@/infrastructure/categories/category-repository";
import { container } from "@/infrastructure/di/container";
import { heroBannerRepository } from "@/infrastructure/hero-banner/hero-banner-repository";
import { offerCampaignRepository } from "@/infrastructure/offers/offer-campaign-repository";
import { Money } from "@/core/domain/value-objects/money";

export const instant = false;

export const metadata: Metadata = {
  title: "Offers Management — NiVi Console",
  robots: { index: false, follow: false },
};

export default async function AdminOffersPage() {
  await connection();

  const listProductsUseCase = container.listAdminProducts();
  const domainProducts = await listProductsUseCase.execute();
  const categories = await categoryRepository.list();
  const campaigns = await offerCampaignRepository.list();
  const heroBanner = await heroBannerRepository.get();

  const products: AdminProductItem[] = domainProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: Money.toMajor(p.price),
    stock: p.stock,
    category: p.category ?? null,
    primaryImageUrl: p.primaryImageUrl ?? null,
    offer: p.offer
      ? {
          active: p.offer.active,
          type: p.offer.type,
          value:
            p.offer.type === "percent"
              ? p.offer.percent
              : Money.toMajor(p.offer.amount),
          label: p.offer.label,
          expiry: p.offer.expiry ? String(p.offer.expiry).slice(0, 10) : null,
        }
      : null,
  }));

  return (
    <OfferManager
      campaigns={campaigns}
      products={products}
      categories={categories}
      initialHeroBanner={heroBanner}
    />
  );
}
