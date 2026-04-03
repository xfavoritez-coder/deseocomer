const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
const BASE = 'https://deseocomer.com';

async function getPart(cid, uid) {
  return p.participanteConcurso.findUnique({
    where: { concursoId_usuarioId: { concursoId: cid, usuarioId: uid } },
  });
}

function rpt(label, d) {
  if (!d) return console.log(`  ${label}: NO EXISTE ✗`);
  console.log(`  ${label}: pts=${d.puntos} pend=${d.puntosPendientes} n2=${d.puntosNivel2||0} n2pend=${d.puntosNivel2Pendientes||0} refNuev=${d.puntosReferidosNuevos||0} refExist=${d.puntosReferidosExistentes||0} madrug=${d.esMadrugador} refDir=${d.referidorDirectoId||'-'} refN2=${d.referidorNivel2Id||'-'}`);
}

async function api(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const testEmails = [];
async function createUser(key, cfg) {
  const email = `test-${key.toLowerCase()}@deseocomer-test.com`;
  testEmails.push(email);
  await p.notificacion.deleteMany({ where: { usuario: { email } } }).catch(() => {});
  await p.participanteConcurso.deleteMany({ where: { usuario: { email } } }).catch(() => {});
  await p.usuario.deleteMany({ where: { email } }).catch(() => {});
  const hash = await bcrypt.hash('test123', 10);
  return p.usuario.create({
    data: {
      nombre: `Test ${key}`,
      email,
      password: hash,
      emailVerificado: cfg.verificado ?? false,
      ipRegistro: cfg.ip || '10.0.0.' + Math.floor(Math.random() * 254 + 1),
      codigoRef: 'TST' + key + Math.floor(Math.random() * 9000 + 1000),
      ...(cfg.old ? { createdAt: new Date('2025-01-01') } : {}),
    },
  });
}

async function cleanup() {
  console.log('\n=== LIMPIEZA ===');
  const users = await p.usuario.findMany({ where: { email: { in: testEmails } }, select: { id: true } });
  const ids = users.map(u => u.id);
  if (ids.length === 0) { console.log('  Nada que limpiar'); return; }
  const dp = await p.participanteConcurso.deleteMany({ where: { usuarioId: { in: ids } } });
  const dn = await p.notificacion.deleteMany({ where: { usuarioId: { in: ids } } });
  const du = await p.usuario.deleteMany({ where: { id: { in: ids } } });
  console.log(`  Eliminados: ${dp.count} participaciones, ${dn.count} notificaciones, ${du.count} usuarios`);
}

(async () => {
  const results = [];
  const pass = (name) => { results.push({ t: name, ok: true }); console.log(`  ✓ ${name}`); };
  const fail = (name, detail) => { results.push({ t: name, ok: false, detail }); console.log(`  ✗ ${name} — ${detail}`); };

  try {
    // Setup
    const concurso = await p.concurso.findFirst({ where: { activo: true }, select: { id: true, premio: true } });
    if (!concurso) { console.log('NO HAY CONCURSO ACTIVO'); await p.$disconnect(); return; }
    const cid = concurso.id;
    console.log(`Concurso: ${concurso.premio} (${cid})\n`);

    // Create users - all verified except B
    const A = await createUser('A', { verificado: true, ip: '10.1.1.1' });
    const B = await createUser('B', { verificado: true, ip: '10.2.2.2' });
    const C = await createUser('C', { verificado: true, ip: '10.3.3.3' });
    const D = await createUser('D', { verificado: true, ip: '10.4.4.4', old: true }); // viejo = existente
    console.log(`Usuarios: A=${A.id.slice(-6)} B=${B.id.slice(-6)} C=${C.id.slice(-6)} D=${D.id.slice(-6)}\n`);

    // ═══ P1: A participa solo ═══
    console.log('=== P1: A participa ===');
    let r = await api(`/api/concursos/${cid}/participar`, { usuarioId: A.id });
    console.log(`  API: ${r.status}`);
    let pA = await getPart(cid, A.id);
    rpt('A', pA);
    if (r.status === 201 && pA && pA.puntos >= 1) pass('A participa OK');
    else fail('A participa', `status=${r.status} pts=${pA?.puntos}`);

    // ═══ P2: B participa con ref A (B verificado → puntos directos a A) ═══
    console.log('\n=== P2: B participa ref A (ambos verificados) ===');
    r = await api(`/api/concursos/${cid}/participar`, { usuarioId: B.id, referidoPor: A.id });
    console.log(`  API: ${r.status}`);
    let pB = await getPart(cid, B.id);
    pA = await getPart(cid, A.id);
    rpt('B', pB);
    rpt('A', pA);

    if (pB && pB.referidorDirectoId === A.id) pass('B.refDirecto = A');
    else fail('B.refDirecto = A', `got ${pB?.referidorDirectoId}`);

    // B es nuevo (< 7 días) → A debería recibir +3 DIRECTOS (no pendientes)
    if (pA && pA.puntosReferidosNuevos >= 3 && pA.puntosPendientes === 0) pass('A recibe +3 directos (B nuevo verificado)');
    else fail('A recibe +3 directos', `refNuev=${pA?.puntosReferidosNuevos} pend=${pA?.puntosPendientes}`);

    // ═══ P3: C participa ref B → nivel 2 a A ═══
    console.log('\n=== P3: C participa ref B (nivel 2 → A) ===');
    r = await api(`/api/concursos/${cid}/participar`, { usuarioId: C.id, referidoPor: B.id });
    console.log(`  API: ${r.status}`);
    let pC = await getPart(cid, C.id);
    pB = await getPart(cid, B.id);
    pA = await getPart(cid, A.id);
    rpt('C', pC);
    rpt('B', pB);
    rpt('A', pA);

    if (pC && pC.referidorDirectoId === B.id) pass('C.refDirecto = B');
    else fail('C.refDirecto = B', `got ${pC?.referidorDirectoId}`);

    if (pC && pC.referidorNivel2Id === A.id) pass('C.refNivel2 = A');
    else fail('C.refNivel2 = A', `got ${pC?.referidorNivel2Id}`);

    // B debería recibir +3 por C (nuevo verificado)
    if (pB && pB.puntosReferidosNuevos >= 3) pass('B recibe +3 por C');
    else fail('B recibe +3 por C', `refNuev=${pB?.puntosReferidosNuevos}`);

    // A debería recibir +1 nivel 2 (C verificado, IPs diferentes)
    if (pA && (pA.puntosNivel2 || 0) >= 1) pass('A recibe +1 nivel 2');
    else if (pA && (pA.puntosNivel2Pendientes || 0) >= 1) fail('A nivel 2 quedo pendiente (antifraude?)', `n2pend=${pA.puntosNivel2Pendientes}`);
    else fail('A nivel 2', `n2=${pA?.puntosNivel2} n2pend=${pA?.puntosNivel2Pendientes}`);

    // ═══ P4: D participa ref A (existente verificado → +2) ═══
    console.log('\n=== P4: D participa ref A (existente >7 días) ===');
    const ptsAntes = pA?.puntos || 0;
    r = await api(`/api/concursos/${cid}/participar`, { usuarioId: D.id, referidoPor: A.id });
    console.log(`  API: ${r.status}`);
    let pD = await getPart(cid, D.id);
    pA = await getPart(cid, A.id);
    rpt('D', pD);
    rpt('A', pA);

    const diff = (pA?.puntos || 0) - ptsAntes;
    if (diff === 2 && (pA?.puntosReferidosExistentes || 0) >= 2) pass('A recibe +2 por D existente');
    else fail('A recibe +2 por D existente', `diff=${diff} refExist=${pA?.puntosReferidosExistentes}`);

    // ═══ P5: Antifraude - misma IP ═══
    console.log('\n=== P5: Antifraude misma IP ===');
    const sameIPUser = await createUser('X', { verificado: true, ip: '10.1.1.1', old: true }); // misma IP que A
    const ptsAntesIP = pA?.puntos || 0;
    r = await api(`/api/concursos/${cid}/participar`, { usuarioId: sameIPUser.id, referidoPor: A.id });
    console.log(`  API: ${r.status}`);
    pA = await getPart(cid, A.id);
    rpt('A post-sameIP', pA);
    // Nivel 1 siempre se acredita (antifraude solo nivel 2)
    // X es existente → +2 directos
    const diffIP = (pA?.puntos || 0) - ptsAntesIP;
    if (diffIP === 2) pass('Nivel 1 se acredita incluso con misma IP');
    else fail('Nivel 1 con misma IP', `diff=${diffIP}`);

    // ═══ P6: Límite nivel 2 (max 10) ═══
    console.log('\n=== P6: Límite nivel 2 ===');
    for (let i = 0; i < 12; i++) {
      const u = await createUser(`E${i}`, { verificado: true, ip: `10.100.${i}.1`, old: true });
      await api(`/api/concursos/${cid}/participar`, { usuarioId: u.id, referidoPor: B.id });
    }
    pA = await getPart(cid, A.id);
    console.log(`  A.puntosNivel2 = ${pA?.puntosNivel2 || 0}`);
    if ((pA?.puntosNivel2 || 0) <= 10) pass('Nivel 2 limitado a max 10');
    else fail('Nivel 2 limite', `n2=${pA?.puntosNivel2}`);

    // ═══ P7: Usuario NO verificado no puede participar ═══
    console.log('\n=== P7: Usuario no verificado rechazado ===');
    const unverified = await createUser('UV', { verificado: false, ip: '10.99.99.1' });
    r = await api(`/api/concursos/${cid}/participar`, { usuarioId: unverified.id });
    console.log(`  API: ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
    if (r.status === 403) pass('No verificado rechazado (403)');
    else fail('No verificado debería ser 403', `status=${r.status}`);

    // ═══ REPORTE FINAL ═══
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║         REPORTE FINAL                ║');
    console.log('╚══════════════════════════════════════╝');
    pA = await getPart(cid, A.id);
    pB = await getPart(cid, B.id);
    pC = await getPart(cid, C.id);
    pD = await getPart(cid, D.id);
    console.log('\nEstado final:');
    rpt('A', pA);
    rpt('B', pB);
    rpt('C', pC);
    rpt('D', pD);

    console.log('\n=== RESULTADOS ===');
    let ok = 0;
    for (const r of results) {
      if (r.ok) ok++;
    }
    console.log(`\n${ok}/${results.length} PRUEBAS PASADAS`);
    if (ok < results.length) {
      console.log('\nFALLIDAS:');
      for (const r of results) {
        if (!r.ok) console.log(`  ✗ ${r.t} — ${r.detail}`);
      }
    }

  } catch (err) {
    console.error('ERROR FATAL:', err);
  }

  await cleanup();
  await p.$disconnect();
})();
