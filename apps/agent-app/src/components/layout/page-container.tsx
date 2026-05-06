import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 max-w-[1600px] mx-auto",
      className
    )}>
      {children}
    </div>
  );
}
