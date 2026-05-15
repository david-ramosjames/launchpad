import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { img: 40, text: "text-sm" },
  md: { img: 56, text: "text-base" },
  lg: { img: 80, text: "text-xl" },
};

export function Logo({ size = "sm", showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={BRAND.logoUrl}
        alt={`${BRAND.firmName} logo`}
        width={s.img}
        height={s.img}
        className="object-contain"
        style={{ height: s.img, width: "auto", maxWidth: s.img * 2.5 }}
        priority
      />
      {showText && (
        <div className="min-w-0">
          <p
            className={cn(
              "font-bold tracking-tight text-navy-800 leading-tight",
              s.text
            )}
          >
            {BRAND.productName}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-pink-500">
            {BRAND.firmName}
          </p>
        </div>
      )}
    </div>
  );
}
