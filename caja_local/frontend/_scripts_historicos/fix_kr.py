content = open('src/pages/KardexReport.tsx', encoding='utf-8').read()
lines = content.split('\n')

# Fix dollar sign lines (97-98 are index 96-97)
lines[96] = '                    <td className="p-4 text-center text-white font-bold">{"$" + costo.toFixed(2)}</td>'
lines[97] = '                    <td className="p-4 text-center text-emerald-400 font-bold">{"$" + precio.toFixed(2)}</td>'

# Fix stock color line (100 is index 99)
stockLine = '                    <td className="p-4 text-center">'
stockLine += '<span className={p.stock < 10 ? "font-black text-lg text-red-400" : p.stock < 20 ? "font-black text-lg text-yellow-400" : "font-black text-lg text-blue-400"}>'
stockLine += '{p.stock}</span></td>'
lines[99] = stockLine

# Fix status line (101 is index 100)
statusLine = '                    <td className="p-4 text-center">'
statusLine += '<span className={(p.status || "ACTIVO") === "ACTIVO" ? "text-xs font-black px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-900" : "text-xs font-black px-3 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-900"}>'
statusLine += '{p.status || "ACTIVO"}</span></td>'
lines[100] = statusLine

open('src/pages/KardexReport.tsx', 'w', encoding='utf-8').write('\n'.join(lines))
print('Fixed successfully')
