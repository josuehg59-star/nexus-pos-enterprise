const fs = require('fs');
let file = fs.readFileSync('src/pages/Inventory.tsx', 'utf8');

file = file.replace(/reader\.onload = async \(evt\) => \{[\s\S]*?reader\.readAsBinaryString\(file\);/m, 
eader.onload = async (evt: any) => {
      if (!evt.target) return;
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      alert('Se importaron ' + data.length + ' productos.');
      for (const row of data as any[]) {
        await db.products.put({
          sku: String(row.sku || ''),
          name: String(row.name || '').toUpperCase(),
          cost: parseFloat(row.cost || 0),
          price: parseFloat(row.price || 0),
          stock: parseInt(row.stock || 0),
          category: String(row.category || 'Sin Categoría'),
          status: 'ACTIVO'
        });
      }
    };
    reader.readAsBinaryString(file););

fs.writeFileSync('src/pages/Inventory.tsx', file);
console.log('Fixed TS in Inventory');
