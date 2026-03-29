import type { Metadata } from "next";
import { Cinzel_Decorative, Cinzel, Lato } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { GenieProvider } from "@/contexts/GenieContext";
import GenieLampara from "@/components/genio/GenieButton";

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          var h=new Date().getHours(),p;
          if(h<7)p="madrugada";else if(h<20)p="dia";else p="noche";
          var T={
            madrugada:{bg:"#07040f",bg2:"#0c0818",text:"#f0d080",muted:"#7a6040",accent:"#c4853a",border:"rgba(196,133,58,0.22)",title:"#c4853a",link:"#3db89e",label:"#5a3c18",ctext:"#c0a060"},
            dia:{bg:"#1e1400",bg2:"#080d18",text:"#fff8e0",muted:"#b09040",accent:"#e8a020",border:"rgba(232,160,32,0.25)",title:"#e8a020",link:"#1aa098",label:"#706018",ctext:"#cca858"},
            noche:{bg:"#060410",bg2:"#08101a",text:"#e0d8f0",muted:"#586090",accent:"#b8860b",border:"rgba(184,134,11,0.22)",title:"#b8860b",link:"#3db89e",label:"#282e48",ctext:"#b0a8c8"}
          };
          var t=T[p],r=document.documentElement,s=r.style;
          s.setProperty("transition","none");
          s.setProperty("--bg-primary",t.bg);s.setProperty("--bg-secondary",t.bg2);
          s.setProperty("--text-primary",t.text);s.setProperty("--text-muted",t.muted);
          s.setProperty("--accent",t.accent);s.setProperty("--border-color",t.border);
          s.setProperty("--theme-bg",t.bg);s.setProperty("--theme-text",t.text);s.setProperty("--theme-accent",t.accent);
          s.setProperty("--color-title",t.title);s.setProperty("--color-link",t.link);
          s.setProperty("--color-label",t.label);s.setProperty("--color-text",t.ctext);
          requestAnimationFrame(function(){requestAnimationFrame(function(){s.removeProperty("transition")})});
        })()` }} />
      </head>
      <body className={`${cinzelDecorative.variable} ${cinzel.variable} ${lato.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <GenieProvider>
              {children}
              <GenieLampara />
            </GenieProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
