import React from "react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-fun-gray/20 ${className}`}
      aria-hidden
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="max-w-sm mx-auto w-full">
      <Skeleton className="w-full aspect-video mb-4" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default Skeleton;
