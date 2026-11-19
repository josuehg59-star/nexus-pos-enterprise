import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageSearch, 
  Truck, 
  Users, 
  Settings,
  ChevronDown,
  Menu,
  X
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
import { useSettings } from './store/useSettings';
import { LicenseModal } from './components/LicenseModal';
import { getLicenseInfo } from './utils/licenseManager';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary atrapó un error en el módulo:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0b1120] text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 text-3xl font-black">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">
            Detalle al Cargar el Módulo
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mb-5 font-mono">
            {this.state.error?.message || 'Error inesperado al renderizar el módulo'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => {
                if (this.props.onReset) this.props.onReset();
                else window.location.reload();
              }}
              className="px-5 py-2.5 bg-nexus-800 hover:bg-nexus-700 text-slate-200 rounded-xl font-black text-xs uppercase active:scale-95 transition-all"
            >
              🛒 Ir a Caja
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const modules = [
  { 
    id: 'operacion', 
    title: 'OPERACIÓN Y VENTAS', 
    icon: ShoppingCart, 
    subItems: ['Terminal POS', 'Recargas y Servicios', 'Arqueos y Caja Z'] 
  },
  { 
    id: 'dashboard', 
    title: 'DASHBOARD BI', 
    icon: LayoutDashboard, 
    subItems: ['Resumen Global', 'Analítica Avanzada'] 
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

export function App() {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(getLicenseInfo());
  const [activeMenu, setActiveMenu] = useState('operacion');
  const [activeSubMenu, setActiveSubMenu] = useState('Terminal POS');
  const [expandedMenu, setExpandedMenu] = useState('operacion');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { sidebarOpen, setSidebarOpen } = usePosStore();
  const { activeUser } = useSettings();

  const toggleMenu = (id: string) => {
    setExpandedMenu(expandedMenu === id ? '' : id);
  };

  const selectModule = (modId: string, subItem: string) => {
    setActiveMenu(modId);
    setActiveSubMenu(subItem);
    
    // 🌟 Cerrar automáticamente el menú lateral al seleccionar un módulo para dejar la pantalla limpia
    setMobileMenuOpen(false);
    setSidebarOpen(false);
  };

  useEffect(() => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
  }, []);

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
      case 'dashboard': return <DashboardBI onNavigate={(mod, sub) => selectModule(mod, sub)} />;
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
          <h2 className="text-2xl font-black text-slate-600">Módulo en Construcción</h2>
        </div>
      );
    }
  };

  const isMenuOpen = mobileMenuOpen || sidebarOpen;
  const closeMenu = () => {
    setMobileMenuOpen(false);
    setSidebarOpen(false);
  };
  const toggleMenuVisibility = () => {
    const next = !isMenuOpen;
    setMobileMenuOpen(next);
    setSidebarOpen(next);
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] bg-nexus-900 text-slate-200 overflow-hidden relative font-sans">

      {/* BACKDROP PARA MÓVIL CUANDO EL MENÚ ESTÁ ABIERTO */}
      {isMenuOpen && (
        <div 
          onClick={closeMenu}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* SIDEBAR COMPLETO (DESLIZABLE EN MÓVIL / FIJO EN TABLET GRANDE O PC) */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 bg-nexus-900 border-r border-nexus-800 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out w-[270px] sm:w-[290px] ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-nexus-800 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
              <span className="font-black text-white text-lg">N</span>
            </div>
            <div>
              <h1 className="font-black text-white text-base tracking-wider flex items-center gap-1">
                <span>NEXUS</span><span className="text-emerald-400">POS</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">MÓVIL</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Edition</p>
            </div>
          </div>
          <button 
            onClick={closeMenu}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-1">
          <div className="text-[10px] font-black text-slate-500 mb-2 ml-2 uppercase tracking-widest">
            MÓDULOS DEL SISTEMA
          </div>
          
          {modules.map(mod => {
            const Icon = mod.icon;
            const isExpanded = expandedMenu === mod.id;
            const isActiveParent = activeMenu === mod.id;

            return (
              <div key={mod.id} className="mb-1">
                <button 
                  onClick={() => toggleMenu(mod.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl font-black text-xs tracking-wider transition-all duration-150 ${
                    isActiveParent 
                      ? 'bg-gradient-to-r from-emerald-600/30 to-emerald-800/10 text-emerald-400 border border-emerald-500/20' 
                      : 'text-slate-400 hover:bg-nexus-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActiveParent ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{mod.title}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-slate-500 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="pl-8 pr-2 py-1 space-y-1 mt-0.5 border-l-2 border-nexus-800 ml-4">
                    {mod.subItems.map(subItem => {
                      const isSubActive = activeMenu === mod.id && activeSubMenu === subItem;
                      return (
                        <button
                          key={subItem}
                          onClick={() => selectModule(mod.id, subItem)}
                          className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            isSubActive 
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                              : 'text-slate-400 hover:text-slate-200 hover:bg-nexus-800/40'
                          }`}
                        >
                          {subItem}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info usuario footer */}
        <div className="p-3 border-t border-nexus-800/80 bg-nexus-950/60 shrink-0 text-center">
          <span className="text-[10px] text-slate-400 font-bold block truncate">
            {activeUser?.name || 'ADMINISTRADOR'} ({activeUser?.role || 'ADMIN'})
          </span>
          <span className="text-[9px] text-emerald-400 font-mono">Modo Celular / Tablet Activo</span>
          <div className="mt-2 pt-2 border-t border-nexus-800/60 text-center">
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">JOSUE HERNANDEZ GUTIERREZ</p>
            <p className="text-[9px] font-bold text-slate-400 font-mono">TEL: 9612765041</p>
          </div>
        </div>
        {/* LICENCIA BADGE MÓVIL */}
        <div className="p-3 border-t border-nexus-800 bg-[#070d18]/80 shrink-0">
          <button 
            onClick={() => setShowLicenseModal(true)}
            className="w-full py-1.5 px-2 rounded-xl text-[10px] font-black tracking-wider uppercase border flex items-center justify-between transition-colors bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/40"
          >
            <span>{licenseInfo.status === 'LIFETIME_DEV' ? '👑 VITALICIA PRO' : licenseInfo.status === 'ACTIVE_CLIENT' ? '✅ LICENCIA ACTIVA' : `⏳ PRUEBA (${licenseInfo.daysRemaining} DÍAS)`}</span>
            <span className="underline opacity-80 text-[9px]">GESTIONAR</span>
          </button>
          <div className="mt-2 text-center">
            <p className="text-[9px] font-black text-amber-400 uppercase">JOSUE HERNANDEZ GUTIERREZ</p>
            <p className="text-[9px] font-bold text-slate-400 font-mono">TEL: 9612765041</p>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL DEL MÓDULO ACTIVO */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {!(activeMenu === 'operacion' && activeSubMenu === 'Terminal POS') && (
          <header className="h-11 sm:h-12 bg-nexus-900 border-b border-nexus-800 px-3 flex items-center justify-between shrink-0 z-30 shadow-md">
            <button 
              onClick={toggleMenuVisibility}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-nexus-800 hover:bg-nexus-700 text-emerald-400 rounded-xl border border-nexus-700 font-black text-xs active:scale-95 transition-transform"
              title="Abrir Menú de Módulos"
            >
              <Menu className="w-4 h-4" />
              <span>MENÚ</span>
            </button>

            <span className="font-black text-xs text-white uppercase tracking-wider truncate max-w-[150px] sm:max-w-none text-center">
              {activeSubMenu}
            </span>

            <button 
              onClick={() => selectModule('operacion', 'Terminal POS')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs active:scale-95 transition-transform shadow-md"
              title="Volver al Punto de Venta"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>CAJA</span>
            </button>
          </header>
        )}
        <div className="flex-1 overflow-auto w-full">
          <ErrorBoundary onReset={() => selectModule('operacion', 'Terminal POS')}>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>

      <LicenseModal isOpen={showLicenseModal || licenseInfo.status === 'EXPIRED_BLOCKED'} onClose={() => setShowLicenseModal(false)} onActivated={() => setLicenseInfo(getLicenseInfo())} />
    </div>
  );
}

export default App;
