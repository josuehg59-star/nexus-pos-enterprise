import re

with open('src/pages/Kardex.tsx', 'r', encoding='utf-8') as f:
    file = f.read()

file = re.sub(
    r'<button onClick=\{\(\) => setTipoMovimiento\("ENTRADA"\)\} className=\{px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>ENTRADA</button>',
    '<button onClick={() => setTipoMovimiento("ENTRADA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>ENTRADA</button>',
    file
)

file = re.sub(
    r'<button onClick=\{\(\) => setTipoMovimiento\("DEVOLUCION"\)\} className=\{px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>DEVOLUCI.N</button>',
    '<button onClick={() => setTipoMovimiento("DEVOLUCION")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>DEVOLUCIÓN</button>',
    file
)

file = re.sub(
    r'<button onClick=\{\(\) => setTipoMovimiento\("MERMA"\)\} className=\{px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors \}>MERMA</button>',
    '<button onClick={() => setTipoMovimiento("MERMA")} className={px-6 py-3 rounded-lg font-black text-xs uppercase transition-colors }>MERMA</button>',
    file
)

with open('src/pages/Kardex.tsx', 'w', encoding='utf-8') as f:
    f.write(file)
print('Fixed completely')
