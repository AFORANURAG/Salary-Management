"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload, FileText, Download, X } from "lucide-react";
import { Button } from "@salary-mgmt/ui";
import { useEmployeeImport } from "@salary-mgmt/store";
import type { ImportResponse } from "@salary-mgmt/types";

const TWO_MB = 2 * 1024 * 1024;

type Step = "upload" | "results";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BulkImportPage() {
  const router = useRouter();
  const { mutate, isPending } = useEmployeeImport();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResponse | null>(null);

  function selectFile(f: File) {
    setClientError(null);
    if (!f.name.endsWith(".csv") && !f.type.includes("csv")) {
      setClientError("Only .csv files are accepted.");
      return;
    }
    if (f.size > TWO_MB) {
      setClientError("File exceeds 2 MB limit.");
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (picked) selectFile(picked);
  }

  function handleImport() {
    if (!file) return;
    mutate(file, {
      onSuccess: (data) => {
        setResults(data);
        setStep("results");
      },
      onError: (err) => {
        setClientError(err instanceof Error ? err.message : "Import failed.");
      },
    });
  }

  function reset() {
    setFile(null);
    setClientError(null);
    setResults(null);
    setStep("upload");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Import Employees</h1>
        <Button variant="outline" asChild>
          <Link href="/employees">Back to Employees</Link>
        </Button>
      </div>

      {step === "upload" && (
        <div className="space-y-6">
          {/* Drop zone */}
          <div
            data-testid="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drag and drop a CSV file here</p>
              <p className="text-xs text-muted-foreground">or click Browse to choose a file</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              Browse
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              aria-label="Choose CSV file"
              onChange={handleFileInput}
            />
          </div>

          {/* Selected file display */}
          {file && (
            <div
              data-testid="selected-file"
              className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3"
            >
              <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  setClientError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Client-side error */}
          {clientError && (
            <p data-testid="client-error" className="text-sm text-destructive">
              {clientError}
            </p>
          )}

          {/* Template download + action */}
          <div className="flex items-center justify-between">
            <a
              href="/templates/employees-import-template.csv"
              download
              data-testid="download-template"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download template
            </a>

            <Button
              disabled={!file || isPending}
              onClick={handleImport}
              data-testid="preview-import-btn"
            >
              {isPending ? "Importing…" : "Preview & Import"}
            </Button>
          </div>
        </div>
      )}

      {step === "results" && results && (
        <div data-testid="results-step" className="space-y-6">
          <div className="rounded-lg border border-border bg-background p-6 space-y-1">
            <p className="text-lg font-semibold">
              {results.imported} employee{results.imported !== 1 ? "s" : ""} imported successfully.
            </p>
            {results.failed.length > 0 && (
              <p className="text-sm text-destructive">
                {results.failed.length} row{results.failed.length !== 1 ? "s" : ""} failed.
              </p>
            )}
          </div>

          {results.failed.length > 0 && (
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm" data-testid="failure-table">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground w-16">Row</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground w-32">Employee Code</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {results.failed.map((f) => (
                    <tr key={f.row} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{f.row}</td>
                      <td className="px-4 py-2 font-mono text-xs">{f.employeeCode ?? "—"}</td>
                      <td className="px-4 py-2 text-destructive">{f.errors.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} data-testid="import-more-btn">
              Import More
            </Button>
            <Button onClick={() => router.push("/employees")} data-testid="view-employees-btn">
              View Employees
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
