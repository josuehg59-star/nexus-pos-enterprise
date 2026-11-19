import fs from 'fs';

const code = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');

// Find the first occurrence of VENTAS
const startVentas = code.indexOf("{activeTab === 'VENTAS' && (");

// The original file was:
// 1. [Header]
// 2. {['VENTAS', 'FOLIOS'].includes(activeTab) && ( ... )}
// 3. {activeTab === 'ESTADÍSTICAS' && ...

// Because of my bad python script, the file is now:
// 1. [Header]
// 2. {activeTab === 'VENTAS' && ( ... )}
// 3. [Rest of file including ESTAD, CREDITOS, etc.]
// 4. {activeTab === 'FOLIOS' && ( ... )}
// 5. [Rest of file including ESTAD, CREDITOS, etc.]

// Let's grab the header
const header = code.substring(0, startVentas);

// Let's grab the actual VENTAS UI. It ends before the FIRST occurrence of {activeTab === 'ESTAD
const firstEstad = code.indexOf("{activeTab === 'ESTAD", startVentas);
const ventasUI = code.substring(startVentas, firstEstad).trim();

// The rest of the valid file (ESTAD, CREDITOS, etc.) can be extracted from the FIRST occurrence of {activeTab === 'ESTAD
// up to the start of the FOLIOS block that was wrongly appended.
const startFolios = code.indexOf("{activeTab === 'FOLIOS' && (", firstEstad);
const restOfFile = code.substring(firstEstad, startFolios).trim();

// Now we need to create the FOLIOS UI. 
// We can just take ventasUI, replace 'VENTAS' with 'FOLIOS', and switch the rendering logic inside.
// Actually, it's easier to grab the folios UI from the second block.
const secondEstad = code.indexOf("{activeTab === 'ESTAD", startFolios);
const foliosUI = code.substring(startFolios, secondEstad).trim();

// Wait, the restOfFile already has the correct closing of the component.
// So we just need: header + ventasUI + "\n" + foliosUI + "\n" + restOfFile

const finalCode = header + ventasUI + "\n\n" + foliosUI + "\n\n" + restOfFile;

fs.writeFileSync('src/pages/Reports.tsx', finalCode);
console.log("Fixed Reports.tsx duplication!");
