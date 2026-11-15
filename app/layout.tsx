import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import AuthGate from "@/components/AuthGate";
import { DataProvider } from "@/components/DataProvider";

export const metadata: Metadata = {
  title: "Daybook",
  description: "Track daily trading profit and loss",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <DataProvider>
            <main className="app">{children}</main>
            <TabBar />
          </DataProvider>
        </AuthGate>
      </body>
    </html>
  );
}
