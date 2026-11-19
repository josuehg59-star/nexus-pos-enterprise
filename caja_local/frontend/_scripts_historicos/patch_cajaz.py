import os
import re

with open('src/pages/CajaZ.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add activeTurno hook
hook_code = """  const [montoInicial, setMontoInicial] = useState('500');
  const [showHistory, setShowHistory] = useState(false);
  const [comprasDelDia] = useState<any[]>(JSON.parse(localStorage.getItem('comprasDia') || '[]'));
  const historialCortes = useLiveQuery(() => db.cortes.reverse().toArray()) || [];

  const activeTurno = useLiveQuery(async () => {
    if (!db.turnos) return null;
    const turnos = await db.turnos.toArray();
    return turnos.find(t => t.estado === 'ACTIVO') || null;
  });

  const handleAbrirCaja = async () => {
    const parsedMonto = parseFloat(montoInicial) || 0;
    await db.turnos.add({
      folio: 'TRN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      fechaApertura: new Date().toISOString(),
      montoInicial: parsedMonto,
      estado: 'ACTIVO',
      cajero: 'CAJERO PRINCIPAL'
    });
  };"""

code = code.replace("  const [montoInicial, setMontoInicial] = useState('500');\n  const [showHistory, setShowHistory] = useState(false);\n  const [comprasDelDia] = useState<any[]>(JSON.parse(localStorage.getItem('comprasDia') || '[]'));\n  const historialCortes = useLiveQuery(() => db.cortes.reverse().toArray()) || [];", hook_code)


# 2. Modify handleCorteZ to close the active turno
corte_code = """  const handleCorteZ = async () => {
    if (!activeTurno) {
      alert("No hay un turno abierto para hacer el corte.");
      return;
    }
    try {
      const backupData = { 
        tickets, 
        corte: {
          ventasEfectivo,
          ventasTarjeta,
          ventasTransferencia,
          totalVentas,
          totalEnCajaFisica,
          montoInicial: activeTurno.montoInicial
        },
        date: new Date().toISOString() 
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `CORTE_Z_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      // Guardar el corte en db.cortes
      await db.cortes.add({
        date: new Date().toISOString(),
        fondoInicial: activeTurno.montoInicial,
        ventasEfectivo,
        ventasTarjeta,
        ventasTransferencia,
        totalVentas,
        totalEsperado: totalEnCajaFisica
      });

      // CERRAR EL TURNO
      if (activeTurno && activeTurno.id) {
        await db.turnos.update(activeTurno.id, {
          estado: 'CERRADO',
          fechaCierre: new Date().toISOString()
        });
      }

      alert("Corte Z realizado exitosamente y turno cerrado.");
    } catch (e) {
      console.error(e);
      alert("Error al realizar el corte Z");
    }
  };"""

# Replace existing handleCorteZ
pattern_corte = r'const handleCorteZ = async \(\) => \{[\s\S]*?alert\("Error al exportar los datos"\);\n\s*\}\n\s*\};'
if re.search(pattern_corte, code):
    code = re.sub(pattern_corte, corte_code, code)
else:
    # If the old handleCorteZ had slightly different closing brackets:
    pattern_corte2 = r'const handleCorteZ = async \(\) => \{[\s\S]*?\}\n\s*\};'
    code = re.sub(pattern_corte2, corte_code, code)


# 3. Modify the UI based on activeTurno
ui_open_shift = """
        {/* CONDICIONAL: SI NO HAY TURNO ACTIVO, MOSTRAR PANTALLA DE APERTURA */}
        {!activeTurno ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
            <div className="bg-nexus-900 border border-nexus-700 rounded-3xl p-12 max-w-lg w-full shadow-2xl text-center">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Caja Cerrada</h2>
              <p className="text-slate-400 font-bold mb-8">Debes aperturar un nuevo turno para registrar ventas y movimientos en caja.</p>
              
              <div className="text-left mb-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Monto / Fondo Inicial</label>
                <div className="flex items-center">
                  <span className="bg-nexus-800 text-slate-400 px-6 py-4 rounded-l-xl font-bold border border-nexus-700 border-r-0 text-xl">$</span>
                  <input 
                    type="number" 
                    value={montoInicial}
                    onChange={e => setMontoInicial(e.target.value)}
                    className="w-full bg-[#0b1120] border border-nexus-700 text-white px-6 py-4 rounded-r-xl font-black text-xl focus:outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>

              <button 
                onClick={handleAbrirCaja}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
              >
                ABRIR CAJA
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
"""

code = code.replace('<div className="grid grid-cols-12 gap-8">', ui_open_shift)
code = code.replace('<!-- FIN DEL GRID -->', '') # Clean up if it exists
# We need to add the closing bracket for the activeTurno conditional
code = code.replace("</>\n  );\n}", "  )}</>\n  );\n}")

# Update totalEnCajaFisica to use activeTurno.montoInicial
code = code.replace("const totalEnCajaFisica = parseFloat(montoInicial || '0') + ventasEfectivo;", "const totalEnCajaFisica = (activeTurno ? activeTurno.montoInicial : parseFloat(montoInicial || '0')) + ventasEfectivo;")
# Update Fondo de caja input to be readonly when shift is active
code = code.replace("""<input 
                      type="number" 
                      value={montoInicial}
                      onChange={e => setMontoInicial(e.target.value)}
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-r-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-colors" 
                    />""", """<input 
                      type="number" 
                      value={activeTurno ? activeTurno.montoInicial : montoInicial}
                      readOnly
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-r-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-colors opacity-70" 
                    />""")

with open('src/pages/CajaZ.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("CajaZ.tsx modified with Shift Management!")
