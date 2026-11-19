import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

# We need to insert the missing fields into the Mercado Pago block, or right after it.
# Let's see how the structure is.
old_mercado_pago = """          {/* MERCADO PAGO POINT */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MERCADO PAGO POINT (ACCESS TOKEN)</label>
                <input type="password" defaultValue="APP_USR-1234567890-XXXXXXXXX" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
              </div>
              <button className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
                <Search className="w-4 h-4" /> BUSCAR TERMINALES POINT
              </button>
            </div>
          </div>"""

new_mercado_pago = """          {/* MERCADO PAGO POINT Y DATOS EXTRA */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MERCADO PAGO POINT (ACCESS TOKEN)</label>
                  <input type="password" defaultValue="APP_USR-1234567890-XXXXXXXXX" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                </div>
                <button className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 w-max">
                  <Search className="w-4 h-4" /> BUSCAR TERMINALES POINT
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">SELECCIONAR TERMINAL VINCULADA</label>
                <div className="w-full bg-[#0b1120] border border-nexus-800 border-dashed text-slate-500 px-4 py-4 rounded-xl text-center text-xs font-bold">
                  No se han buscado terminales aún.
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">VINCULAR MANUALMENTE (ID DE TERMINAL / SN)</label>
                <div className="flex gap-4">
                  <input type="text" defaultValue="NEWLAND_N950_N950NCBA01817088" className="flex-1 bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                  <button className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shrink-0">
                    PROBAR VÍNCULO
                  </button>
                </div>
                <p className="text-[9px] text-slate-600 mt-2 italic">* El ID suele ser el Número de Serie (S/N) impreso detrás de tu terminal. Ejemplo: S/N ABC12345678</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">TELÉFONO</label>
                  <input type="text" defaultValue="9612765041" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">EMAIL</label>
                  <input type="text" defaultValue="miscelaneabrittany@gmail.com" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">DIRECCIÓN COMPLETA</label>
                <textarea defaultValue="AV. 16 DE SEPTIEMBRE 903, COL. BIENESTAR SOCIAL, TUXTLA GUTIERREZ, CHIAPAS. CP 29077" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none font-mono resize-none h-20" />
              </div>

              <button className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors mt-4">
                GUARDAR CONFIGURACIÓN
              </button>
            </div>
          </div>

          {/* BITÁCORA DE ACCIONES (AUDITORÍA) */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-4 h-4 bg-nexus-700 rounded-sm flex flex-col gap-[2px] p-[3px] justify-center">
                <span className="w-full h-[2px] bg-white rounded-full"></span>
                <span className="w-full h-[2px] bg-white rounded-full"></span>
                <span className="w-full h-[2px] bg-white rounded-full"></span>
              </span>
              BITÁCORA DE ACCIONES (AUDITORÍA)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-nexus-800/50">
                <span className="text-blue-500 font-mono text-xs font-bold pt-1">09:11</span>
                <div>
                  <p className="font-black text-white text-xs">VENTA FINALIZADA</p>
                  <p className="text-slate-500 text-[10px] italic">Ticket #81162, Total: $4.00, Método: EFECTIVO</p>
                </div>
              </div>
              <div className="flex items-start gap-4 pb-4 border-b border-nexus-800/50">
                <span className="text-blue-500 font-mono text-xs font-bold pt-1">09:11</span>
                <div>
                  <p className="font-black text-white text-xs">VENTA</p>
                  <p className="text-slate-500 text-[10px] italic">Ticket #81162 - Cant: 1 (Terminal-Principal)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-blue-500 font-mono text-xs font-bold pt-1">09:10</span>
                <div>
                  <p className="font-black text-white text-xs">VENTA FINALIZADA</p>
                  <p className="text-slate-500 text-[10px] italic">Ticket #81161, Total: $45.00, Método: EFECTIVO</p>
                </div>
              </div>
            </div>
          </div>"""

c = c.replace(old_mercado_pago, new_mercado_pago)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added missing fields')
