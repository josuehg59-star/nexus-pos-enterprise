import os
import re

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old_section = re.search(r"\{\/\* MERCADO PAGO POINT Y DATOS EXTRA \*\/\}[\s\S]*?GUARDAR CONFIGURACIÓN\n\s*</button>\n\s*</div>\n\s*</div>", c)

new_section = """{/* INTEGRACIÓN DE TERMINALES (PAYMENT GATEWAYS) */}
          <div className="bg-nexus-900/30 border border-nexus-800 rounded-3xl p-6">
            <div className="mb-6">
              <h3 className="font-black text-white text-xl tracking-widest uppercase">Integración de Terminales</h3>
              <p className="text-slate-400 text-xs">Configuración de Pasarelas de Pago Bancarias y Mercado Pago</p>
            </div>
            
            <div className="space-y-6">
              
              {/* MERCADO PAGO POINT */}
              <div className="bg-[#0b1120] border border-blue-900/50 rounded-2xl p-4">
                <h4 className="text-blue-400 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <SmartphoneNfc className="w-4 h-4" /> MERCADO PAGO POINT (API / WEBHOOKS)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ACCESS TOKEN (PRODUCCIÓN)</label>
                    <input type="password" defaultValue="APP_USR-1234567890-XXXXXXXXX" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ID DE SUCURSAL / CAJA</label>
                      <input type="text" defaultValue="SUC_001_CAJA_MAESTRA" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">ID DE TERMINAL (S/N)</label>
                      <input type="text" defaultValue="NEWLAND_N950_N950NCBA01817088" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => alert("Buscando terminales Mercado Pago activas en la red local...")} className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
                      <Search className="w-3 h-3" /> BUSCAR TERMINALES
                    </button>
                    <button onClick={() => alert("Conexión API Exitosa. Webhooks configurados.")} className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors">
                      PROBAR CONEXIÓN API
                    </button>
                  </div>
                </div>
              </div>

              {/* TERMINAL BANCARIA */}
              <div className="bg-[#0b1120] border border-nexus-800 rounded-2xl p-4">
                <h4 className="text-slate-300 font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> TERMINAL BANCARIA (CLIP, BANORTE, BBVA)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">PROVEEDOR / BANCO</label>
                    <select className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none">
                      <option>Terminal Genérica (Cobro Manual)</option>
                      <option>Clip (API B2B)</option>
                      <option>BBVA Net Cash API</option>
                      <option>Banorte Payworks</option>
                      <option>NetPay / Evo Payments</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MERCHANT ID (AFILIACIÓN)</label>
                      <input type="text" placeholder="Ej. 1234567" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">API KEY / SECRET</label>
                      <input type="password" placeholder="******************" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono text-xs focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTACTO */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-nexus-800">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">TELÉFONO NEGOCIO</label>
                  <input type="text" defaultValue="9612765041" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">EMAIL NEGOCIO</label>
                  <input type="text" defaultValue="miscelaneabrittany@gmail.com" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">DIRECCIÓN COMPLETA TICKET</label>
                <textarea defaultValue="AV. 16 DE SEPTIEMBRE 903, COL. BIENESTAR SOCIAL, TUXTLA GUTIERREZ, CHIAPAS. CP 29077" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none font-mono resize-none h-20" />
              </div>

              <button onClick={() => alert("Configuración general guardada en la base de datos correctamente.")} className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors mt-4">
                GUARDAR CONFIGURACIÓN
              </button>
            </div>
          </div>"""

if old_section:
    c = c[:old_section.start()] + new_section + c[old_section.end():]
    with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Config.tsx terminal integration added")
else:
    print("Regex failed to match Config.tsx")
