import { PlatformShell } from "@/components/layout";
import { CodeOrbitClerkProvider } from "@/components/providers/CodeOrbitClerkProvider";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CodeOrbitClerkProvider>
      <PlatformShell>{children}</PlatformShell>
    </CodeOrbitClerkProvider>
  );
}
