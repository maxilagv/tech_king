import React from "react";

/**
 * Shimmer skeleton block. CSS-driven (`.tk-skeleton`), theme-aware, and
 * auto-stilled under `data-performance="reduced"`.
 */
export function Skeleton({ className = "", rounded = "rounded-lg", style }) {
  return <div aria-hidden="true" style={style} className={`tk-skeleton ${rounded} ${className}`} />;
}

/**
 * Loading placeholder that mirrors the real ProductCard layout (same
 * aspect ratio and spacing) so swapping content in causes no layout shift.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col rounded-2xl border tk-theme-border bg-[var(--tk-surface)] p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
    >
      <Skeleton className="aspect-[4/5] w-full" rounded="rounded-xl" />
      <div className="space-y-2 px-1.5 pb-1 pt-3.5">
        <Skeleton className="h-2.5 w-1/3" rounded="rounded" />
        <Skeleton className="h-4 w-4/5" rounded="rounded" />
        <Skeleton className="h-5 w-2/5" rounded="rounded" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-9 w-24" rounded="rounded-xl" />
          <Skeleton className="h-9 flex-1" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * A responsive grid of ProductCardSkeletons matching the catalog grid.
 */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default Skeleton;
