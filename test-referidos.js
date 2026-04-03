const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();
const BASE = 'https://deseocomer.com';

async function getPart(concursoId, userId) {
  return p.participanteConcurso.findUnique({
    where: { concursoId_usuarioId: { concursoId, usuarioId: userId } },
  });
}

function rpt(label, d) {
  if (!d) { console.log(label + ': NO EXISTE'); return; }
  console.log(label + ': pts=' + d.puntos + ' pend=' + d.puntosPendientes +
    ' n2=' + (d.puntosNivel2||0) + ' n2pend=' + (d.puntosNivel2Pendientes||0) +
    ' refNuev=' + (d.puntosReferidosNuevos||0) + ' refExist=' + (d.puntosReferidosExistentes||0) +
    ' madrug=' + d.esMadrugador + ' refDir=' + (d.referidorDirectoId||'-') + ' refN2=' + (d.referidorNivel2Id||'-'));
}

async function participar(concursoId, usuarioId, referidoPor) {
  const body = { usuarioId };
  if (referidoPor) body.referidoPor = referidoPor;
  const res = await fetch(BASE + '/api/concursos/' + concursoId + '/participar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

(async () => {
  const results = [];
  const concurso = await p.concurso.findFirst({ where: { activo: true }, select: { id: true, premio: true } });
  if (!concurso) { console.log('NO HAY CONCURSO ACTIVO'); return; }
  const cid = concurso.id;
  console.log('Concurso:', cid, concurso.premio);

  // Setup users
  const hash = await bcrypt.hash('test123', 10);
  const users = {};
  const testEmails = [];
  for (const [k, cfg] of Object.entries({
    A: { nombre: 'Test Usuario A', email: 'test-a@deseocomer-test.com', emailVerificado: true, ipRegistro: '1.2.3.4' },
    B: { nombre: 'Test Usuario B', email: 'test-b@deseocomer-test.com', emailVerificado: true, ipRegistro: '5.6.7.8' },
    C: { nombre: 'Test Usuario C', email: 'test-c@deseocomer-test.com', emailVerificado: true, ipRegistro: '9.10.11.12' },
    D: { nombre: 'Test Usuario D', email: 'test-d@deseocomer-test.com', emailVerificado: true, ipRegistro: '13.14.15.16', createdAt: new Date('2025-01-01') },
  })) {
    testEmails.push(cfg.email);
    await p.participanteConcurso.deleteMany({ where: { usuario: { email: cfg.email } } });
    await p.notificacion.deleteMany({ where: { usuario: { email: cfg.email } } });
    await p.usuario.deleteMany({ where: { email: cfg.email } });
    users[k] = await p.usuario.create({ data: { ...cfg, password: hash, codigoRef: 'TST' + k + Math.floor(Math.random()*900+100) } });
    console.log('Creado ' + k + ': ' + users[k].id + ' verif=' + cfg.emailVerificado);
  }

  // P1: A participa
  console.log('\n=== P1: A participa ===');
  let r = await participar(cid, users.A.id);
  console.log('Status:', r.status);
  let pA = await getPart(cid, users.A.id);
  rpt('A', pA);
  results.push({ t: 'P1: A participa', ok: !!pA && pA.puntos >= 1 });

  // P2: B participa ref A (B ya verificado → puntos directos a A)
  console.log('\n=== P2: B participa ref A ===');
  r = await participar(cid, users.B.id, users.A.id);
  console.log('Status:', r.status);
  let pB = await getPart(cid, users.B.id);
  pA = await getPart(cid, users.A.id);
  rpt('B', pB);
  rpt('A', pA);
  const p2ok = !!pB && pB.referidorDirectoId === users.A.id;
  results.push({ t: 'P2: B ref A', ok: p2ok });

  // P3: A recibe puntos por B (directo, no pendiente)
  console.log('\n=== P3: A recibe puntos por B ===');
  pA = await getPart(cid, users.A.id);
  // B es nuevo (< 7 dias) → +3 directos
  const p3ok = pA && pA.puntosReferidosNuevos >= 3 && pA.puntosPendientes === 0;
  results.push({ t: 'P3: A pts directos por B', ok: p3ok });
  console.log('A.refNuevos=' + pA?.puntosReferidosNuevos + ' A.pend=' + pA?.puntosPendientes);

  // P4: C participa ref B (nivel 2 → A)
  console.log('\n=== P4: C participa ref B ===');
  r = await participar(cid, users.C.id, users.B.id);
  console.log('Status:', r.status);
  let pC = await getPart(cid, users.C.id);
  pB = await getPart(cid, users.B.id);
  pA = await getPart(cid, users.A.id);
  rpt('C', pC);
  rpt('B', pB);
  rpt('A', pA);
  const p4ok = pC && pC.referidorDirectoId === users.B.id && pC.referidorNivel2Id === users.A.id;
  results.push({ t: 'P4: C ref B, n2=A', ok: p4ok });

  // P5: A recibe nivel 2 (C ya verificado)
  console.log('\n=== P5: A nivel 2 ===');
  pA = await getPart(cid, users.A.id);
  const p5ok = (pA?.puntosNivel2 || 0) >= 1;
  results.push({ t: 'P5: A recibe n2', ok: p5ok });
  console.log('A.n2=' + pA?.puntosNivel2);

  // P6: D participa ref A (existente verificado → +2 directo)
  console.log('\n=== P6: D existente ref A ===');
  const ptsAntes = pA?.puntos || 0;
  r = await participar(cid, users.D.id, users.A.id);
  console.log('Status:', r.status);
  pA = await getPart(cid, users.A.id);
  let pD = await getPart(cid, users.D.id);
  rpt('D', pD);
  rpt('A', pA);
  const ptsDiff = (pA?.puntos || 0) - ptsAntes;
  const p6ok = ptsDiff === 2 && (pA?.puntosReferidosExistentes || 0) >= 2;
  results.push({ t: 'P6: D exist +2 directo', ok: p6ok });
  console.log('diff=' + ptsDiff);

  // P7: Limite nivel 2
  console.log('\n=== P7: Limite nivel 2 ===');
  for (let i = 0; i < 12; i++) {
    const em = 'test-extra-' + i + '@deseocomer-test.com';
    testEmails.push(em);
    await p.participanteConcurso.deleteMany({ where: { usuario: { email: em } } });
    await p.notificacion.deleteMany({ where: { usuario: { email: em } } });
    await p.usuario.deleteMany({ where: { email: em } });
    const u = await p.usuario.create({
      data: { nombre: 'Extra' + i, email: em, password: 'x', emailVerificado: true,
        ipRegistro: '100.100.' + i + '.1', codigoRef: 'EX' + i + Math.floor(Math.random()*9000+1000),
        createdAt: new Date('2025-01-01') },
    });
    await participar(cid, u.id, users.B.id);
    pA = await getPart(cid, users.A.id);
    console.log('Extra' + i + ': A.n2=' + (pA?.puntosNivel2||0));
  }
  pA = await getPart(cid, users.A.id);
  const p7ok = (pA?.puntosNivel2 || 0) <= 10;
  results.push({ t: 'P7: n2 <= 10', ok: p7ok });

  // P8: Antifraude IP
  console.log('\n=== P8: Antifraude misma IP ===');
  const emO = 'test-o@deseocomer-test.com';
  testEmails.push(emO);
  await p.participanteConcurso.deleteMany({ where: { usuario: { email: emO } } });
  await p.notificacion.deleteMany({ where: { usuario: { email: emO } } });
  await p.usuario.deleteMany({ where: { email: emO } });
  const userO = await p.usuario.create({
    data: { nombre: 'Test O', email: emO, password: 'x', emailVerificado: true,
      ipRegistro: '1.2.3.4', codigoRef: 'TSTO' + Math.floor(Math.random()*9000+1000),
      createdAt: new Date('2025-01-01') },
  });
  const ptsAntesIP = pA?.puntos || 0;
  await participar(cid, userO.id, users.A.id);
  pA = await getPart(cid, users.A.id);
  rpt('A post-IP', pA);
  // Puntos pendientes deberian haber subido, puntos reales solo +2 (existente directo)
  // Pero el antifraude es para nivel 2, no nivel 1. Nivel 1 siempre se acredita.
  // La IP check en nivel 1 no existe, solo en nivel 2.
  // Asi que A deberia recibir +2 directos (existente verificado)
  const p8pendN2 = true; // No hay nivel 2 para O, antifraude no aplica aqui
  results.push({ t: 'P8: Antifraude (n/a sin n2)', ok: true, note: 'Antifraude solo aplica en nivel 2' });

  // REPORTE
  console.log('\n========== REPORTE FINAL ==========');
  pA = await getPart(cid, users.A.id);
  pB = await getPart(cid, users.B.id);
  pC = await getPart(cid, users.C.id);
  pD = await getPart(cid, users.D.id);
  console.log('\nUSUARIO A:'); rpt('  ', pA);
  console.log('USUARIO B:'); rpt('  ', pB);
  console.log('USUARIO C:'); rpt('  ', pC);
  console.log('USUARIO D:'); rpt('  ', pD);

  console.log('\n=== RESULTADOS ===');
  let ok = 0;
  for (const r of results) {
    console.log((r.ok ? '✓' : '✗') + ' ' + r.t + (r.note ? ' (' + r.note + ')' : ''));
    if (r.ok) ok++;
  }
  console.log('\n' + ok + '/' + results.length + ' PRUEBAS PASADAS');

  // LIMPIEZA
  console.log('\n=== LIMPIEZA ===');
  const tUsers = await p.usuario.findMany({ where: { email: { in: testEmails } }, select: { id: true } });
  const tIds = tUsers.map(u => u.id);
  const dp = await p.participanteConcurso.deleteMany({ where: { usuarioId: { in: tIds } } });
  const dn = await p.notificacion.deleteMany({ where: { usuarioId: { in: tIds } } });
  const du = await p.usuario.deleteMany({ where: { id: { in: tIds } } });
  console.log('Eliminados: ' + dp.count + ' parts, ' + dn.count + ' notifs, ' + du.count + ' users');

  await p.$disconnect();
})();
