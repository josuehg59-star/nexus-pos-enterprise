import { useState, useMemo, useEffect } from 'react';
import { Calculator, DollarSign, CreditCard, Banknote, History, Printer, Lock, ShoppingBag, Calendar, ArrowLeft, CheckCircle2, Edit3, AlertCircle, Smartphone } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import { useSettings } from '../store/useSettings';
import { matchCaja } from '../store/useStore';
import { parseUniversalTimestamp, getDayRange, formatLocalDateStr } from '../utils/dateUtils';

export default function CajaZ() {
  const { cajaNombre, activeUser } = useSettings();
  const selectedCaja = cajaNombre || 'CAJA MÓVIL (CELULAR)';
  const [montoInicial, setMontoInicial] = useState('500');
  const [showHistory, setShowHistory] = useState(false);
  
  // Selector de fecha: por defecto el día actual local
  const todayStr = useMemo(() => formatLocalDateStr(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDateStr(new Date()));

  const isToday = selectedDate === todayStr;

  // Rango de timestamps para el día seleccionado (00:00:00.000 a 23:59:59.999)
  const { startTs: dayStartTs, endTs: dayEndTs } = useMemo(() => getDayRange(selectedDate), [selectedDate]);

  const historialCortes = useLiveQuery(async () => {
    const all = await db.cortes.reverse().toArray();
    return all.filter(c => matchCaja(c.caja, selectedCaja));
  }, [selectedCaja]) || [];

  const activeTurno = useLiveQuery(async () => {
    if (!db.turnos) return null;
    const turnos = await db.turnos.toArray();
    return turnos.find(t => t.estado === 'ACTIVO' && matchCaja(t.caja, selectedCaja)) || null;
  }, [selectedCaja]);

  // Estado editable para Fondo de Caja
  const [fondoInput, setFondoInput] = useState<string>('0');
  const [isEditingFondo, setIsEditingFondo] = useState(false);

  // Sincronizar fondoInput con el turno activo al cargar
  useEffect(() => {
    if (activeTurno && !isEditingFondo) {
      setFondoInput(String(activeTurno.montoInicial || 0));
    }
  }, [activeTurno, isEditingFondo]);

  // Estado: ¿Descontar compras del efectivo de caja? (Por defecto false porque muchas compras son transferencia o dinero fuera de caja)
  const [descontarCompras, setDescontarCompras] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_cajaz_descontar_compras');
    return saved === 'true';
  });

  const handleToggleDescontarCompras = (val: boolean) => {
    setDescontarCompras(val);
    localStorage.setItem('nexus_cajaz_descontar_compras', val ? 'true' : 'false');
  };

  // Estado: Efectivo Físico Contado en Cajón (Arqueo manual por el cajero/dueño)
  const [efectivoContadoInput, setEfectivoContadoInput] = useState<string>('');

  // Si se consulta un día pasado, buscar si ya existe un Corte Z cerrado para ese día
  const corteGuardadoDelDia = useMemo(() => {
    return historialCortes.find(c => {
      const cTs = parseUniversalTimestamp(c.date);
      return cTs >= dayStartTs && cTs <= dayEndTs;
    }) || null;
  }, [historialCortes, dayStartTs, dayEndTs]);

  // Punto de corte de inicio:
  const effectiveCutoffTs = useMemo(() => {
    if (isToday && activeTurno?.fechaApertura) {
      const turnoTs = parseUniversalTimestamp(activeTurno.fechaApertura);
      return Math.max(dayStartTs, turnoTs);
    }
    return dayStartTs;
  }, [isToday, activeTurno, dayStartTs]);

  // Consultar compras del día/turno:
  const comprasList = useLiveQuery(async () => {
    const allCompras = await db.compras.toArray();
    const allKardex = await db.kardex.toArray();

    const seenFolios = new Set<string>();
    const result: Array<{ provider: string; total: number; folio?: string; date?: string }> = [];

    // 1. De la tabla compras (solo compras reales recibidas)
    allCompras.forEach(c => {
      if (c.status === 'ORDEN' || c.status === 'PENDIENTE' || c.status === 'BORRADOR' || c.status === 'DEVOLUCION') {
        return;
      }
      const cTs = parseUniversalTimestamp(c.date);
      if (cTs >= effectiveCutoffTs && cTs <= dayEndTs) {
        const folioKey = String(c.folio || '').trim().toUpperCase();
        if (folioKey) seenFolios.add(folioKey);
        result.push({
          provider: String(c.provider || 'PROVEEDOR GENERAL').trim().toUpperCase(),
          total: Number(c.total) || 0,
          folio: c.folio,
          date: c.date
        });
      }
    });

    // 2. Del Kardex (entradas de inventario no registradas en compras o migradas)
    const kardexByFolio: Record<string, { provider: string; total: number; date: string }> = {};
    allKardex.forEach(k => {
      if ((k.tipo === 'ENTRADA' || k.tipo === 'COMPRA') && k.folio) {
        const kFolio = String(k.folio).trim().toUpperCase();
        if (
          kFolio.startsWith('AUD-') ||
          kFolio.startsWith('AJUSTE') ||
          kFolio.startsWith('TEST-') ||
          kFolio.startsWith('SANEAMIENTO') ||
          kFolio.startsWith('AUTO-CONV')
        ) {
          return;
        }

        const kTs = parseUniversalTimestamp(k.fecha);
        if (kTs >= effectiveCutoffTs && kTs <= dayEndTs) {
          if (!seenFolios.has(kFolio)) {
            if (!kardexByFolio[kFolio]) {
              kardexByFolio[kFolio] = {
                provider: String(k.proveedor || k.provider || 'PROVEEDOR GENERAL').trim().toUpperCase(),
                total: 0,
                date: k.fecha
              };
            }
            kardexByFolio[kFolio].total += (Number(k.total) || (Number(k.costo || 0) * Number(k.cantidad || 0)));
          }
        }
      }
    });

    Object.entries(kardexByFolio).forEach(([fol, data]) => {
      result.push({
        provider: data.provider,
        total: data.total,
        folio: fol,
        date: data.date
      });
    });

    return result;
  }, [effectiveCutoffTs, dayEndTs]) || [];

  const handleAbrirCaja = async () => {
    const parsedMonto = parseFloat(montoInicial) || 0;
    await db.turnos.add({
      folio: 'TRN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      fechaApertura: new Date().toISOString(),
      montoInicial: parsedMonto,
      estado: 'ACTIVO',
      cajero: activeUser?.name || 'ADMINISTRADOR',
      caja: selectedCaja
    });
  };

  const handleUpdateFondo = async () => {
    const parsed = parseFloat(fondoInput) || 0;
    if (activeTurno && activeTurno.id) {
      await db.turnos.update(activeTurno.id, { montoInicial: parsed });
    }
    setIsEditingFondo(false);
  };

  // Fetch tickets delimitados estrictamente al periodo / día seleccionado y a la terminal móvil
  const tickets = useLiveQuery(async () => {
    const all = await db.tickets.toArray();
    return all.filter(t => {
      const tTs = parseUniversalTimestamp(t.date);
      const inDateRange = tTs >= effectiveCutoffTs && tTs <= dayEndTs;
      if (!inDateRange) return false;
      return matchCaja(t.caja, selectedCaja);
    });
  }, [effectiveCutoffTs, dayEndTs, selectedCaja]) || [];

  // Normalizador de texto para métodos de pago
  const normMethod = (m: string | undefined) => String(m || '').trim().toUpperCase();

  // Cálculos de Arqueo
  const ventasEfectivo = tickets.reduce((sum, t) => {
    const m = normMethod(t.paymentMethod);
    if (m === 'EFECTIVO' || m === 'CASH') return sum + t.total;
    if (m === 'MIXTO') return sum + (t.montoEfectivo || 0);
    return sum;
  }, 0);

  const ventasTarjeta = tickets.reduce((sum, t) => {
    const m = normMethod(t.paymentMethod);
    const sec = normMethod(t.metodoMixtoSecundario);
    const isCard = m === 'TARJETA' || m === 'CARD' || m === 'DEBITO' || m === 'CREDITO' || m === 'TDC' || m === 'TDD' || m === 'TERMINAL' || m === 'MERCADO PAGO' || m === 'MERCADOPAGO' || m === 'POINT' || m === 'CLIP' || m === 'BANCO';
    const isCardSec = sec === 'TARJETA' || sec === 'CARD' || sec === 'DEBITO' || sec === 'CREDITO' || sec === 'MERCADO PAGO' || sec === 'MERCADOPAGO' || sec === 'POINT';

    if (isCard) return sum + t.total;
    if (m === 'MIXTO' && (t.montoTarjeta !== undefined || isCardSec)) {
      return sum + (t.montoTarjeta !== undefined ? t.montoTarjeta : (t.total - (t.montoEfectivo || 0)));
    }
    return sum;
  }, 0);

  const ventasTransferencia = tickets.reduce((sum, t) => {
    const m = normMethod(t.paymentMethod);
    const sec = normMethod(t.metodoMixtoSecundario);
    const isTransfer = m === 'TRANSFERENCIA' || m === 'TRANSFER' || m === 'SPEI' || m === 'DEPOSITO' || m === 'DIGITAL' || m === 'TRANSFERENCIA / OTROS';
    const isTransferSec = sec === 'TRANSFERENCIA' || sec === 'TRANSFER' || sec === 'SPEI' || sec === 'DEPOSITO';

    if (isTransfer) return sum + t.total;
    if (m === 'MIXTO' && (t.montoTransferencia !== undefined || isTransferSec)) {
      return sum + (t.montoTransferencia !== undefined ? t.montoTransferencia : (t.total - (t.montoEfectivo || 0)));
    }
    return sum;
  }, 0);
  
  const totalVentas = tickets.reduce((sum, t) => sum + t.total, 0);

  // Cálculos de Compras a Proveedores
  const provMap: Record<string, number> = {};
  let totalComprasGeneral = 0;
  comprasList.forEach(c => {
    const prov = (c.provider || 'PROVEEDOR GENERAL').toUpperCase();
    if (!provMap[prov]) provMap[prov] = 0;
    provMap[prov] += (c.total || 0);
    totalComprasGeneral += (c.total || 0);
  });
  const provArr = Object.keys(provMap).map(k => ({ provider: k, total: provMap[k] }));

  // Fondo inicial aplicable
  const fondoAplicable = isToday
    ? (parseFloat(fondoInput) || 0)
    : (corteGuardadoDelDia?.fondoInicial !== undefined ? corteGuardadoDelDia.fondoInicial : 0);

  // Compras descontadas del cajón según la casilla
  const comprasADescontar = descontarCompras ? totalComprasGeneral : 0;

  // Efectivo Esperado por el Sistema = Fondo Inicial + Ventas en Efectivo - Compras (si salieron de caja)
  const efectivoEsperado = fondoAplicable + ventasEfectivo - comprasADescontar;

  // Efectivo Físico Contado ingresado por el usuario
  const efectivoFisicoVal = efectivoContadoInput.trim() !== '' ? parseFloat(efectivoContadoInput) : null;

  // Diferencia de Arqueo (Contado vs Esperado)
  const diferenciaArqueo = efectivoFisicoVal !== null ? (efectivoFisicoVal - efectivoEsperado) : null;

  // Función para imprimir tickets de corte térmico
  const printThermalTicket = (
    title: string, 
    customData?: {
      caja: string;
      cajero: string;
      foliosCount: number;
      fondo: number;
      efectivo: number;
      tarjeta: number;
      transferencia: number;
      ventas: number;
      cajaEsperada: number;
      cajaContada?: number | null;
      diferencia?: number | null;
      compras: number;
      comprasDescontadas: number;
      detalleCompras: Array<{ provider: string; total: number }>;
      fechaHora: string;
    }
  ) => {
    const w = window.open('', '_blank', 'width=420,height=750');
    if (!w) return alert('Por favor permite ventanas emergentes para imprimir el ticket de corte.');

    const data = customData || {
      caja: selectedCaja,
      cajero: activeUser?.name || 'ADMINISTRADOR',
      foliosCount: tickets.length,
      fondo: fondoAplicable,
      efectivo: ventasEfectivo,
      tarjeta: ventasTarjeta,
      transferencia: ventasTransferencia,
      ventas: totalVentas,
      cajaEsperada: efectivoEsperado,
      cajaContada: efectivoFisicoVal,
      diferencia: diferenciaArqueo,
      compras: totalComprasGeneral,
      comprasDescontadas: comprasADescontar,
      detalleCompras: provArr,
      fechaHora: new Date().toLocaleString('es-MX')
    };

    let provHtml = data.detalleCompras.map(p => `
      <tr>
        <td style="width:70%; text-align:left;">${p.provider}</td>
        <td style="width:30%; text-align:right;">$${p.total.toFixed(2)}</td>
      </tr>
    `).join('');

    if (data.detalleCompras.length === 0) {
      provHtml = '<tr><td colspan="2" style="text-align:center;">Ninguna compra registrada</td></tr>';
    }

    let arqueoFisicoHtml = '';
    if (data.cajaContada !== null && data.cajaContada !== undefined) {
      const diffVal = data.diferencia || 0;
      const diffTexto = Math.abs(diffVal) < 0.01 
        ? 'CUADRADA ($0.00)' 
        : diffVal > 0 
          ? `SOBRANTE: +$${diffVal.toFixed(2)}` 
          : `FALTANTE: -$${Math.abs(diffVal).toFixed(2)}`;
      arqueoFisicoHtml = `
        <div class="row"><span>DINERO CONTADO:</span><span><b>$${data.cajaContada.toFixed(2)}</b></span></div>
        <div class="row"><span>DIFERENCIA:</span><span><b>${diffTexto}</b></span></div>
      `;
    }

    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              font-weight: 900 !important;
              width: 44mm !important;
              max-width: 44mm !important;
              margin: 0 auto !important;
              padding: 1mm 0 !important;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            * { font-weight: 900 !important; color: #000000 !important; }
            h2, h3, p { margin: 3px 0; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            th { border-bottom: 2px dashed #000; text-align: left; }
            td, th { padding: 2px 0; font-size: 10px; }
            .divider { border-top: 1.5px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>FECHA: ${data.fechaHora}</p>
          <div class="row"><span>TERMINAL / CAJA:</span><span><b>${data.caja}</b></span></div>
          <div class="row"><span>CAJERO:</span><span><b>${data.cajero}</b></span></div>
          <div class="row"><span>FOLIOS COBRADOS:</span><span><b>${data.foliosCount}</b></span></div>
          <div class="divider"></div>
          <div class="row"><span>FONDO INICIAL:</span><span>$${data.fondo.toFixed(2)}</span></div>
          <div class="row"><span>V. EFECTIVO:</span><span>$${data.efectivo.toFixed(2)}</span></div>
          <div class="row"><span>V. TARJETA:</span><span>$${data.tarjeta.toFixed(2)}</span></div>
          <div class="row"><span>V. TRANSF:</span><span>$${data.transferencia.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row" style="font-size:12px"><span><b>TOTAL VENTAS:</b></span><span><b>$${data.ventas.toFixed(2)}</b></span></div>
          <div class="divider"></div>
          <div class="row" style="font-size:11px"><span><b>EFECTIVO ESPERADO:</b></span><span><b>$${data.cajaEsperada.toFixed(2)}</b></span></div>
          ${arqueoFisicoHtml}
          
          <div class="divider"></div>
          <h3>COMPRAS A PROVEEDORES</h3>
          <table>
            <thead>
              <tr><th>PROVEEDOR</th><th style="text-align:right">TOTAL</th></tr>
            </thead>
            <tbody>${provHtml}</tbody>
          </table>
          <div class="row" style="font-size:10px; margin-top:4px;">
            <span>TOTAL COMPRAS:</span>
            <span>$${data.compras.toFixed(2)}</span>
          </div>
          <div class="row" style="font-size:9px;">
            <span>(${data.comprasDescontadas > 0 ? 'Descontado de caja' : 'No descontado del cajón'})</span>
          </div>
          
          <div class="divider"></div>
          <p>*** ${title} ***</p>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const handleCorteX = () => {
    printThermalTicket('CORTE X (PARCIAL)');
  };

  const handleReimprimirHistorico = (corte: any) => {
    printThermalTicket('REIMPRESIÓN CORTE Z', {
      caja: corte.caja || selectedCaja,
      cajero: corte.cajero || 'GENERAL',
      foliosCount: corte.ticketsCount !== undefined ? Number(corte.ticketsCount) : 0,
      fondo: Number(corte.fondoInicial) || 0,
      efectivo: Number(corte.ventasEfectivo) || 0,
      tarjeta: Number(corte.ventasTarjeta) || 0,
      transferencia: Number(corte.ventasTransferencia) || 0,
      ventas: Number(corte.totalVentas) || 0,
      cajaEsperada: Number(corte.totalEsperado) || 0,
      cajaContada: corte.totalFisico !== undefined ? Number(corte.totalFisico) : null,
      diferencia: corte.diferencia !== undefined ? Number(corte.diferencia) : null,
      compras: Number(corte.totalCompras) || 0,
      comprasDescontadas: Number(corte.comprasDescontadas) || 0,
      detalleCompras: Array.isArray(corte.comprasDetalle) ? corte.comprasDetalle : [],
      fechaHora: new Date(corte.date).toLocaleString('es-MX')
    });
  };

  const handleCorteZ = async () => {
    if (!activeTurno) {
      alert(`No hay un turno abierto para ${selectedCaja}. Debes abrir caja primero.`);
      return;
    }
    try {
      const backupData = { 
        caja: selectedCaja,
        cajero: activeUser?.name || 'ADMINISTRADOR',
        tickets, 
        corte: {
          caja: selectedCaja,
          cajero: activeUser?.name || 'ADMINISTRADOR',
          ticketsCount: tickets.length,
          ventasEfectivo,
          ventasTarjeta,
          ventasTransferencia,
          totalVentas,
          totalEsperado: efectivoEsperado,
          totalFisicoContado: efectivoFisicoVal,
          diferencia: diferenciaArqueo,
          montoInicial: fondoAplicable,
          totalCompras: totalComprasGeneral,
          comprasDescontadas: comprasADescontar,
          descontarComprasDeCaja: descontarCompras,
          comprasDetalle: provArr
        },
        date: new Date().toISOString() 
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `CORTE_Z_${selectedCaja.replace(/\s+/g, '_')}_${selectedDate}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      // Guardar el corte en db.cortes
      await db.cortes.add({
        date: new Date().toISOString(),
        caja: selectedCaja,
        cajero: activeUser?.name || 'ADMINISTRADOR',
        ticketsCount: tickets.length,
        fondoInicial: fondoAplicable,
        ventasEfectivo,
        ventasTarjeta,
        ventasTransferencia,
        totalVentas,
        totalEsperado: efectivoEsperado,
        totalFisico: efectivoFisicoVal !== null ? efectivoFisicoVal : efectivoEsperado,
        diferencia: diferenciaArqueo !== null ? diferenciaArqueo : 0,
        totalCompras: totalComprasGeneral,
        comprasDescontadas: comprasADescontar,
        descontarComprasDeCaja: descontarCompras,
        comprasDetalle: provArr
      });

      // Imprimir ticket de Corte Z
      printThermalTicket('CORTE Z (CIERRE)');

      // CERRAR EL TURNO CORRESPONDIENTE A ESTA CAJA
      if (activeTurno && activeTurno.id) {
        await db.turnos.update(activeTurno.id, {
          estado: 'CERRADO',
          fechaCierre: new Date().toISOString()
        });
      }

      alert(`Corte Z para ${selectedCaja} realizado exitosamente y turno cerrado.`);
    } catch (e) {
      console.error(e);
      alert("Error al realizar el corte Z");
    }
  };

  const handleSetAyer = () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    setSelectedDate(formatLocalDateStr(ayer));
  };

  return (
    <>
      {showHistory && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/80 backdrop-blur-sm'>
          <div className='bg-nexus-900 border border-nexus-700 w-[740px] p-6 rounded-2xl shadow-2xl'>
            <div className='flex justify-between items-center mb-6'>
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-fuchsia-400" />
                <h3 className='text-xl font-black text-white uppercase tracking-wide'>Historial de Cortes Z Guardados</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className='text-slate-400 hover:text-white font-black text-xl px-2'>✕</button>
            </div>
            <div className='space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar'>
              {historialCortes.length === 0 ? (
                <p className='text-slate-500 text-center py-8 font-bold'>No hay cortes registrados en la base de datos para {selectedCaja}.</p>
              ) : (
                historialCortes.map(corte => (
                  <div key={corte.id} className='bg-nexus-800/80 p-4 rounded-xl border border-nexus-700 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-nexus-600 transition-colors'>
                    <div className="space-y-1">
                      <div className='flex items-center gap-2.5 flex-wrap'>
                        <span className='text-white font-bold text-sm'>{new Date(corte.date).toLocaleString('es-MX')}</span>
                        <span className='bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-800/60 px-2 py-0.5 rounded text-[11px] font-black'>
                          {corte.caja || 'CAJA MÓVIL'}
                        </span>
                        {corte.cajero && (
                          <span className='text-slate-300 text-xs font-bold'>({corte.cajero})</span>
                        )}
                        <span className='text-emerald-400 font-black text-base ml-auto md:ml-0'>Ventas: ${corte.totalVentas?.toFixed(2)}</span>
                        {corte.ticketsCount !== undefined && (
                          <span className='text-cyan-400 text-xs font-black'>[{corte.ticketsCount} tickets]</span>
                        )}
                      </div>
                      <div className='text-xs text-slate-400 flex flex-wrap gap-3 font-bold'>
                        <span>Fondo: ${corte.fondoInicial?.toFixed(2)}</span>
                        <span>Efectivo: ${corte.ventasEfectivo?.toFixed(2)}</span>
                        <span>Compras: ${(corte.totalCompras ?? 0).toFixed(2)}</span>
                        <span className='text-cyan-400'>Esperado: ${(corte.totalEsperado ?? 0).toFixed(2)}</span>
                        {corte.totalFisico !== undefined && (
                          <span className='text-emerald-400'>Contado: ${Number(corte.totalFisico).toFixed(2)}</span>
                        )}
                        {corte.diferencia !== undefined && corte.diferencia !== 0 && (
                          <span className={corte.diferencia > 0 ? 'text-blue-400' : 'text-rose-400'}>
                            Dif: {corte.diferencia > 0 ? `+${corte.diferencia.toFixed(2)}` : corte.diferencia.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReimprimirHistorico(corte)}
                      className="bg-nexus-700 hover:bg-nexus-600 text-slate-200 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-colors border border-nexus-600 shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-400" /> Reimprimir Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
        {/* HEADER ADAPTABLE */}
        <div className="bg-nexus-900/70 border-b border-nexus-800 shrink-0 p-3 sm:px-6 sm:py-3.5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-fuchsia-600/20 text-fuchsia-400 rounded-xl border border-fuchsia-500/30">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-lg tracking-wider text-white">ARQUEOS Y <span className="text-fuchsia-400">CAJA Z</span></h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden sm:block">
                  {isToday ? `CORTE DE TURNO - ${selectedCaja}` : `CONSULTA HISTÓRICA: ${selectedDate} (${selectedCaja})`}
                </p>
              </div>
            </div>
            
            {/* SELECTOR DE DÍA Y ACCIONES */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1.5 bg-blue-950/80 px-2.5 py-1 rounded-xl border border-blue-700/80 shadow-inner shrink-0">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-white">{selectedCaja}</span>
              </div>

              <div className="flex items-center bg-nexus-950/80 p-1 rounded-xl border border-nexus-700 gap-1 shadow-inner shrink-0">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                    isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  HOY
                </button>
                <button
                  onClick={handleSetAyer}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                    !isToday && selectedDate === formatLocalDateStr(new Date(Date.now() - 86400000))
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AYER
                </button>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-nexus-900 rounded-lg border border-nexus-700/70">
                  <Calendar className="w-3 h-3 text-fuchsia-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer"
                    title="Seleccionar fecha para auditar corte"
                  />
                </div>
              </div>

              <button onClick={() => setShowHistory(true)} className="bg-nexus-800 hover:bg-nexus-700 text-slate-200 px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 border border-nexus-700 transition-colors shadow-md shrink-0">
                <History className="w-3.5 h-3.5 text-fuchsia-400" /> CORTES
              </button>
              <button onClick={handleCorteX} className="bg-blue-900/30 border border-blue-500/50 text-blue-400 hover:bg-blue-900/50 px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 transition-colors shadow-md shrink-0">
                <Printer className="w-3.5 h-3.5" /> CORTE X
              </button>
            </div>
          </div>
        </div>

        {/* ALERTA DE MODO CONSULTA HISTÓRICA */}
        {!isToday && (
          <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border-b border-blue-800/50 p-2.5 sm:px-6 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-bold text-blue-300 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Auditoría histórica del día <b className="text-white underline">{selectedDate}</b>.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {corteGuardadoDelDia && (
                <button
                  onClick={() => handleReimprimirHistorico(corteGuardadoDelDia)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-black text-[10px] flex items-center gap-1 shadow-md transition-colors"
                >
                  <Printer className="w-3 h-3" /> Reimprimir Corte Z
                </button>
              )}
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white px-2.5 py-1 rounded-lg border border-blue-500/50 font-black text-[10px] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Volver a Hoy
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 custom-scrollbar">
          
          {/* SI ES HOY Y NO HAY TURNO ACTIVO, MOSTRAR PANTALLA DE APERTURA */}
          {isToday && !activeTurno ? (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-300">
              <div className="bg-nexus-900 border border-nexus-700 rounded-3xl p-12 max-w-lg w-full shadow-2xl text-center">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-12 h-12 text-blue-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">Caja Cerrada ({selectedCaja})</h2>
                <p className="text-slate-400 font-bold mb-8">Debes aperturar un nuevo turno para registrar ventas y movimientos en {selectedCaja}.</p>
                
                <div className="text-left mb-8">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Monto / Fondo Inicial ({selectedCaja})</label>
                  <div className="flex items-center">
                    <span className="bg-nexus-800 text-slate-400 px-6 py-4 rounded-l-xl font-bold border border-nexus-700 border-r-0 text-xl">$</span>
                    <input 
                      type="number" 
                      value={montoInicial} 
                      onChange={e => setMontoInicial(e.target.value)}
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-6 py-4 rounded-r-xl font-black text-xl focus:outline-none focus:border-blue-500 transition-colors" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAbrirCaja}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
                >
                  ABRIR CAJA ({selectedCaja})
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-8">

              {/* COLUMNA IZQUIERDA: RESUMEN Y MÉTODOS DE PAGO */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                
                <div className="bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Banknote className="text-emerald-400" /> INGRESOS POR METODO DE PAGO ({selectedCaja} - {selectedDate})
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0b1120] rounded-xl border border-nexus-800">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-900/30 rounded-lg"><Banknote className="text-emerald-400 w-5 h-5" /></div>
                        <span className="font-bold text-slate-300">EFECTIVO</span>
                      </div>
                      <span className="font-black text-xl text-emerald-400">${ventasEfectivo.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0b1120] rounded-xl border border-nexus-800">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-900/30 rounded-lg"><CreditCard className="text-blue-400 w-5 h-5" /></div>
                        <span className="font-bold text-slate-300">TARJETA (TDC/TDD)</span>
                      </div>
                      <span className="font-black text-xl text-blue-400">${ventasTarjeta.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0b1120] rounded-xl border border-nexus-800">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-fuchsia-900/30 rounded-lg"><DollarSign className="text-fuchsia-400 w-5 h-5" /></div>
                        <span className="font-bold text-slate-300">TRANSFERENCIA / OTROS</span>
                      </div>
                      <span className="font-black text-xl text-fuchsia-400">${ventasTransferencia.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-nexus-800 flex justify-between items-center">
                    <span className="text-lg font-black text-slate-400 tracking-widest">TOTAL DE VENTAS ({selectedCaja}):</span>
                    <span className="text-3xl font-black text-white">${totalVentas.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center justify-between">
                    <span className="flex items-center gap-3">
                      <History className="text-blue-400" /> {isToday ? `ÚLTIMOS MOVIMIENTOS DEL DÍA (${selectedCaja})` : `MOVIMIENTOS REGISTRADOS EL ${selectedDate} (${selectedCaja})`}
                    </span>
                    <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-3 py-1 rounded-full">
                      {tickets.length} Folios Cobrados
                    </span>
                  </h3>
                  <table className="w-full text-left">
                    <thead className="border-b border-nexus-800">
                      <tr>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Folio</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Terminal</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cajero</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</th>
                        <th className="pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-nexus-800">
                      {tickets.slice(-10).reverse().map((t, i) => (
                        <tr key={i}>
                          <td className="py-3 text-xs font-bold text-slate-400">{new Date(t.date).toLocaleTimeString('es-MX')}</td>
                          <td className="py-3 text-xs font-mono font-black text-cyan-400">#{t.folio || (t.id ? String(t.id).slice(0,6).toUpperCase() : i)}</td>
                          <td className="py-3 text-xs font-black text-fuchsia-400">
                            <span className="bg-fuchsia-950/60 border border-fuchsia-800/40 px-2 py-0.5 rounded text-[10px]">
                              {t.caja || selectedCaja}
                            </span>
                          </td>
                          <td className="py-3 text-xs font-bold text-slate-300">{t.cajero || '-'}</td>
                          <td className="py-3 text-[10px] font-black text-slate-400 uppercase">{t.paymentMethod}</td>
                          <td className="py-3 text-sm font-black text-emerald-400 text-right">+ ${t.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      {tickets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">
                            No hay movimientos registrados para {selectedCaja} en {selectedDate}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* SECCIÓN COMPRAS A PROVEEDORES (DELIMITADAS AL DÍA) */}
                <div className='bg-nexus-900/50 border border-nexus-700 rounded-3xl p-8 shadow-xl mt-8'>
                  <div className='flex justify-between items-center mb-6'>
                    <div>
                      <h3 className='text-sm font-black text-white uppercase tracking-widest flex items-center gap-3'>
                        <ShoppingBag className='text-fuchsia-400' /> COMPRAS A PROVEEDORES ({selectedDate})
                      </h3>
                      <p className='text-slate-400 text-xs font-bold mt-1'>
                        {descontarCompras ? 'Estas compras se descontarán del cajón' : 'Compras registradas (no se descuentan del cajón de ventas)'}
                      </p>
                    </div>
                    <span className='text-xs font-black bg-fuchsia-900/50 text-fuchsia-400 px-3 py-1 rounded-full border border-fuchsia-700/50'>
                      {provArr.length} {provArr.length === 1 ? 'Proveedor' : 'Proveedores'}
                    </span>
                  </div>
                  <table className='w-full text-left'>
                    <thead className='border-b border-nexus-800'>
                      <tr>
                        <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest'>Proveedor</th>
                        <th className='pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right'>Total Pagado</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-nexus-800'>
                      {provArr.length === 0 ? (
                        <tr>
                          <td colSpan={2} className='py-8 text-center text-slate-500 font-bold'>
                            No hay compras a proveedores registradas en esta fecha.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {provArr.map((c, i) => (
                            <tr key={i}>
                              <td className='py-3 text-sm font-bold text-white'>{c.provider}</td>
                              <td className='py-3 text-sm font-black text-fuchsia-400 text-right'>$ {c.total.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className='py-4 text-sm font-black text-slate-400'>TOTAL GENERAL COMPRAS</td>
                            <td className='py-4 text-xl font-black text-fuchsia-400 text-right'>$ {totalComprasGeneral.toFixed(2)}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* COLUMNA DERECHA: FLUJO DE EFECTIVO Y ARQUEO REAL EDITABLE */}
              <div className="col-span-12 lg:col-span-4 space-y-8">
                <div className="bg-nexus-900 border border-nexus-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Lock className="w-32 h-32 text-fuchsia-400" /></div>
                  
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 relative z-10 flex items-center justify-between">
                    <span>EFECTIVO EN CAJA</span>
                    {corteGuardadoDelDia && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Corte Registrado
                      </span>
                    )}
                  </h3>

                  <div className="space-y-6 relative z-10">
                    
                    {/* FONDO DE CAJA INICIAL EDITABLE */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Edit3 className="w-3 h-3 text-blue-400" /> Fondo de Caja (Inicio)
                        </label>
                        {isToday && (
                          <span className="text-[10px] text-blue-400 font-black">Editable</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="bg-nexus-800 text-slate-400 px-4 py-3 rounded-l-xl font-bold border border-nexus-700 border-r-0">$</span>
                        <input 
                          type="number" 
                          value={fondoInput}
                          disabled={!isToday}
                          onChange={e => {
                            setFondoInput(e.target.value);
                            setIsEditingFondo(true);
                          }}
                          onBlur={handleUpdateFondo}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateFondo(); }}
                          placeholder="0.00"
                          title="Puedes modificar el fondo inicial si cambiaste dinero o abriste en ceros"
                          className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-3 rounded-r-xl font-black text-lg focus:outline-none focus:border-blue-500 transition-colors" 
                        />
                      </div>
                    </div>

                    {/* VENTAS EN EFECTIVO (+) */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Ventas en Efectivo (+)</label>
                      <div className="w-full bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-xl font-black text-lg">
                        $ {ventasEfectivo.toFixed(2)}
                      </div>
                    </div>

                    {/* COMPRAS A PROVEEDORES (-) CON CASILLA DE CONTROL */}
                    <div className="bg-[#0b1120] p-4 rounded-2xl border border-nexus-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">
                          Compras del Día {descontarCompras ? '(-)' : '(Informativo)'}
                        </label>
                        <span className="font-mono font-black text-fuchsia-400 text-base">
                          $ {totalComprasGeneral.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Checkbox selector */}
                      {isToday && (
                        <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-nexus-800/80">
                          <input 
                            type="checkbox" 
                            checked={descontarCompras} 
                            onChange={e => handleToggleDescontarCompras(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-nexus-900 border-nexus-700 cursor-pointer"
                          />
                          <span className="text-[11px] font-bold text-slate-300 select-none">
                            ¿Descontar compras del efectivo de caja?
                          </span>
                        </label>
                      )}
                      {!descontarCompras && (
                        <p className="text-[10px] text-slate-400 font-bold">
                          💡 No se descuentan del cajón (se asume pagado por transferencia o dinero externo).
                        </p>
                      )}
                    </div>

                    {/* EFECTIVO ESPERADO EN SISTEMA */}
                    <div className="pt-4 border-t border-nexus-800">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        EFECTIVO ESPERADO (SISTEMA)
                      </label>
                      <div className="w-full bg-nexus-950 border border-nexus-700 text-white px-4 py-3 rounded-xl font-mono font-black text-2xl text-center shadow-inner">
                        $ {efectivoEsperado.toFixed(2)}
                      </div>
                    </div>

                    {/* ARQUEO FÍSICO CONTADO EDITABLE */}
                    {isToday && (
                      <div className="bg-nexus-950/80 p-4 rounded-2xl border border-blue-900/40 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5" /> DINERO FÍSICO CONTADO (EN MANO)
                          </label>
                          <span className="text-[9px] bg-blue-900/50 text-blue-300 font-black px-2 py-0.5 rounded">
                            ARQUEO
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="bg-nexus-800 text-blue-400 px-4 py-3.5 rounded-l-xl font-bold border border-nexus-700 border-r-0 text-xl">$</span>
                          <input 
                            type="number"
                            step="any"
                            value={efectivoContadoInput}
                            onChange={e => setEfectivoContadoInput(e.target.value)}
                            placeholder={efectivoEsperado.toFixed(2)}
                            className="w-full bg-[#0b1120] border border-nexus-700 text-emerald-400 px-4 py-3.5 rounded-r-xl font-black text-2xl focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* DIFERENCIA EN TIEMPO REAL */}
                        {diferenciaArqueo !== null && (
                          <div className={`p-3 rounded-xl border text-center font-black text-xs flex items-center justify-center gap-2 ${
                            Math.abs(diferenciaArqueo) < 0.01
                              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400'
                              : diferenciaArqueo > 0
                                ? 'bg-cyan-950/70 border-cyan-800 text-cyan-300'
                                : 'bg-rose-950/70 border-rose-800 text-rose-400'
                          }`}>
                            {Math.abs(diferenciaArqueo) < 0.01 ? (
                              <span>✅ CAJA CUADRADA EXACTA ($0.00)</span>
                            ) : diferenciaArqueo > 0 ? (
                              <span>🟢 SOBRANTE EN CAJA: +${diferenciaArqueo.toFixed(2)}</span>
                            ) : (
                              <span>🔴 FALTANTE EN CAJA: -${Math.abs(diferenciaArqueo).toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* BOTÓN REALIZAR CORTE Z (SOLO EN EL DÍA DE HOY) */}
                {isToday ? (
                  <button 
                    onClick={handleCorteZ} 
                    className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-3"
                  >
                    <Lock className="w-6 h-6" /> REALIZAR CORTE Z
                  </button>
                ) : (
                  <div className="p-4 bg-nexus-900/80 border border-nexus-800 rounded-2xl text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">
                      {corteGuardadoDelDia 
                        ? `Corte Z ya cerrado para el día ${selectedDate}` 
                        : `No se cerró turno Z en la fecha ${selectedDate}`}
                    </p>
                    {corteGuardadoDelDia && (
                      <button
                        onClick={() => handleReimprimirHistorico(corteGuardadoDelDia)}
                        className="w-full bg-nexus-800 hover:bg-nexus-700 text-blue-400 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 border border-nexus-700 transition-colors"
                      >
                        <Printer className="w-4 h-4" /> REIMPRIMIR CORTE Z GUARDADO
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
