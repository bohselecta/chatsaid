"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/nav/categories";

type Props = {
  variant?: "chip" | "list";
  className?: string;
  // When false, behaves like in-page filter: prevents navigation and calls onSelect
  navigate?: boolean;
  onSelect?: (key: string) => void;
};

export default function CategoryRail({ variant = "chip", className = "", navigate = true, onSelect }: Props) {
  const pathname = usePathname();
  const isChip = variant === "chip";

  return (
    <ul role="list" className={className}>
      {CATEGORIES.map(({ key, label, href, iconPath }) => {
        const active = pathname?.startsWith(href);
        const base = isChip
          ? "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
          : "flex items-center gap-2 rounded-lg px-3 py-2";
        const tone = active
          ? "bg-white/15 text-white"
          : "bg-white/5 text-white hover:bg-white/10";

        const content = (
          <span className={`${base} ${tone}`} aria-current={active ? "page" : undefined}>
            <img src={iconPath} alt="" aria-hidden className="h-4 w-4" />
            <span>{label}</span>
          </span>
        );

        return (
          <li key={key} className={isChip ? "mr-2 inline-block" : "mb-1"}>
            {navigate ? (
              <Link href={href}>{content}</Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(key)}
                className="appearance-none"
                aria-pressed={active}
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

