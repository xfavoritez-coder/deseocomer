import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    // Get unique sessions with their latest interaction
    const interactions = await prisma.interaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        action: true,
        sessionId: true,
        userId: true,
        ctxCompany: true,
        ctxHunger: true,
        ctxBudget: true,
        ctxOccasion: true,
        weatherTemp: true,
        weatherCondition: true,
        weatherHumidity: true,
        userLat: true,
        userLng: true,
        hour: true,
        dayOfWeek: true,
        createdAt: true,
        menuItem: { select: { nombre: true, categoria: true, imagenUrl: true, local: { select: { nombre: true } } } },
      },
    });

    // Group by session
    const sessions: Record<string, { sessionId: string; userId: string | null; firstSeen: string; lastSeen: string; actions: typeof interactions; context: any; weather: any; location: any }> = {};

    for (const i of interactions) {
      const sid = i.sessionId;
      if (!sessions[sid]) {
        sessions[sid] = {
          sessionId: sid,
          userId: i.userId,
          firstSeen: i.createdAt.toISOString(),
          lastSeen: i.createdAt.toISOString(),
          actions: [],
          context: null,
          weather: null,
          location: null,
        };
      }
      sessions[sid].actions.push(i);
      if (i.createdAt.toISOString() < sessions[sid].firstSeen) sessions[sid].firstSeen = i.createdAt.toISOString();
      if (i.createdAt.toISOString() > sessions[sid].lastSeen) sessions[sid].lastSeen = i.createdAt.toISOString();

      // Capture context from SELECTED interactions
      if (i.action === "SELECTED" && i.ctxCompany) {
        sessions[sid].context = { ctxCompany: i.ctxCompany, ctxHunger: i.ctxHunger, ctxBudget: i.ctxBudget, ctxOccasion: i.ctxOccasion };
      }
      if (i.weatherTemp != null) {
        sessions[sid].weather = { temp: i.weatherTemp, condition: i.weatherCondition, humidity: i.weatherHumidity };
      }
      if (i.userLat != null) {
        sessions[sid].location = { lat: i.userLat, lng: i.userLng };
      }
    }

    const sessionList = Object.values(sessions).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

    // Stats
    const totalInteractions = await prisma.interaction.count();
    const totalProfiles = await prisma.userTasteProfile.count();
    const totalRatings = await prisma.dishRating.count();
    const actionCounts = await prisma.interaction.groupBy({ by: ["action"], _count: true });

    return NextResponse.json({
      stats: { totalInteractions, totalSessions: sessionList.length, totalProfiles, totalRatings, actionCounts },
      sessions: sessionList,
    });
  } catch (e) {
    console.error("[Admin genie]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
