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
            dia:{bg:"#1a0e05",bg2:"#080d18",text:"#fff8e0",muted:"rgba(255,245,210,0.7)",accent:"#e8a84c",border:"rgba(232,168,76,0.28)",title:"#f5d080",link:"#3db89e",label:"rgba(255,245,210,0.55)",ctext:"rgba(255,245,210,0.85)"},
            noche:{bg:"#0a0812",bg2:"#080d18",text:"#f0ead6",muted:"rgba(240,234,214,0.65)",accent:"#e8a84c",border:"rgba(232,168,76,0.22)",title:"#f5d080",link:"#3db89e",label:"rgba(240,234,214,0.5)",ctext:"rgba(240,234,214,0.82)"},
            madrugada:{bg:"#07040f",bg2:"#0c0818",text:"#ede0ff",muted:"rgba(237,224,255,0.62)",accent:"#c8a0ff",border:"rgba(200,160,255,0.22)",title:"#e0c8ff",link:"#3db89e",label:"rgba(237,224,255,0.5)",ctext:"rgba(237,224,255,0.8)"}
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
