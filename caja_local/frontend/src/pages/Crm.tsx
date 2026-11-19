import { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2, CreditCard } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import type { Client } from '../store/database';

export default function Crm() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [monederoCode, setMonederoCode] = useState('');

  const clients = useLiveQuery(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      return db.clients.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        !!(c.monederoCode && c.monederoCode.includes(lower))
      ).toArray();
    }
    return db.clients.toArray();
  }, [searchQuery]) || [];

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setName(client.name);
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setMonederoCode(client.monederoCode || '');
    } else {
      setEditingClient(null);
      setName('');
      setPhone('');
      setEmail('');
      setMonederoCode('');
    }
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!name) return alert('El nombre es obligatorio');
    
    // Si no se asigna código manualmente, generamos uno por defecto tipo tarjeta
    const finalMonederoCode = monederoCode.trim() || `NEXUS-${Date.now().toString().slice(-6)}`;

    const data = {
      name: name.toUpperCase(),
      phone,
      email,
      type: 'General',
      monederoCode: finalMonederoCode
    };

    if (editingClient && editingClient.id) {
      await db.clients.update(editingClient.id, data);
    } else {
      await db.clients.add({
        ...data,
        monedero: 0,
        credito: 0
      });
    }
    setShowAddModal(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await db.clients.delete(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      <div className="h-24 flex items-center justify-between px-8 bg-nexus-900/50 backdrop-blur-md border-b border-nexus-800 shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-fuchsia-500" />
          <div>
            <h2 className="font-black text-2xl tracking-wider text-white">PADRÓN DE <span className="text-fuchsia-500">CLIENTES (CRM)</span></h2>
            <p className="text-slate-400 text-sm">GESTIÓN DE LEALTAD Y MONEDERO ELECTRÓNICO</p>
          </div>
        </div>
        <button onClick={() => openModal()} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-fuchsia-600/20 transition-colors">
          <UserPlus className="w-4 h-4" /> NUEVO CLIENTE
        </button>
      </div>

      <div className="p-6">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar cliente por nombre o tarjeta monedero..." className="w-full bg-nexus-900/50 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:outline-none focus:border-fuchsia-500 transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6">
        <div className="bg-nexus-900/30 border border-nexus-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-nexus-900 border-b border-nexus-800">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">NOMBRE</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">TELÉFONO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TARJETA MONEDERO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">SALDO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TIPO</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexus-800/50">
              {clients.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-bold">Sin clientes registrados</td></tr>
              ) : clients.map((client: Client, idx: number) => (
                <tr key={idx} className="hover:bg-nexus-800/30 transition-colors">
                  <td className="p-4 font-black text-white">{client.name}</td>
                  <td className="p-4 text-slate-300">{client.phone || '-'}</td>
                  <td className="p-4 text-center">
                    <span className="flex items-center justify-center gap-2 text-fuchsia-400 font-mono text-sm bg-fuchsia-900/20 px-2 py-1 rounded">
                      <CreditCard className="w-4 h-4" /> {client.monederoCode || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-emerald-400 font-black">${(client.monedero || 0).toFixed(2)}</td>
                  <td className="p-4 text-center"><span className="bg-fuchsia-900/50 text-fuchsia-400 border border-fuchsia-900 text-xs font-black px-3 py-1 rounded-full">{client.type}</span></td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => openModal(client)} className="border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id!)} className="border border-red-900/50 text-red-500 hover:bg-red-900/30 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl p-8 w-[480px] shadow-2xl">
            <h3 className="font-black text-xl text-white mb-6">{editingClient ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">NOMBRE *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-nexus-800 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-fuchsia-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">NÚMERO DE TARJETA MONEDERO</label>
                <input type="text" value={monederoCode} onChange={e => setMonederoCode(e.target.value)} placeholder="Ej. Escanea el código aquí, o se generará uno solo" className="w-full bg-nexus-800 border border-fuchsia-900/50 text-fuchsia-400 px-4 py-3 rounded-xl font-mono focus:border-fuchsia-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">TELÉFONO</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-nexus-800 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-fuchsia-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">EMAIL</label>
                  <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-nexus-800 border border-nexus-700 text-white px-4 py-3 rounded-xl font-bold focus:border-fuchsia-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">CANCELAR</button>
              <button onClick={handleSave} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-colors">GUARDAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
