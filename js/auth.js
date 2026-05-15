// js/auth.js — Autenticación UbiPet 2.0
import { supabase } from './supabase.js'
import { state, showToast, initTheme } from './utils.js'
import { launchApp } from './app.js'

// ── RENDER AUTH ──
function renderAuth() {
  const el = document.getElementById('auth-content')
  if (!el) return
  el.innerHTML = `
    <div class="auth-tabs">
      <button class="auth-tab active" id="tab-login" onclick="authTab('login')">Entrar</button>
      <button class="auth-tab" id="tab-register" onclick="authTab('register')">Crear cuenta</button>
    </div>

    <!-- LOGIN -->
    <div class="auth-panel active" id="panel-login">
      <div class="field">
        <label>Email</label>
        <input id="login-email" type="email" placeholder="tu@email.com" autocomplete="email">
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password">
      </div>
      <label class="check-row">
        <input id="login-remember" type="checkbox"> Mantener sesión
      </label>
      <button class="btn-primary btn-auth" onclick="doLogin()">Entrar →</button>
      <button class="btn-ghost" onclick="showForgot()">¿Olvidaste tu contraseña?</button>
    </div>

    <!-- REGISTRO -->
    <div class="auth-panel" id="panel-register">
      <div class="field">
        <label>Email</label>
        <input id="reg-email" type="email" placeholder="tu@email.com" autocomplete="email">
      </div>
      <div class="field">
        <label>Contraseña</label>
        <input id="reg-pass" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
      </div>
      <div class="field">
        <label>Código de placa UbiPet</label>
        <input id="reg-placa" type="text" placeholder="Ej: UBI-K7X2M9" style="text-transform:uppercase">
      </div>
      <button class="btn-primary btn-auth" onclick="doRegister()">Crear cuenta →</button>
    </div>
  `
}

// ── TAB SWITCH ──
window.authTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'))
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'))
  document.getElementById('tab-' + tab)?.classList.add('active')
  document.getElementById('panel-' + tab)?.classList.add('active')
}

// ── LOGIN ──
window.doLogin = async function() {
  const email    = document.getElementById('login-email')?.value.trim()
  const pass     = document.getElementById('login-pass')?.value
  const remember = document.getElementById('login-remember')?.checked

  if (!email || !pass) { showToast('Completa todos los campos', 'err'); return }

  setLoadingAuth(true)
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw error

    if (remember) localStorage.setItem('ubipet_persist', '1')
    else          localStorage.removeItem('ubipet_persist')

    await boot(data.user)
  } catch (e) {
    showToast(authError(e.message), 'err')
  } finally {
    setLoadingAuth(false)
  }
}

// ── REGISTRO ──
window.doRegister = async function() {
  const email = document.getElementById('reg-email')?.value.trim()
  const pass  = document.getElementById('reg-pass')?.value
  const placa = document.getElementById('reg-placa')?.value.trim().toUpperCase()

  if (!email || !pass) { showToast('Completa email y contraseña', 'err'); return }
  if (pass.length < 6) { showToast('Contraseña mínimo 6 caracteres', 'err'); return }
  if (!placa)          { showToast('Ingresa el código de tu placa', 'err'); return }

  setLoadingAuth(true)
  try {
    // Verificar que la placa existe y está disponible
    const { data: placaData, error: placaErr } = await supabase
      .from('placas').select('id,estado').eq('codigo', placa).maybeSingle()

    if (placaErr || !placaData) { showToast('Código de placa no válido', 'err'); return }
    if (placaData.estado === 'activa') { showToast('Esa placa ya está en uso', 'err'); return }

    // Crear cuenta
    const { data, error } = await supabase.auth.signUp({ email, password: pass })
    if (error) throw error

    // Guardar placa pendiente para vincular tras confirmar email
    sessionStorage.setItem('placa_pendiente', placa)

    showToast('¡Cuenta creada! Revisa tu email para confirmar.', 'ok', 5000)
  } catch (e) {
    showToast(authError(e.message), 'err')
  } finally {
    setLoadingAuth(false)
  }
}

// ── LOGOUT ──
export async function doLogout() {
  state.user        = null
  state.mascotas    = []
  state.mascotaActual = null
  state.isAdmin     = false
  sessionStorage.clear()
  localStorage.removeItem('ubipet_persist')
  await supabase.auth.signOut()
  document.getElementById('app')?.classList.add('hidden')
  document.getElementById('auth-screen')?.classList.remove('hidden')
  renderAuth()
}

// ── BOOT (tras login exitoso) ──
async function boot(user) {
  // Verificar si es admin
  const { data: adminData } = await supabase
    .from('admins').select('rol,activo').eq('email', user.email).maybeSingle()

  state.isAdmin = !!(adminData?.activo)

  launchApp(user)
}

// ── INIT AUTH ──
export function initAuth() {
  renderAuth()

  // Restaurar sesión si eligió "mantener sesión"
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user && localStorage.getItem('ubipet_persist')) {
      await boot(session.user)
    }
  })
}

// ── FORGOT PASSWORD ──
window.showForgot = function() {
  const email = document.getElementById('login-email')?.value.trim()
  const dest  = email || prompt('Ingresa tu email:')
  if (!dest) return
  supabase.auth.resetPasswordForEmail(dest, {
    redirectTo: 'https://app.ubipet.shop/reset-password.html'
  }).then(() => showToast('Email de recuperación enviado ✓', 'ok', 4000))
    .catch(() => showToast('Error al enviar email', 'err'))
}

// ── HELPERS ──
function setLoadingAuth(v) {
  document.querySelectorAll('.btn-auth').forEach(b => {
    if (!b.dataset.orig) b.dataset.orig = b.textContent
    b.disabled    = v
    b.textContent = v ? 'Cargando...' : b.dataset.orig
  })
}

function authError(msg = '') {
  if (msg.includes('Invalid login'))     return 'Email o contraseña incorrectos'
  if (msg.includes('Email not confirmed')) return 'Confirma tu email antes de entrar'
  if (msg.includes('already registered')) return 'Ese email ya tiene una cuenta'
  if (msg.includes('weak'))              return 'Contraseña muy débil'
  return 'Error de conexión'
}
