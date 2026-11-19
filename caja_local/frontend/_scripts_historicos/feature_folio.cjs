const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

// 1. Add state for folio
file = file.replace(/const \[scanInput, setScanInput\] = useState\(''\);/, "const [scanInput, setScanInput] = useState('');\n  const [folio, setFolio] = useState('ENT-' + Math.floor(Math.random()*1000000));");

// 2. Bind the folio input
file = file.replace(/<input type="text" placeholder="Ej: F-99824" className="w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none" \/>/, "<input type='text' value={folio} onChange={e => setFolio(e.target.value)} className='w-full bg-nexus-900 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-blue-500 outline-none' />");

// 3. Bind IMPRIMIR PDF
file = file.replace(/<button className="bg-blue-900\/30 border border-blue-500\/50 text-blue-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2">/, "<button onClick={() => window.print()} className='bg-blue-900/30 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg font-black text-xs flex items-center gap-2 print-hidden'>");

fs.writeFileSync('src/pages/Kardex.tsx', file);
