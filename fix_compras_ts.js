const fs = require('fs');
const path = require('path');

const zPath = path.join(__dirname, 'caja_local/frontend/src/pages/CajaZ.tsx');
let zCode = fs.readFileSync(zPath, 'utf8');

const comprasListCode = `const comprasList = useLiveQuery(async () => {
    if (!activeTurno) return [];
    return await db.compras.where('date').aboveOrEqual(activeTurno.fechaApertura).toArray();
  }, [activeTurno]) || [];`;

zCode = zCode.replace(comprasListCode, '');

const activeTurnoRegex = /const activeTurno = useLiveQuery\(async \(\) => \{[\s\S]*?\}\);/;
zCode = zCode.replace(activeTurnoRegex, `$&

  ${comprasListCode}`);

fs.writeFileSync(zPath, zCode);
console.log('Fixed TS error 2');
