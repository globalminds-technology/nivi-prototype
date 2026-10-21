import type { Metadata } from "next";
import { connection } from "next/server";
import { ShippingManager } from "@/components/admin/shipping-manager";
import { container } from "@/infrastructure/di/container";

export const instant = false;

export const metadata: Metadata = {
  title: "Shipping Charges — NiVi Console",
  robots: { index: false, follow: false },
};

export default async function AdminShippingPage() {
  await connection();
  const options = await container.getShippingOptions();

  return <ShippingManager initialOptions={[...options]} />;
}
