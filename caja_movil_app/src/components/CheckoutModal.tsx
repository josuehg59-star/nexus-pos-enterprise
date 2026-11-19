import React, { useState } from 'react';
import { type MobileCartItem } from '../db';
import { X, CheckCircle, Share2, Banknote, CreditCard, ArrowRightLeft, Clock } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MobileCartItem[];
  total: number;
  onConfirmSale: (paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MERCADO PAGO' | 'CLIP' | 'BANCO', received: number, change: number, clientName?: string) => Promise<string | void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  total,
  onConfirmSale
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MERCADO PAGO' | 'CLIP' | 'BANCO'>('EFECTIVO');
  const [receivedStr, setReceivedStr] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleSuccessFolio, setSaleSuccessFolio] = useState<string | null>(null);

  if (!isOpen) return null;

  const received = parseFloat(receivedStr) || 0;
  const change = paymentMethod === 'EFECTIVO' ? Math.max(0, received - total) : 0;
  const canComplete = paymentMethod !== 'EFECTIVO' || received >= total;

  const handleQuickCash = (amount: number) => {
    setReceivedStr(String(amount));
  };

  const handleFinish = async () => {
    if (!canComplete) return;
    setIsProcessing(true);
    try {
      const folio = await onConfirmSale(paymentMethod, received || total, change, clientName.trim() || undefined);
      if (folio) {
        setSaleSuccessFolio(folio);
      } else {
        onClose();
      }
    } catch (e) {
      alert('Error registrando la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!saleSuccessFolio) return;
    const itemsText = items.map(it => `• ${it.quantity}x ${it.product.name} = $${it.subtotal.toFixed(2)}`).join('%0A');
    const msg = `*COMPROBANTE DE COMPRA - NEXUS POS*%0A%0A*Folio:* %23${saleSuccessFolio}%0A*Total:* $${total.toFixed(2)}%0A*Pago:* ${paymentMethod}%0A%0A*Artículos:*%0A${itemsText}%0A%0A_¡Gracias por su compra!_`;
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 bg-slate-800/80 border-b border-slate-700">
          <div>
            <h2 className="text-white font-black text-base">COBRAR VENTA</h2>
            <p className="text-xs text-slate-400">{items.length} productos en carrito</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saleSuccessFolio ? (
          /* Pantalla de Venta Exitosa */
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white">¡VENTA COMPLETADA!</h3>
            <p className="text-sm text-slate-300">
              Folio registrado: <span className="font-bold text-emerald-400">#{saleSuccessFolio}</span>
            </p>
            {paymentMethod === 'EFECTIVO' && change > 0 && (
              <div className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-xs text-slate-400 block">CAMBIO A ENTREGAR:</span>
                <span className="text-2xl font-black text-emerald-400">${change.toFixed(2)}</span>
              </div>
            )}

            <div className="w-full grid grid-cols-1 gap-2 pt-4">
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-sm"
              >
                <Share2 className="w-4 h-4" /> ENVIAR TICKET POR WHATSAPP
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm"
              >
                NUEVA VENTA
              </button>
            </div>
          </div>
        ) : (
          /* Proceso de Cobro */
          <div className="p-4 overflow-y-auto space-y-4">
            
            {/* Total Destacado */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-800 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-emerald-400 block uppercase">TOTAL A COBRAR</span>
                <span className="text-3xl font-black text-white">${total.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">ARTÍCULOS</span>
                <span className="text-lg font-bold text-slate-200">
                  {items.reduce((acc, it) => acc + it.quantity, 0)} pzas
                </span>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">FORMA DE PAGO</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote, color: 'text-emerald-400' },
                  { id: 'MERCADO PAGO', label: 'Mercado Pago Point', icon: CreditCard, color: 'text-blue-400' },
                  { id: 'CLIP', label: 'Terminal Clip', icon: CreditCard, color: 'text-amber-400' },
                  { id: 'TARJETA', label: 'Tarjeta Banco (BBVA/Banorte)', icon: CreditCard, color: 'text-purple-400' },
                  { id: 'TRANSFERENCIA', label: 'Transferencia SPEI', icon: ArrowRightLeft, color: 'text-cyan-400' },
                  { id: 'CREDITO', label: 'Crédito / Fiado', icon: Clock, color: 'text-rose-400' }
                ].map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border font-bold text-xs transition-all ${
                        active 
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300' 
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Efectivo recibido y cambio */}
            {paymentMethod === 'EFECTIVO' && (
              <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">EFECTIVO RECIBIDO</label>
                  {received > 0 && (
                    <span className={`text-xs font-bold ${received >= total ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {received >= total ? `Cambio: $${change.toFixed(2)}` : `Faltan: $${(total - received).toFixed(2)}`}
                    </span>
                  )}
                </div>

                <input 
                  type="number"
                  inputMode="decimal"
                  placeholder={`$${total.toFixed(2)}`}
                  value={receivedStr}
                  onChange={(e) => setReceivedStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg font-black focus:outline-none focus:border-emerald-500"
                />

                {/* Botones de efectivo rápido */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    total,
                    Math.ceil(total / 50) * 50 || 50,
                    Math.ceil(total / 100) * 100 || 100,
                    Math.ceil(total / 200) * 200 || 200
                  ]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 4)
                    .map((quickVal) => (
                      <button
                        key={quickVal}
                        type="button"
                        onClick={() => handleQuickCash(quickVal)}
                        className="py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg border border-slate-600"
                      >
                        ${quickVal}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Cliente (Opcional o Requerido si es Crédito) */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                {paymentMethod === 'CREDITO' ? 'CLIENTE A CARGAR DEUDA *' : 'CLIENTE (OPCIONAL)'}
              </label>
              <input 
                type="text"
                placeholder={paymentMethod === 'CREDITO' ? 'Nombre del cliente deudor' : 'Público General'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Botón de Confirmación */}
            <div className="pt-2">
              <button
                disabled={!canComplete || isProcessing || (paymentMethod === 'CREDITO' && !clientName.trim())}
                onClick={handleFinish}
                className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg ${
                  canComplete && (!isProcessing && (paymentMethod !== 'CREDITO' || clientName.trim()))
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'PROCESANDO...' : `CONFIRMAR COBRO $${total.toFixed(2)}`}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
