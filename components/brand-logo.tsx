import { cn } from "@/lib/utils";

type BrandLogoProps = {
  alt?: string;
  className?: string;
};

export function BrandLogo({ alt = "", className }: BrandLogoProps) {
  return (
    <>
      <img src="/brand/spendfence-logo-light.png" alt={alt} className={cn("object-contain dark:hidden", className)} />
      <img src="/brand/spendfence-logo-dark.png" alt={alt} className={cn("hidden object-contain dark:block", className)} />
    </>
  );
}
