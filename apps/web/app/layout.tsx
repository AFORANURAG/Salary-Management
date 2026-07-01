import type { Metadata } from "next";
import "@salary-mgmt/ui/globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Salary Management",
  description: "ACME Employee Salary Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
