import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 animate-pulse rounded-md bg-muted",
            i === lines - 1 && "w-2/3",
          )}
        />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
