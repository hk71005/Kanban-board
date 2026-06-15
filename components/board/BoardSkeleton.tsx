import { Skeleton } from '@/components/ui/skeleton';

const ColumnSkeleton = () => (
  <div className="flex flex-col w-[350px] h-full rounded-lg bg-surface">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-3 h-3 rounded-full" />
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
      <Skeleton className="w-8 h-8" />
    </div>
    <div className="flex flex-col flex-grow gap-2 p-2">
      <Skeleton className="w-full h-24 rounded-lg" />
      <Skeleton className="w-full h-20 rounded-lg" />
      <Skeleton className="w-full h-28 rounded-lg" />
    </div>
    <div className="p-2">
      <Skeleton className="w-full h-9" />
    </div>
  </div>
);

export default function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="p-4 border-b bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-48 h-8" />
            <div className="flex -space-x-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-48 h-9" />
            <Skeleton className="w-24 h-9" />
            <Skeleton className="w-9 h-9" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Skeleton className="w-96 h-9" />
          <div className="flex items-center w-64 gap-2">
            <Skeleton className="w-full h-2" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      </div>
      {/* Board Content Skeleton */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="inline-flex h-full gap-4">
          <ColumnSkeleton />
          <ColumnSkeleton />
          <ColumnSkeleton />
          <ColumnSkeleton />
        </div>
      </div>
    </div>
  );
}

