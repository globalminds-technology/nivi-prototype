"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";

export function ReturnToStoreLink() {
  const [storefrontHref, setStorefrontHref] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("admin.")) {
        const rootHost = host.replace(/^admin\./, "");
        setStorefrontHref(`${window.location.protocol}//${rootHost}/`);
      } else {
        setStorefrontHref("/");
      }
    }
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.startsWith("admin.")) {
        e.preventDefault();
        const rootHost = host.replace(/^admin\./, "");
        const targetUrl = `${window.location.protocol}//${rootHost}/`;
        if (e.metaKey || e.ctrlKey) {
          window.open(targetUrl, "_blank");
        } else {
          window.location.href = targetUrl;
        }
      }
    }
  };

  return (
    <Link
      href={storefrontHref}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#073C35] bg-[#FFFCF5]/80 hover:bg-[#FFFCF5] border border-[#D5CCBB] px-3 py-1.5 rounded-full shadow-2xs transition-all group cursor-pointer"
    >
      <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
      <Store className="h-3.5 w-3.5 opacity-80" />
      <span>Return to Store</span>
    </Link>
  );
}
