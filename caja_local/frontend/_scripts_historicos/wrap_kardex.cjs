const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

file = file.replace(/return \(\s*<div className="flex-1 flex flex-col h-full bg-\[#0b1120\] text-slate-200 overflow-hidden relative">/,
"return (\\n    <div className=\\"flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative\\">\\n      <div className=\\"flex-1 flex flex-col print:hidden h-full\\">");

file = file.replace(/<div className='hidden print:block/, "</div>\\n      <div className='hidden print:block");

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Wrapped Kardex content');
