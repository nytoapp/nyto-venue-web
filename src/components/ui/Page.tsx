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
  /** e.g. "of 8 paid seats" — shown under the number */
  meta,
  /** 0–100 fill for the meter bar */
  progress,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "default" | "success" | "warning" | "accent";
  meta?: string;
  progress?: number;
}) {
  const shell =
    tone === "success"
      ? "border-success/20 bg-gradient-to-br from-success/10 via-white to-white"
      : tone === "warning"
        ? "border-warning/25 bg-gradient-to-br from-warning/10 via-white to-white"
        : tone === "accent"
          ? "border-accent/25 bg-gradient-to-br from-accent/10 via-white to-white"
          : "border-border bg-white";
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "accent"
          ? "text-accent-deep"
          : "text-ink";
  const bar =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "accent"
          ? "bg-accent"
          : "bg-ink/30";
  const pct =
    progress == null
      ? null
      : Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-[var(--shadow-sm)] ${shell}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold tracking-[-0.01em] text-text-muted">
          {label}
        </p>
        <span
          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${bar}`}
          aria-hidden
        />
      </div>
      <p
        className={`mt-3 text-[42px] font-semibold leading-none tracking-[-0.05em] ${valueColor}`}
      >
        {value}
      </p>
      {meta ? (
        <p className="mt-1.5 text-[12px] font-medium text-text-faint">{meta}</p>
      ) : null}
      {pct != null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
          <div
            className={`h-full rounded-full transition-[width] ${bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
      <p className="mt-3 text-[12px] leading-snug text-text-muted">{hint}</p>
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
