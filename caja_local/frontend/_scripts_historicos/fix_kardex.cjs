const fs = require('fs');
let file = fs.readFileSync('src/pages/Kardex.tsx', 'utf8');

// Remove the erroneous closing div
file = file.replace("</div>\\n<div className='hidden print:block", "<div className='hidden print:block");

// Now inject the opening wrapper properly
file = file.replace('return (\\n    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">', 'return (\\n    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden relative">\\n<div className="flex-1 flex flex-col print:hidden h-full">');

// And add the closing wrapper back
file = file.replace("<div className='hidden print:block", "</div>\\n<div className='hidden print:block");

fs.writeFileSync('src/pages/Kardex.tsx', file);
console.log('Fixed wrap');
