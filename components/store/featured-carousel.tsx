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
import { ShinyText } from "@/components/ui/shiny-text";

interface FeaturedCarouselProps {
  products: StoreProductData[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
}

export function FeaturedCarousel({
  products,
  title = "Curator's Highlights",
  subtitle = "Handpicked pieces defining our current seasonal collection",
  viewAllHref,
}: FeaturedCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Header with Title on left & Explore All on right matching reference screenshot */}
      <div className="flex items-end justify-between gap-3 pb-1 border-b border-neutral-100 sm:border-none">
        <div className="space-y-0.5 text-left">
          <h2 className="font-['Great_Vibes'] text-3xl sm:text-4xl md:text-5xl font-normal leading-tight tracking-wide text-primary pt-1">
            <ShinyText
              text={title}
              speed={3}
              color="#083e3e"
              shineColor="#dfb76c"
            />
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-600 max-w-lg hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-[#052920] hover:underline shrink-0 pb-0.5 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: products.length > 3,
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-2 sm:-ml-2.5 lg:-ml-3">
          {products.map((product) => (
            <CarouselItem
              key={product.sku}
              className="pl-2 sm:pl-2.5 lg:pl-3 basis-[43.5%] sm:basis-[26%] md:basis-[22%] lg:basis-[18.18%]"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* Previous & Next arrows vertically in the middle of product cards at start and last */}
        <CarouselPrevious
          className="inset-y-auto top-1/2 -mt-4 sm:-mt-4.5 lg:-mt-5 my-0 -left-2.5 sm:-left-3.5 lg:-left-4 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-[#faf8f2]/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-primary hover:border-primary text-neutral-800 transition-all z-20 disabled:opacity-0 disabled:pointer-events-none active:translate-y-0 active:not-aria-[haspopup]:translate-y-0"
        />
        <CarouselNext
          className="inset-y-auto top-1/2 -mt-4 sm:-mt-4.5 lg:-mt-5 my-0 -right-2.5 sm:-right-3.5 lg:-right-4 h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-[#faf8f2]/95 backdrop-blur-md border border-[#d2c8b5] shadow-md hover:bg-white hover:text-primary hover:border-primary text-neutral-800 transition-all z-20 disabled:opacity-0 disabled:pointer-events-none active:translate-y-0 active:not-aria-[haspopup]:translate-y-0"
        />
      </Carousel>
    </section>
  );
}
