"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function ConfirmarContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const token = params.get("token");
  const respuesta = params.get("respuesta");
  const [status, setStatus] = useState<"loading" | "completado" | "en_disputa" | "error">("loading");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!id || !token || !respuesta) {
      setStatus("error");
      setMensaje("Link inválido. Verifica el email que recibiste.");
      return;
    }
    fetch(`/api/concursos/${id}/confirmar-entrega?token=${token}&respuesta=${respuesta}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus(data.estado);
        } else {
          setStatus("error");
          setMensaje(data.error || "Error al procesar la confirmación");
        }
      })
      .catch(() => {
        setStatus("error");
        setMensaje("Error de conexión. Intenta de nuevo.");
      });
  }, [id, token, respuesta]);

  const content = {
    loading: {
      icon: "⏳",
      title: "Procesando...",
      desc: "Estamos verificando tu respuesta",
      color: "#e8a84c",
    },
    completado: {
      icon: "🎉",
      title: "¡Premio confirmado!",
      desc: "Gracias por confirmar que recibiste tu premio. ¡Que lo disfrutes! Aparecerás en nuestra página de ganadores.",
      color: "#3db89e",
    },
    en_disputa: {
      icon: "🔍",
      title: "Investigación abierta",
      desc: "Recibimos tu reporte. Nuestro equipo investigará el caso con el local en las próximas 48 horas. Te mantendremos informado por email.",
      color: "#ff6b6b",
    },
    error: {
      icon: "⚠️",
      title: "Error",
      desc: mensaje,
      color: "#ff6b6b",
    },
  }[status];

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "120px 24px 80px", textAlign: "center" }}>
      <div style={{
        background: "rgba(45,26,8,0.85)",
        border: `1px solid ${content.color}40`,
        borderRadius: "20px",
        padding: "48px 32px",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>{content.icon}</div>
        <h1 style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(1.4rem, 5vw, 1.8rem)",
          color: content.color,
          marginBottom: "16px",
        }}>{content.title}</h1>
        <p style={{
          fontFamily: "var(--font-lato)",
          fontSize: "1rem",
          color: "rgba(240,234,214,0.65)",
          lineHeight: 1.7,
          marginBottom: "32px",
        }}>{content.desc}</p>

        {status === "completado" && (
          <Link href="/concursos/ganadores" style={{
            display: "inline-block",
            background: "#e8a84c",
            color: "#0a0812",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.85rem",
            fontWeight: 700,
            padding: "14px 32px",
            borderRadius: "12px",
            textDecoration: "none",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>Ver ganadores</Link>
        )}

        {(status === "en_disputa" || status === "error") && (
          <Link href="/concursos" style={{
            display: "inline-block",
            border: "1px solid rgba(232,168,76,0.3)",
            color: "#e8a84c",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.85rem",
            padding: "14px 32px",
            borderRadius: "12px",
            textDecoration: "none",
          }}>Volver a concursos</Link>
        )}
      </div>
    </div>
  );
}

export default function ConfirmarPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <Suspense fallback={
        <div style={{ textAlign: "center", padding: "160px 40px" }}>
          <div style={{ fontSize: "3rem" }}>⏳</div>
        </div>
      }>
        <ConfirmarContent />
      </Suspense>
      <Footer />
    </main>
  );
}
