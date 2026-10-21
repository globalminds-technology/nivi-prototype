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
      {/* Simple Header */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">Shipping Charges</h1>
      </div>

      {/* Two Simple Rate Cards with Individual Update Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Standard Shipping Card */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#694208]/10 text-[#694208]">
                <Truck className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Standard Shipping</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="standardRate" className="text-xs font-medium text-muted-foreground">
                Shipping Cost (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  ₹
                </span>
                <Input
                  id="standardRate"
                  type="number"
                  min="0"
                  step="1"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value)}
                  className="pl-8 text-base font-semibold"
                  placeholder="200"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateStandard}
              disabled={isUpdatingStandard}
              className="w-full bg-[#694208] hover:bg-[#523306] text-white shadow-xs gap-2"
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
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#073C35]/10 text-[#073C35]">
                <Zap className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Express Delivery</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="expressRate" className="text-xs font-medium text-muted-foreground">
                Shipping Cost (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  ₹
                </span>
                <Input
                  id="expressRate"
                  type="number"
                  min="0"
                  step="1"
                  value={expressRate}
                  onChange={(e) => setExpressRate(e.target.value)}
                  className="pl-8 text-base font-semibold"
                  placeholder="350"
                />
              </div>
            </div>

            <Button
              onClick={handleUpdateExpress}
              disabled={isUpdatingExpress}
              className="w-full bg-[#073C35] hover:bg-[#052C27] text-white shadow-xs gap-2"
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
