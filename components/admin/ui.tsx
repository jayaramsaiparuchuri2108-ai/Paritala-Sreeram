"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, CircleAlert, Info, Loader2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { useLang } from "@/components/shared/Providers";

/* ------------------------------------------------------------------ helpers */

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** Text input styling shared by every admin control. */
export const inputCls =
  "w-full border border-ink/30 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-stone/70 hover:border-ink/60 focus:border-ink focus:ring-4 focus:ring-brand/70 disabled:bg-cream disabled:text-stone";

/* ------------------------------------------------------------------ buttons */

type Variant = "primary" | "yellow" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "border border-ink bg-ink text-brand hover:bg-brand hover:text-ink",
  yellow: "border border-ink bg-brand text-ink hover:bg-ink hover:text-brand",
  secondary: "border border-ink/30 bg-white text-ink hover:border-ink hover:bg-cream",
  ghost: "border border-transparent text-ink hover:bg-ink/5",
  danger: "border border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-5 py-2.5 text-[12px]",
};

export function buttonCls(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.12em] transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", loading, icon, children, className, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonCls(variant, size, className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, className, children, tone = "default", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "grid h-9 w-9 shrink-0 place-items-center border border-transparent transition-colors disabled:pointer-events-none disabled:opacity-35",
        tone === "danger" ? "text-red-700 hover:bg-red-700 hover:text-white" : "hover:bg-brand",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ layout bits */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("border border-ink/15 bg-white", className)}>{children}</section>;
}

export function CardHeader({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/10 px-5 py-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5 text-stone">{eyebrow}</p>}
        <h2 className="font-display text-xl leading-tight">{title}</h2>
      </div>
      {action}
    </header>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-6">
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-3 text-stone">{eyebrow}</p>}
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-sm leading-relaxed text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

type Tone = "neutral" | "yellow" | "black" | "green" | "red";
const tones: Record<Tone, string> = {
  neutral: "border-ink/25 bg-white text-ink",
  yellow: "border-ink bg-brand text-ink",
  black: "border-ink bg-ink text-brand",
  green: "border-green-700/40 bg-green-50 text-green-800",
  red: "border-red-700/40 bg-red-50 text-red-800",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", tones[tone], className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse bg-ink/[0.07]", className)} />;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-ink/30 bg-white px-6 py-14 text-center">
      {icon && <div className="mx-auto mb-4 grid h-12 w-12 place-items-center border border-ink/20 bg-cream">{icon}</div>}
      <p className="font-display text-xl">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Segmented control (e.g. status filter, language mode). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("inline-flex flex-wrap border border-ink/30 bg-white p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cx("px-3 py-1.5 text-[12px] font-bold transition-colors", active ? "bg-ink text-brand" : "text-ink/70 hover:bg-brand/50 hover:text-ink")}
          >
            {o.label}
            {typeof o.count === "number" && <span className={cx("ml-1.5", active ? "text-brand/70" : "text-stone")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ toasts */

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
interface UiContextValue {
  toast: { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void };
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

const UiContext = createContext<UiContextValue | null>(null);

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside <AdminUiProvider>");
  return ctx;
}

const toastIcon = { success: CheckCircle2, error: CircleAlert, info: Info } as const;

export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), kind === "error" ? 8000 : 4200);
  }, []);

  const value = useMemo<UiContextValue>(
    () => ({
      toast: { success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) },
      confirm: (opts) => new Promise<boolean>((resolve) => setDialog({ ...opts, resolve })),
    }),
    [push],
  );

  function settle(result: boolean) {
    dialog?.resolve(result);
    setDialog(null);
  }

  return (
    <UiContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[120] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end" role="region" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = toastIcon[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.25 }}
                className={cx(
                  "on-dark pointer-events-auto flex w-full max-w-sm items-start gap-3 border-l-4 bg-ink px-4 py-3 text-sm text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]",
                  t.kind === "success" && "border-brand",
                  t.kind === "error" && "border-red-500",
                  t.kind === "info" && "border-white/60",
                )}
                role={t.kind === "error" ? "alert" : "status"}
              >
                <Icon className={cx("mt-0.5 h-4 w-4 shrink-0", t.kind === "success" ? "text-brand" : t.kind === "error" ? "text-red-400" : "text-white/70")} aria-hidden />
                <p className="min-w-0 flex-1 break-words leading-snug">{t.message}</p>
                <button type="button" aria-label="Dismiss" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-white/60 hover:text-white">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Modal open={dialog !== null} onClose={() => settle(false)} title={dialog?.title ?? ""} size="sm" footer={<ConfirmFooter dialog={dialog} onSettle={settle} />}>
        {dialog?.message && <p className="text-sm leading-relaxed text-ink/80">{dialog.message}</p>}
      </Modal>
    </UiContext.Provider>
  );
}

function ConfirmFooter({ dialog, onSettle }: { dialog: (ConfirmOptions & { resolve: (v: boolean) => void }) | null; onSettle: (v: boolean) => void }) {
  const { t } = useLang();
  return (
    <>
      <Button variant="secondary" onClick={() => onSettle(false)}>
        {dialog?.cancelLabel ?? t.admin.cancel}
      </Button>
      <Button variant={dialog?.tone === "danger" ? "danger" : "primary"} onClick={() => onSettle(true)} className={dialog?.tone === "danger" ? "bg-red-700 text-white hover:bg-red-800 hover:text-white" : undefined}>
        {dialog?.confirmLabel ?? t.admin.confirm}
      </Button>
    </>
  );
}

/* ------------------------------------------------------------------ modal */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: focus moves in on open, Tab is trapped, Escape closes, the page behind cannot scroll and
 * focus returns to whatever opened it.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  dismissible?: boolean;
}) {
  const { t } = useLang();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel.current)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, dismissible]);

  const width = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" }[size];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-ink/70 backdrop-blur-[2px] sm:items-start sm:p-6 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose()}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cx("flex max-h-[100svh] w-full flex-col bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] outline-none sm:max-h-none", width)}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <header className="on-dark flex items-start justify-between gap-4 border-b-4 border-brand bg-ink px-5 py-4 text-white">
              <div>
                {eyebrow && <p className="eyebrow mb-1.5 text-brand">{eyebrow}</p>}
                <h2 id={titleId} className="font-display text-xl leading-tight md:text-2xl">
                  {title}
                </h2>
              </div>
              {dismissible && (
                <button type="button" onClick={onClose} aria-label={t.nav.close} className="grid h-9 w-9 shrink-0 place-items-center text-white/80 transition-colors hover:bg-brand hover:text-ink">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              )}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/15 bg-cream px-5 py-3">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function WarnNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 border border-ink/20 bg-brand/30 px-3 py-2 text-xs font-semibold leading-relaxed">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
