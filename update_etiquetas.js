const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'caja_movil_app', 'src', 'pages', 'ImpresionEtiquetas.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Normalizar CRLF para reemplazos seguros
code = code.replace(/\r\n/g, '\n');

// 1. Agregar Trash2 en los imports
code = code.replace(
  "import { Printer, Settings, CheckSquare, Square, Package, Search } from 'lucide-react';",
  "import { Printer, Settings, CheckSquare, Square, Package, Search, Trash2 } from 'lucide-react';"
);

// 2. Importar useEffect
code = code.replace(
  "import { useState, useRef } from 'react';",
  "import { useState, useRef, useEffect } from 'react';"
);

// 3. Persistencia de selectedIds y formato
const oldStateBlock = `  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [formato, setFormato] = useState('58mm'); // 50x25mm o 38x25mm
  const [anchoBarra, setAnchoBarra] = useState<'AUTO' | 'COMPACTO' | 'ESTANDAR'>('AUTO');
  const printRef = useRef<HTMLDivElement>(null);`;

const newStateBlock = `  const [search, setSearch] = useState('');
  
  // 🌟 Persistencia en localStorage para que la lista no se borre al salir
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('nexus_etiquetas_selected_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set<number>(parsed);
      }
    } catch (e) {}
    return new Set<number>();
  });

  const [formato, setFormato] = useState(() => localStorage.getItem('nexus_etiquetas_formato') || '58mm');
  const [anchoBarra, setAnchoBarra] = useState<'AUTO' | 'COMPACTO' | 'ESTANDAR'>(() => {
    return (localStorage.getItem('nexus_etiquetas_ancho') as any) || 'AUTO';
  });
  const printRef = useRef<HTMLDivElement>(null);

  // 🌟 Guardado automático inmediato en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem('nexus_etiquetas_selected_ids', JSON.stringify(Array.from(selectedIds)));
    } catch (e) {}
  }, [selectedIds]);

  const handleFormatoChange = (f: string) => {
    setFormato(f);
    localStorage.setItem('nexus_etiquetas_formato', f);
  };

  const handleAnchoChange = (a: any) => {
    setAnchoBarra(a);
    localStorage.setItem('nexus_etiquetas_ancho', a);
  };

  const handleClearList = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(\`¿Deseas vaciar la lista de \${selectedIds.size} etiqueta(s) seleccionada(s)?\`)) {
      setSelectedIds(new Set());
      localStorage.removeItem('nexus_etiquetas_selected_ids');
    }
  };`;

code = code.replace(oldStateBlock, newStateBlock);

// 4. Cambiar onChange de formato y ancho
code = code.replace("onChange={e => setFormato(e.target.value)}", "onChange={e => handleFormatoChange(e.target.value)}");
code = code.replace("onChange={e => setAnchoBarra(e.target.value as any)}", "onChange={e => handleAnchoChange(e.target.value as any)}");

// 5. Agregar el botón 'LIMPIAR LISTA' al lado del botón IMPRIMIR
const oldPrintBtn = `<button 
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> IMPRIMIR ({selectedIds.size})
          </button>`;

const newButtons = `{selectedIds.size > 0 && (
            <button 
              onClick={handleClearList}
              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-300 px-4 py-2 rounded-lg font-black text-xs uppercase shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Vaciar toda la lista de etiquetas guardada"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> LIMPIAR ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> IMPRIMIR ({selectedIds.size})
          </button>`;

code = code.replace(oldPrintBtn, newButtons);

// Convertir de vuelta a CRLF para Windows
code = code.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, code, 'utf8');
console.log('✅ ImpresionEtiquetas.tsx actualizado exitosamente con persistencia y botón de limpiar.');
