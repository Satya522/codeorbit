import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { cookies } from "next/headers";
import { CookieConsentGate } from "@/components/legal/CookieConsentGate";
import { COOKIE_CONSENT_COOKIE_NAME, isCookieConsentAccepted } from "@/lib/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CodeOrbit - Premium Coding Platform",
  description: "A 2027-level, premium, startup-grade coding education and developer practice platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialCookieConsent = isCookieConsentAccepted(
    cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value,
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased min-h-screen bg-background text-foreground flex flex-col transition-colors duration-[800ms] ease-in-out`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <main className="flex-1 transition-colors duration-[800ms] ease-in-out">
            {children}
          </main>
          <CookieConsentGate initialHasConsent={initialCookieConsent} />
        </ThemeProvider>
      </body>
    </html>
  );
}
