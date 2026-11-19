import { useState } from 'react';
import { Smartphone, Zap, Droplet, MonitorPlay } from 'lucide-react';
import { usePosStore } from '../store/useStore';

export default function Recargas() {
  const { addToCart } = usePosStore();
  const [telefono, setTelefono] = useState('');
  const [monto, setMonto] = useState('');
  const [compania, setCompania] = useState('TELCEL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [customServices, setCustomServices] = useState<{id: string, icon: any, color: string}[]>([]);

  const companias = [
    ...customServices,
    { id: 'TELCEL', icon: Smartphone, color: 'text-blue-500' },
    { id: 'MOVISTAR', icon: Smartphone, color: 'text-emerald-500' },
    { id: 'AT&T', icon: Smartphone, color: 'text-orange-500' },
    { id: 'CFE LUZ', icon: Zap, color: 'text-yellow-400' },
    { id: 'AGUA', icon: Droplet, color: 'text-cyan-400' },
    { id: 'NETFLIX', icon: MonitorPlay, color: 'text-red-500' },
  ];

  const handleProcesar = () => {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) return alert('Ingresa un monto válido');

    let price = montoNum;
    let cost = montoNum;
    let sku = 'SRV-' + compania;
    let name = 'PAGO DE SERVICIO: ' + compania + (telefono ? ' (' + telefono + ')' : '');

    const isRecarga = ['TELCEL', 'MOVISTAR', 'AT&T', 'UNEFON', 'BAIT', 'VIRGIN'].includes(compania.toUpperCase());
    const isRetiro = compania.toUpperCase().includes('RETIRO');

    if (isRecarga) {
      // RECARGA: $2 al cliente, 5% bonificación MP
      const comisionMP = montoNum * 0.05;
      price = montoNum + 2;
      cost = Math.max(0, montoNum - comisionMP);
      sku = `REC-${compania}-${montoNum}`;
      name = `RECARGA ${compania} $${montoNum}` + (telefono ? ` (Tel: ${telefono})` : '');
    } else if (isRetiro) {
      // RETIRO: $45 comisión
      price = montoNum + 45;
      cost = montoNum;
      sku = `RET-EFECTIVO-${montoNum}`;
      name = `RETIRO DE EFECTIVO ($${montoNum}) + COMISIÓN`;
    } else {
      // SERVICIO: $25 comisión
      price = montoNum + 25;
      cost = montoNum;
      sku = `SRV-${compania}`;
      name = `PAGO DE SERVICIO ${compania}` + (telefono ? ` (Ref: ${telefono})` : '');
    }

    addToCart({
      id: Date.now(),
      sku,
      name,
      price,
      cost,
      stock: 9999,
      category: isRecarga ? 'RECARGAS' : isRetiro ? 'RETIROS' : 'SERVICIOS',
      status: 'ACTIVO'
    });

    alert(`¡Agregado al carrito de la caja principal para su cobro!\n\nCobro al cliente: $${price.toFixed(2)} MXN\nGanancia esperada: $${(price - cost).toFixed(2)} MXN`);
    setTelefono('');
    setMonto('');
  };

  return (
    <>
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/80 backdrop-blur-sm">
          <div className="bg-nexus-900 border border-nexus-700 w-[400px] p-6 rounded-2xl shadow-2xl">
            <h3 className="text-xl font-black text-white mb-4">NUEVO SERVICIO</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nombre del Servicio</label>
                <input type="text" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Ej: IZZI" className="w-full bg-[#0b1120] border border-nexus-700 text-white px-4 py-2 rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-nexus-800 hover:bg-nexus-700 text-white rounded-xl text-xs font-bold">CANCELAR</button>
              <button onClick={() => { if(newServiceName) { setCustomServices([...customServices, { id: newServiceName.toUpperCase(), icon: MonitorPlay, color: 'text-fuchsia-400' }]); setShowAddModal(false); setNewServiceName(''); } }} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-black">GUARDAR SERVICIO</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-fuchsia-500" />
            <div>
              <h2 className="font-black text-2xl tracking-wider text-white">RECARGAS Y PAGO DE SERVICIOS</h2>
              <p className="text-slate-400 text-sm">VENDE TIEMPO AIRE Y COBRA RECIBOS</p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-nexus-800 hover:bg-nexus-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase transition-colors border border-nexus-700 shadow-lg">CREAR / MODIFICAR SERVICIO</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-nexus-900/50 border border-nexus-800 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Selecciona el Servicio</h3>
            <div className="grid grid-cols-3 gap-4">
              {companias.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setCompania(c.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${compania === c.id ? 'bg-fuchsia-900/30 border-fuchsia-500' : 'bg-nexus-800 border-nexus-700 hover:border-nexus-500'}`}
                >
                  <c.icon className={`w-8 h-8 mb-2 ${c.color}`} />
                  <span className="font-black text-[10px] uppercase tracking-widest">{c.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-nexus-900/50 border border-nexus-800 p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Datos del Cobro ({compania})</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Numero / Referencia (Opcional)</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 5512345678" className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Monto a Cobrar ($)</label>
                <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-fuchsia-500 transition-colors font-bold text-2xl" />
              </div>

              <button onClick={handleProcesar} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-fuchsia-600/20 transition-colors mt-4">
                AGREGAR AL CARRITO
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
