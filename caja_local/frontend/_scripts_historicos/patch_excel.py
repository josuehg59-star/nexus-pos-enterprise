import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace xlsx import
c = c.replace("import * as XLSX from 'xlsx';", "import * as XLSX from 'xlsx-js-style';")

# Replace handleExportExcel
old_export = re.search(r"// EXPORT EXCEL MASTER[\s\S]*?const handleDevolverParcial", c)

if old_export:
    new_export = """// EXPORT EXCEL MASTER
  const handleExportExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const config = await db.products.toArray(); // solo para sacar algun dato, o hardcodeamos los de la tienda
      const nombreEmpresa = "MI TIENDITA \\"MISCELANEA BRITTANY\\"";
      const direccionEmpresa = "AV. 16 DE SEPTIEMBRE 903, COL. BIENESTAR SOCIAL, TUXTLA GUTIERREZ, CHIAPAS. CP 29077";

      const wsData: any[][] = [];
      const isVentas = activeTab === 'VENTAS';
      
      // 1. TÍTULO PRINCIPAL
      wsData.push([`REPORTE DE ${activeTab}`]);
      
      // 2. ENCABEZADOS DEL NEGOCIO
      wsData.push(["Empresa:", nombreEmpresa]);
      wsData.push(["Dirección:", direccionEmpresa]);
      wsData.push(["Periodo:", `${startDate} al ${endDate}`, "", "", "", "Generado:", new Date().toLocaleDateString()]);
      wsData.push([]); // Espacio en blanco
      
      let startRow = 5; // 0-indexed, so row 6 is index 5
      
      // 3. ENCABEZADOS DE TABLA
      if (isVentas) {
        wsData.push(["CÓDIGO", "PRODUCTO", "PROVEEDOR", "CANTIDAD", "COSTO", "PRECIO", "TOTAL", "UTILIDAD"]);
        
        let totalCant = 0;
        let totalTotal = 0;
        let totalUtilidad = 0;
        
        // Agrupar por producto para "VENTAS POR PRODUCTO"
        const prodMap: Record<string, any> = {};
        filteredTickets.forEach(t => {
          t.items?.forEach((item: any) => {
            if (providerFilter !== 'TODOS' && item.category !== providerFilter) return;
            const key = item.sku;
            if(!prodMap[key]) {
              prodMap[key] = {
                sku: item.sku,
                name: item.name,
                proveedor: item.category || 'SIN PROVEEDOR',
                qty: 0,
                cost: item.cost || 0,
                price: item.price || 0,
                total: 0,
                utilidad: 0
              };
            }
            prodMap[key].qty += item.cartQty;
            const subtotal = item.cartQty * item.price;
            const costoTotal = item.cartQty * (item.cost || 0);
            prodMap[key].total += subtotal;
            prodMap[key].utilidad += (subtotal - costoTotal);
          });
        });

        Object.values(prodMap).forEach(p => {
          totalCant += p.qty;
          totalTotal += p.total;
          totalUtilidad += p.utilidad;
          wsData.push([p.sku, p.name, p.proveedor, p.qty, p.cost, p.price, p.total, p.utilidad]);
        });
        
        // Fila de totales
        wsData.push(["TOTAL:", "", "", totalCant, "", "", totalTotal, totalUtilidad]);

      } else {
        // Fallback genérico para otras pestañas para que no truene
        wsData.push(["DATOS", "EXPORTADOS"]);
        wsData.push(["..."]);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // --- ESTILOS AVANZADOS (xlsx-js-style) ---
      
      // Estilo Título
      ws["A1"].s = {
        font: { bold: true, color: { rgb: "003366" }, sz: 16 },
        alignment: { horizontal: "center" }
      };
      
      // Mezclar celdas para el título (A1 a H1)
      ws["!merges"] = [ { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } } ];
      
      // Estilos para encabezados de negocio (Empresa, Dirección, Periodo)
      const boldStyle = { font: { bold: true } };
      if(ws["A2"]) ws["A2"].s = boldStyle;
      if(ws["A3"]) ws["A3"].s = boldStyle;
      if(ws["A4"]) ws["A4"].s = boldStyle;
      if(ws["F4"]) ws["F4"].s = boldStyle;

      // Aplicar estilos a la tabla si es Ventas
      if (isVentas) {
        // Estilo de encabezados de la tabla (Fila 6 -> row index 5)
        const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "0B1120" } }, // Dark Blue/Black
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        // Estilo de celdas normales
        const cellStyle = {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
        
        const currencyStyle = { ...cellStyle, numFmt: "$#,##0.00" };
        const totalStyle = { ...headerStyle, fill: { fgColor: { rgb: "E2E8F0" } }, font: { bold: true, color: { rgb: "000000" } } };
        const totalCurrencyStyle = { ...totalStyle, numFmt: "$#,##0.00" };

        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:H1");
        
        for (let R = startRow; R <= range.e.r; ++R) {
          const isHeader = (R === startRow);
          const isLastRow = (R === range.e.r);
          
          for (let C = 0; C <= 7; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellRef]) ws[cellRef] = { t: "s", v: "" }; // Asegurar que exista la celda
            
            if (isHeader) {
              ws[cellRef].s = headerStyle;
            } else if (isLastRow) {
              ws[cellRef].s = (C === 4 || C === 5 || C === 6 || C === 7) ? totalCurrencyStyle : totalStyle;
            } else {
              // Filas de datos
              if (C === 4 || C === 5 || C === 6 || C === 7) {
                ws[cellRef].s = currencyStyle; // Costo, Precio, Total, Utilidad
              } else {
                ws[cellRef].s = cellStyle;
              }
            }
          }
        }
      }

      // Anchos de columna
      ws['!cols'] = [
        {wch: 15}, // CÓDIGO
        {wch: 45}, // PRODUCTO
        {wch: 35}, // PROVEEDOR
        {wch: 10}, // CANTIDAD
        {wch: 12}, // COSTO
        {wch: 12}, // PRECIO
        {wch: 15}, // TOTAL
        {wch: 15}  // UTILIDAD
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, activeTab);
      XLSX.writeFile(wb, `Reporte_${activeTab}_${startDate}_al_${endDate}.xlsx`);
    } catch(e) {
      console.error(e);
      alert("Error al exportar a Excel. Verifique que haya datos.");
    }
  };

  const handleDevolverParcial"""
    c = c[:old_export.start()] + new_export + c[old_export.end():]

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
    print("Export upgraded to xlsx-js-style")
