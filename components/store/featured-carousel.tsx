import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard, type StoreProductData } from "./product-card";

interface FeaturedCarouselProps {
  products: StoreProductData[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
}

export function FeaturedCarousel({
  products,
  title = "Curator's Highlights",
  viewAllHref,
}: FeaturedCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Header: Great Vibes font placed in center, View All on the right side on the same line */}
      <div className="relative flex items-center justify-center mb-2 sm:mb-4 min-h-[44px]">
        <h2 className="font-['Great_Vibes'] text-3xl sm:text-4xl md:text-5xl font-normal leading-tight tracking-wide text-[#023036] text-center pt-1 px-16 sm:px-24">
          {title}
        </h2>

        {viewAllHref && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#023036] hover:text-[#056677] hover:underline transition-colors shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: products.length > 5,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-2.5 sm:-ml-3 lg:-ml-3.5">
          {products.map((product) => (
            <CarouselItem
              key={product.sku}
              className="pl-2.5 sm:pl-3 lg:pl-3.5 basis-[65%] xs:basis-[46%] sm:basis-[31%] md:basis-[24%] lg:basis-[20%]"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Previous & Next arrows vertically aligned with saree image center */}
        <CarouselPrevious
          className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -left-3 sm:-left-4 lg:-left-5 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20 disabled:opacity-0 disabled:pointer-events-none"
        />
        <CarouselNext
          className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -right-3 sm:-right-4 lg:-right-5 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20 disabled:opacity-0 disabled:pointer-events-none"
        />
      </Carousel>
    </section>
  );
}
