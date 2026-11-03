"use client";

import { useRouter } from "next/navigation";
import { AdminUiProvider } from "@/components/admin/ui";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

interface AdminContextValue {
  email: string;
  cloud: boolean;
  api: <T = unknown>(path: string, init?: { method?: string; body?: unknown; form?: FormData }) => Promise<T>;
}

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];
  constructor(message: string, status: number, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

export function AdminProvider({ email, csrf, cloud, children }: { email: string; csrf: string; cloud: boolean; children: ReactNode }) {
  const router = useRouter();
  const api = useCallback<AdminContextValue["api"]>(
    async (path, init = {}) => {
      const method = init.method ?? "GET";
      const headers: Record<string, string> = { "x-csrf-token": csrf };
      let body: BodyInit | undefined;
      if (init.form) body = init.form;
      else if (init.body !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(init.body);
      }
      const res = await fetch(`/api/admin${path}`, { method, headers, body, credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/admin/login");
        throw new ApiError("Unauthorized", 401);
      }
      if (!res.ok) throw new ApiError(data.error ?? "Request failed", res.status, data.issues);
      return data as never;
    },
    [csrf, router],
  );
  const value = useMemo(() => ({ email, cloud, api }), [email, cloud, api]);
  return (
    <AdminContext.Provider value={value}>
      <AdminUiProvider>{children}</AdminUiProvider>
    </AdminContext.Provider>
  );
}
