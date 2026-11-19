const fs = require('fs');
let file = fs.readFileSync('src/pages/Auditoria.tsx', 'utf8');

// Fix isAuditing state
file = file.replace('const [, setIsAuditing] = useState(false);', 'const [isAuditing, setIsAuditing] = useState(false);');

// Fix start button
file = file.replace('onClick={() => setIsAuditing(true)}', 'onClick={() => setIsAuditing(true)}'); // Already there but let's make sure it toggles the class or input.

// Fix input disabled
file = file.replace(/<input \s*type="number"/g, '<input type="number" disabled={!isAuditing}');

// Fix clear button
const regexTrash = /<button className="p-2 bg-red-900\/10 text-red-500 hover:bg-red-900\/30 border border-red-900\/30 rounded-lg transition-colors">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>/g;
const replaceTrash = '<button onClick={() => clearConteo(item.id)} className="p-2 bg-red-900/10 text-red-500 hover:bg-red-900/30 border border-red-900/30 rounded-lg transition-colors">\n                            <Trash2 className="w-4 h-4" />\n                          </button>';
file = file.replace(regexTrash, replaceTrash);

fs.writeFileSync('src/pages/Auditoria.tsx', file);
console.log('Auditoria patched');
