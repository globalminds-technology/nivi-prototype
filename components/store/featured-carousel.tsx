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
import { GoldText } from "./gold-text";

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
    <section className="space-y-2.5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-1 mb-2 sm:mb-6">
        <GoldText>{title}</GoldText>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-sm font-semibold text-[#073C35] hover:text-[#C9A45C] transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        )}
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
          containScroll: "trimSnaps",
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-2.5 sm:-ml-3 lg:-ml-3.5">
          {products.map((product) => (
            <CarouselItem
              key={product.sku}
              className="pl-2.5 sm:pl-3 lg:pl-3.5 basis-[39%] sm:basis-[30%] md:basis-[28.5%] lg:basis-[20%]"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Previous & Next arrows vertically aligned with saree image center */}
        <CarouselPrevious
          className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -left-3 sm:-left-4 lg:-left-5 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20"
        />
        <CarouselNext
          className="hidden sm:inline-flex inset-y-auto top-[40%] -translate-y-1/2 -right-3 sm:-right-4 lg:-right-5 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-white/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-[#023036] hover:border-[#023036] text-[#023036] transition-all z-20"
        />
      </Carousel>
    </section>
  );
}
