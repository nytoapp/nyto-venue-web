import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_-8px_rgba(37,99,235,0.55)] hover:bg-accent-deep disabled:opacity-45",
  secondary:
    "bg-white text-text border border-border hover:bg-bg-soft hover:border-accent/30 disabled:opacity-45",
  ghost:
    "bg-transparent text-text-muted hover:text-ink hover:bg-bg-hover disabled:opacity-45",
  danger:
    "bg-danger/8 text-danger border border-danger/20 hover:bg-danger/12 disabled:opacity-45",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`v-press inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold tracking-[-0.01em] disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
