import TabBar from "@/components/TabBar";
import AuthGate from "@/components/AuthGate";
import { DataProvider } from "@/components/DataProvider";

// Everything inside the app (Calendar, Analytics, Settings) sits behind sign-in.
// The privacy policy and terms are outside this group, so anyone can read them before joining.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DataProvider>
        <main className="app">{children}</main>
        <TabBar />
      </DataProvider>
    </AuthGate>
  );
}
