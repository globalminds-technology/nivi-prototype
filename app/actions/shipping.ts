"use server";

import { revalidatePath } from "next/cache";
import { container } from "@/infrastructure/di/container";

export async function getShippingRatesAdminAction() {
  const session = await container.adminAuth.getCurrentSession();
  if (!session) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    const options = await container.getShippingOptions();
    return { success: true, options: [...options] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load shipping rates from Zoho",
    };
  }
}

export async function updateShippingRatesAction(data: {
  standardRate?: number;
  expressRate?: number;
}) {
  const session = await container.adminAuth.getCurrentSession();
  if (!session) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  const payload: { standardRate?: number; expressRate?: number } = {};

  if (data.standardRate !== undefined) {
    const sRate = Number(data.standardRate);
    if (isNaN(sRate) || sRate < 0) {
      return { success: false, error: "Standard shipping cost must be a positive number or 0." };
    }
    payload.standardRate = sRate;
  }

  if (data.expressRate !== undefined) {
    const eRate = Number(data.expressRate);
    if (isNaN(eRate) || eRate < 0) {
      return { success: false, error: "Express delivery cost must be a positive number or 0." };
    }
    payload.expressRate = eRate;
  }

  try {
    const updated = await container.updateShippingRates(payload);

    revalidatePath("/admin/shipping");
    revalidatePath("/checkout");

    return {
      success: true,
      options: [...updated],
      message: "Shipping rate updated successfully in Zoho Books!",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update shipping rate in Zoho Books",
    };
  }
}
