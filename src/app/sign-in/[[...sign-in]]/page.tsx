import { AuthExperience } from "@/features/auth/AuthExperience";
import { CodeOrbitClerkProvider } from "@/components/providers/CodeOrbitClerkProvider";

export default function SignInPage() {
  return (
    <CodeOrbitClerkProvider>
      <AuthExperience mode="sign-in" />
    </CodeOrbitClerkProvider>
  );
}
