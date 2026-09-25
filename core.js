/* ============================================================
   CORE — Utilidades compartidas por todos los módulos
============================================================ */
window.BOLTON = window.BOLTON || {};

// Registro de módulos (cada módulo añade su init aquí)
BOLTON.views = {};

// --- Guardar/Leer cache ---
BOLTON.loadCache = function(){
  try { return JSON.parse(localStorage.getItem('bolton_user_profile') || '{}'); }
  catch(e){ return {}; }
};
BOLTON.saveCache = function(p){
  try { localStorage.setItem('bolton_user_profile', JSON.stringify(p)); } catch(e){}
};

// --- Toast universal ---
BOLTON.showToast = function(msg, tipo){
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  const icon = tipo === 'error' ? 'fa-circle-exclamation text-rose-400' : 'fa-circle-check text-emerald-400';
  t.className = 'glass-panel px-4 py-2.5 rounded-2xl text-xs font-semibold text-white shadow-2xl flex items-center gap-2 border border-white/30 pointer-events-auto';
  t.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
};
window.showToast = BOLTON.showToast; // compatibilidad con el código actual

// --- Helpers varios ---
BOLTON.buildAvatarUrl = function(name){
  const safe = encodeURIComponent(name || 'Usuario');
  return 'https://ui-avatars.com/api/?name=' + safe + '&background=10b981&color=fff&bold=true&size=200';
};

console.log('📦 core.js cargado');