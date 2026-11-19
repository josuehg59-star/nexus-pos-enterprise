import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

btn_code = """
              <button onClick={() => fetch('/api/open-folder')} className="w-full bg-nexus-900 border border-nexus-700 text-slate-300 hover:text-white hover:bg-nexus-800 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                Abrir Carpeta de Respaldos (Documentos)
              </button>
"""

c = c.replace(
    "<button onClick={() => downloadManualBackup()}",
    btn_code + "              <button onClick={() => downloadManualBackup()}"
)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added Abrir Carpeta button')
