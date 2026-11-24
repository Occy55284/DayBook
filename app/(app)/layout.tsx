import TabBar from "@/components/TabBar";
import BrandHeader from "@/components/BrandHeader";
import AccountStrip from "@/components/AccountStrip";
import AuthGate from "@/components/AuthGate";
import { DataProvider } from "@/components/DataProvider";
import { PrivacyProvider } from "@/components/Privacy";
import TargetCelebration from "@/components/TargetCelebration";

// Everything inside the app (Calendar, Analytics, Settings) sits behind sign-in.
// The privacy policy and terms are outside this group, so anyone can read them before joining.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DataProvider>
        <PrivacyProvider>
          <main className="app">
            <BrandHeader />
            <AccountStrip />
            {children}
          </main>
          <TabBar />
          <TargetCelebration />
        </PrivacyProvider>
      </DataProvider>
    </AuthGate>
  );
}
