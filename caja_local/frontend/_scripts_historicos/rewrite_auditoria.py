import re

with open('src/pages/Auditoria.tsx', encoding='utf-8') as f:
    content = f.read()

# Make the apply function robust
apply_logic = """
  const handleGuardarAuditoria = async () => {
    if (!window.confirm('¿Aplicar conteo físico y generar ajustes de inventario?')) return;
    
    let totalDifPiezas = 0;
    let totalDifDinero = 0;
    const fecha = new Date().toISOString().split('T')[0];
    
    for (const [idStr, fisico] of Object.entries(conteos)) {
      const id = parseInt(idStr);
      const product = await db.products.get(id);
      if (product) {
        const diff = fisico - product.stock;
        if (diff !== 0) {
          totalDifPiezas += Math.abs(diff);
          totalDifDinero += Math.abs(diff) * (product.cost || 0);
          
          // Actualizar stock
          await db.products.update(id, { stock: fisico });
          
          // Generar Kárdex
          await db.kardex.add({
            fecha,
            tipo: diff > 0 ? 'ENTRADA' : 'MERMA', // Alta o Baja
            sku: product.sku,
            productName: product.name + (diff > 0 ? ' (ALTA POR AJUSTE)' : ' (BAJA POR AJUSTE)'),
            cantidad: Math.abs(diff),
            costo: product.cost || 0,
            precio: product.price || 0,
            total: Math.abs(diff) * (product.cost || 0),
            folio: 'AUD-' + Date.now().toString().slice(-6),
            proveedor: 'AJUSTE DE INVENTARIO'
          });
        }
      }
    }
    
    alert(`Auditoría aplicada con éxito.\\nDiferencia total en piezas: ${totalDifPiezas}\\nDiferencia total en costo: $${totalDifDinero.toFixed(2)}`);
    setIsAuditing(false);
    setConteos({});
  };
"""

content = re.sub(
    r'  const handleGuardarAuditoria = async \(\) => \{.*?\n  \};\n',
    apply_logic,
    content,
    flags=re.DOTALL
)

# Allow category filter to work properly and libre mode
filter_logic = """
  const products = useLiveQuery(() => {
    return db.products.toArray().then((results: any[]) => {
      // Filtro Modalidad
      if (!isLibre) {
        if (modalidad === 'SOLO NEGATIVOS') {
          results = results.filter(p => p.stock < 0);
        } else if (modalidad === 'POR PROVEEDOR' && proveedor) {
          results = results.filter(p => p.category === proveedor || p.proveedor === proveedor || (p as any).brand === proveedor);
        } else if (modalidad === 'POR CATEGORÍA' && proveedor) {
          results = results.filter(p => p.category === proveedor);
        }
      } else {
        // En modo libre, solo mostramos si hay búsqueda o si ya se contó
        results = results.filter(p => conteos[p.id!] !== undefined || (searchQuery && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))));
      }

      // Filtro de Búsqueda
      if (searchQuery && !isLibre) {
        const q = searchQuery.toLowerCase();
        results = results.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      return results;
    });
  }, [searchQuery, modalidad, proveedor, isLibre, conteos]) || [];
"""

content = re.sub(
    r'  const products = useLiveQuery\(\(\) => \{.*?\n  \}, \[searchQuery, modalidad, proveedor\]\) \|\| \[\];',
    filter_logic,
    content,
    flags=re.DOTALL
)

with open('src/pages/Auditoria.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Auditoria logic rewritten')
