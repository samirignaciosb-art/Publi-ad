// js/data.js — CRUD y queries Supabase UbiPet 2.0
import { supabase } from './supabase.js'
import { state } from './utils.js'

// ── MASCOTAS ──
export async function getMascotas(userId) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, placas!perfiles_placa_id_fkey(codigo)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  state.mascotas = data || []
  return state.mascotas
}

export async function getMascota(id) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*, placas!perfiles_placa_id_fkey(codigo)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function crearMascota(payload) {
  const { data, error } = await supabase
    .from('perfiles')
    .insert(payload)
    .select('*, placas!perfiles_placa_id_fkey(codigo)')
    .single()

  if (error) throw error
  state.mascotas.push(data)
  return data
}

export async function actualizarMascota(id, payload) {
  const { data, error } = await supabase
    .from('perfiles')
    .update(payload)
    .eq('id', id)
    .select('*, placas!perfiles_placa_id_fkey(codigo)')
    .single()

  if (error) throw error
  const idx = state.mascotas.findIndex(m => m.id === id)
  if (idx >= 0) state.mascotas[idx] = data
  return data
}

export async function eliminarMascota(id) {
  const mascota = state.mascotas.find(m => m.id === id)

  // Desactivar placa si estaba vinculada
  if (mascota?.placa_id) {
    await supabase.from('placas')
      .update({ estado: 'disponible', perfil_id: null })
      .eq('id', mascota.placa_id)
  }

  const { error } = await supabase.from('perfiles').delete().eq('id', id)
  if (error) throw error
  state.mascotas = state.mascotas.filter(m => m.id !== id)
}

// ── PLACAS ──
export async function verificarPlaca(codigo) {
  const { data, error } = await supabase
    .from('placas')
    .select('id,estado,perfil_id')
    .eq('codigo', codigo.toUpperCase())
    .maybeSingle()

  if (error) throw error
  return data
}

export async function vincularPlaca(mascotaId, placaId, userId) {
  // Actualizar perfil
  const { error: e1 } = await supabase
    .from('perfiles')
    .update({ placa_id: placaId })
    .eq('id', mascotaId)
    .eq('user_id', userId)

  if (e1) throw e1

  // Activar placa
  const { error: e2 } = await supabase
    .from('placas')
    .update({ estado: 'activa', perfil_id: mascotaId })
    .eq('id', placaId)

  if (e2) throw e2
}

// ── ESCANEOS ──
export async function registrarEscaneo(perfilId, lat, lng, ciudad) {
  await supabase.from('escaneos').insert({
    perfil_id: perfilId,
    lat, lng, ciudad
  })
}

export async function getEscaneos(perfilId) {
  const { data, error } = await supabase
    .from('escaneos')
    .select('*')
    .eq('perfil_id', perfilId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

// ── RESCATE (lectura pública) ──
export async function getPerfilPublico(placaCodigo) {
  const { data: placa, error: e1 } = await supabase
    .from('placas')
    .select('perfil_id')
    .eq('codigo', placaCodigo.toUpperCase())
    .maybeSingle()

  if (e1 || !placa?.perfil_id) throw new Error('Placa no encontrada')

  const { data, error: e2 } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', placa.perfil_id)
    .single()

  if (e2) throw e2
  return data
}

// ── PUSH SUBSCRIPTIONS ──
export async function guardarSubscription(userId, subscription) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, subscription }, { onConflict: 'user_id' })

  if (error) throw error
}

export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.subscription || null
}
