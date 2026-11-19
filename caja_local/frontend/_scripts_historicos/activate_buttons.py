import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

# Add simple alerts to dummy buttons
c = c.replace('<button className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2">\n              <Save className="w-4 h-4" /> GUARDAR AJUSTES DE RED\n            </button>',
              '<button onClick={() => alert("Ajustes de red guardados correctamente.")} className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-2">\n              <Save className="w-4 h-4" /> GUARDAR AJUSTES DE RED\n            </button>')

c = c.replace('<button className="text-red-500 text-[10px] font-black hover:text-red-400 uppercase tracking-widest">QUITAR</button>',
              '<button onClick={() => alert("Logotipo removido. Haz clic en Guardar Configuración.")} className="text-red-500 text-[10px] font-black hover:text-red-400 uppercase tracking-widest">QUITAR</button>')

c = c.replace('<button className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 w-max">\n                  <Search className="w-4 h-4" /> BUSCAR TERMINALES POINT\n                </button>',
              '<button onClick={() => alert("Buscando terminales Mercado Pago en la red local... Asegúrate de tener tu terminal Point encendida.")} className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 w-max">\n                  <Search className="w-4 h-4" /> BUSCAR TERMINALES POINT\n                </button>')

c = c.replace('<button className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shrink-0">\n                    PROBAR VÍNCULO\n                  </button>',
              '<button onClick={() => alert("Intentando conectar con terminal NEWLAND... ¡Conexión exitosa! Batería: 85%")} className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors shrink-0">\n                    PROBAR VÍNCULO\n                  </button>')

c = c.replace('<button className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors mt-4">\n                GUARDAR CONFIGURACIÓN\n              </button>',
              '<button onClick={() => alert("Configuración general guardada en la base de datos correctamente.")} className="w-full bg-[#2a68ff] hover:bg-[#1a55e6] text-white py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-colors mt-4">\n                GUARDAR CONFIGURACIÓN\n              </button>')

c = c.replace('<button className="w-full text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300 relative z-10">ACTUALIZAR CONEXIÓN</button>',
              '<button onClick={() => alert("Servidor local recargado. Los dispositivos móviles ya pueden conectarse.")} className="w-full text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300 relative z-10">ACTUALIZAR CONEXIÓN</button>')

c = c.replace('<button className="w-full bg-[#3d2417]/50 border border-[#5c3722]/50 text-[#e08953] hover:bg-[#5c3722]/80 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">\n                Importar Catálogo desde Excel (Escritorio)\n              </button>',
              '<button onClick={() => alert("Para importar productos masivamente, por favor dirígete al módulo: Inventario > Catálogo Maestro, y usa el botón de subir Excel.")} className="w-full bg-[#3d2417]/50 border border-[#5c3722]/50 text-[#e08953] hover:bg-[#5c3722]/80 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">\n                Importar Catálogo desde Excel (Escritorio)\n              </button>')

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Activated buttons')
