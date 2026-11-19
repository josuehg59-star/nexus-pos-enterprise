const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'Auditoria.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Normalizar saltos de línea a LF para edición
code = code.replace(/\r\n/g, '\n');

// 1. Agregar Save en lucide-react si no está
if (!code.includes('Save,')) {
  code = code.replace("import { Play,", "import { Play, Save, RotateCcw,");
}

// 2. Modificar inicialización de estados para cargar de localStorage
const oldStateBlock = `  const [filterText, setFilterText] = useState('');
  const [modalidad, setModalidad] = useState('POR PROVEEDOR');
  const [proveedor, setProveedor] = useState('');
  const [isLibre, setIsLibre] = useState(false);
  const [isAuditing, setIsAuditing] = useState(true);
  const [conteos, setConteos] = useState<Record<number, number>>({});
  const [scanOrder, setScanOrder] = useState<number[]>([]);`;

const newStateBlock = `  const [filterText, setFilterText] = useState('');
  
  // 🌟 Carga inicial directa desde localStorage para que aparezca de inmediato al entrar
  const [conteos, setConteos] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('nexus_auditoria_conteos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch(e) {}
    return {};
  });

  const [scanOrder, setScanOrder] = useState<number[]>(() => {
    try {
      const savedOrder = localStorage.getItem('nexus_auditoria_scan_order');
      if (savedOrder) return JSON.parse(savedOrder);
      const saved = localStorage.getItem('nexus_auditoria_conteos');
      if (saved) return Object.keys(JSON.parse(saved)).map(Number);
    } catch(e) {}
    return [];
  });

  const hasSavedAudit = Object.keys(conteos).length > 0;

  const [modalidad, setModalidad] = useState(() => {
    return localStorage.getItem('nexus_auditoria_modalidad') || (hasSavedAudit ? 'INVENTARIO TOTAL' : 'POR PROVEEDOR');
  });
  const [proveedor, setProveedor] = useState(() => localStorage.getItem('nexus_auditoria_proveedor') || '');
  const [isLibre, setIsLibre] = useState(() => {
    const saved = localStorage.getItem('nexus_auditoria_is_libre');
    return saved !== null ? saved === 'true' : hasSavedAudit;
  });
  const [isAuditing, setIsAuditing] = useState(true);
  const [mostrarBannerAvance, setMostrarBannerAvance] = useState(hasSavedAudit);`;

code = code.replace(oldStateBlock, newStateBlock);

// 3. Agregar guardado en tiempo real en localStorage
const oldUseEffectStorage = `  // Cargar avance previo guardado si existe
  useEffect(() => {
    const saved = localStorage.getItem('nexus_auditoria_conteos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          setConteos(parsed);
          setIsAuditing(true);
        }
      } catch(e) {}
    }
  }, []);`;

const newUseEffectStorage = `  // 🌟 Guardado automático continuo en tiempo real (Autoguardado a prueba de cierres o recargas)
  useEffect(() => {
    try {
      if (Object.keys(conteos).length > 0) {
        localStorage.setItem('nexus_auditoria_conteos', JSON.stringify(conteos));
        localStorage.setItem('nexus_auditoria_scan_order', JSON.stringify(scanOrder));
        localStorage.setItem('nexus_auditoria_is_libre', String(isLibre));
        localStorage.setItem('nexus_auditoria_modalidad', modalidad);
        localStorage.setItem('nexus_auditoria_proveedor', proveedor);
      }
    } catch(e) {}
  }, [conteos, scanOrder, isLibre, modalidad, proveedor]);

  // Función explícita para guardar avance con confirmación visual
  const handleGuardarAvance = () => {
    try {
      localStorage.setItem('nexus_auditoria_conteos', JSON.stringify(conteos));
      localStorage.setItem('nexus_auditoria_scan_order', JSON.stringify(scanOrder));
      localStorage.setItem('nexus_auditoria_is_libre', String(isLibre));
      localStorage.setItem('nexus_auditoria_modalidad', modalidad);
      localStorage.setItem('nexus_auditoria_proveedor', proveedor);
      alert('💾 ¡Avance de auditoría guardado con éxito! (' + Object.keys(conteos).length + ' productos registrados).');
    } catch(e) {
      alert('Error guardando avance');
    }
  };

  // Función para descartar avance y empezar de cero
  const handleDescartarAvance = () => {
    if (window.confirm('¿Estás seguro de descartar el conteo guardado y comenzar una auditoría limpia?')) {
      setConteos({});
      setScanOrder([]);
      localStorage.removeItem('nexus_auditoria_conteos');
      localStorage.removeItem('nexus_auditoria_scan_order');
      setMostrarBannerAvance(false);
    }
  };`;

code = code.replace(oldUseEffectStorage, newUseEffectStorage);

// 4. Mejorar ordenamiento para que el producto que se cuenta se coloque EN PRIMER LUGAR (en la posición 0)
const oldSortBlock = `    // Ordenar de modo que los productos escaneados aparezcan primero en el orden de escaneo (más reciente arriba)
    return list.sort((a, b) => {
      const idxA = scanOrderMap.has(a.id) ? scanOrderMap.get(a.id)! : 999999;
      const idxB = scanOrderMap.has(b.id) ? scanOrderMap.get(b.id)! : 999999;
      return idxA - idxB;
    });`;

const newSortBlock = `    // 🌟 Ordenamiento: Los productos contados / escaneados aparecen EN PRIMER LUGAR (el más reciente hasta arriba)
    return list.sort((a, b) => {
      const hasCountA = conteos[a.id] !== undefined;
      const hasCountB = conteos[b.id] !== undefined;
      
      const idxA = scanOrderMap.has(a.id) ? scanOrderMap.get(a.id)! : (hasCountA ? 10000 : 999999);
      const idxB = scanOrderMap.has(b.id) ? scanOrderMap.get(b.id)! : (hasCountB ? 10000 : 999999);

      if (idxA !== idxB) return idxA - idxB;
      if (hasCountA !== hasCountB) return hasCountA ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });`;

code = code.replace(oldSortBlock, newSortBlock);

// 5. Agregar el Banner de Avance Guardado en el Header
const oldHeaderStart = `<div className="flex-1 flex flex-col p-2.5 sm:p-5 overflow-hidden">`;

const newHeaderStart = `<div className="flex-1 flex flex-col p-2.5 sm:p-5 overflow-hidden">
        {/* 🌟 BANNER VISUAL DE AVANCE GUARDADO */}
        {mostrarBannerAvance && Object.keys(conteos).length > 0 && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 p-3 sm:px-4 rounded-xl mb-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <p className="text-white text-xs font-black uppercase tracking-wide">
                  🟢 CONTEO PREVIO RECUPERADO: <span className="text-emerald-400 font-bold">{Object.keys(conteos).length} PRODUCTOS REGISTRADOS</span>
                </p>
                <p className="text-slate-300 text-[10px]">
                  Tus piezas contadas están cargadas en la tabla. Puedes continuar escaneando o editando manualmente.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleGuardarAvance}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> GUARDAR AVANCE
              </button>
              <button
                onClick={handleDescartarAvance}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 px-3 py-1.5 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                title="Borrar avance previo"
              >
                <RotateCcw className="w-3.5 h-3.5" /> EMPEZAR DE CERO
              </button>
            </div>
          </div>
        )}`;

code = code.replace(oldHeaderStart, newHeaderStart);

// 6. Botón de Guardar Avances en el footer y en la barra de herramientas
const oldFooterBtn = `{dbProducts.some(p => (p.stock || 0) < 0) && (`;
const newFooterBtn = `<button 
                onClick={handleGuardarAvance}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-black text-xs uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                title="Guardar el conteo actual para continuar después"
              >
                <Save className="w-4 h-4" /> GUARDAR AVANCE ({Object.keys(conteos).length})
              </button>
              {dbProducts.some(p => (p.stock || 0) < 0) && (`;

code = code.replace(oldFooterBtn, newFooterBtn);

// Reemplazar la función handleGuardarAvance vieja si quedó duplicada
code = code.replace(`  const handleGuardarAvance = () => {\n    localStorage.setItem('nexus_auditoria_conteos', JSON.stringify(conteos));\n    alert('¡Avance de auditoría guardado con éxito!');\n  };\n\n`, '');

// Volver a CRLF
code = code.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, code, 'utf8');
console.log('✅ Auditoria.tsx actualizado exitosamente.');
