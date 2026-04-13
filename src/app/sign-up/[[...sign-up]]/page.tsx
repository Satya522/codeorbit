import { AuthExperience } from "@/features/auth/AuthExperience";
import { CodeOrbitClerkProvider } from "@/components/providers/CodeOrbitClerkProvider";

export default function SignUpPage() {
  return (
    <CodeOrbitClerkProvider>
      <AuthExperience mode="sign-up" />
    </CodeOrbitClerkProvider>
  );
}
