"use client";

import { useState, useTransition } from "react";
import { Truck, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { updateShippingRatesAction } from "@/app/actions/shipping";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingOption } from "@/core/application/ports/shipping-repository";

interface ShippingManagerProps {
  initialOptions: ShippingOption[];
}

export function ShippingManager({ initialOptions }: ShippingManagerProps) {
  const standardInit = initialOptions.find((o) => o.type === "standard")?.rate ?? 200;
  const expressInit = initialOptions.find((o) => o.type === "express")?.rate ?? 350;

  const [standardRate, setStandardRate] = useState<number | string>(standardInit);
  const [expressRate, setExpressRate] = useState<number | string>(expressInit);

  const [isUpdatingStandard, startStandardTransition] = useTransition();
  const [isUpdatingExpress, startExpressTransition] = useTransition();

  const handleUpdateStandard = () => {
    const sRate = Number(standardRate);
    if (isNaN(sRate) || sRate < 0) {
      toast.error("Standard shipping rate must be 0 or higher.");
      return;
    }

    startStandardTransition(async () => {
      const res = await updateShippingRatesAction({ standardRate: sRate });
      if (res.success) {
        toast.success("Standard shipping rate updated successfully!");
      } else {
        toast.error(res.error || "Failed to update standard shipping rate");
      }
    });
  };

  const handleUpdateExpress = () => {
    const eRate = Number(expressRate);
    if (isNaN(eRate) || eRate < 0) {
      toast.error("Express delivery rate must be 0 or higher.");
      return;
    }

    startExpressTransition(async () => {
      const res = await updateShippingRatesAction({ expressRate: eRate });
      if (res.success) {
        toast.success("Express delivery rate updated successfully!");
      } else {
        toast.error(res.error || "Failed to update express delivery rate");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#D5CCBB]/80 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#073C35] font-serif">Shipping Charges</h1>
        <p className="text-sm text-[#6B5A4A] mt-1 font-sans">
          Configure standard and express delivery rates applied during checkout across India.
        </p>
      </div>

      {/* Two Rate Cards with Individual Update Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Standard Shipping Card */}
        <Card className="border border-[#D5CCBB] bg-[#FFFCF5] shadow-[0_4px_20px_rgba(7,60,53,0.05)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-[#D5CCBB]/60 bg-[#E4DDCD]/25">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#C9A45C]/15 text-[#8C6D37]">
                <Truck className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-serif font-bold text-[#30251F]">Standard Shipping</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="standardRate" className="text-xs font-semibold text-[#6B5A4A]">
                Shipping Cost (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#073C35] font-bold text-sm">
                  ₹
                </span>
                <Input
                  id="standardRate"
                  type="number"
                  min="0"
                  step="1"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value)}
                  className="pl-8 text-base font-semibold font-mono bg-white border-[#D5CCBB] text-[#30251F] focus:border-[#073C35] focus:ring-[#073C35] rounded-xl shadow-2xs h-11"
                  placeholder="200"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateStandard}
              disabled={isUpdatingStandard}
              className="w-full bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] font-semibold rounded-xl shadow-xs gap-2 h-10 cursor-pointer"
            >
              {isUpdatingStandard ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Standard Shipping</span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Express Delivery Card */}
        <Card className="border border-[#D5CCBB] bg-[#FFFCF5] shadow-[0_4px_20px_rgba(7,60,53,0.05)] rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-[#D5CCBB]/60 bg-[#E4DDCD]/25">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#073C35]/10 text-[#073C35]">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-serif font-bold text-[#30251F]">Express Delivery</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="expressRate" className="text-xs font-semibold text-[#6B5A4A]">
                Shipping Cost (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#073C35] font-bold text-sm">
                  ₹
                </span>
                <Input
                  id="expressRate"
                  type="number"
                  min="0"
                  step="1"
                  value={expressRate}
                  onChange={(e) => setExpressRate(e.target.value)}
                  className="pl-8 text-base font-semibold font-mono bg-white border-[#D5CCBB] text-[#30251F] focus:border-[#073C35] focus:ring-[#073C35] rounded-xl shadow-2xs h-11"
                  placeholder="350"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateExpress}
              disabled={isUpdatingExpress}
              className="w-full bg-[#073C35] hover:bg-[#0a4d44] text-[#FFFCF5] font-semibold rounded-xl shadow-xs gap-2 h-10 cursor-pointer"
            >
              {isUpdatingExpress ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Express Delivery</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
