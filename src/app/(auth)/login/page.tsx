"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { MOCK_OTP } from "@/lib/mock/auth";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { OtpInput } from "@/components/ui/OtpInput";

export default function LoginPage() {
  const { requestOtp, verifyOtp, mockMode } = useAuth();
  const [email, setEmail] = useState("venue@nyto.app");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [masked, setMasked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(email);
      setMasked(res.maskedEmail);
      setCode("");
      setStep("code");
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Could not send code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email, code);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Invalid code or not a venue account.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(59,130,246,0.35),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(5,150,105,0.12),transparent_45%)]" />
        <div className="relative z-[1]">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[13px] font-bold text-white">
              N
            </span>
            <span className="text-[14px] font-semibold text-white">NYTO Venue</span>
          </div>
        </div>
        <div className="relative z-[1] max-w-lg">
          <h1 className="text-[48px] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
            Run your night from the door to the table.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-sidebar-muted">
            Same bookings guests make in the NYTO app. Same nights Admin sees.
            Your login only opens venues you’re assigned to.
          </p>
          <ul className="mt-8 space-y-3 text-[14px] text-sidebar-text">
            <li className="flex gap-2">
              <span className="text-accent-soft">→</span> Check guests in with app codes
            </li>
            <li className="flex gap-2">
              <span className="text-accent-soft">→</span> Publish partner nights & menus
            </li>
            <li className="flex gap-2">
              <span className="text-accent-soft">→</span> Message NYTO ops when something breaks
            </li>
          </ul>
        </div>
        <p className="relative z-[1] text-[12px] text-sidebar-muted">
          Partner portal · not the Admin console
        </p>
      </div>

      <div className="flex items-center justify-center bg-bg px-6 py-12">
        <div className="v-rise w-full max-w-[400px] rounded-2xl border border-border bg-white p-8 shadow-[var(--shadow-md)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-deep">
            Venue sign-in
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">
            Welcome back
          </h2>
          <p className="mt-2 text-[14px] text-text-muted">
            Use your venue staff email. Each account is scoped to its venues.
          </p>

          {step === "email" ? (
            <form onSubmit={onRequest} className="mt-7 space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <FieldError message={error} />
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Sending…" : "Send code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerify} className="mt-7 space-y-4">
              <p className="text-[13px] text-text-muted">
                Code sent to <span className="font-semibold text-ink">{masked}</span>
              </p>
              <div>
                <Label>6-digit code</Label>
                <OtpInput value={code} onChange={setCode} />
              </div>
              <FieldError message={error} />
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Checking…" : "Enter floor"}
              </Button>
              <button
                type="button"
                className="text-[12px] font-semibold text-text-muted hover:text-accent-deep"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
              >
                Different email
              </button>
            </form>
          )}

          {mockMode ? (
            <p className="mt-6 rounded-xl bg-bg-soft px-3 py-2.5 text-[12px] text-text-muted">
              Demo · code{" "}
              <span className="font-mono font-semibold text-accent-deep">
                {MOCK_OTP}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
