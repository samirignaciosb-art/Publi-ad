// js/views/admin.js — Vista admin UbiPet 2.0
import { supabase } from '../supabase.js'
import { state, showToast } from '../utils.js'

let cache = {}, todasMascotas = []

export async function renderAdmin(container) {
  if (!state.isAdmin) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">Acceso restringido</div><div class="empty-sub">No tienes permisos para ver esta sección.</div></div>`
    return
  }
  container.innerHTML = `
    <style>
      .admin-nav-tabs{display:flex;gap:4px;background:var(--surface-2);border-radius:var(--r);padding:4px;margin-bottom:20px;overflow-x:auto}
      .admin-tab{padding:8px 14px;border:none;background:transparent;border-radius:calc(var(--r) - 4px);font-family:'Sora',sans-serif;font-size:13px;font-weight:600;color:var(--ink-muted);cursor:pointer;transition:all 0.15s;white-space:nowrap}
      .admin-tab.active{background:var(--surface);color:var(--clay);box-shadow:var(--shadow-xs)}
      .admin-sec{display:none}
      .admin-sec.active{display:block}
      .stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px}
      @media(min-width:480px){.stat-grid{grid-template-columns:repeat(4,1fr)}}
      .stat-card{background:var(--surface);border-radius:var(--r-lg);border:1px solid var(--border);padding:18px;box-shadow:var(--shadow-xs)}
      .stat-icon{font-size:20px;margin-bottom:6px}
      .stat-num{font-family:'Fraunces',serif;font-size:32px;font-weight:700;color:var(--clay);line-height:1}
      .stat-label{font-size:11px;font-weight:600;color:var(--ink-muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.06em}
      .tbl-wrap{overflow-x:auto;border-radius:var(--r-lg);border:1px solid var(--border)}
      .tbl{width:100%;border-collapse:collapse;font-size:14px}
      .tbl th{background:var(--surface-2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-muted);padding:10px 14px;text-align:left;white-space:nowrap}
      .tbl td{padding:12px 14px;border-top:1px solid var(--border);color:var(--ink-soft);vertical-align:middle}
      .tbl tr:hover td{background:var(--clay-bg)}
      .code{font-family:monospace;font-size:14px;font-weight:700;letter-spacing:2px;color:var(--clay)}
      .cliente-row{background:var(--surface);border-radius:var(--r-lg);border:1px solid var(--border);padding:14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;box-shadow:var(--shadow-xs)}
      .usuario-row{display:flex;align-items:center;justify-content:space-between;padding:14px;background:var(--surface);border-radius:var(--r-lg);margin-bottom:8px;border:1px solid var(--border);flex-wrap:wrap;gap:8px}
      .search-bar{width:100%;padding:10px 14px;border:1.5px solid var(--border-strong);border-radius:var(--r);font-family:'Sora',sans-serif;font-size:14px;background:var(--surface-2);color:var(--ink);outline:none;margin-bottom:14px}
      .search-bar:focus{border-color:var(--clay)}
    </style>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h2 style="font-family:'Fraunces',serif;font-size:24px;color:var(--ink)">⚙️ Admin</h2>
      <span id="rolBadge" style="font-size:12px;font-weight:700;color:var(--clay)"></span>
    </div>

    <div class="admin-nav-tabs">
      <button class="admin-tab active" onclick="window._adminIr('stats')">📊 Dashboard</button>
      <button class="admin-tab" onclick="window._adminIr('activas')">✅ Activas</button>
      <button class="admin-tab" onclick="window._adminIr('disponibles')">📦 Disponibles</button>
      <button class="admin-tab" onclick="window._adminIr('mascotas')">🐾 Mascotas</button>
      <button class="admin-tab" onclick="window._adminIr('usuarios')">👥 Admins</button>
      <button class="admin-tab" onclick="window._adminIr('config')">🔗 Config</button>
      <button class="admin-tab" onclick="window._adminIr('generador')">🔑 Generar placas</button>
    </div>

    <!-- STATS -->
    <div id="admin-stats" class="admin-sec active">
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon">📦</div><div class="stat-num" id="statTotal">—</div><div class="stat-label">Placas totales</div></div>
        <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-num" id="statActivas">—</div><div class="stat-label">Activas</div></div>
        <div class="stat-card"><div class="stat-icon">🔓</div><div class="stat-num" id="statDisponibles">—</div><div class="stat-label">Disponibles</div></div>
        <div class="stat-card"><div class="stat-icon">🚨</div><div class="stat-num" id="statPerdidas">—</div><div class="stat-label">Perdidas</div></div>
      </div>
    </div>

    <!-- ACTIVAS -->
    <div id="admin-activas" class="admin-sec">
      <input type="text" class="search-bar" id="buscarActivas" placeholder="🔍 Buscar por código, mascota o dueño...">
      <div id="listaActivas"><div class="spinner"></div></div>
    </div>

    <!-- DISPONIBLES -->
    <div id="admin-disponibles" class="admin-sec">
      <input type="text" class="search-bar" id="buscarDisponibles" placeholder="🔍 Buscar por código...">
      <div id="listaDisponibles"><div class="spinner"></div></div>
    </div>

    <!-- MASCOTAS -->
    <div id="admin-mascotas" class="admin-sec">
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <input type="text" class="search-bar" id="buscarMascotas" placeholder="🔍 Buscar..." style="flex:1;margin:0">
        <select id="filtroEstado" style="padding:10px 12px;border:1.5px solid var(--border-strong);border-radius:var(--r);font-family:'Sora',sans-serif;font-size:14px;background:var(--surface-2);color:var(--ink);outline:none">
          <option value="">Todas</option>
          <option value="perdida">🚨 Perdidas</option>
          <option value="casa">✅ En casa</option>
        </select>
      </div>
      <div style="font-size:13px;color:var(--ink-muted);margin-bottom:10px" id="contadorMascotas"></div>
      <div id="clientesLista"></div>
    </div>

    <!-- USUARIOS -->
    <div id="admin-usuarios" class="admin-sec">
      <div id="alertUsuarios" class="alert" style="margin-bottom:14px"></div>
      <div class="card" style="margin-bottom:14px">
        <div class="sec-title" style="padding:0 0 12px">Agregar administrador</div>
        <div class="field"><label>Email</label><input type="email" id="nuevoEmail" placeholder="admin@ubipet.cl"></div>
        <div class="field"><label>Nombre</label><input type="text" id="nuevoNombre" placeholder="Nombre"></div>
        <div class="field" style="margin-bottom:16px">
          <label>Rol</label>
          <select id="nuevoRol" style="width:100%;padding:12px 14px;border:1.5px solid var(--border-strong);border-radius:var(--r);font-family:'Sora',sans-serif;font-size:14px;background:var(--surface-2);color:var(--ink);outline:none">
            <option value="admin">🔧 Admin</option>
            <option value="superadmin">👑 Super Admin</option>
          </select>
        </div>
        <button class="btn-primary btn-sm" id="btnAgregarUsuario">+ Agregar</button>
      </div>
      <div id="usuariosLista"></div>
    </div>

    <!-- CONFIG -->
    <div id="admin-config" class="admin-sec">
      <div id="alertConfig" class="alert" style="margin-bottom:14px"></div>
      <div class="card">
        <div class="sec-title" style="padding:0 0 16px">🔗 Links de contacto</div>
        <div class="field"><label>Instagram</label><input type="url" id="cfgInstagram" placeholder="https://instagram.com/ubipet"></div>
        <div class="field"><label>Web</label><input type="url" id="cfgWeb" placeholder="https://ubipet.cl"></div>
        <div class="field"><label>WhatsApp</label><input type="tel" id="cfgWhatsapp" placeholder="+56912345678"></div>
        <div class="field"><label>Email</label><input type="email" id="cfgEmail" placeholder="hola@ubipet.cl"></div>
        <div class="field" style="margin-bottom:20px"><label>Teléfono</label><input type="tel" id="cfgTelefono" placeholder="+56912345678"></div>
        <button class="btn-primary btn-sm" id="btnGuardarConfig">💾 Guardar cambios</button>
      </div>
    </div>

    <!-- GENERADOR -->
    <div id="admin-generador" class="admin-sec">
      <div id="alertGen" class="alert" style="margin-bottom:14px"></div>
      <div class="card">
        <div class="sec-title" style="padding:0 0 16px">🔑 Generar placas nuevas</div>
        <div class="field" style="margin-bottom:20px">
          <label>Cantidad de placas</label>
          <input type="number" id="cantidadPlacas" placeholder="10" min="1" max="100" value="10">
        </div>
        <button class="btn-primary btn-sm" id="btnGenerar">⚡ Generar placas</button>
      </div>
      <div id="placasGeneradas" style="margin-top:16px"></div>
    </div>
  `

  cargarStats()
  document.getElementById('btnAgregarUsuario').addEventListener('click', agregarUsuario)
  document.getElementById('btnGuardarConfig').addEventListener('click', guardarConfig)
  document.getElementById('btnGenerar').addEventListener('click', generarPlacas)
}

window._adminIr = function(nombre) {
  document.querySelectorAll('.admin-sec').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'))
  document.getElementById('admin-' + nombre)?.classList.add('active')
  document.querySelectorAll('.admin-tab').forEach(t => {
    if (t.textContent.toLowerCase().includes(nombre === 'stats' ? 'dashboard' : nombre)) t.classList.add('active')
  })
  if (nombre === 'activas')     cargarPlacas('activa')
  if (nombre === 'disponibles') cargarPlacas('disponible')
  if (nombre === 'mascotas')    cargarMascotas()
  if (nombre === 'usuarios' && !cache.usuarios) { cache.usuarios = true; cargarUsuarios() }
  if (nombre === 'config'   && !cache.config)   { cache.config   = true; cargarConfig() }
}

async function cargarStats() {
  const [{ data: placas }, { data: perdidas }] = await Promise.all([
    supabase.from('placas').select('estado'),
    supabase.from('perfiles').select('id').eq('esta_perdida', true)
  ])
  const total = placas?.length || 0
  const activas = placas?.filter(p => p.estado === 'activa').length || 0
  document.getElementById('statTotal').textContent       = total
  document.getElementById('statActivas').textContent     = activas
  document.getElementById('statDisponibles').textContent = total - activas
  document.getElementById('statPerdidas').textContent    = perdidas?.length || 0
}

async function cargarPlacas(estado) {
  const listaId  = estado === 'activa' ? 'listaActivas' : 'listaDisponibles'
  const buscarId = estado === 'activa' ? 'buscarActivas' : 'buscarDisponibles'
  const listaEl  = document.getElementById(listaId); if (!listaEl) return
  listaEl.innerHTML = '<div class="spinner" style="margin:24px auto"></div>'
  const { data, error } = await supabase
    .from('placas')
    .select('id,codigo,estado,perfil_id,perfiles!placas_perfil_id_fkey(nombre_mascota,nombre_dueno)')
    .eq('estado', estado).order('codigo')
  if (error || !data?.length) {
    listaEl.innerHTML = `<p style="color:var(--ink-muted);padding:16px 0">${error ? '❌ ' + error.message : 'Sin placas aún.'}</p>`
    return
  }
  let todas = data
  renderTabla(listaId, todas, estado)
  const buscarEl = document.getElementById(buscarId)
  if (buscarEl) {
    buscarEl.addEventListener('input', e => {
      const q = e.target.value.toLowerCase()
      renderTabla(listaId, todas.filter(p => {
        const pf = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles
        return p.codigo.toLowerCase().includes(q) ||
               (pf?.nombre_mascota||'').toLowerCase().includes(q) ||
               (pf?.nombre_dueno||'').toLowerCase().includes(q)
      }), estado)
    })
  }
}

function renderTabla(listaId, data, estado) {
  const el = document.getElementById(listaId); if (!el) return
  el.innerHTML = `
    <div class="tbl-wrap">
      <table class="tbl"><thead><tr><th>Código</th><th>Mascota</th><th>Dueño</th><th>Acciones</th></tr></thead>
      <tbody>${data.map(p => {
        const pf = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles
        const qr = p.perfil_id ? `${window.location.origin}/rescate.html?id=${p.perfil_id}` : null
        return `<tr>
          <td><span class="code">${p.codigo}</span></td>
          <td>${pf?.nombre_mascota || '—'}</td>
          <td>${pf?.nombre_dueno || '—'}</td>
          <td style="display:flex;gap:6px;flex-wrap:wrap">
            ${qr ? `<button onclick="window.open('${qr}','_blank')" class="chip chip-sage" style="font-size:12px;padding:4px 10px">Ver QR</button>` : ''}
            ${estado === 'activa' ? `<button onclick="window._desasociarPlaca('${p.id}')" class="chip chip-clay" style="font-size:12px;padding:4px 10px">Desasociar</button>` : ''}
          </td>
        </tr>`
      }).join('')}</tbody></table>
    </div>`
}

async function cargarMascotas() {
  const el = document.getElementById('clientesLista'); if (!el) return
  el.innerHTML = '<div class="spinner" style="margin:24px auto"></div>'
  const { data, error } = await supabase
    .from('perfiles').select('*,placas!perfiles_placa_id_fkey(codigo)')
    .order('created_at', { ascending: false })
  if (error || !data) { el.innerHTML = `<p style="color:var(--error)">❌ ${error?.message}</p>`; return }
  todasMascotas = data
  renderMascotas()
  document.getElementById('buscarMascotas')?.addEventListener('input', renderMascotas)
  document.getElementById('filtroEstado')?.addEventListener('change', renderMascotas)
}

function renderMascotas() {
  const q      = (document.getElementById('buscarMascotas')?.value || '').toLowerCase()
  const estado = document.getElementById('filtroEstado')?.value || ''
  let lista = todasMascotas
  if (q) lista = lista.filter(c => (c.nombre_mascota||'').toLowerCase().includes(q) || (c.nombre_dueno||'').toLowerCase().includes(q) || (c.placas?.codigo||'').toLowerCase().includes(q))
  if (estado === 'perdida') lista = lista.filter(c => c.esta_perdida)
  if (estado === 'casa')    lista = lista.filter(c => !c.esta_perdida)
  const cont = document.getElementById('contadorMascotas')
  if (cont) cont.textContent = `${lista.length} mascota${lista.length !== 1 ? 's' : ''}`
  const el = document.getElementById('clientesLista'); if (!el) return
  if (!lista.length) { el.innerHTML = '<p style="color:var(--ink-muted);padding:16px 0">Sin resultados.</p>'; return }
  el.innerHTML = lista.map(c => `
    <div class="cliente-row">
      <div style="display:flex;align-items:center;gap:12px">
        ${c.foto_url
          ? `<img src="${c.foto_url}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--clay-l);flex-shrink:0">`
          : `<div style="width:48px;height:48px;border-radius:50%;background:var(--clay-bg);border:2px solid var(--clay-l);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${c.especie==='gato'?'🐱':'🐶'}</div>`}
        <div>
          <div style="font-weight:700;color:var(--ink);font-size:15px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${c.nombre_mascota||'—'}
            ${c.esta_perdida
              ? '<span style="color:var(--error);font-size:11px;font-weight:700;background:var(--error-bg);padding:2px 8px;border-radius:20px">🚨 PERDIDA</span>'
              : '<span style="color:var(--sage-d);font-size:11px;font-weight:600;background:var(--sage-bg);padding:2px 8px;border-radius:20px">✅ En casa</span>'}
          </div>
          <div style="font-size:13px;color:var(--ink-muted);margin-top:3px">👤 ${c.nombre_dueno||'—'} &nbsp;·&nbsp; 📱 ${c.telefono||'—'}</div>
          <div style="font-size:12px;color:var(--ink-muted);margin-top:2px">
            <span style="font-family:monospace;font-weight:700;color:var(--clay)">${c.placas?.codigo||'Sin placa'}</span>
            &nbsp;·&nbsp; ${c.especie==='gato'?'🐱 Gato':'🐶 Perro'}${c.raza?' · '+c.raza:''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${c.telefono?`<a href="https://wa.me/${c.telefono.replace(/[^0-9]/g,'')}" target="_blank" class="chip chip-sage" style="font-size:12px;padding:5px 10px">WhatsApp</a>`:''}
        ${c.esta_perdida?`<button onclick="window._marcarEncontrada('${c.id}')" class="chip chip-clay" style="font-size:12px;padding:5px 10px">✅ Encontrada</button>`:''}
      </div>
    </div>`).join('')
}

window._marcarEncontrada = async id => {
  await supabase.from('perfiles').update({ esta_perdida: false }).eq('id', id)
  cache.mascotas = false; await cargarMascotas(); await cargarStats()
}

window._desasociarPlaca = async placaId => {
  if (!confirm('¿Desasociar esta placa?')) return
  await supabase.from('placas').update({ estado: 'disponible', perfil_id: null }).eq('id', placaId)
  await supabase.from('perfiles').update({ placa_id: null }).eq('placa_id', placaId)
  cargarPlacas('activa'); cargarStats()
}

async function cargarUsuarios() {
  const { data } = await supabase.from('admins').select('*').order('created_at')
  const el = document.getElementById('usuariosLista'); if (!el || !data?.length) return
  el.innerHTML = data.map(u => `
    <div class="usuario-row">
      <div>
        <span style="font-weight:700;color:var(--ink)">${u.nombre||'—'}</span>
        <span style="color:var(--ink-muted);font-size:13px;margin-left:8px">${u.email}</span>
        <span style="margin-left:8px;font-size:12px;font-weight:700;color:${u.rol==='superadmin'?'var(--clay)':'var(--sage)'}">
          ${u.rol==='superadmin'?'👑 Super Admin':'🔧 Admin'}
        </span>
        ${!u.activo?'<span style="color:var(--error);font-size:12px;margin-left:6px">⛔ Inactivo</span>':''}
      </div>
      <div style="display:flex;gap:6px">
        ${u.activo
          ? `<button onclick="window._toggleUsuario('${u.id}',false)" class="chip chip-err" style="font-size:12px;padding:5px 10px">Desactivar</button>`
          : `<button onclick="window._toggleUsuario('${u.id}',true)" class="chip chip-sage" style="font-size:12px;padding:5px 10px">Activar</button>`}
      </div>
    </div>`).join('')
}

async function agregarUsuario() {
  const email  = document.getElementById('nuevoEmail')?.value.trim()
  const nombre = document.getElementById('nuevoNombre')?.value.trim()
  const rol    = document.getElementById('nuevoRol')?.value
  const alertEl = document.getElementById('alertUsuarios')
  const showA = (msg, type='err') => { alertEl.textContent = msg; alertEl.className = `alert alert-${type} show` }
  if (!email) return showA('❌ Ingresa un email')
  const { error } = await supabase.from('admins').insert({ email, nombre, rol })
  if (error) return showA('❌ ' + (error.message.includes('unique') ? 'Ese email ya existe' : error.message))
  document.getElementById('nuevoEmail').value = ''
  document.getElementById('nuevoNombre').value = ''
  showA(`✅ Usuario agregado como ${rol}`, 'ok')
  cache.usuarios = false; await cargarUsuarios()
}

window._toggleUsuario = async (id, activo) => {
  await supabase.from('admins').update({ activo }).eq('id', id)
  cache.usuarios = false; await cargarUsuarios()
}

async function cargarConfig() {
  const { data } = await supabase.from('configuracion').select('*'); if (!data) return
  data.forEach(r => {
    const el = document.getElementById('cfg' + r.clave.charAt(0).toUpperCase() + r.clave.slice(1))
    if (el) el.value = r.valor
  })
}

async function guardarConfig() {
  const campos = ['instagram','web','whatsapp','email','telefono']
  const btn = document.getElementById('btnGuardarConfig')
  btn.disabled = true; btn.textContent = '⏳ Guardando...'
  const results = await Promise.all(campos.map(clave => {
    const el = document.getElementById('cfg' + clave.charAt(0).toUpperCase() + clave.slice(1))
    return supabase.from('configuracion').upsert({ clave, valor: el?.value.trim() || '' })
  }))
  btn.disabled = false; btn.textContent = '💾 Guardar cambios'
  const alertEl = document.getElementById('alertConfig')
  if (results.find(r => r.error)) { alertEl.textContent = '❌ Error al guardar'; alertEl.className = 'alert alert-err show' }
  else { alertEl.textContent = '✅ Guardado correctamente'; alertEl.className = 'alert alert-ok show' }
}

async function generarPlacas() {
  const cantidad = parseInt(document.getElementById('cantidadPlacas')?.value) || 10
  const btn = document.getElementById('btnGenerar')
  btn.disabled = true; btn.textContent = '⏳ Generando...'
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const genCodigo = () => 'UBI-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const placas = Array.from({ length: cantidad }, () => ({ codigo: genCodigo(), estado: 'disponible' }))
  const { data, error } = await supabase.from('placas').insert(placas).select()
  btn.disabled = false; btn.textContent = '⚡ Generar placas'
  const alertEl = document.getElementById('alertGen')
  if (error) { alertEl.textContent = '❌ ' + error.message; alertEl.className = 'alert alert-err show'; return }
  alertEl.textContent = `✅ ${cantidad} placas generadas`; alertEl.className = 'alert alert-ok show'
  const el = document.getElementById('placasGeneradas')
  el.innerHTML = `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Estado</th></tr></thead><tbody>
    ${(data||placas).map(p => `<tr><td><span class="code">${p.codigo}</span></td><td><span class="badge badge-clay">Disponible</span></td></tr>`).join('')}
  </tbody></table></div>`
}
