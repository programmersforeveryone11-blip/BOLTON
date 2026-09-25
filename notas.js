/* ============================================================
   MÓDULO: NOTAS v2 — Editor estilo iPhone Notes
   - localStorage por usuario
   - Editor con dibujo, stickers, fondos pastel
============================================================ */
(function(){
    'use strict';
  
    /* ============================================================
       1. STORAGE POR USUARIO
    ============================================================ */
    function storageKey(){
      let uid = 'guest';
      try {
        const c = JSON.parse(localStorage.getItem('bolton_user_profile') || '{}');
        if (c.uid) uid = c.uid;
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
       2. COLORES PASTEL PREDEFINIDOS
    ============================================================ */
    const FONDOS = [
      { nombre: 'Blanco',  color: '#ffffff' },
      { nombre: 'Crema',   color: '#fef9ef' },
      { nombre: 'Rosa',    color: '#fce7f3' },
      { nombre: 'Verde',   color: '#d1fae5' },
      { nombre: 'Amarillo', color: '#fef3c7' },
      { nombre: 'Azul',    color: '#dbeafe' },
      { nombre: 'Lila',    color: '#ede9fe' },
      { nombre: 'Durazno', color: '#ffe4d6' },
      { nombre: 'Menta',   color: '#e0f2f1' },
      { nombre: 'Negro',   color: '#1a1a1a' }
    ];
  
    const EMOJIS = ['😀','😂','🥰','😎','🤔','😴','🤩','😭','🥳','🤗','😇','🤠',
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💫','⭐','✨','🔥','💯',
      '📚','✏️','📝','📖','🎓','💡','🎯','🏆','🎨','🎵','☕','🍕','🌈','🌸',
      '🌺','🍀','🌙','☀️','⚡','💧','🐱','🐶','🦊','🐼','🦄','🐸','🍎','🍓'];
  
    /* ============================================================
       3. INYECTAR MODALES Y ESTILOS
    ============================================================ */
    function inyectarTodo(){
      if (document.getElementById('boltonEditorModal')) return;
  
      // --- ESTILOS ---
      if (!document.getElementById('bolton-notas-styles')) {
        const style = document.createElement('style');
        style.id = 'bolton-notas-styles';
        style.textContent = `
          .bolton-sticker {
            position: absolute;
            cursor: grab;
            user-select: none;
            pointer-events: auto;
            font-size: 40px;
            line-height: 1;
            filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 0 4px #fff);
            transition: filter .15s;
            touch-action: none;
          }
          .bolton-sticker:active { cursor: grabbing; }
          .bolton-sticker.selected {
            filter: drop-shadow(0 0 2px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 0 0 2px #10b981);
          }
          .bolton-sticker-del {
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #ef4444;
            color: #fff;
            border: 2px solid #fff;
            font-size: 11px;
            display: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            font-weight: bold;
            line-height: 1;
          }
          .bolton-sticker.selected .bolton-sticker-del { display: flex; }
          .bolton-editor-input {
            background: transparent;
            border: none;
            outline: none;
            color: inherit;
            font-family: inherit;
            width: 100%;
          }
          .bolton-editor-input::placeholder { color: rgba(0,0,0,0.25); }
          .bolton-dark .bolton-editor-input::placeholder { color: rgba(255,255,255,0.3); }
          .bolton-dark .bolton-editor-input { color: #fff; }
          .bolton-color-swatch {
            width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.5); transition: transform .15s;
          }
          .bolton-color-swatch:hover { transform: scale(1.15); }
          .bolton-color-swatch.active { border: 3px solid #10b981; transform: scale(1.15); }
          .bolton-emoji-btn {
            font-size: 24px; padding: 6px; border-radius: 10px; cursor: pointer;
            background: rgba(255,255,255,0.08); transition: all .15s;
            border: 1px solid transparent;
          }
          .bolton-emoji-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.15); border-color: rgba(255,255,255,0.3); }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
      }
  
      // --- HTML DE MODALES ---
      const html = `
        <!-- MODAL: EDITOR COMPLETO -->
        <div id="boltonEditorModal" class="fixed inset-0 z-[80] hidden bg-black/90 backdrop-blur-md p-2 sm:p-4">
          <div class="w-full h-full max-w-5xl mx-auto flex flex-col gap-2">
  
            <!-- HEADER -->
            <div class="glass-panel rounded-2xl px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <button onclick="BOLTON.notas.cerrarEditor()" class="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white">
                  <i class="fa-solid fa-arrow-left text-sm"></i>
                </button>
                <span class="text-sm font-black uppercase tracking-wider text-white">Nota</span>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="BOLTON.notas.toggleCapaDibujo()" id="btnCapaDibujo" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5" title="Capa dibujo">
                  <i class="fa-solid fa-layer-group text-xs"></i> <span id="capaDibujoLabel">Frente</span>
                </button>
                <button onclick="BOLTON.notas.limpiarDibujo()" class="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5" title="Borrar dibujo">
                  <i class="fa-solid fa-eraser text-xs"></i>
                </button>
                <button onclick="BOLTON.notas.guardarEditor()" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                  <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
              </div>
            </div>
  
            <!-- LIENZO -->
            <div id="editorLienzo" class="flex-1 rounded-2xl relative overflow-hidden shadow-2xl bolton-dark" style="background:#ffffff;">
              <!-- Capa canvas dibujo -->
              <canvas id="editorCanvas" class="absolute inset-0 w-full h-full" style="z-index: 1;"></canvas>
              <!-- Capa texto -->
              <div id="editorTexto" class="absolute inset-0 p-5 sm:p-8 overflow-y-auto" style="z-index: 10;">
                <input type="text" id="editorTitulo" class="bolton-editor-input text-2xl font-black mb-2" placeholder="Título...">
                <input type="text" id="editorCategoria" class="bolton-editor-input text-xs uppercase tracking-wider font-bold mb-4 opacity-60" placeholder="Categoría">
                <textarea id="editorContenido" class="bolton-editor-input text-sm leading-relaxed resize-none" style="min-height:200px;" placeholder="Escribe tu nota..."></textarea>
              </div>
              <!-- Capa stickers -->
              <div id="editorStickersLayer" class="absolute inset-0 pointer-events-none" style="z-index: 20;"></div>
            </div>
  
            <!-- TOOLBAR -->
            <div class="glass-panel rounded-2xl p-2 sm:p-3 space-y-2 max-h-[35vh] overflow-y-auto">
  
              <!-- Pincel -->
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-[10px] font-bold text-white/70 uppercase tracking-wider w-16 flex items-center gap-1"><i class="fa-solid fa-paintbrush"></i> Pincel</span>
                <input type="range" id="pincelSize" min="1" max="40" value="4" class="flex-1 min-w-[100px] accent-emerald-400">
                <span id="pincelSizeLabel" class="text-[11px] font-mono text-white/70 w-8">4</span>
                <input type="color" id="pincelColor" value="#000000" class="w-9 h-9 rounded-lg cursor-pointer border border-white/30 bg-transparent">
              </div>
  
              <!-- Colores pastel -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-bold text-white/70 uppercase tracking-wider w-16 flex items-center gap-1"><i class="fa-solid fa-palette"></i> Fondo</span>
                <div id="fondosGrid" class="flex gap-2 flex-wrap"></div>
                <input type="color" id="fondoCustom" value="#ffffff" class="w-9 h-9 rounded-lg cursor-pointer border border-white/30 bg-transparent" title="Color personalizado">
              </div>
  
              <!-- Stickers -->
              <div class="space-y-1">
                <span class="text-[10px] font-bold text-white/70 uppercase tracking-wider flex items-center gap-1"><i class="fa-solid fa-face-smile"></i> Stickers</span>
                <div class="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto" id="stickersGrid"></div>
              </div>
  
            </div>
  
          </div>
        </div>
  
        <!-- MODAL: NUEVA NOTA -->
        <div id="boltonNotaModal" class="fixed inset-0 z-[70] hidden bg-black/80 backdrop-blur-md p-3 sm:p-5 items-center justify-center">
          <div class="glass-panel w-full max-w-lg rounded-3xl border border-white/30 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-4 sm:p-5 border-b border-white/20 flex items-center justify-between bg-black/20">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-400/30">
                  <i class="fa-regular fa-note-sticky text-sm"></i>
                </div>
                <h2 class="text-base font-black uppercase tracking-wider text-white">Nueva Nota</h2>
              </div>
              <button onclick="BOLTON.notas.cerrarModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/80">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <div class="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Título *</label>
                <input type="text" id="notaTitulo" placeholder="Ej: Resumen Capítulo 3" class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm">
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Categoría</label>
                <input type="text" id="notaCategoria" placeholder="Ej: Biología, Historia..." class="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm">
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-semibold text-white/90">Contenido</label>
                <textarea id="notaContenido" rows="4" placeholder="Escribe aquí..." class="glass-input w-full p-3 rounded-xl text-sm resize-none"></textarea>
              </div>
              <div id="notaError" class="hidden text-xs text-rose-300 bg-rose-500/15 border border-rose-400/30 px-3 py-2 rounded-lg">El título es obligatorio</div>
            </div>
            <div class="p-3.5 border-t border-white/15 flex justify-end gap-2 bg-black/20">
              <button onclick="BOLTON.notas.cerrarModal()" class="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs">Cancelar</button>
              <button onclick="BOLTON.notas.guardarNueva()" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-plus"></i> Crear y editar
              </button>
            </div>
          </div>
        </div>
  
        <!-- MODAL: CONFIRMAR BORRADO -->
        <div id="boltonEliminarNotaModal" class="fixed inset-0 z-[75] hidden bg-black/80 backdrop-blur-md p-3 items-center justify-center">
          <div class="glass-panel w-full max-w-md rounded-3xl border border-rose-500/30 overflow-hidden shadow-2xl">
            <div class="p-6 text-center space-y-4">
              <div class="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/40 mx-auto flex items-center justify-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-rose-300"></i>
              </div>
              <div>
                <h2 class="text-lg font-black text-white mb-1">¿Borrar esta nota?</h2>
                <p class="text-sm text-white/70" id="notaBorrarTexto">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div class="p-3.5 border-t border-white/15 flex justify-center gap-2 bg-black/20">
              <button onclick="BOLTON.notas.cerrarEliminarModal()" class="px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-xs">Cancelar</button>
              <button onclick="BOLTON.notas.confirmarEliminar()" class="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5">
                <i class="fa-solid fa-trash"></i> Sí, borrar
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
  
      // --- INICIALIZAR SWATCHES DE FONDOS ---
      const fondosGrid = document.getElementById('fondosGrid');
      FONDOS.forEach(f => {
        const s = document.createElement('div');
        s.className = 'bolton-color-swatch';
        s.style.background = f.color;
        s.title = f.nombre;
        s.dataset.color = f.color;
        s.onclick = () => aplicarFondo(f.color);
        fondosGrid.appendChild(s);
      });
  
      // --- INICIALIZAR EMOJIS ---
      const emojisGrid = document.getElementById('stickersGrid');
      EMOJIS.forEach(e => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'bolton-emoji-btn';
        b.textContent = e;
        b.onclick = () => agregarSticker(e);
        emojisGrid.appendChild(b);
      });
  
      // --- EVENTOS PINCEL ---
      const pincelSize = document.getElementById('pincelSize');
      const pincelSizeLabel = document.getElementById('pincelSizeLabel');
      pincelSize.addEventListener('input', () => {
        pincelSizeLabel.textContent = pincelSize.value;
        editorState.brushSize = parseInt(pincelSize.value, 10);
      });
  
      document.getElementById('pincelColor').addEventListener('input', (e) => {
        editorState.brushColor = e.target.value;
      });
  
      document.getElementById('fondoCustom').addEventListener('input', (e) => {
        aplicarFondo(e.target.value);
      });
  
      // --- CLICK fuera de editor para deseleccionar sticker ---
      document.getElementById('editorLienzo').addEventListener('click', (ev) => {
        if (ev.target.id === 'editorLienzo' || ev.target.id === 'editorCanvas') {
          deseleccionarSticker();
        }
      });
    }
  
    /* ============================================================
       4. ESTADO DEL EDITOR
    ============================================================ */
    let editorState = {
      notaId: null,
      bgColor: '#ffffff',
      capaDibujo: 'front',   // 'front' | 'behind'
      brushColor: '#000000',
      brushSize: 4,
      strokes: [],           // [{color, size, points:[{x,y}]}]
      isDrawing: false,
      currentStroke: null,
      stickers: [],          // [{id, emoji, x, y, size, layer}]
      activeStickerId: null
    };
  
    /* ============================================================
       5. ABRIR / CERRAR EDITOR
    ============================================================ */
    function abrirEditor(notaId){
      inyectarTodo();
      const nota = notasCache.find(n => n.id === notaId);
      if (!nota) return;
  
      editorState.notaId = notaId;
      editorState.bgColor = nota.bgColor || '#ffffff';
      editorState.capaDibujo = nota.capaDibujo || 'front';
      editorState.strokes = nota.strokes ? JSON.parse(JSON.stringify(nota.strokes)) : [];
      editorState.stickers = nota.stickers ? JSON.parse(JSON.stringify(nota.stickers)) : [];
      editorState.brushColor = '#000000';
      editorState.brushSize = 4;
      editorState.activeStickerId = null;
  
      // Set inputs
      document.getElementById('editorTitulo').value = nota.titulo || '';
      document.getElementById('editorCategoria').value = nota.categoria || '';
      document.getElementById('editorContenido').value = nota.contenido || '';
      document.getElementById('pincelColor').value = '#000000';
      document.getElementById('pincelSize').value = 4;
      document.getElementById('pincelSizeLabel').textContent = '4';
  
      // Mostrar modal
      const m = document.getElementById('boltonEditorModal');
      m.classList.remove('hidden');
      m.style.display = 'flex';
      m.style.alignItems = 'center';
  
      // Aplicar fondo y capa
      aplicarFondo(editorState.bgColor);
      aplicarCapaDibujo(editorState.capaDibujo);
  
      // Configurar canvas
      setTimeout(() => {
        setupCanvas();
        redibujarCanvas();
        renderStickers();
      }, 100);
    }
  
    function cerrarEditor(){
      const m = document.getElementById('boltonEditorModal');
      if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
      deseleccionarSticker();
    }
  
    /* ============================================================
       6. CANVAS — DIBUJO
    ============================================================ */
    function setupCanvas(){
      const canvas = document.getElementById('editorCanvas');
      if (!canvas) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
  
      // Remover listeners previos
      canvas.replaceWith(canvas.cloneNode(true));
      const newCanvas = document.getElementById('editorCanvas');
  
      const getPos = (ev) => {
        const r = newCanvas.getBoundingClientRect();
        let x, y;
        if (ev.touches && ev.touches[0]) {
          x = ev.touches[0].clientX - r.left;
          y = ev.touches[0].clientY - r.top;
        } else {
          x = ev.clientX - r.left;
          y = ev.clientY - r.top;
        }
        return { x, y };
      };
  
      const iniciar = (ev) => {
        ev.preventDefault();
        editorState.isDrawing = true;
        const p = getPos(ev);
        editorState.currentStroke = {
          color: editorState.brushColor,
          size: editorState.brushSize,
          points: [p]
        };
      };
  
      const mover = (ev) => {
        if (!editorState.isDrawing) return;
        ev.preventDefault();
        const p = getPos(ev);
        editorState.currentStroke.points.push(p);
        dibujarSegmento(newCanvas, editorState.currentStroke, true);
      };
  
      const terminar = () => {
        if (!editorState.isDrawing) return;
        editorState.isDrawing = false;
        if (editorState.currentStroke) {
          editorState.strokes.push(editorState.currentStroke);
          editorState.currentStroke = null;
        }
      };
  
      newCanvas.addEventListener('mousedown', iniciar);
      newCanvas.addEventListener('mousemove', mover);
      window.addEventListener('mouseup', terminar);
      newCanvas.addEventListener('touchstart', iniciar, { passive: false });
      newCanvas.addEventListener('touchmove', mover, { passive: false });
      newCanvas.addEventListener('touchend', terminar);
    }
  
    function dibujarSegmento(canvas, stroke, incremental){
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const pts = stroke.points;
      if (pts.length === 1) {
        ctx.arc(pts[0].x, pts[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        return;
      }
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  
    function redibujarCanvas(){
      const canvas = document.getElementById('editorCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      editorState.strokes.forEach(s => {
        const ctx2 = canvas.getContext('2d');
        ctx2.strokeStyle = s.color;
        ctx2.lineWidth = s.size;
        ctx2.lineCap = 'round';
        ctx2.lineJoin = 'round';
        ctx2.beginPath();
        if (s.points.length === 1) {
          ctx2.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2);
          ctx2.fillStyle = s.color;
          ctx2.fill();
          continue;
        }
        ctx2.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) ctx2.lineTo(s.points[i].x, s.points[i].y);
        ctx2.stroke();
      });
    }
  
    function limpiarDibujo(){
      if (!confirm('¿Borrar todo el dibujo de esta nota?')) return;
      editorState.strokes = [];
      redibujarCanvas();
      BOLTON.showToast('Dibujo borrado');
    }
  
    /* ============================================================
       7. CAPA DIBUJO (FRENTE / DETRÁS)
    ============================================================ */
    function aplicarCapaDibujo(capa){
      editorState.capaDibujo = capa;
      const canvas = document.getElementById('editorCanvas');
      const texto = document.getElementById('editorTexto');
      const capaLabel = document.getElementById('capaDibujoLabel');
  
      if (capa === 'front') {
        canvas.style.zIndex = '20';
        texto.style.zIndex = '10';
        if (capaLabel) capaLabel.textContent = 'Frente';
      } else {
        canvas.style.zIndex = '1';
        texto.style.zIndex = '10';
        if (capaLabel) capaLabel.textContent = 'Detrás';
      }
    }
  
    function toggleCapaDibujo(){
      const nueva = editorState.capaDibujo === 'front' ? 'behind' : 'front';
      aplicarCapaDibujo(nueva);
      BOLTON.showToast(`Dibujo: ${nueva === 'front' ? 'delante' : 'detrás'} de las letras`);
    }
  
    /* ============================================================
       8. FONDO
    ============================================================ */
    function aplicarFondo(color){
      editorState.bgColor = color;
      const lienzo = document.getElementById('editorLienzo');
      lienzo.style.background = color;
      document.getElementById('fondoCustom').value = color;
  
      // Dark mode para negro
      const esOscuro = esColorOscuro(color);
      lienzo.classList.toggle('bolton-dark', esOscuro);
  
      // Actualizar swatch activo
      document.querySelectorAll('.bolton-color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === color);
      });
    }
  
    function esColorOscuro(hex){
      try {
        const c = hex.replace('#','');
        const r = parseInt(c.substr(0,2),16);
        const g = parseInt(c.substr(2,2),16);
        const b = parseInt(c.substr(4,2),16);
        const lum = (r*0.299 + g*0.587 + b*0.114);
        return lum < 128;
      } catch(e){ return false; }
    }
  
    /* ============================================================
       9. STICKERS
    ============================================================ */
    function agregarSticker(emoji){
      const id = 'sk_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
      const lienzo = document.getElementById('editorLienzo');
      const r = lienzo.getBoundingClientRect();
      const sticker = {
        id,
        emoji,
        x: r.width / 2 - 20,
        y: r.height / 2 - 20,
        size: 40,
        layer: 'front' // front | behind
      };
      editorState.stickers.push(sticker);
      renderStickers();
      seleccionarSticker(id);
      BOLTON.showToast('Sticker agregado');
    }
  
    function renderStickers(){
      const layer = document.getElementById('editorStickersLayer');
      if (!layer) return;
      layer.innerHTML = '';
  
      editorState.stickers.forEach(sk => {
        const div = document.createElement('div');
        div.className = 'bolton-sticker';
        div.style.left = sk.x + 'px';
        div.style.top = sk.y + 'px';
        div.style.fontSize = sk.size + 'px';
        div.style.zIndex = sk.layer === 'behind' ? '5' : '25';
        div.dataset.id = sk.id;
        div.textContent = sk.emoji;
  
        // Botón eliminar
        const del = document.createElement('button');
        del.className = 'bolton-sticker-del';
        del.innerHTML = '×';
        del.onclick = (ev) => {
          ev.stopPropagation();
          eliminarSticker(sk.id);
        };
        div.appendChild(del);
  
        // Interacciones
        div.addEventListener('mousedown', (ev) => iniciarDragSticker(ev, sk.id, div));
        div.addEventListener('touchstart', (ev) => iniciarDragSticker(ev, sk.id, div), { passive: false });
        div.addEventListener('click', (ev) => {
          ev.stopPropagation();
          seleccionarSticker(sk.id);
        });
  
        layer.appendChild(div);
      });
  
      // Reaplicar selección
      if (editorState.activeStickerId) seleccionarSticker(editorState.activeStickerId);
    }
  
    function seleccionarSticker(id){
      editorState.activeStickerId = id;
      document.querySelectorAll('.bolton-sticker').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
      });
    }
  
    function deseleccionarSticker(){
      editorState.activeStickerId = null;
      document.querySelectorAll('.bolton-sticker').forEach(el => el.classList.remove('selected'));
    }
  
    function eliminarSticker(id){
      editorState.stickers = editorState.stickers.filter(s => s.id !== id);
      renderStickers();
      BOLTON.showToast('Sticker eliminado');
    }
  
    /* ============================================================
       10. DRAG STICKERS
    ============================================================ */
    function iniciarDragSticker(ev, id, el){
      ev.preventDefault();
      ev.stopPropagation();
      seleccionarSticker(id);
  
      const sticker = editorState.stickers.find(s => s.id === id);
      if (!sticker) return;
  
      const getPos = () => {
        if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
        return { x: ev.clientX, y: ev.clientY };
      };
  
      const start = getPos();
      const offsetX = start.x - sticker.x;
      const offsetY = start.y - sticker.y;
  
      const mover = (e) => {
        e.preventDefault();
        const p = e.touches && e.touches[0] ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        sticker.x = p.x - offsetX;
        sticker.y = p.y - offsetY;
        el.style.left = sticker.x + 'px';
        el.style.top = sticker.y + 'px';
      };
  
      const terminar = () => {
        window.removeEventListener('mousemove', mover);
        window.removeEventListener('mouseup', terminar);
        window.removeEventListener('touchmove', mover);
        window.removeEventListener('touchend', terminar);
      };
  
      window.addEventListener('mousemove', mover);
      window.addEventListener('mouseup', terminar);
      window.addEventListener('touchmove', mover, { passive: false });
      window.addEventListener('touchend', terminar);
    }
  
    /* ============================================================
       11. GUARDAR DESDE EDITOR
    ============================================================ */
    function guardarEditor(){
      const nota = notasCache.find(n => n.id === editorState.notaId);
      if (!nota) return;
  
      nota.titulo = (document.getElementById('editorTitulo').value || '').trim() || 'Sin título';
      nota.categoria = (document.getElementById('editorCategoria').value || '').trim() || 'General';
      nota.contenido = (document.getElementById('editorContenido').value || '').trim();
      nota.bgColor = editorState.bgColor;
      nota.capaDibujo = editorState.capaDibujo;
      nota.strokes = JSON.parse(JSON.stringify(editorState.strokes));
      nota.stickers = JSON.parse(JSON.stringify(editorState.stickers));
      nota.actualizado = new Date().toISOString();
  
      saveNotas(notasCache);
      render();
      cerrarEditor();
      BOLTON.showToast('📝 Nota guardada');
    }
  
    /* ============================================================
       12. NUEVA NOTA MODAL
    ============================================================ */
    function abrirModal(){
      inyectarTodo();
      document.getElementById('notaTitulo').value = '';
      document.getElementById('notaCategoria').value = '';
      document.getElementById('notaContenido').value = '';
      document.getElementById('notaError').classList.add('hidden');
      const m = document.getElementById('boltonNotaModal');
      m.classList.remove('hidden');
      m.style.display = 'flex';
      setTimeout(() => document.getElementById('notaTitulo').focus(), 100);
    }
  
    function cerrarModal(){
      const m = document.getElementById('boltonNotaModal');
      if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
    }
  
    function guardarNueva(){
      const titulo = (document.getElementById('notaTitulo').value || '').trim();
      const categoria = (document.getElementById('notaCategoria').value || '').trim() || 'General';
      const contenido = (document.getElementById('notaContenido').value || '').trim();
  
      if (!titulo) {
        document.getElementById('notaError').classList.remove('hidden');
        return;
      }
  
      const nueva = {
        id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        titulo, categoria, contenido,
        bgColor: '#ffffff',
        capaDibujo: 'front',
        strokes: [],
        stickers: [],
        creado: new Date().toISOString()
      };
  
      notasCache.unshift(nueva);
      saveNotas(notasCache);
      render();
      cerrarModal();
      BOLTON.showToast(`📝 "${titulo}" creada`);
  
      // Abrir editor automáticamente
      setTimeout(() => abrirEditor(nueva.id), 300);
    }
  
    /* ============================================================
       13. ELIMINAR
    ============================================================ */
    let idPendienteBorrar = null;
    function pedirEliminar(id){
      const nota = notasCache.find(n => n.id === id);
      if (!nota) return;
      idPendienteBorrar = id;
      inyectarTodo();
      document.getElementById('notaBorrarTexto').textContent = `"${nota.titulo}" se eliminará permanentemente.`;
      const m = document.getElementById('boltonEliminarNotaModal');
      m.classList.remove('hidden');
      m.style.display = 'flex';
    }
    function cerrarEliminarModal(){
      idPendienteBorrar = null;
      const m = document.getElementById('boltonEliminarNotaModal');
      if (m) { m.classList.add('hidden'); m.style.display = 'none'; }
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
       14. CARGAR Y PINTAR
    ============================================================ */
    function cargar(){
      const grid = document.getElementById('notesGrid');
      if (!grid) return;
      grid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fa-solid fa-spinner fa-spin text-2xl text-white/40"></i>
          <p class="text-white/60 text-sm mt-3">Cargando tus notas...</p>
        </div>`;
      setTimeout(() => {
        notasCache = loadNotas();
        render();
      }, 200);
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
  
      grid.innerHTML = notasCache.map((n, i) => {
        const bg = n.bgColor || '#ffffff';
        const esOscuro = esColorOscuro(bg);
        const colorTitulo = esOscuro ? '#fff' : '#1a1a1a';
        const colorTexto = esOscuro ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
        const borde = esOscuro ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)';
  
        return `
        <div class="rounded-2xl space-y-2 relative group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl"
             style="background:${bg}; padding:16px; border:${borde}; animation: fadeIn 0.3s ease forwards; animation-delay: ${i * 40}ms;"
             onclick="BOLTON.notas.abrirEditor('${n.id}')">
          <div class="flex items-start justify-between gap-2">
            <span style="padding:2px 8px; border-radius:6px; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; background:${esOscuro ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}; color:${colorTitulo};">
              ${esc(n.categoria || 'General')}
            </span>
            <button onclick="event.stopPropagation(); BOLTON.notas.pedirEliminar('${n.id}')"
                    class="opacity-0 group-hover:opacity-100 transition-all w-7 h-7 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center"
                    title="Eliminar">
              <i class="fa-solid fa-trash text-[10px]"></i>
            </button>
          </div>
          <h3 style="font-weight:800; font-size:14px; color:${colorTitulo}; word-break:break-word;">${esc(n.titulo)}</h3>
          ${n.contenido ? `<p style="font-size:12px; color:${colorTexto}; word-break:break-word; white-space:pre-wrap; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;">${esc(n.contenido)}</p>` : ''}
          <p style="font-size:9px; color:${colorTexto}; padding-top:8px; border-top:${esOscuro ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.06)'};">
            ${formatearFecha(n.creado)}
          </p>
        </div>`;
      }).join('');
    }
  
    function formatearFecha(iso){
      try {
        const d = new Date(iso);
        const diff = Math.floor((new Date() - d) / 1000);
        if (diff < 60) return 'Hace un momento';
        if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff/3600)} h`;
        if (diff < 604800) return `Hace ${Math.floor(diff/86400)} d`;
        return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
      } catch(e) { return ''; }
    }
  
    function esc(s){
      const d = document.createElement('div');
      d.textContent = String(s || '');
      return d.innerHTML;
    }
  
    /* ============================================================
       15. API PÚBLICA + REGISTRO
    ============================================================ */
    BOLTON.notas = {
      cargar, render,
      abrirModal, cerrarModal, guardarNueva,
      pedirEliminar, cerrarEliminarModal, confirmarEliminar,
      abrirEditor, cerrarEditor, guardarEditor,
      toggleCapaDibujo, limpiarDibujo
    };
  
    BOLTON.views.notas = cargar;
  
    // Reemplazar botón "Nueva Nota" del HTML
    document.addEventListener('DOMContentLoaded', function(){
      const btnViejo = document.querySelector('#view-notas button');
      if (btnViejo) {
        const btnNuevo = btnViejo.cloneNode(true);
        btnViejo.parentNode.replaceChild(btnNuevo, btnViejo);
        btnNuevo.addEventListener('click', abrirModal);
      }
    });
  
    // Resize: redibujar canvas
    window.addEventListener('resize', () => {
      if (!document.getElementById('boltonEditorModal').classList.contains('hidden')) {
        setupCanvas();
        redibujarCanvas();
      }
    });
  
    console.log('📝 notas.js v2 cargado (editor iPhone-style)');
  })();
