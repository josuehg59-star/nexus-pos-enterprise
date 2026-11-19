import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../store/database';
import type { Provider } from '../store/database';
import { Search, Plus, Edit2, Trash2, Save, X, Phone, Mail, MapPin, User, FileText } from 'lucide-react';

export default function Providers() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [rfc, setRfc] = useState('');

  const providers = useLiveQuery(() => {
    let q = db.providers.toCollection();
    return q.toArray().then(arr => {
      if (search) {
        const s = search.toLowerCase();
        arr = arr.filter(p => 
          p.name.toLowerCase().includes(s) || 
          p.contact.toLowerCase().includes(s) ||
          p.phone.includes(s) ||
          (p.rfc && p.rfc.toLowerCase().includes(s))
        );
      }
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [search]);

  const openModal = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setName(provider.name);
      setPhone(provider.phone);
      setEmail(provider.email);
      setContact(provider.contact);
      setAddress(provider.address);
      setRfc(provider.rfc || '');
    } else {
      setEditingProvider(null);
      setName('');
      setPhone('');
      setEmail('');
      setContact('');
      setAddress('');
      setRfc('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const saveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = { name, phone, email, contact, address, rfc };
    if (editingProvider?.id) {
      await db.providers.update(editingProvider.id, data);
    } else {
      await db.providers.add(data);
    }
    closeModal();
  };

  const deleteProvider = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      await db.providers.delete(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200">
      <div className="p-6 border-b border-nexus-800 flex justify-between items-center bg-nexus-900/50 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black text-white tracking-wider">GESTIÓN DE <span className="text-blue-500">PROVEEDORES</span></h2>
          <p className="text-slate-400 text-sm mt-1">Administra tu cartera de proveedores y socios comerciales.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-nexus-800/50 border border-nexus-700 text-white pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" /> NUEVO PROVEEDOR
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers?.map(provider => (
            <div key={provider.id} className="bg-nexus-800/50 border border-nexus-700 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white truncate pr-4">{provider.name}</h3>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openModal(provider)} className="text-slate-400 hover:text-blue-400 transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteProvider(provider.id!)} className="text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{provider.contact || 'Sin contacto registrado'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-mono text-sm">{provider.rfc || 'Sin RFC'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{provider.phone || 'Sin teléfono'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="truncate">{provider.address || 'Sin dirección'}</span>
                </div>
              </div>
            </div>
          ))}

          {providers?.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron proveedores</p>
              <p className="text-sm">Haz clic en "Nuevo Proveedor" para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-nexus-900 border border-nexus-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-nexus-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingProvider ? 'EDITAR PROVEEDOR' : 'NUEVO PROVEEDOR'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={saveProvider} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Nombre Comercial / Empresa *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">RFC</label>
                  <input 
                    type="text" 
                    value={rfc} 
                    onChange={(e) => setRfc(e.target.value)}
                    className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Teléfono</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Contacto (Nombre)</label>
                  <input 
                    type="text" 
                    value={contact} 
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Dirección Completa</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-nexus-800 border border-nexus-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-nexus-800 transition-colors"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Save className="w-5 h-5" /> GUARDAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
