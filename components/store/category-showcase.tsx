import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/core/domain/entities/category";

interface CategoryShowcaseProps {
  categories: Category[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary tracking-wider uppercase mb-1">
            <span>Master Crafts & Weaves</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Shop by Weave
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Explore authentic handlooms, certified mulberry silks, and ceremonial brocades curated by region and tradition.
          </p>
        </div>
        <Link
          href="/collections"
          className="text-xs font-medium text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>View All Weaves</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group relative flex flex-col justify-end overflow-hidden rounded-xl aspect-[3/4] border border-border/60 bg-muted/40 shadow-xs hover:shadow-xl hover:border-primary/40 transition-all duration-300"
          >
            {category.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.imageUrl}
                alt={category.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-muted/80 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-primary/20 bg-background/50 backdrop-blur-xs flex items-center justify-center text-primary/60 font-serif text-xl font-bold">
                  {category.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

            {/* Content overlay */}
            <div className="relative z-10 p-3.5 sm:p-4 text-white flex flex-col justify-end space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-200/90 font-medium">
                Collection
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold leading-tight group-hover:text-amber-100 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-[11px] text-white/75 line-clamp-2 leading-relaxed hidden sm:block">
                  {category.description}
                </p>
              )}
              <div className="pt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-300/95 group-hover:translate-x-0.5 transition-transform">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
