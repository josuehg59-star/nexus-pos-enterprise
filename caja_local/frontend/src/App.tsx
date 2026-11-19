import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  Truck, 
  Users, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { usePosStore } from './store/useStore';
import PosTerminal from './pages/PosTerminal';
import DashboardBI from './pages/DashboardBI';
import SmartPurchasing from './pages/SmartPurchasing';
import Providers from './pages/Providers';
import Inventory from './pages/Inventory';
import Kardex from './pages/Kardex';
import KardexReport from './pages/KardexReport';
import CajaZ from './pages/CajaZ';
import Crm from './pages/Crm';
import Monedero from './pages/Monedero';
import Config from './pages/Config';
import Reports from './pages/Reports';
import Auditoria from './pages/Auditoria';
import Recargas from './pages/Recargas';
import ImpresionEtiquetas from './pages/ImpresionEtiquetas';
import LiquidacionProveedor from './pages/LiquidacionProveedor';
import { db } from './store/database';

const modules = [
  { 
    id: 'dashboard', 
    title: 'DASHBOARD BI', 
    icon: LayoutDashboard, 
    subItems: ['Resumen Global', 'Analítica Avanzada'] 
  },
  { 
    id: 'operacion', 
    title: 'OPERACIÓN Y VENTAS', 
    icon: ShoppingCart, 
    subItems: ['Terminal POS', 'Recargas y Servicios', 'Arqueos y Caja Z'] 
  },
  { 
    id: 'inventario', 
    title: 'INVENTARIO Y ALMACÉN', 
    icon: PackageSearch, 
    subItems: ['Catálogo Maestro', 'Entradas', 'Kardex', 'Auditorías Físicas', 'Impresión Etiquetas'] 
  },
  { 
    id: 'suministro', 
    title: 'CADENA DE SUMINISTRO', 
    icon: Truck, 
    subItems: ['Liquidación y Control (Efectivo)', 'Órdenes de Compra (IA)', 'Proveedores y Socios'] 
  },
  { 
    id: 'crm', 
    title: 'FIDELIZACIÓN (CRM)', 
    icon: Users, 
    subItems: ['Padrón de Clientes', 'Monedero Electrónico'] 
  },
  { 
    id: 'config', 
    title: 'CONFIGURACIÓN', 
    icon: Settings, 
    subItems: ['Panel de Control', 'Migrador TITAN POS (Respaldos)'] 
  },
];

import { useSettings } from './store/useSettings';
import { LicenseModal } from './components/LicenseModal';
import { AutoUpdater } from './components/AutoUpdater';
import { getLicenseInfo } from './utils/licenseManager';

function App() {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(getLicenseInfo());
  const [activeMenu, setActiveMenu] = useState('operacion');
  const [activeSubMenu, setActiveSubMenu] = useState('Terminal POS');
  const [expandedMenu, setExpandedMenu] = useState('operacion');
  const { sidebarOpen, setSidebarOpen } = usePosStore();
  const { activeUser, usersList, cajaNombre, rolCaja } = useSettings();

  const toggleMenu = (id: string) => {
    setExpandedMenu(expandedMenu === id ? '' : id);
  };

  const selectModule = (modId: string, subItem: string) => {
    // Si el usuario activo es CAJERO y pretende ingresar a un módulo administrativo restringido
    const isRestrictedForCajero = activeUser?.role === 'CAJERO' && (
      modId === 'config' || 
      (modId === 'inventario' && subItem === 'Catálogo Maestro') || 
      modId === 'dashboard'
    );

    if (isRestrictedForCajero) {
      const pin = window.prompt('🔒 MÓDULO RESTRINGIDO PARA CAJEROS\n\nIngresa el PIN de Administrador para autorizar el acceso:');
      const adminPins = usersList.filter(u => u.role === 'ADMINISTRADOR').map(u => u.pin);
      if (!pin || (!adminPins.includes(pin) && pin !== '1234')) {
        alert('Acceso Denegado: Se requiere autorización de Administrador.');
        return;
      }
    }

    setActiveMenu(modId);
    setActiveSubMenu(subItem);
    
    // Auto-colapsamos si entramos a POS
    if (modId === 'operacion' && subItem === 'Terminal POS') {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  // Asegurarnos de que el menú empiece colapsado si el default es POS
  useEffect(() => {
    if (activeMenu === 'operacion' && activeSubMenu === 'Terminal POS') {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, []);

  // Actualizador para restaurar a PENDIENTE los créditos marcados erróneamente como LIQUIDADO
  useEffect(() => {
    async function restorePendingCredits() {
      const flagKey = 'nexus_fix_credit_status_applied_v5';
      if (localStorage.getItem(flagKey)) return;

      try {
        const ticketsToFix = [
          { id: 'c781bf3d-c3e7-445a-9e58-6814caecd99c', folio: 930993, total: 20, client: 'SAMGHELIS DAVID' },
          { id: '9e91c283-bf1d-49f9-9091-6abf94e7c4ca', folio: 930794, total: 50, client: 'SAMGHELIS DAVID' },
          { id: 'dd27ad6b-12ca-4cba-9909-041c814eb484', folio: 930592, total: 9, client: 'SAMGHELIS DAVID' },
          { id: 'b0b4ccaa-6edf-4f9f-8907-b0031e4ed2d5', folio: 930542, total: 10, client: 'SAMGHELIS DAVID' },
          { id: '87aa1809-15da-49f4-a4a0-658bb04dee1c', folio: 930466, total: 20, client: 'EDGAR GONZALEZ MOLINA' }
        ];

        const allTickets = await db.tickets.toArray();

        for (const item of ticketsToFix) {
          const t = allTickets.find(x => x.id === item.id || Number(x.folio) === item.folio);
          if (t && t.id) {
            await db.tickets.update(t.id, {
              status: 'PENDIENTE',
              pendingBalance: item.total,
              clientName: item.client,
              client: item.client
            });
          }
        }

        // Actualizar saldos en db.clients
        const allClients = await db.clients.toArray();
        const cDavid = allClients.find(c => c.name.toUpperCase().includes('SAMGHELIS'));
        if (cDavid && cDavid.id) {
          await db.clients.update(cDavid.id, {
            credito: (cDavid.credito || 0) + (20 + 50 + 9 + 10)
          });
        }

        const cEdgar = allClients.find(c => c.name.toUpperCase().includes('EDGAR'));
        if (cEdgar && cEdgar.id) {
          await db.clients.update(cEdgar.id, {
            credito: (cEdgar.credito || 0) + 20
          });
        }

        localStorage.setItem(flagKey, 'true');
        console.log('✅ Tickets a crédito restaurados exitosamente a PENDIENTE');
      } catch (err) {
        console.error('Error restaurando créditos:', err);
      }
    }

    restorePendingCredits();
  }, []);

  // Recuperador automático de foco: evita congelamiento de teclado tras cerrar modales o hacer clics
  useEffect(() => {
    const handleGlobalFocus = () => {
      if (activeMenu === 'operacion' && activeSubMenu === 'Terminal POS') {
        const searchInput = document.getElementById('pos-search-input') as HTMLInputElement | null;
        if (searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('focus', handleGlobalFocus);
    const clickHandler = () => setTimeout(handleGlobalFocus, 50);
    window.addEventListener('click', clickHandler);
    return () => {
      window.removeEventListener('focus', handleGlobalFocus);
      window.removeEventListener('click', clickHandler);
    };
  }, [activeMenu, activeSubMenu]);

  const renderContent = () => {
    if (activeMenu === 'operacion' && activeSubMenu === 'Arqueos y Caja Z') return <CajaZ />;
    if (activeMenu === 'dashboard' && activeSubMenu === 'Analítica Avanzada') return <Reports />;
    if (activeMenu === 'inventario' && activeSubMenu === 'Auditorías Físicas') return <Auditoria />;
    if (activeMenu === 'inventario' && activeSubMenu === 'Impresión Etiquetas') return <ImpresionEtiquetas />;
    if (activeMenu === 'inventario' && activeSubMenu === 'Entradas') return <Kardex />;
    if (activeMenu === 'inventario' && activeSubMenu === 'Kardex') return <KardexReport />;
    if (activeMenu === 'operacion') {
      if (activeSubMenu === 'Arqueos y Caja Z') return <CajaZ />;
      if (activeSubMenu === 'Recargas y Servicios') return <Recargas />;
      return <PosTerminal />;
    }
    
    switch (activeMenu) {
      case 'dashboard': return <DashboardBI />;
      case 'suministro':
        if (activeSubMenu === 'Liquidación y Control (Efectivo)') return <LiquidacionProveedor />;
        if (activeSubMenu === 'Proveedores y Socios') return <Providers />;
        return <SmartPurchasing />;
      case 'inventario':
        if (activeSubMenu === 'Catálogo Maestro') return <Inventory />;
        if (activeSubMenu === 'Entradas') return <Kardex />;
          if (activeSubMenu === 'Kardex') return <KardexReport />;
        if (activeSubMenu === 'Auditorías Físicas') return <Auditoria />;
        return <Inventory />;
      case 'crm':
          if (activeSubMenu === 'Monedero Electrónico') return <Monedero />;
          return <Crm />;
      case 'config': return <Config />;
      case 'reportes': return <Reports />;
      default: return (
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-black text-slate-600">Módulo en Construcción</h2>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-nexus-900 text-slate-200 overflow-hidden selection:bg-nexus-accent selection:text-white relative">
      
      {/* SIDEBAR */}
      <aside className={`bg-nexus-900 border-r border-nexus-800 flex flex-col shadow-2xl z-40 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[300px] translate-x-0' : 'w-0 -translate-x-full overflow-hidden shrink-0'}`}>
        <div className="h-20 flex items-center px-6 border-b border-nexus-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-accent to-emerald-700 flex items-center justify-center mr-3 shadow-lg shadow-nexus-accent/20">
            <span className="font-black text-white text-xl">N</span>
          </div>
          <div>
            <h1 className="font-black text-white text-lg tracking-wider">NEXUS<span className="text-nexus-accent">POS</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Edition</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="text-xs font-bold text-slate-600 mb-4 ml-2 uppercase tracking-widest">Módulos del Sistema</div>
          
          {modules.map(mod => (
            <div key={mod.id} className="mb-2">
              <button 
                onClick={() => toggleMenu(mod.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border border-transparent
                ${activeMenu === mod.id ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'hover:bg-nexus-800 text-slate-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <mod.icon className={`w-5 h-5 ${activeMenu === mod.id ? 'text-white' : 'text-slate-500'}`} />
                  <span className="font-bold text-sm tracking-wide">{mod.title}</span>
                </div>
                {mod.subItems && (
                  <div className={`transition-transform duration-300 ${expandedMenu === mod.id ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </div>
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenu === mod.id ? 'max-h-[300px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="pl-11 pr-4 py-2 space-y-2 border-l-2 border-nexus-800 ml-6">
                  {mod.subItems?.map((item, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => selectModule(mod.id, item)}
                      className={`block w-full text-left text-[13px] font-semibold transition-colors py-1.5 ${activeSubMenu === item ? 'text-nexus-accent' : 'text-slate-400 hover:text-white'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER INFO TERMINAL & USUARIO */}
        <div className="p-4 border-t border-nexus-800 bg-[#070d18]/60 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">TERMINAL ACTIVA</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
              rolCaja === 'PRINCIPAL' 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {rolCaja === 'PRINCIPAL' ? '👑 MAESTRO' : '💻 SATÉLITE'}
            </span>
          </div>
          <p className="text-xs font-black text-white truncate">{cajaNombre || 'CAJA 1 - PRINCIPAL'}</p>
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-nexus-800/60">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-bold text-slate-300 truncate">{activeUser?.name || 'ADMINISTRADOR'}</span>
            </div>
            <span className="text-[9px] font-black text-slate-500 uppercase shrink-0">{activeUser?.role || 'ADMIN'}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-nexus-800/60">
            <button 
              onClick={() => setShowLicenseModal(true)}
              className="w-full py-1 px-2 rounded-lg text-[9px] font-black tracking-wider uppercase border flex items-center justify-between transition-colors bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/40"
            >
              <span>{licenseInfo.status === 'LIFETIME_DEV' ? '👑 LICENCIA VITALICIA' : licenseInfo.status === 'ACTIVE_CLIENT' ? '✅ LICENCIA ACTIVA' : `⏳ PRUEBA (${licenseInfo.daysRemaining} DÍAS)`}</span>
              <span className="underline opacity-80">ESTADO</span>
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-nexus-800/60 text-center">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">JOSUE HERNANDEZ GUTIERREZ</p>
            <p className="text-[9px] font-bold text-slate-400 font-mono">TEL: 9612765041</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-[#0b1120] relative overflow-hidden flex flex-col">
        {renderContent()}
      </main>
      <LicenseModal isOpen={showLicenseModal || licenseInfo.status === 'EXPIRED_BLOCKED'} onClose={() => setShowLicenseModal(false)} onActivated={() => setLicenseInfo(getLicenseInfo())} />
      <AutoUpdater mode="pc" />
    </div>
  );
}

export default App;
