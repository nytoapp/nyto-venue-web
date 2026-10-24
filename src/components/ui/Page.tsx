export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-bg-hover ${className}`}
      aria-hidden
    />
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-[13px] text-danger"
      role="alert"
    >
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center shadow-[var(--shadow-sm)]">
      <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-text-muted">
        {body}
      </p>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const accentBar =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "accent"
          ? "bg-accent"
          : "bg-border";
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "accent"
          ? "text-accent-deep"
          : "text-ink";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentBar}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
        {label}
      </p>
      <p
        className={`mt-2 text-[36px] font-semibold leading-none tracking-[-0.05em] ${valueColor}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-text-muted">{hint}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-deep">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[34px] font-semibold tracking-[-0.04em] text-ink">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-muted">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
