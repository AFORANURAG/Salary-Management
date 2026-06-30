import type { HealthResponse } from "@salary-mgmt/types";
import { fetchHealth } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default async function HomePage(): Promise<React.JSX.Element> {
  let health: HealthResponse | null = null;
  let error: string | null = null;

  try {
    health = await fetchHealth();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to reach API";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Salary Management</h1>
        <p className="mt-2 text-slate-600">Scaffold home — API health check below.</p>
      </div>

      <section className="rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-medium">API /health</h2>
        {health ? (
          <pre className="mt-3 overflow-x-auto rounded bg-slate-50 p-4 text-sm">
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-red-600">{error ?? "Unknown error"}</p>
        )}
      </section>

      <Button variant="outline" asChild>
        <a href="/">Refresh</a>
      </Button>
    </main>
  );
}
