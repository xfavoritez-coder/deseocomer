import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, Lato } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-decorative",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "DeseoComer.com — El genio que cumple tu deseo de comer",
  description: "Gana comida gratis, descubre los mejores locales y promociones de tu ciudad.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${cinzelDecorative.variable} ${cinzel.variable} ${lato.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
