// src/shared/components/primary-action.tsx
import { LucideIcon } from "lucide-react";
import { Spinner } from "@/shared/ui/spinner/spinner";
import { cn } from "@/shared/utils/utils";

type Props = {
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  isLoading?: boolean; // Nuevo prop
  onClick: () => void;
};

export function PrimaryAction({ label, icon: Icon, disabled = false, isLoading = false, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold transition",
        disabled ? "cursor-not-allowed bg-foreground/10 text-foreground/35" : "bg-foreground text-background hover:bg-foreground/90",
        isLoading && "opacity-80 cursor-wait"
      )}
    >
      {isLoading ? (
        <Spinner size={16} />
      ) : (
        <>
          {Icon ? <Icon size={16} strokeWidth={2.5} /> : null}
          {label}
        </>
      )}
    </button>
  );
}