import React from 'react';
import { Printer, FileText, X } from 'lucide-react';

export interface CompraItem {
  sku: string;
  name: string;
  unit_measure?: string;
  cost: number;
  price?: number;
  qty: number;
  total: number;
  ieps_pct?: number;
  iva_pct?: number;
}

export interface CompraData {
  id?: number;
  folio: string;
  date: string;
  provider: string;
  items: CompraItem[];
  subtotal: number;
  ieps?: number;
  iva?: number;
  total: number;
  status?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  compra: CompraData | null;
  storeName?: string;
}

export default function ReporteEntradaPDFModal({
  isOpen,
  onClose,
  compra,
  storeName = 'MI TIENDITA " MISCELANEA BRITTANY "'
}: Props) {
  if (!isOpen || !compra) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      {/* CONTENEDOR MODAL PANTALLA */}
      <div className="bg-[#0b1120] border border-nexus-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* BARRA SUPERIOR DE ACCIONES (SE OCULTA EN IMPRESIÓN) */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#131b2c] border-b border-nexus-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Printer className="w-4 h-4" /> IMPRIMIR A4
            </button>
            <button
              onClick={handlePrint}
              className="bg-[#059669] hover:bg-[#047857] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <FileText className="w-4 h-4" /> GUARDAR PDF EXPORTACIÓN
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-nexus-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CUERPO IMPRESO ESTILO DOCUMENTO A4 FIDELIDAD EXTREMA */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-black text-sm font-sans print:p-0 print:overflow-visible">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              #printable-entrada-area, #printable-entrada-area * { visibility: visible; }
              #printable-entrada-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; color: black; }
              .print\\:hidden { display: none !important; }
            }
          `}</style>

          <div id="printable-entrada-area" className="max-w-3xl mx-auto bg-white p-6 rounded-lg text-black">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
              <div>
                <h1 className="font-black text-xl tracking-tight text-black uppercase">{storeName}</h1>
                <p className="font-bold text-slate-700 text-xs uppercase tracking-wider mt-1">REPORTE DE ENTRADA DE MERCANCÍA</p>
              </div>
              <div className="text-right">
                <p className="font-black text-xs text-black">FOLIO SISTEMA: <span className="font-mono">{compra.folio}</span></p>
                <p className="font-bold text-xs text-slate-700 mt-1">FECHA: {compra.date}</p>
              </div>
            </div>

            {/* PROVEEDOR */}
            <div className="mb-6">
              <p className="font-black text-sm uppercase text-black">
                PROVEEDOR: <span className="font-mono">{compra.provider}</span>
              </p>
            </div>

            {/* TABLA DE PRODUCTOS */}
            <table className="w-full text-left border-collapse border border-slate-300 mb-6 text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800 uppercase">
                  <th className="p-2 border-r border-slate-300 text-center w-16">CANTIDAD</th>
                  <th className="p-2 border-r border-slate-300 text-center w-20">U. MEDIDA</th>
                  <th className="p-2 border-r border-slate-300 w-36">NO. IDENTIFICACIÓN</th>
                  <th className="p-2 border-r border-slate-300">DESCRIPCIÓN</th>
                  <th className="p-2 border-r border-slate-300 text-right w-24">PRECIO U.</th>
                  <th className="p-2 text-right w-24">IMPORTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(compra.items || []).map((item, idx) => (
                  <tr key={idx} className="font-medium text-slate-900">
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {(item.qty || 0).toFixed(2)}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center uppercase font-mono">
                      {item.unit_measure || 'PZA'}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-bold uppercase">
                      {item.name}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      ${(item.cost || 0).toFixed(2)}
                    </td>
                    <td className="p-2 text-right font-mono font-bold">
                      ${(item.total || ((item.cost || 0) * (item.qty || 0))).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* CAJA DE TOTALES */}
            <div className="flex justify-end mb-16">
              <div className="w-72 border border-black p-3 bg-slate-50 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-300">
                  <span className="font-bold text-slate-700">SUBTOTAL:</span>
                  <span className="font-bold text-black">${(compra.subtotal ?? compra.total ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-300">
                  <span className="font-bold text-slate-700">IEPS:</span>
                  <span className="font-bold text-black">${(compra.ieps || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-300">
                  <span className="font-bold text-slate-700">IVA:</span>
                  <span className="font-bold text-black">${(compra.iva || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-black">
                  <span>TOTAL:</span>
                  <span>${(compra.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* FIRMA DE RECIBIDO */}
            <div className="text-center pt-8 border-t border-slate-400 max-w-md mx-auto">
              <div className="w-64 h-0.5 bg-black mx-auto mb-2"></div>
              <p className="font-black text-xs uppercase tracking-wider text-black">
                NOMBRE Y FIRMA DE RECIBIDO / AUTORIZACIÓN
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
