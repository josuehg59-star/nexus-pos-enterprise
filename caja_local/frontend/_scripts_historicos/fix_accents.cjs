const fs = require('fs');
let file = fs.readFileSync('src/pages/CajaZ.tsx', 'utf8');

file = file.replace(/COMPRAS DEL D.A/g, 'COMPRAS DEL DIA');
file = file.replace(/ART.CULOS/g, 'ARTICULOS');
file = file.replace(/d.a de hoy/g, 'dia de hoy');
file = file.replace(/M.todo/g, 'Metodo');
file = file.replace(/sLTIMOS MOVIMIENTOS DEL D.A/g, 'ULTIMOS MOVIMIENTOS DEL DIA');
file = file.replace(/CAJ.N/g, 'CAJON');
file = file.replace(/M.TODO DE PAGO/g, 'METODO DE PAGO');

fs.writeFileSync('src/pages/CajaZ.tsx', file);
