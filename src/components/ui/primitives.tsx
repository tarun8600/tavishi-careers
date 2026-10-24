import type { ButtonHTMLAttributes, ReactNode } from "react";
import { statusMeta } from "@/lib/design/status";

type Variant = "primary" | "secondary" | "ghost" | "danger";
export function Button({ variant = "primary", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`tc-btn tc-btn-${variant} ${className}`} {...rest} />;
}

export function Card({ children, hover = false, className = "" }: { children: ReactNode; hover?: boolean; className?: string }) {
  return <div className={`tc-card ${hover ? "tc-card-hover" : ""} ${className}`}>{children}</div>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="tc-field">
      <span>{label}</span>
      {children}
      {hint && !error && <small className="tc-hint">{hint}</small>}
      {error && <small role="alert" className="tc-error">{error}</small>}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const m = statusMeta(status);
  return <span className={`tc-badge tc-tone-${m.tone}`}>{m.label}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="tc-empty">
      <h3>{title}</h3>
      <p className="tc-hint">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => <div key={i} className="tc-skeleton" style={{ marginBottom: 8, width: `${90 - i * 15}%` }} />)}
    </div>
  );
}
