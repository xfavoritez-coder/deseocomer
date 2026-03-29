"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useGenie } from "@/contexts/GenieContext";
import { useAuth } from "@/contexts/AuthContext";
import { getLocalById, LOCALES, type Local, type Resena } from "@/lib/mockLocales";
import { CONCURSOS } from "@/lib/mockConcursos";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

function formatPrice(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const COLORS = ["#2a7a6f", "#7c3fa8", "#c4853a", "#2d6a8f", "#8f2d5a", "#4a7a2a"];
function getColor(name: string): string {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

const TABS = ["Información", "Menú", "Reseñas", "Fotos", "Concursos"] as const;
type Tab = typeof TABS[number];

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LocalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addInteraccion, perfil } = useGenie();
  const { isAuthenticated } = useAuth();
  const local = getLocalById(Number(id));
  const [tab, setTab] = useState<Tab>("Información");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  // Track visit
  useEffect(() => {
    if (!local) return;
    addInteraccion("local_visitado", { id: String(local.id), nombre: local.nombre, categoria: local.categoria, comuna: local.barrio });
  }, [local?.id]);

  // Check fav
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("deseocomer_favoritos") ?? "[]") as number[];
      setIsFav(favs.includes(Number(id)));
    } catch {}
  }, [id]);

  const toggleFav = () => {
    try {
      const favs = JSON.parse(localStorage.getItem("deseocomer_favoritos") ?? "[]") as number[];
      const newFavs = isFav ? favs.filter(f => f !== Number(id)) : [...favs, Number(id)];
      localStorage.setItem("deseocomer_favoritos", JSON.stringify(newFavs));
      setIsFav(!isFav);
      if (!isFav) addInteraccion("favorito_guardado", { categoria: local?.categoria ?? "", comuna: local?.barrio ?? "" });
    } catch {}
  };

  if (!local) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</p>
          <p style={{ fontFamily: "var(--font-cinzel)", color: "var(--accent)", fontSize: "1.2rem" }}>Local no encontrado</p>
          <Link href="/locales" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--oasis-bright)", textDecoration: "none", marginTop: "16px", display: "inline-block" }}>← Volver a locales</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const todayName = DAY_NAMES[new Date().getDay()];
  const concursosLocal = CONCURSOS.filter(c => c.local === local.nombre);
  const similares = LOCALES.filter(l => l.categoria === local.categoria && l.id !== local.id).slice(0, 3);

  // Genie recommendation text
  const catScore = perfil.gustos.categorias[local.categoria.toLowerCase()] ?? 0;
  const comScore = perfil.gustos.comunas[local.barrio.toLowerCase()] ?? 0;
  const genieText = catScore > 0
    ? `Te recomendamos ${local.nombre} porque te gusta ${local.categoria.toLowerCase()}`
    : comScore > 0
    ? `Está en ${local.barrio}, una de tus zonas preferidas`
    : `Uno de los mejor valorados en ${local.barrio}`;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div style={{ position: "relative", height: "340px", overflow: "hidden" }}>
        <img src={local.imagenPortada} alt={local.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(13,7,3,0.95) 100%)" }} />
        {/* Fav button */}
        <button onClick={toggleFav} style={{
          position: "absolute", top: "80px", right: "20px", zIndex: 10,
          width: "44px", height: "44px", borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
          fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isFav ? "❤️" : "🤍"}
        </button>
        {/* Info overlay */}
        <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px", zIndex: 10, display: "flex", alignItems: "flex-end", gap: "16px" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "50%", flexShrink: 0,
            background: getColor(local.nombre), border: "2px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-cinzel)", fontSize: "1rem", fontWeight: 700, color: "#fff",
          }}>
            {getInitials(local.nombre)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem, 4vw, 1.8rem)", color: "#fff", margin: 0 }}>
                {local.nombre}
              </h1>
              {local.verificado && (
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", background: "var(--accent)", color: "#1a0e05", padding: "2px 8px", borderRadius: "10px", fontWeight: 900 }}>
                  ✓ Verificado
                </span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>
              {local.categoria} · {local.barrio} · {local.precio} · ⭐ {local.rating} ({local.totalResenas})
              {" · "}<span style={{ color: local.isOpen ? "#3db89e" : "#ff6b6b" }}>{local.isOpen ? "Abierto" : "Cerrado"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        position: "sticky", top: "64px", zIndex: 50,
        background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)",
        display: "flex", overflowX: "auto", scrollbarWidth: "none",
        padding: "0 24px",
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase",
            color: tab === t ? "var(--accent)" : "var(--text-muted)",
            background: "none", border: "none", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
            padding: "14px 16px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <div className="dc-ld-layout">
          <div className="dc-ld-main">

            {/* TAB: Información */}
            {tab === "Información" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <Section title="Sobre nosotros"><p style={bodyStyle}>{local.descripcion}</p></Section>
                {local.historia && <Section title="Nuestra historia"><p style={bodyStyle}>{local.historia}</p></Section>}
                <Section title="Horarios">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {local.horarios.map(h => (
                      <div key={h.dia} style={{
                        display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px",
                        background: h.dia === todayName ? "rgba(232,168,76,0.08)" : "transparent",
                        border: h.dia === todayName ? "1px solid rgba(232,168,76,0.2)" : "1px solid transparent",
                      }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-primary)" }}>{h.dia}</span>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: h.cerrado ? "#ff6b6b" : "var(--text-muted)" }}>
                          {h.cerrado ? "Cerrado" : `${h.abre} - ${h.cierra}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="Ubicación">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={bodyStyle}>📍 {local.direccion}</p>
                    <p style={bodyStyle}>📞 {local.telefono}</p>
                    <p style={bodyStyle}>📷 <a href={`https://instagram.com/${local.instagram.replace("@", "")}`} target="_blank" rel="noopener" style={{ color: "var(--oasis-bright)", textDecoration: "none" }}>{local.instagram}</a></p>
                  </div>
                  <div style={{ marginTop: "16px", height: "200px", background: "rgba(45,26,8,0.85)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--text-muted)" }}>🗺️ Mapa próximamente</p>
                  </div>
                </Section>
              </div>
            )}

            {/* TAB: Menú */}
            {tab === "Menú" && (
              local.tieneMenu && local.menu.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  {local.menu.map(cat => (
                    <div key={cat.categoria}>
                      <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                        {cat.categoria}
                      </h3>
                      <div className="dc-ld-menu-grid">
                        {cat.items.map(item => (
                          <div key={item.id} style={{ background: "rgba(45,26,8,0.85)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "4px" }}>
                                  {item.nombre} {item.destacado && <span style={{ fontSize: "0.7rem" }}>⭐</span>}
                                </p>
                                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.descripcion}</p>
                              </div>
                              <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)", flexShrink: 0, marginLeft: "12px" }}>
                                {formatPrice(item.precio)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="🍽️" title="Menú no disponible" text="Este local no ha publicado su menú aún. Visítanos para conocer nuestras opciones del día." />
              )
            )}

            {/* TAB: Reseñas */}
            {tab === "Reseñas" && <ResenasTab local={local} isAuth={isAuthenticated} />}

            {/* TAB: Fotos */}
            {tab === "Fotos" && (
              local.galeria.length > 0 ? (
                <div className="dc-ld-gallery">
                  {local.galeria.map((foto, i) => (
                    <div key={i} onClick={() => setLightbox(foto)} style={{ cursor: "pointer", height: "200px", borderRadius: "12px", overflow: "hidden" }}>
                      <img src={foto} alt={`${local.nombre} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="📷" title="Sin fotos" text="Este local aún no ha subido fotos" />
              )
            )}

            {/* TAB: Concursos */}
            {tab === "Concursos" && (
              concursosLocal.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {concursosLocal.map(c => (
                    <Link key={c.id} href={`/concursos/${c.id}`} style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)",
                      borderRadius: "14px", padding: "16px", textDecoration: "none",
                    }}>
                      <span style={{ fontSize: "2rem" }}>{c.imagen}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)" }}>{c.premio}</p>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--oasis-bright)" }}>{c.participantes} participantes</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon="🏆" title="Sin concursos" text="No hay concursos activos en este momento" />
              )
            )}
          </div>

          {/* Sidebar */}
          <div className="dc-ld-sidebar">
            {/* Genie card */}
            <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "8px" }}>🧞 El Genio recomienda</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{genieText}</p>
            </div>
            {/* Stats */}
            <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <StatRow icon="❤️" text={`${local.totalFavoritos} personas lo tienen como favorito`} />
                <StatRow icon="⭐" text={`${local.rating} rating promedio`} />
                <StatRow icon="💬" text={`${local.totalResenas} reseñas`} />
              </div>
            </div>
          </div>
        </div>

        {/* Similares */}
        {similares.length > 0 && (
          <div style={{ marginTop: "60px" }}>
            <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "20px" }}>
              También te puede gustar
            </h3>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
              {similares.map(s => (
                <Link key={s.id} href={`/locales/${s.id}`} style={{
                  flexShrink: 0, width: "240px", display: "flex", alignItems: "center", gap: "12px",
                  background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)",
                  borderRadius: "14px", padding: "14px", textDecoration: "none",
                }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", flexShrink: 0, background: getColor(s.nombre), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                    {getInitials(s.nombre)}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--accent)" }}>{s.nombre}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{s.barrio} · ⭐ {s.rating}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px" }} />
          <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "2rem", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <Footer />

      <style>{`
        .dc-ld-layout { display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start; }
        .dc-ld-main { min-width: 0; }
        .dc-ld-sidebar { position: sticky; top: 120px; }
        .dc-ld-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .dc-ld-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        @media (max-width: 767px) {
          .dc-ld-layout { grid-template-columns: 1fr; }
          .dc-ld-sidebar { position: static; }
          .dc-ld-menu-grid { grid-template-columns: 1fr; }
          .dc-ld-gallery { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
      `}</style>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = { fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{text}</span>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{icon}</div>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>{title}</p>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto" }}>{text}</p>
    </div>
  );
}

function ResenasTab({ local, isAuth }: { local: Local; isAuth: boolean }) {
  const [resenas, setResenas] = useState<Resena[]>(local.resenas);
  const [writing, setWriting] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const handlePublish = () => {
    if (stars === 0 || comment.length < 20) return;
    const nueva: Resena = { id: Date.now(), usuario: "Tú", avatar: null, rating: stars, fecha: new Date().toISOString().slice(0, 10), comentario: comment, likes: 0 };
    setResenas(prev => [nueva, ...prev]);
    setWriting(false);
    setStars(0);
    setComment("");
  };

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: resenas.filter(r => r.rating === s).length }));
  const maxCount = Math.max(...dist.map(d => d.count), 1);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "3rem", color: "var(--accent)", lineHeight: 1 }}>{local.rating}</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{local.totalResenas} reseñas</p>
        </div>
        <div style={{ flex: 1, minWidth: "150px" }}>
          {dist.map(d => (
            <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)", width: "14px" }}>{d.stars}</span>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.3)" }}>
                <div style={{ height: "100%", borderRadius: "3px", background: "var(--accent)", width: `${(d.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {isAuth && !writing && (
          <button onClick={() => setWriting(true)} style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
            background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700,
            border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer",
          }}>Escribir reseña</button>
        )}
      </div>

      {/* Write form */}
      {writing && (
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px", animation: "genieSlideUp 0.3s ease" }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setStars(s)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: s <= stars ? 1 : 0.3 }}>
                ★
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Escribe tu experiencia (mínimo 20 caracteres)..." rows={3}
            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={handlePublish} disabled={stars === 0 || comment.length < 20} style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", background: stars > 0 && comment.length >= 20 ? "var(--accent)" : "rgba(232,168,76,0.2)",
              color: stars > 0 && comment.length >= 20 ? "var(--bg-primary)" : "var(--text-muted)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: stars > 0 && comment.length >= 20 ? "pointer" : "default", fontWeight: 700,
            }}>Publicar</button>
            <button onClick={() => setWriting(false)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", background: "none", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 16px", color: "var(--text-muted)", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {resenas.map(r => (
          <div key={r.id} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: getColor(r.usuario), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {getInitials(r.usuario)}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-primary)" }}>{r.usuario}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {timeAgo(r.fecha)}
                </p>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "8px" }}>{r.comentario}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "var(--text-muted)" }}>👍 {r.likes}</p>
            {r.respuestaLocal && (
              <div style={{ marginTop: "12px", marginLeft: "20px", padding: "12px 16px", background: "rgba(45,26,8,0.6)", borderRadius: "10px", borderLeft: "2px solid var(--accent)" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "var(--accent)", marginBottom: "4px" }}>💬 Respuesta del local · {r.fechaRespuesta && timeAgo(r.fechaRespuesta)}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{r.respuestaLocal}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`@keyframes genieSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
