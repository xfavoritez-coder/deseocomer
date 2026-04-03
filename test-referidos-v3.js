// Test via production API only — no direct Prisma calls
const BASE = 'https://deseocomer.com';
const ADMIN_TOKEN = 'DeseoComer2026Admin';

async function api(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function adminGet(path) {
  const res = await fetch(BASE + path, { headers: { 'x-admin-token': ADMIN_TOKEN } });
  return res.json().catch(() => ({}));
}

async function adminPut(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': ADMIN_TOKEN },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Create user via register API
async function createUser(nombre, email, password) {
  const res = await fetch(BASE + '/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password, telefono: '', ciudad: 'Santiago' }),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, id: data.id, ...data };
}

(async () => {
  const results = [];
  const pass = (name) => { results.push({ ok: true, t: name }); console.log(`  ✓ ${name}`); };
  const fail = (name, d) => { results.push({ ok: false, t: name, d }); console.log(`  ✗ ${name} — ${d}`); };

  console.log('=== SETUP ===');

  // Find active concurso
  const concursosRaw = await fetch(BASE + '/api/concursos').then(r => r.json());
  const concursos = Array.isArray(concursosRaw) ? concursosRaw : [];
  const concurso = concursos.find(c => new Date(c.fechaFin) > new Date());
  if (!concurso) { console.log('No hay concurso activo'); return; }
  console.log(`Concurso: ${concurso.premio} (${concurso.id})`);
  const cid = concurso.id;

  // Create test users via API
  console.log('Creando usuarios de prueba...');
  const uA = await createUser('TestRefA Prueba', 'testref-a@deseocomer-test.com', 'TestPass123');
  const uB = await createUser('TestRefB Prueba', 'testref-b@deseocomer-test.com', 'TestPass123');
  const uC = await createUser('TestRefC Prueba', 'testref-c@deseocomer-test.com', 'TestPass123');
  console.log(`  A: ${uA.status} id=${uA.id?.slice(-6)}`);
  console.log(`  B: ${uB.status} id=${uB.id?.slice(-6)}`);
  console.log(`  C: ${uC.status} id=${uC.id?.slice(-6)}`);

  if (!uA.id || !uB.id || !uC.id) {
    console.log('Error creando usuarios:', JSON.stringify({ uA: uA.data, uB: uB.data, uC: uC.data }));
    return;
  }

  // Activate users via admin
  console.log('Activando cuentas via admin...');
  for (const u of [uA, uB, uC]) {
    await adminPut(`/api/admin/usuarios/${u.id}`, { accion: 'activar' });
  }

  // ═══ P1: A participa ═══
  console.log('\n=== P1: A participa ===');
  let r = await api(`/api/concursos/${cid}/participar`, { usuarioId: uA.id });
  console.log(`  Status: ${r.status}`);
  if (r.status === 201) pass('A participa');
  else fail('A participa', `status=${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);

  // ═══ P2: B participa con ref A ═══
  console.log('\n=== P2: B participa ref A ===');
  r = await api(`/api/concursos/${cid}/participar`, { usuarioId: uB.id, referidoPor: uA.id });
  console.log(`  Status: ${r.status}`);
  if (r.status === 201) pass('B participa ref A');
  else fail('B participa ref A', `status=${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);

  // Check A's referral data via admin
  const aNet = await adminGet(`/api/admin/usuarios/${uA.id}`);
  const aConc = Array.isArray(aNet) ? aNet.find(x => x.concursoId === cid) : null;
  console.log(`  A red: pts=${aConc?.puntos} refNuev=${aConc?.puntosReferidosNuevos || 0} refExist=${aConc?.puntosReferidosExistentes || 0} directos=${aConc?.referidosDirectos?.length}`);

  // B es nuevo y verificado → A debería recibir +3 directos
  if (aConc && aConc.puntos > 1) pass('A recibe puntos por B');
  else fail('A recibe puntos por B', `pts=${aConc?.puntos}`);

  // ═══ P3: C participa ref B (nivel 2 → A) ═══
  console.log('\n=== P3: C participa ref B (nivel 2) ===');
  r = await api(`/api/concursos/${cid}/participar`, { usuarioId: uC.id, referidoPor: uB.id });
  console.log(`  Status: ${r.status}`);
  if (r.status === 201) pass('C participa ref B');
  else fail('C participa ref B', `status=${r.status}`);

  // Re-check A
  const aNet2 = await adminGet(`/api/admin/usuarios/${uA.id}`);
  const aConc2 = Array.isArray(aNet2) ? aNet2.find(x => x.concursoId === cid) : null;
  console.log(`  A red: pts=${aConc2?.puntos} n2=${aConc2?.puntosNivel2 || 0} n2pend=${aConc2?.puntosNivel2Pendientes || 0} directos=${aConc2?.referidosDirectos?.length} nivel2=${aConc2?.referidosNivel2?.length}`);

  if (aConc2 && ((aConc2.puntosNivel2 || 0) >= 1 || (aConc2.puntosNivel2Pendientes || 0) >= 1)) pass('A recibe nivel 2 por C');
  else fail('A recibe nivel 2', `n2=${aConc2?.puntosNivel2} n2pend=${aConc2?.puntosNivel2Pendientes}`);

  // Check B
  const bNet = await adminGet(`/api/admin/usuarios/${uB.id}`);
  const bConc = Array.isArray(bNet) ? bNet.find(x => x.concursoId === cid) : null;
  console.log(`  B red: pts=${bConc?.puntos} refNuev=${bConc?.puntosReferidosNuevos || 0}`);

  if (bConc && bConc.puntos > 1) pass('B recibe puntos por C');
  else fail('B recibe puntos por C', `pts=${bConc?.puntos}`);

  // ═══ P4: No verificado rechazado ═══
  console.log('\n=== P4: No verificado rechazado ===');
  const uNV = await createUser('TestNV Prueba', 'testnv@deseocomer-test.com', 'TestPass123');
  // NOT activating
  r = await api(`/api/concursos/${cid}/participar`, { usuarioId: uNV.id });
  console.log(`  Status: ${r.status}`);
  if (r.status === 403) pass('No verificado rechazado');
  else fail('No verificado rechazado', `status=${r.status}`);

  // ═══ P5: Ya participando rechazado ═══
  console.log('\n=== P5: Doble participación rechazada ===');
  r = await api(`/api/concursos/${cid}/participar`, { usuarioId: uA.id });
  console.log(`  Status: ${r.status}`);
  if (r.status === 400) pass('Doble participación rechazada');
  else fail('Doble participación', `status=${r.status}`);

  // ═══ REPORTE ═══
  console.log('\n╔══════════════════════════════════╗');
  console.log('║       REPORTE FINAL              ║');
  console.log('╚══════════════════════════════════╝');
  let ok = 0;
  for (const r of results) { if (r.ok) ok++; }
  console.log(`\n${ok}/${results.length} PRUEBAS PASADAS`);
  if (ok < results.length) {
    console.log('\nFALLIDAS:');
    for (const r of results) { if (!r.ok) console.log(`  ✗ ${r.t} — ${r.d}`); }
  }

  // ═══ LIMPIEZA ═══
  console.log('\n=== LIMPIEZA ===');
  const testIds = [uA.id, uB.id, uC.id, uNV.id].filter(Boolean);
  for (const id of testIds) {
    // Descalificar para borrar participaciones
    await adminPut(`/api/admin/usuarios/${id}`, { accion: 'descalificar' }).catch(() => {});
    // Eliminar usuario
    await fetch(BASE + `/api/admin/usuarios/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': ADMIN_TOKEN },
    }).catch(() => {});
  }
  console.log(`Eliminados: ${testIds.length} usuarios de prueba`);
})();
