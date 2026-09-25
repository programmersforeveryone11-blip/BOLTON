/* ============================================================
   MÓDULO: NOTAS
   - Cada usuario tiene sus propias notas
   - Guardadas en localStorage (NO en Firebase)
   - Modal personalizado para crear
   - Confirmación personalizada para borrar
============================================================ */
(function(){
    'use strict';
  
    /* ============================================================
       1. CLAVE ÚNICA POR USUARIO
       Cada usuario tiene su propia "caja" de notas
    ============================================================ */
    function storageKey(){
      let uid = 'guest';
      try {
        const cached = JSON.parse(localStorage.getItem('bolton_user_profile') || '{}');
        if (cached.uid) uid = cached.uid;
      } catch(e){}
      return 'bolton_notas_' + uid;
    }
  
    function loadNotas(){
      try { return JSON.parse(localStorage.getItem(storageKey()) || '[]'); }
      catch(e){ return []; }
    }
  
    function saveNotas(arr){
      try { localStorage.setItem(storageKey(), JSON.stringify(arr)); } catch(e){}
    }
  
    let notasCache = [];
  
    /* ============================================================
       2. INYECTAR MODALES (solo una vez)
    ============================================================ */
    function inyectarModales(){
      if (document.getElementById('boltonNotaModal')) return;
  
      const html = `
        <!-- MODAL: NUEVA NOTA -->
        <div id="boltonNotaModal" class="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md hidden transition-opacity duration-300">
          <div class="glass-panel w-full max-w-lg rounded-3xl border border-white/30 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-4 sm:p-5 border-b border-white/20 flex items-center justify-between bg-black/20">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-400/30">
                  <i class="fa-regular fa-note-sticky text-sm"></i>
                </div>
                <div>
                  <h2 class="text-base sm:text-lg font-black uppercase tracking-wider text-white">Nueva Nota</h2>
                  <p class="text-[11px] text-white/70">Crea una nota rápida para tus apuntes</p>
                </div>
              </div>
              <button onclick="BOLTON.notas.cerrarModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/80">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
  
            <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Título *</label>
                <input type="text" id="notaTitulo" placeholder="Ej: Resumen Capítulo 3" class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm" autofocus>
              </div>
  
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Categoría</label>
                <input type="text" id="notaCategoria" placeholder="Ej: Biología, Historia..." class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm">
              </div>
  
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Contenido</label>
                <textarea id="notaContenido" rows="5" placeholder="Escribe aquí tu nota..." class="glass-input w-full p-3 rounded-xl text-sm resize-none"></textarea>
              </div>
  
              <div id="notaError" class="hidden text-xs text-rose-300 bg-rose-500/15 border border-rose-400/30 px-3 py-2 rounded-lg">
                El título es obligatorio
              </div>
            </div>
  
            <div class="p-3.5 border-t border-white/15 flex justify-end gap-2 bg-black/20">
              <button onclick="BOLTON.notas.cerrarModal()" class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs">
                Cancelar
              </button>
              <button onclick="BOLTON.notas.guardarNueva()" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-floppy-disk"></i> Guardar
              </button>
            </div>
          </div>
        </div>
  
        <!-- MODAL: CONFIRMAR BORRADO -->
        <div id="boltonEliminarNotaModal" class="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md hidden transition-opacity duration-300">
          <div class="glass-panel w-full max-w-md rounded-3xl border border-rose-500/30 flex flex-col overflow-hidden shadow-2xl">
            <div class="p-5 sm:p-6 text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/40 mx-auto flex items-center justify-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-rose-300"></i>
              </div>
              <div>
                <h2 class="text-lg font-black text-white mb-1">¿Borrar esta nota?</h2>
                <p class="text-sm text-white/70" id="notaBorrarTexto">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div class="p-3.5 border-t border-white/15 flex justify-center gap-2 bg-black/20">
              <button onclick="BOLTON.notas.cerrarEliminarModal()" class="px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs">
                Cancelar
              </button>
              <button onclick="BOLTON.notas.confirmarEliminar()" class="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-trash"></i> Sí, borrar
              </button>
            </div>
          </div>
        </div>
      `;
  
      document.body.insertAdjacentHTML('beforeend', html);
  
      // Enter en título → ir a contenido
      document.getElementById('notaTitulo').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('notaCategoria').focus();
        }
      });
  
      // Ctrl+Enter en contenido → guardar
      document.getElementById('notaContenido').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          BOLTON.notas.guardarNueva();
        }
      });
    }
  
    /* ============================================================
       3. ABRIR / CERRAR MODAL NUEVA NOTA
    ============================================================ */
    function abrirModal(){
      inyectarModales();
      document.getElementById('notaTitulo').value = '';
      document.getElementById('notaCategoria').value = '';
      document.getElementById('notaContenido').value = '';
      document.getElementById('notaError').classList.add('hidden');
      document.getElementById('boltonNotaModal').classList.remove('hidden');
      setTimeout(() => document.getElementById('notaTitulo').focus(), 100);
    }
  
    function cerrarModal(){
      const m = document.getElementById('boltonNotaModal');
      if (m) m.classList.add('hidden');
    }
  
    /* ============================================================
       4. GUARDAR NUEVA NOTA
    ============================================================ */
    function guardarNueva(){
      const titulo = (document.getElementById('notaTitulo').value || '').trim();
      const categoria = (document.getElementById('notaCategoria').value || '').trim() || 'General';
      const contenido = (document.getElementById('notaContenido').value || '').trim();
  
      if (!titulo) {
        const err = document.getElementById('notaError');
        err.classList.remove('hidden');
        document.getElementById('notaTitulo').focus();
        return;
      }
  
      const nueva = {
        id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        titulo,
        categoria,
        contenido,
        creado: new Date().toISOString()
      };
  
      notasCache.unshift(nueva);
      saveNotas(notasCache);
      render();
      cerrarModal();
  
      BOLTON.showToast(`📝 Nota "${titulo}" guardada`);
    }
  
    /* ============================================================
       5. CONFIRMAR BORRADO
    ============================================================ */
    let idPendienteBorrar = null;
  
    function pedirEliminar(id){
      const nota = notasCache.find(n => n.id === id);
      if (!nota) return;
  
      idPendienteBorrar = id;
      inyectarModales();
      document.getElementById('notaBorrarTexto').textContent = `"${nota.titulo}" se eliminará permanentemente.`;
      document.getElementById('boltonEliminarNotaModal').classList.remove('hidden');
    }
  
    function cerrarEliminarModal(){
      idPendienteBorrar = null;
      const m = document.getElementById('boltonEliminarNotaModal');
      if (m) m.classList.add('hidden');
    }
  
    function confirmarEliminar(){
      if (!idPendienteBorrar) return;
      const id = idPendienteBorrar;
      const nota = notasCache.find(n => n.id === id);
      const titulo = nota ? nota.titulo : 'Nota';
  
      notasCache = notasCache.filter(n => n.id !== id);
      saveNotas(notasCache);
      render();
      cerrarEliminarModal();
  
      BOLTON.showToast(`🗑️ "${titulo}" eliminada`, 'error');
    }
  
    /* ============================================================
       6. CARGAR Y PINTAR
    ============================================================ */
    function cargar(){
      const grid = document.getElementById('notesGrid');
      if (!grid) return;
  
      // Simular carga breve para dar feedback
      grid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fa-solid fa-spinner fa-spin text-2xl text-white/40"></i>
          <p class="text-white/60 text-sm mt-3">Cargando tus notas...</p>
        </div>`;
  
      setTimeout(() => {
        notasCache = loadNotas();
        render();
      }, 250);
    }
  
    function render(){
      const grid = document.getElementById('notesGrid');
      if (!grid) return;
  
      if (notasCache.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12">
            <i class="fa-regular fa-note-sticky text-6xl text-white/20 mb-4"></i>
            <p class="text-white/70 text-sm font-semibold mb-1">Aún no tienes notas</p>
            <p class="text-white/40 text-xs mb-4">Crea tu primera nota con el botón "+ Nueva Nota"</p>
          </div>`;
        return;
      }
  
      grid.innerHTML = notasCache.map((n, i) => `
        <div class="glass-panel p-4 rounded-2xl space-y-2 glass-card-hover relative group animate-[fadeIn_0.3s_ease_forwards]"
             style="animation-delay: ${i * 40}ms"
             data-id="${n.id}">
          <div class="flex items-start justify-between gap-2">
            <span class="px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 text-[9px] font-extrabold uppercase tracking-wider">
              ${esc(n.categoria || 'General')}
            </span>
            <button onclick="BOLTON.notas.pedirEliminar('${n.id}')"
                    class="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center"
                    title="Eliminar nota">
              <i class="fa-solid fa-trash text-[10px]"></i>
            </button>
          </div>
          <h3 class="font-bold text-sm text-white break-words">${esc(n.titulo)}</h3>
          ${n.contenido ? `<p class="text-xs text-white/70 break-words whitespace-pre-wrap line-clamp-4">${esc(n.contenido)}</p>` : ''}
          <p class="text-[9px] text-white/40 pt-2 border-t border-white/10">
            ${formatearFecha(n.creado)}
          </p>
        </div>
      `).join('');
    }
  
    function formatearFecha(iso){
      try {
        const d = new Date(iso);
        const ahora = new Date();
        const diff = Math.floor((ahora - d) / 1000);
        if (diff < 60) return 'Hace un momento';
        if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff/3600)} h`;
        if (diff < 604800) return `Hace ${Math.floor(diff/86400)} d`;
        return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch(e) { return ''; }
    }
  
    function esc(s){
      const d = document.createElement('div');
      d.textContent = String(s || '');
      return d.innerHTML;
    }
  
    /* ============================================================
       7. API PÚBLICA
    ============================================================ */
    BOLTON.notas = {
      cargar,
      abrirModal,
      cerrarModal,
      guardarNueva,
      pedirEliminar,
      cerrarEliminarModal,
      confirmarEliminar,
      // Extra: para debugging
      _debug: () => ({ key: storageKey(), count: notasCache.length })
    };
  
    /* ============================================================
       8. REGISTRAR EN EL ROUTER DE VISTAS
    ============================================================ */
    BOLTON.views.notas = cargar;
  
    /* ============================================================
       9. REEMPLAZAR BOTÓN "NUEVA NOTA"
    ============================================================ */
    document.addEventListener('DOMContentLoaded', function(){
      const btnViejo = document.querySelector('#view-notas button');
      if (btnViejo) {
        const btnNuevo = btnViejo.cloneNode(true);
        btnViejo.parentNode.replaceChild(btnNuevo, btnViejo);
        btnNuevo.addEventListener('click', abrirModal);
      }
    });
  
    console.log('📝 notas.js cargado (localStorage por usuario)');
  })();