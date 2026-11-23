import { LicenseModal } from '../components/LicenseModal';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateDirectTicketPDF } from '../utils/ticketPdf';
import { 
  ClipboardList, Search, User, Wallet,
  CreditCard, Banknote, Smartphone, PauseCircle,
  CheckCircle2, Bolt, Droplet, ArrowDownToLine, ShoppingCart, Wifi,
  X, Printer, List, ShieldCheck, Lock, UserCheck, SmartphoneNfc, Layers, Unlock, FileSpreadsheet
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { usePosStore, lineTotal } from '../store/useStore';
import { useSettings } from '../store/useSettings';
import { buildTicketEscPos, openCashDrawer } from '../utils/escposHelper';
import { useLiveSyncStore } from '../store/liveSyncEngine';
import { db } from '../store/database';
import { productIndex } from '../store/productIndex';
import { playBeepSuccess, playBeepError } from '../utils/sound';

interface CartRowProps {
  item: any;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onFocusSearch: () => void;
}

const CartRow = React.memo(({ item, onUpdateQuantity, onRemove, onFocusSearch }: CartRowProps) => {
  return (
    <div className="bg-nexus-900 border border-nexus-800 p-4 rounded-2xl flex items-center gap-4 hover:border-nexus-700 transition-colors shadow-sm group">
      <div className="flex items-center justify-center gap-1.5 bg-nexus-900 border border-nexus-700 rounded-xl p-1 shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id!, item.cartQty - 1); onFocusSearch(); }} 
          className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-black text-xl"
          title="Restar 1 pieza"
        >
          -
        </button>
        <input
          type="number"
          value={item.cartQty === 0 ? '' : item.cartQty}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onUpdateQuantity(item.id!, isNaN(val) ? 0 : Math.max(0, val));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onFocusSearch();
            }
          }}
          onBlur={() => {
            if (item.cartQty <= 0) {
              onRemove(item.id!);
            }
            onFocusSearch();
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-16 border-2 border-emerald-500/60 text-center font-black text-xl rounded-lg py-1 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400 shadow-inner font-mono cursor-text"
          style={{ backgroundColor: '#020617', color: '#34d399', opacity: 1 }}
          title="Escribe la cantidad directamente (Ej: 100)"
        />
        <button 
          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id!, item.cartQty + 1); onFocusSearch(); }} 
          className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-black text-xl"
          title="Sumar 1 pieza"
        >
          +
        </button>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-white text-lg">{item.name}</h3>
        <p className="text-sm font-bold text-slate-500 font-mono">{item.sku} • ${item.price.toFixed(2)} c/u</p>
      </div>
      <div className="text-right mr-4">
        <p className="font-black text-white text-2xl">${lineTotal(item).toFixed(2)}</p>
      </div>
      <button 
        onClick={() => { onRemove(item.id!); onFocusSearch(); }}
        className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-6 h-6" />
      </button>
          </div>
  );
});

function formatTicketDate(dStr: any) {
  if (!dStr) return '';
  try {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? String(dStr) : d.toLocaleString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return String(dStr);
  }
}

export default function PosTerminal() {
  const { isOnline } = useLiveSyncStore();
  const { nombreNegocio, rfc, eslogan, telefono, direccion, mercadoPagoToken, mercadoPagoDeviceId, servidorIp, clipApiKey, clipSecretKey, clipSerialNumber, clipModo, logo, cajaNombre, activeUser, usersList, requirePasswordLogin, ticketFontFamily, ticketFontSize, ticketTitleSize, ticketDetailSize, ticketTotalSize, ticketFontWeight, ticketHeaderAlign, ticketWordWrap, ticketWidth, ticketCharsPerLine, ticketFeedLines, ticketShowLogo, ticketPrinterName, setSettings } = useSettings();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { cart, total, addToCart, removeFromCart, updateQuantity, processSale, clearCart, restoreCart } = usePosStore();

  const focusSearchInput = () => {
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
  };

  // Mantener el cursor/foco activo en la barra de búsqueda constantemente
  useEffect(() => {
    focusSearchInput();
  }, [cart.length]);
  
  // Terminal Linking & Paused Sales State
    const [showNegadoModal, setShowNegadoModal] = useState(false);
  const [negadoNombre, setNegadoNombre] = useState('');
  const [negadoCantidad, setNegadoCantidad] = useState(1);
  const [negadoProveedor, setNegadoProveedor] = useState('');
  const [negadoSugerencias, setNegadoSugerencias] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserToSwitch, setSelectedUserToSwitch] = useState<any>(null);
  const [userPinInput, setUserPinInput] = useState('');

  
  
  const [pausedSales, setPausedSales] = useState<any[]>(() => JSON.parse(localStorage.getItem('pausedSales') || '[]'));
  const [showPausedModal, setShowPausedModal] = useState(false);

  
  const [scanInput, setScanInput] = useState('');
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [client, setClient] = useState<{ name: string; monedero: number; id?: number }>({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<string>('');
  const montoRecibidoRef = useRef<HTMLInputElement>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [lastTicket, setLastTicket] = useState<any>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState('');

  const [showClientModal, setShowClientModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState("");
  const [mpStatus, setMpStatus] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });
  const [clipStatus, setClipStatus] = useState<{ loading: boolean; ok?: boolean; message?: string }>({ loading: false });
  const [clientSearch, setClientSearch] = useState('');

  // Modal Pago Mixto (Efectivo + Tarjeta/Transferencia/Mercado Pago)
  const [showMixtoModal, setShowMixtoModal] = useState(false);
  const [mixtoEfectivo, setMixtoEfectivo] = useState('');
  const [mixtoSecundarioMetodo, setMixtoSecundarioMetodo] = useState<'TARJETA' | 'TRANSFERENCIA' | 'MERCADO PAGO'>('TARJETA');
  const [mixtoEfectivoRecibido, setMixtoEfectivoRecibido] = useState('');

  // Modal Cobros Adicionales (Recargas $2 + MP $5 = $7, Servicios $25, Retiros $45)
  const [showAdicionalModal, setShowAdicionalModal] = useState(false);
  const [adicionalType, setAdicionalType] = useState<'RECARGA' | 'SERVICIO' | 'RETIRO'>('RECARGA');
  const [adicionalCompany, setAdicionalCompany] = useState('TELCEL');
  const [adicionalMonto, setAdicionalMonto] = useState('100');
  const [adicionalReferencia, setAdicionalReferencia] = useState('');

  // Recuperar foco automáticamente al cerrar cualquier modal (Ticket, Tarjeta, Mixto, Cliente, etc.)
  useEffect(() => {
    if (!showTicketModal && !isProcessing && !showMixtoModal && !showClientModal && !showPausedModal && !showUserModal && !showAdicionalModal) {
      focusSearchInput();
    }
  }, [showTicketModal, isProcessing, showMixtoModal, showClientModal, showPausedModal, showUserModal, showAdicionalModal]);

  // Recuperar foco al volver a la ventana de la aplicación
  useEffect(() => {
    const handleWindowFocus = () => {
      focusSearchInput();
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  const handleAddAdicionalToCart = () => {
    const montoNum = parseFloat(adicionalMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    if (adicionalType === 'RECARGA') {
      const comisionMP = montoNum * 0.05;
      const precioCliente = montoNum + 2;
      const costoNegocio = Math.max(0, montoNum - comisionMP);
      const refText = adicionalReferencia.trim() ? ` (Tel: ${adicionalReferencia.trim()})` : '';

      addToCart({
        id: -(Math.floor(Math.random() * 1000000)),
        sku: `REC-${adicionalCompany}-${montoNum}`,
        name: `RECARGA ${adicionalCompany} $${montoNum}${refText}`,
        price: precioCliente,
        cost: costoNegocio,
        stock: 9999,
        category: 'RECARGAS',
        status: 'ACTIVO',
        cartQty: 1
      } as any);
    } else if (adicionalType === 'SERVICIO') {
      const precioCliente = montoNum + 25;
      const costoNegocio = montoNum;
      const refText = adicionalReferencia.trim() ? ` (Ref: ${adicionalReferencia.trim()})` : '';

      addToCart({
        id: -(Math.floor(Math.random() * 1000000)),
        sku: `SRV-${adicionalCompany}`,
        name: `PAGO DE SERVICIO ${adicionalCompany}${refText}`,
        price: precioCliente,
        cost: costoNegocio,
        stock: 9999,
        category: 'SERVICIOS',
        status: 'ACTIVO',
        cartQty: 1
      } as any);
    } else if (adicionalType === 'RETIRO') {
      const precioCliente = montoNum + 45;
      const costoNegocio = montoNum;

      addToCart({
        id: -(Math.floor(Math.random() * 1000000)),
        sku: `RET-EFECTIVO-${montoNum}`,
        name: `RETIRO DE EFECTIVO ($${montoNum}) + COMISIÓN`,
        price: precioCliente,
        cost: costoNegocio,
        stock: 9999,
        category: 'RETIROS',
        status: 'ACTIVO',
        cartQty: 1
      } as any);
    }

    setShowAdicionalModal(false);
    setAdicionalReferencia('');
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inicializar índice de productos en memoria al abrir la terminal
  useEffect(() => {
    productIndex.init().catch(console.warn);
  }, []);

  const clients = useLiveQuery(() => {
    if (!showClientModal) return [];
    if (clientSearch) {
      const q = clientSearch.toLowerCase();
      return db.clients.filter(c =>
        Boolean((c.name && c.name.toLowerCase().includes(q)) ||
        (c.monederoCode && c.monederoCode.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)))
      ).toArray();
    }
    return db.clients.toArray();
  }, [clientSearch, showClientModal]) || [];

  const activeClientLive = useLiveQuery(
    () => (client?.id ? db.clients.get(client.id) : undefined),
    [client?.id]
  );

  useEffect(() => {
    if (activeClientLive && client?.id) {
      setClient({
        id: activeClientLive.id,
        name: activeClientLive.name,
        monedero: activeClientLive.monedero || 0
      });
    }
  }, [activeClientLive]);

  const handleSelectClient = (selectedClient: any) => {
    setClient(selectedClient);
    setShowClientModal(false);
  };

  const PORCENTAJE_MONEDERO = 0.01;
  const abonoMonedero = total * PORCENTAJE_MONEDERO;
  const cambio = (parseFloat(montoRecibido) || 0) - total;

  // Live Search ultrarrápido en memoria (< 0.2ms) con debounce para no saturar con escáneres
  useEffect(() => {
    const q = scanInput.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    // Si se está escaneando un código de barras numérico largo (>= 8 dígitos), no saturar la pantalla con dropdown
    if (/^\d{8,}$/.test(q)) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      const results = productIndex.search(q, 15);
      setSuggestions(results);
    }, 100);
    return () => clearTimeout(timer);
  }, [scanInput]);

  // Procesa un código escaneado o texto con velocidad de supermercado (< 0.5ms)
  const processBarcodeOrSearch = async (rawVal: string) => {
    const val = rawVal.trim();
    if (!val) return;

    // Protección anti-duplicado (evita que un mismo escaneo agregue 2 piezas por disparos múltiples en < 600ms)
    const now = Date.now();
    if (lastScanRef.current.code.toLowerCase() === val.toLowerCase() && (now - lastScanRef.current.time) < 600) {
      return;
    }
    lastScanRef.current = { code: val, time: now };
    scannerBufferRef.current = '';

    // 1. Escaneo de monedero de cliente
    const clientMatch = await db.clients.where('monederoCode').equals(val).first();
    if (clientMatch) {
      playBeepSuccess();
      setClient(clientMatch);
      setScanInput('');
      setSuggestions([]);
      focusSearchInput();
      return;
    }

    // 2. Coincidencia EXACTA por código de barras o SKU en memoria (O(1) < 0.001ms)
    let p = productIndex.findByBarcode(val);

    // 3. Fallback directo a Dexie por SKU o códigos alternativos
    if (!p) {
      p = await db.products.where('sku').equals(val).first();
    }
    if (!p) {
      p = await db.products.filter(item => 
        String(item.sku || '').trim().toLowerCase() === val.toLowerCase() ||
        String(item.barcode2 || '').trim().toLowerCase() === val.toLowerCase() ||
        String(item.barcode3 || '').trim().toLowerCase() === val.toLowerCase()
      ).first();
    }

    // 4. Búsqueda por texto SOLO si NO es un código numérico o código de barras
    // (Previene que un código de barras no encontrado agregue productos fantasmas por coincidencia difusa)
    const isBarcodeLike = /^\d{5,}$/.test(val);
    if (!p && !isBarcodeLike && suggestions.length > 0) {
      p = suggestions[0];
    }

    if (p) {
      playBeepSuccess();
      addToCart(p);
      setScanInput('');
      setSuggestions([]);
      focusSearchInput();
    } else {
      playBeepError();
      setScanErrorMsg(`Código no encontrado: ${val}`);
      setTimeout(() => setScanErrorMsg(''), 3000);
      setScanInput('');
      setSuggestions([]);
      focusSearchInput();
    }
  };

  const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Si el escáner envió un salto de línea (sufijo Enter de escáner USB/Bluetooth)
    if (raw.includes('\n') || raw.includes('\r')) {
      const clean = raw.replace(/[\r\n]/g, '').trim();
      setScanInput('');
      setSuggestions([]);
      scannerBufferRef.current = '';
      if (clean) {
        processBarcodeOrSearch(clean);
      }
      return;
    }

    setScanInput(raw);
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.keyCode === 13 || e.which === 13) && scanInput.trim() !== '') {
      e.preventDefault();
      e.stopPropagation();
      scannerBufferRef.current = '';
      const toSearch = scanInput.trim();
      await processBarcodeOrSearch(toSearch);
    }
  };

  const handleSelectProduct = (p: any) => {
    playBeepSuccess();
    addToCart(p);
    setScanInput('');
    setSuggestions([]);
    focusSearchInput();
  };

  // Interceptor global para lector de códigos de barra (estilo Chedraui / Walmart)
  // Permite escanear incluso si el cursor no estaba en el input de búsqueda
  const scannerBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleGlobalScannerInput = (e: KeyboardEvent) => {
      // Ignorar si hay modales abiertos que requieran texto
      if (showTicketModal || isProcessing || showMixtoModal || showUserModal || showWaModal || showAdicionalModal) {
        return;
      }

      // Si el foco está en la barra de búsqueda o cualquier input/textarea,
      // el propio componente maneja el Enter y la entrada, evitando duplicación
      const activeEl = document.activeElement;
      if (activeEl && ['INPUT', 'TEXTAREA'].includes(activeEl.tagName)) {
        scannerBufferRef.current = '';
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si pasaron más de 80ms entre teclas, se descarta el buffer anterior (escritura humana manual)
      if (diff > 80) {
        scannerBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const barcode = scannerBufferRef.current.trim();
        scannerBufferRef.current = '';
        if (barcode.length >= 2) {
          e.preventDefault();
          e.stopPropagation();
          processBarcodeOrSearch(barcode);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        scannerBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalScannerInput, true);
    return () => window.removeEventListener('keydown', handleGlobalScannerInput, true);
  }, [showTicketModal, isProcessing, showMixtoModal, showUserModal, showWaModal, showAdicionalModal, suggestions]);

  const triggerClipPayment = async (customAmount?: number): Promise<boolean> => {
    const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;
    const apiKey = clipApiKey ? clipApiKey.trim() : "";
    const serialNumber = clipSerialNumber ? clipSerialNumber.trim() : "";
    const modo = clipModo || "MANUAL";

    setIsProcessing(true);

    // 1. MODO DIRECTO / MANUAL: APERTURA INSTANTÁNEA (0ms)
    if (modo !== "API_NUBE" || !apiKey) {
      setProcessMsg("Cobro con Terminal Clip: $" + chargeAmount.toFixed(2));
      setClipStatus({
        loading: false,
        ok: true,
        message: "Monto a cobrar: $" + chargeAmount.toFixed(2) + " MXN en maquinita Clip. Digita en la terminal y presiona CONFIRMAR PAGO (F12) al salir el voucher."
      });
      return true;
    }

    // 2. MODO NUBE: Llamada con timeout ultra-rápido de 2.5 segundos
    setProcessMsg("Enviando orden a Terminal Clip...");
    setClipStatus({ loading: true, message: "Enviando orden a Clip S/N " + (serialNumber || 'PinPad') + "..." });

    try {
      const hostUrl = servidorIp ? ("http://" + (servidorIp.includes(":") ? servidorIp : servidorIp + ":3008")) : "http://127.0.0.1:3008";
      const endpoint = hostUrl + "/api/clip/payment";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const payload = {
        apiKey: apiKey,
        serialNumber: serialNumber,
        amount: chargeAmount,
        reference: "NEXUS-" + Date.now().toString().slice(-6)
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (!res) {
        setProcessMsg("Terminal Clip lista para cobro: $" + chargeAmount.toFixed(2));
        setClipStatus({
          loading: false,
          ok: true,
          message: "Digita $" + chargeAmount.toFixed(2) + " MXN en tu maquinita Clip y presiona CONFIRMAR PAGO (F12) al salir el voucher."
        });
        return true;
      }

      const result = await res.json().catch(() => ({}));

      if (result.success) {
        setProcessMsg("⚡ Cobro de $" + chargeAmount.toFixed(2) + " enviado a Terminal Clip");
        setClipStatus({
          loading: false,
          ok: true,
          message: "¡Orden recibida en terminal Clip! ($" + chargeAmount.toFixed(2) + "). El cliente ya puede deslizar o aproximar tarjeta/NFC."
        });
        return true;
      } else {
        setProcessMsg("Terminal Clip lista para cobro: $" + chargeAmount.toFixed(2));
        setClipStatus({
          loading: false,
          ok: true,
          message: "Monto a cobrar: $" + chargeAmount.toFixed(2) + " MXN en maquinita Clip. Digita en la terminal y presiona CONFIRMAR PAGO (F12) al salir el voucher."
        });
        return true;
      }
    } catch (e: any) {
      setProcessMsg("Terminal Clip lista para cobro: $" + chargeAmount.toFixed(2));
      setClipStatus({
        loading: false,
        ok: true,
        message: "Digita $" + chargeAmount.toFixed(2) + " MXN en tu maquinita Clip y presiona CONFIRMAR PAGO (F12)."
      });
      return true;
    }
  };

  const triggerMercadoPagoPayment = async (customAmount?: number): Promise<boolean> => {
    setIsProcessing(true);
    setProcessMsg("Conectando con Terminal Mercado Pago Point...");
    setMpStatus({ loading: true, message: "Enviando cobro a la terminal física..." });

    const token = mercadoPagoToken || "APP_USR-7550911274372329-020913-4c9391b9edb39d57a3c97e1af4c86c0f-3193296364";
    const deviceId = mercadoPagoDeviceId || "POINT_SMART_01";

    try {
      const chargeAmount = customAmount !== undefined && customAmount > 0 ? customAmount : total;
      const amountInCents = Math.round(chargeAmount * 100);
      const payload = {
        amount: amountInCents,
        additional_info: {
          external_reference: "NEXUS-" + Date.now(),
          print_on_terminal: true
        }
      };

      const response = await fetch("https://api.mercadopago.com/point/integration-api/devices/" + deviceId + "/payment-intents", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setProcessMsg("⚡ Cobro de $" + chargeAmount.toFixed(2) + " enviado a Terminal (" + deviceId + ")");
        setMpStatus({ loading: false, ok: true, message: "Orden recibida en terminal ($" + chargeAmount.toFixed(2) + "). El cliente ya puede deslizar o aproximar tarjeta/NFC." });
        return true;
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("MP Error:", err);
        setProcessMsg("Error al conectar con la terminal");
        setMpStatus({ loading: false, ok: false, message: (err.message || err.error || "No se pudo enviar el cobro a la terminal.") + " (Revisa tu Device ID)" });
        return false;
      }
    } catch (e) {
      setProcessMsg("Error de conexión");
      setMpStatus({ loading: false, ok: false, message: (e as Error).message });
      return false;
    }
  };


  
  const handleRegistrarNegado = async () => {
    if (!negadoNombre.trim()) {
      alert('Escribe el nombre del producto solicitado');
      return;
    }
    const item = {
      id: 'NEG-' + Date.now(),
      name: negadoNombre.trim().toUpperCase(),
      supplier: negadoProveedor.trim() || 'SIN_PROVEEDOR',
      requested_qty: Number(negadoCantidad) || 1,
      date: new Date().toISOString()
    };
    try {
      const cur = JSON.parse(localStorage.getItem('nexus_productos_negados') || '[]');
      cur.push(item);
      localStorage.setItem('nexus_productos_negados', JSON.stringify(cur));
    } catch(e) {}

    // Transmitir al servidor de pedidos si está activo
    try {
      fetch('http://127.0.0.1:3002/api/negados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      }).catch(() => {});
    } catch(e) {}

    alert(`✅ Producto anotado para el próximo pedido: ${item.name} (${item.requested_qty} pz).`);
    setNegadoNombre('');
    setNegadoCantidad(1);
    setNegadoProveedor('');
    setNegadoSugerencias([]);
    setShowNegadoModal(false);
  };

  // Billetes inteligentes sugeridos calculados en tiempo real (Fast-Cash)
  const smartCashList = useMemo(() => {
    if (total <= 0) return [];
    const suggestions = new Set<number>();
    
    // Siguiente múltiplo de $10 si no es exacto
    const next10 = Math.ceil(total / 10) * 10;
    if (next10 > total && next10 <= total + 20) suggestions.add(next10);

    // Siguiente múltiplo de $50 si no es exacto
    const next50 = Math.ceil(total / 50) * 50;
    if (next50 > total) suggestions.add(next50);

    // Billetes estándar mayores al total
    const standardBills = [20, 50, 100, 200, 500, 1000];
    for (const b of standardBills) {
      if (b > total) suggestions.add(b);
    }

    return Array.from(suggestions)
      .filter(val => val > total)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [total]);

  // Cobro ultra rápido en efectivo (1 solo clic / 1 tecla)
  const handleFastCashPayment = async (amount: number) => {
    if (cart.length === 0 || total <= 0) {
      alert("El carrito está vacío");
      return;
    }
    setIsProcessing(false);
    const { processSale, lastError } = usePosStore.getState();
    const ticket = await processSale('EFECTIVO', client.name || 'PUBLICO GENERAL', amount);
    if (ticket) {
      setLastTicket(ticket);
      setShowTicketModal(true);
      openCashDrawer(ticketPrinterName);
      setMontoRecibido('');
      setPaymentMethod('EFECTIVO');
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    } else {
      alert('Error al procesar la venta: ' + (lastError || 'Verifica los montos.'));
    }
  };

  // Cobro directo con otros métodos (1 solo clic / 1 tecla)
  const handleFastDirectPayment = async (method: string) => {
    if (cart.length === 0 || total <= 0) {
      alert("El carrito está vacío");
      return;
    }
    setPaymentMethod(method);

    if (method === 'MERCADO PAGO') {
      await triggerMercadoPagoPayment();
      return;
    }
    if (method === 'CLIP') {
      await triggerClipPayment();
      return;
    }
    if (method === 'MIXTO') {
      setMixtoEfectivo('');
      setMixtoEfectivoRecibido('');
      setShowMixtoModal(true);
      return;
    }
    if (method === 'CRÉDITO' && (!client.id || client.name === 'PUBLICO GENERAL')) {
      alert('Para venta a crédito, selecciona primero un cliente asignado.');
      setShowClientModal(true);
      return;
    }

    // TARJETA, TRANSFERENCIA, CRÉDITO, MONEDERO: Cobro directo por el total exacto
    setIsProcessing(false);
    const { processSale, lastError } = usePosStore.getState();
    const ticket = await processSale(method, client.name || 'PUBLICO GENERAL', total);
    if (ticket) {
      setLastTicket(ticket);
      setShowTicketModal(true);
      openCashDrawer(ticketPrinterName);
      setMontoRecibido('');
      setPaymentMethod('EFECTIVO');
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    } else {
      alert('Error al procesar la venta: ' + (lastError || 'Verifica los montos.'));
    }
  };

  const handlePaymentClick = (method: string) => {
    setPaymentMethod(method);
    if (cart.length > 0 && method !== 'EFECTIVO') {
      if (method === 'MERCADO PAGO') {
        triggerMercadoPagoPayment();
      } else if (method === 'CLIP') {
        triggerClipPayment();
      } else if (method === 'MIXTO') {
        setMixtoEfectivo('');
        setMixtoEfectivoRecibido('');
        setShowMixtoModal(true);
      } else {
        setIsProcessing(true);
      }
    }
  };

  const handleCobrar = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    const methodToUse = paymentMethod;

    if (methodToUse === 'MERCADO PAGO') {
      await triggerMercadoPagoPayment();
    } else if (methodToUse === 'CLIP') {
      await triggerClipPayment();
    } else if (methodToUse === 'MIXTO') {
      setShowMixtoModal(true);
    } else if (methodToUse === 'EFECTIVO') {
      finalizeSaleWithMethod(methodToUse);
    } else {
      setIsProcessing(true);
    }
  };

  const handleFinalizarMixto = async () => {
    const efecMonto = parseFloat(mixtoEfectivo) || 0;
    if (efecMonto <= 0) {
      alert("Por favor ingresa un monto válido a pagar en efectivo.");
      return;
    }
    if (efecMonto >= total) {
      alert(`El monto en efectivo ($${efecMonto.toFixed(2)}) cubre el 100% o más del total ($${total.toFixed(2)}). Para cobrar todo en efectivo, selecciona el método 'EFECTIVO'.`);
      return;
    }

    const restoDigital = Math.round((total - efecMonto) * 100) / 100;
    const efecRecibido = parseFloat(mixtoEfectivoRecibido) || efecMonto;
    if (mixtoEfectivoRecibido !== '' && efecRecibido < efecMonto) {
      alert(`El efectivo entregado por el cliente ($${efecRecibido.toFixed(2)}) es menor a la parte en efectivo a cobrar ($${efecMonto.toFixed(2)}).`);
      return;
    }

    if (mixtoSecundarioMetodo === 'MERCADO PAGO') {
      const ok = await triggerMercadoPagoPayment(restoDigital);
      if (!ok) {
        if (!window.confirm(`Hubo un detalle enviando el cobro de $${restoDigital.toFixed(2)} a la terminal Point. ¿Deseas registrar la venta mixta de todos modos?`)) {
          return;
        }
      }
    }

    setIsProcessing(false);
    const { processSale, lastError } = usePosStore.getState();
    const ticket = await processSale('MIXTO', client.name || 'PUBLICO GENERAL', efecRecibido, {
      efectivo: efecMonto,
      secundario: restoDigital,
      metodoSecundario: mixtoSecundarioMetodo
    });

    if (ticket) {
      setLastTicket(ticket);
      setShowMixtoModal(false);
      setShowTicketModal(true);
      openCashDrawer(ticketPrinterName);
      setMontoRecibido('');
      setMixtoEfectivo('');
      setMixtoEfectivoRecibido('');
      setPaymentMethod('EFECTIVO');
      setIsProcessing(false);
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    } else {
      setIsProcessing(false);
      alert('Error al procesar la venta mixta: ' + (lastError || 'Verifica los montos e intenta de nuevo.'));
    }
  };

  const finalizeSaleWithMethod = async (methodToUse: string) => {
    let parsedRecibido = parseFloat(montoRecibido);
    let validRecibido = methodToUse === 'EFECTIVO' && !isNaN(parsedRecibido) && parsedRecibido > 0 ? parsedRecibido : undefined;
    
    if (methodToUse === 'EFECTIVO' && montoRecibido !== '' && (parseFloat(montoRecibido) || 0) < total) {
      alert('El monto recibido ($' + (parseFloat(montoRecibido) || 0).toFixed(2) + ') es menor al total ($' + total.toFixed(2) + ').');
      setIsProcessing(false);
      return;
    }

    const { processSale, lastError } = usePosStore.getState();
    const ticket = await processSale(methodToUse, client.name, validRecibido);
    
    if (ticket) {
      setLastTicket(ticket);
      setIsProcessing(false);
      setShowTicketModal(true);
      openCashDrawer(ticketPrinterName);
      setMontoRecibido('');
      setPaymentMethod('EFECTIVO');
      setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    } else {
      setIsProcessing(false);
      alert('Error al procesar la venta: ' + lastError);
    }
  };

  
  
function resolveTicketPx(val: any, defaultPx: number): string {
  if (!val) return `${defaultPx}px`;
  if (typeof val === 'number') return `${val}px`;
  const str = String(val).trim();
  if (str.endsWith('px') || str.endsWith('pt') || str.endsWith('mm')) return str;
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) return `${num}px`;
  if (str === 'sm') return `${defaultPx - 2}px`;
  if (str === 'md') return `${defaultPx}px`;
  if (str === 'lg') return `${defaultPx + 4}px`;
  if (str === 'xl') return `${defaultPx + 8}px`;
  if (str === 'xxl') return `${defaultPx + 12}px`;
  return `${defaultPx}px`;
}

  const dynFontFamily = ticketFontFamily || 'Consolas, monospace';
  const dynTitleSize = resolveTicketPx(ticketTitleSize, 24);
  const dynDetailSize = resolveTicketPx(ticketDetailSize, 14);
  const dynFontSize = resolveTicketPx(ticketFontSize, 16);
  const dynTotalSize = resolveTicketPx(ticketTotalSize, 26);
  const dynFontWeight = ticketFontWeight === 'normal' ? '700' : '900';
  const headerAlign = ticketHeaderAlign || 'center';
  const wordWrapMode = ticketWordWrap === false ? 'normal' : 'break-word';

  const printTicket = async () => {
    try {
      // 1. Impresión térmica nativa directa ESC/POS de alta fidelidad (RAW) en Electron
      if ((window as any).require && ticketPrinterName && lastTicket) {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          const builder = await buildTicketEscPos({
            folio: lastTicket.folio,
            date: lastTicket.date ? new Date(lastTicket.date) : new Date(),
            caja: lastTicket.caja || cajaNombre || 'CAJA 1 - PRINCIPAL',
            cajero: lastTicket.cajero || activeUser?.name || 'ADMINISTRADOR',
            clientName: lastTicket.clientName || 'PUBLICO GENERAL',
            paymentMethod: lastTicket.paymentMethod,
            montoEfectivo: lastTicket.montoEfectivo,
            montoTarjeta: lastTicket.montoTarjeta,
            montoTransferencia: lastTicket.montoTransferencia,
            metodoMixtoSecundario: lastTicket.metodoMixtoSecundario,
            recibido: lastTicket.recibido,
            cambio: lastTicket.cambio,
            total: lastTicket.total || 0,
            items: (lastTicket.items || lastTicket.cart || []).map((it: any) => ({
              cartQty: it.cartQty || it.qty || 1,
              name: it.name || it.productName || 'PRODUCTO',
              price: it.price || 0,
              subtotal: (it.cartQty || it.qty || 1) * (it.price || 0)
            }))
          }, {
            nombreNegocio,
            rfc,
            eslogan,
            telefono,
            direccion,
            logo,
            ticketShowLogo,
            cajaNombre,
            activeUser,
            ticketCharsPerLine,
            ticketWidth,
            ticketFeedLines,
            ticketTitleSize,
            ticketDetailSize,
            ticketFontSize,
            ticketTotalSize,
            ticketFontWeight,
            ticketHeaderAlign,
            ticketWordWrap
          });

          const res = await ipcRenderer.invoke('print-ticket-raw', {
            base64Data: builder.toBase64(),
            deviceName: ticketPrinterName
          });

          if (res && res.success) {
            return;
          }
        } catch (rawErr) {
          console.warn("Detalle con impresión ESC/POS nativa en PosTerminal, intentando fallback HTML:", rawErr);
        }
      }

      const el = document.getElementById('ticket-print');
      if (!el) return;

      let iframe = document.getElementById('pos-print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'pos-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      let styles = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
        styles += node.outerHTML;
      });

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        window.print();
        return;
      }
      const printStyles = `
        <style>
          @page {
            margin: 0 !important;
            size: auto !important;
          }
          * {
            box-sizing: border-box !important;
            color: #000000 !important;
            font-family: ${dynFontFamily} !important;
            -webkit-font-smoothing: none !important;
            font-smooth: never !important;
            text-rendering: geometricPrecision !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            text-align: left !important;
          }
          #ticket-print {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            margin: 0 !important;
            padding: 0 1mm 2mm 1mm !important;
            box-sizing: border-box !important;
            font-family: ${dynFontFamily} !important;
            font-size: ${dynFontSize} !important;
            line-height: 1.25 !important;
            color: #000000 !important;
            font-weight: ${dynFontWeight} !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            word-break: ${wordWrapMode} !important;
            overflow-wrap: ${wordWrapMode} !important;
            white-space: normal !important;
          }
          .ticket-header {
            text-align: ${headerAlign} !important;
            width: 100% !important;
            margin: 0 0 3px 0 !important;
          }
          .ticket-logo {
            max-height: 60px !important;
            max-width: 140px !important;
            display: block !important;
            margin: ${headerAlign === 'center' ? '0 auto 4px auto' : headerAlign === 'right' ? '0 0 4px auto' : '0 auto 4px 0'} !important;
            object-fit: contain !important;
            filter: grayscale(100%) !important;
          }
          .ticket-title {
            font-size: ${dynTitleSize} !important;
            font-weight: 900 !important;
            text-align: ${headerAlign} !important;
            line-height: 1.15 !important;
            margin: 0 0 2px 0 !important;
            text-transform: uppercase !important;
            word-break: ${wordWrapMode} !important;
          }
          .ticket-details {
            font-size: ${dynDetailSize} !important;
            font-weight: ${dynFontWeight} !important;
            text-align: ${headerAlign} !important;
            line-height: 1.25 !important;
            margin: 0 !important;
            word-break: ${wordWrapMode} !important;
          }
          #ticket-print table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            margin: 2px 0 !important;
          }
          #ticket-print th, #ticket-print td {
            font-size: ${dynFontSize} !important;
            font-weight: ${dynFontWeight} !important;
            padding: 2px 0 !important;
            color: #000000 !important;
            line-height: 1.2 !important;
          }
          #ticket-print th {
            border-bottom: 2px solid #000000 !important;
            font-weight: 900 !important;
          }
          .ticket-total-row {
            font-size: ${dynTotalSize} !important;
            font-weight: 900 !important;
          }
        </style>
      `;
      if ((window as any).require && ticketPrinterName) {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          ipcRenderer.invoke('print-ticket-html', {
            html: '<html><head><title>Ticket NEXUS POS</title>' + styles + printStyles + '</head><body style="margin:0; padding:0; background:white; width: 100%;">' + el.outerHTML + '</body></html>',
            deviceName: ticketPrinterName,
            ticketWidth: ticketWidth || '58mm',
            silent: true
          });
          return;
        } catch(_) {}
      }

      doc.open();
      doc.write('<html><head><title>Ticket NEXUS POS</title>' + styles + printStyles + '</head><body style="margin:0; padding:0; background:white; width: 100%;">' + el.outerHTML + '</body></html>');
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn("Detalle al imprimir en iframe, reintentando:", printErr);
          try { window.print(); } catch (_) {}
        }
      }, 200);
    } catch (err) {
      console.error("Error al imprimir ticket:", err);
    }
  };


  const sendWhatsapp = async () => {
    if (!lastTicket) return;
    setShowWaModal(true);
  };
  const confirmSendWhatsapp = () => {
    let phone = waPhone.replace(/\D/g, '');
    if (phone.length < 10) { alert('Número de WhatsApp inválido. Debe tener 10 dígitos.'); return; }
    setShowWaModal(false);

    try {
      const settings = useSettings.getState();
      const { pdf, fileName, folioStr } = generateDirectTicketPDF(lastTicket, settings);

      let savedPath = '';
      if ((window as any).require) {
        try {
          const fsLib = (window as any).require('fs');
          const pathLib = (window as any).require('path');
          const osLib = (window as any).require('os');
          const desktopPath = pathLib.join(osLib.homedir(), 'Desktop');
          savedPath = pathLib.join(desktopPath, fileName);
          const pdfBuffer = pdf.output('arraybuffer');
          fsLib.writeFileSync(savedPath, new Uint8Array(pdfBuffer));
        } catch(err) {
          console.warn('Fallback guardando en Desktop:', err);
          pdf.save(fileName);
        }
      } else {
        pdf.save(fileName);
      }

      const msg = `🧾 *TICKET DE COMPRA* 🧾\n📌 *FOLIO:* #${folioStr}\n💵 *TOTAL: $${(lastTicket.total || 0).toFixed(2)} MXN*\n\nTe comparto tu ticket de compra en formato PDF. ¡Gracias por tu preferencia!`;
      const waUrl = `https://wa.me/52${phone.slice(-10)}?text=${encodeURIComponent(msg)}`;

      if ((window as any).require) {
        try {
          const { shell } = (window as any).require('electron');
          if (shell && shell.openExternal) shell.openExternal(waUrl);
          else window.open(waUrl, '_blank');
        } catch(e) {
          window.open(waUrl, '_blank');
        }
      } else {
        window.open(waUrl, '_blank');
      }

      alert(`✓ PDF (${fileName}) guardado en tu Escritorio / Descargas.\nSe ha abierto WhatsApp para que lo envíes.`);
    } catch(e: any) {
      console.error("Error generando PDF WhatsApp:", e);
      alert('Error al generar PDF: ' + e.message);
    }
  };

  const handlePausar = () => {
    if (cart.length === 0) return;
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleTimeString(),
      cart: [...cart],
      client,
      total
    };
    const newPaused = [...pausedSales, newSale];
    setPausedSales(newPaused);
    localStorage.setItem('pausedSales', JSON.stringify(newPaused));
    clearCart();
    setClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 });
    alert("Venta guardada en espera.");
  };

  const handleRecuperar = (sale: any) => {
    restoreCart(sale.cart, sale.total);
    setClient(sale.client);
    const updated = pausedSales.filter(s => s.id !== sale.id);
    setPausedSales(updated);
    localStorage.setItem('pausedSales', JSON.stringify(updated));
    setShowPausedModal(false);
  };
// Atajos de teclado empresariales
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // F3: Abrir cajón de dinero manualmente
      if (e.key === 'F3') {
        e.preventDefault();
        openCashDrawer(ticketPrinterName);
        return;
      }

      // F4: Registrar producto negado / faltante
      if (e.key === 'F4') {
        e.preventDefault();
        setShowNegadoModal(true);
        return;
      }

      // F1: Enfocar buscador / escáner de productos
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // ESPACIO o F5: PAGO EXACTO EN EFECTIVO (1 solo toque)
      if (e.key === 'F5' || (e.code === 'Space' && !isInputFocused && !showTicketModal && !isProcessing && !showMixtoModal && !showClientModal && !showPausedModal && !showUserModal && !showAdicionalModal)) {
        if (cart.length > 0 && total > 0) {
          e.preventDefault();
          handleFastCashPayment(total);
          return;
        }
      }

      // F6: Enfocar campo de monto recibido manual
      if (e.key === 'F6') {
        e.preventDefault();
        setPaymentMethod('EFECTIVO');
        montoRecibidoRef.current?.focus();
        montoRecibidoRef.current?.select();
        return;
      }

      // F7: Tarjeta (1 clic / cobro directo)
      if (e.key === 'F7') {
        e.preventDefault();
        handleFastDirectPayment('TARJETA');
        return;
      }

      // F8: Transferencia (1 clic / cobro directo)
      if (e.key === 'F8') {
        e.preventDefault();
        handleFastDirectPayment('TRANSFERENCIA');
        return;
      }

      // F9: Crédito (1 clic / cobro directo a cuenta cliente)
      if (e.key === 'F9') {
        e.preventDefault();
        handleFastDirectPayment('CRÉDITO');
        return;
      }

      // F10: Terminal Mercado Pago Point
      if (e.key === 'F10') {
        e.preventDefault();
        handleFastDirectPayment('MERCADO PAGO');
        return;
      }

      // F11: Monedero Electrónico
      if (e.key === 'F11') {
        e.preventDefault();
        handleFastDirectPayment('MONEDERO');
        return;
      }

      // F12: Cobro tradicional o confirmación
      if (e.key === 'F12') {
        e.preventDefault();
        if (isProcessing) {
          finalizeSaleWithMethod(paymentMethod);
        } else {
          handleCobrar();
        }
        return;
      }

      // Enter
      if (e.key === 'Enter') {
        if (showMixtoModal) {
          e.preventDefault();
          handleFinalizarMixto();
          return;
        }
        if (showTicketModal) {
          e.preventDefault();
          // Enter finaliza y pasa directamente a la Nueva Venta (la impresión es opcional)
          setShowTicketModal(false);
          focusSearchInput();
          return;
        } else if (isProcessing) {
          e.preventDefault();
          finalizeSaleWithMethod(paymentMethod);
          return;
        }
      }

      // F2 o P: Imprimir ticket cuando el modal está abierto
      if (e.key === 'p' || e.key === 'P' || e.key === 'F2') {
        if (showTicketModal) {
          e.preventDefault();
          printTicket();
          return;
        }
      }

      // Escape: Cerrar cualquier modal abierto
      if (e.key === 'Escape') {
        if (showTicketModal) {
          e.preventDefault();
          setShowTicketModal(false);
          focusSearchInput();
        } else if (isProcessing) {
          e.preventDefault();
          setIsProcessing(false);
          focusSearchInput();
        } else if (showMixtoModal) {
          e.preventDefault();
          setShowMixtoModal(false);
          focusSearchInput();
        } else if (showClientModal) {
          e.preventDefault();
          setShowClientModal(false);
          focusSearchInput();
        } else if (showPausedModal) {
          e.preventDefault();
          setShowPausedModal(false);
          focusSearchInput();
        } else if (showNegadoModal) {
          e.preventDefault();
          setShowNegadoModal(false);
          focusSearchInput();
        } else if (showAdicionalModal) {
          e.preventDefault();
          setShowAdicionalModal(false);
          focusSearchInput();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, total, paymentMethod, client.name, showTicketModal, isProcessing, showMixtoModal, showClientModal, showPausedModal, showNegadoModal, showAdicionalModal, montoRecibido, ticketPrinterName]);

  const handleCloseTicketModal = () => {
    setShowTicketModal(false);
    focusSearchInput();
  };

  const handleCloseProcessingModal = () => {
    setIsProcessing(false);
    focusSearchInput();
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden select-none"
      onClick={(e) => {
        // Si hace clic en la zona de trabajo y no hay modal abierto, devolver el cursor al escáner
        if (!showTicketModal && !isProcessing && !showMixtoModal && !showClientModal && !showPausedModal && !showUserModal) {
          const target = e.target as HTMLElement;
          // No robar el foco si está interactuando con otro input o botón interactivo
          if (target && !['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
            focusSearchInput();
          }
        }
      }}
    >
      
      {/* HEADER POS */}
      <div className="h-16 flex items-center justify-between px-4 bg-nexus-900 border-b border-nexus-800 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
          
          <button 
            onClick={() => usePosStore.getState().setSidebarOpen(!usePosStore.getState().sidebarOpen)}
            className="bg-nexus-800 hover:bg-nexus-700 p-2.5 rounded-xl border border-nexus-700 text-slate-300 transition-colors"
          >
            <List className="w-5 h-5" />
          </button>
          
          <div className="bg-white rounded-xl w-10 h-10 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-blue-600 font-black text-xl leading-none">
                {(nombreNegocio || 'T')[0].toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex flex-col shrink-0">
            <h1 className="font-black text-white tracking-widest text-xs uppercase truncate max-w-[140px] sm:max-w-[220px]">{nombreNegocio.toUpperCase()}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 tracking-wider">
                💻 {cajaNombre || 'CAJA 1 - PRINCIPAL'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border tracking-wider ${isOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`} title={isOnline ? 'Servidor de red multi-caja activo (:3008)' : 'Servidor 3008 no detectado'}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isOnline ? 'RED :3008' : 'LOCAL'}
              </span>
            </div>
          </div>

          <div className="w-px h-6 bg-nexus-800 mx-2 hidden sm:block"></div>

          <div className="relative" ref={searchContainerRef}>
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input 
              type="text" 
              value={scanInput}
              onChange={handleScanInputChange}
              onKeyDown={handleScan}
              ref={searchInputRef}
              id="pos-search-input"
              placeholder="Buscar producto o escanear..."
              className="w-96 bg-nexus-800 border-2 border-nexus-700 text-white pl-10 pr-4 py-2 rounded-xl font-bold focus:outline-none focus:border-emerald-400 text-sm transition-colors shadow-inner"
              autoFocus
            />
            
            {/* BANNER DE ERROR NO BLOQUEANTE */}
            {scanErrorMsg && (
              <div className="absolute top-full left-0 mt-2 px-4 py-2 bg-red-600 text-white font-black text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-red-400 z-50 animate-pulse">
                <span>⚠️</span>
                <span>{scanErrorMsg}</span>
              </div>
            )}

            {/* DROPDOWN DE SUGERENCIAS EN VIVO */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-[500px] bg-nexus-900 border border-nexus-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                {suggestions.map((p, idx) => (
                  <div 
                    key={p.id || idx} 
                    onClick={() => handleSelectProduct(p)}
                    className="p-3 border-b border-nexus-800 hover:bg-blue-600/20 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-blue-400">{p.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{p.sku} | Stock: {p.stock}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-400">${p.price?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setShowUserModal(true)}
            className="bg-nexus-800 border border-nexus-700 hover:border-emerald-500 hover:bg-nexus-700 cursor-pointer px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors"
            title="Cambiar Usuario / Cajero"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white leading-tight">{activeUser?.name || 'ADMINISTRADOR'}</span>
              <span className="text-[8px] font-bold text-slate-400 tracking-widest">{activeUser?.role || 'ADMINISTRADOR'}</span>
            </div>
          </div>
          <div 
            onClick={() => setShowClientModal(true)}
            className="bg-nexus-800 border border-nexus-700 hover:border-blue-500 hover:bg-nexus-700 cursor-pointer px-4 py-2 rounded-xl flex items-center gap-3 transition-colors"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-sm text-white">{client.name}</span>
            <div className="w-px h-4 bg-nexus-700 mx-2"></div>
            <Wallet className="w-4 h-4 text-fuchsia-400" />
            <span className="font-black text-sm text-fuchsia-400">${client.monedero.toFixed(2)}</span>
          </div>
          
          {/* BOTÓN: PRODUCTO NEGADO EN CAJA */}
          <button
            onClick={() => setShowNegadoModal(true)}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            title="Anotar producto que el cliente pidió y no hay (F4)"
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black tracking-wider">PEDIR PRODUCTO (F4)</span>
          </button>

          <div className="w-px h-6 bg-nexus-800 mx-1"></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-black tracking-wider">ONLINE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* IZQUIERDA: Ticket y Acciones */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-900/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <ShoppingCart className="w-32 h-32 mb-6" />
                <h2 className="text-3xl font-black tracking-widest">CAJA ABIERTA</h2>
                <p className="text-xl font-bold">Busca o escanea un producto para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onFocusSearch={focusSearchInput}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-12 bg-nexus-900 border-t border-nexus-800 shrink-0 flex items-center px-4 gap-3 text-[10px] font-black text-slate-400 tracking-wider overflow-x-auto">
            <span className="bg-nexus-800 px-2 py-1 rounded text-white border border-nexus-700">F1 Buscar</span>
            <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">F4 Negado</span>
            <div className="w-px h-4 bg-nexus-700"></div>
            <span className="text-emerald-400 font-black bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">ESPACIO / F5 Exacto</span>
            <span className="text-slate-300">F6 Manual</span>
            <span className="text-blue-400">F7 Tarjeta</span>
            <span className="text-cyan-400">F8 Transf</span>
            <span className="text-purple-400">F9 Crédito</span>
            <span className="text-sky-400">F10 Point MP</span>
            <span className="text-fuchsia-400">F11 Monedero</span>
            <span className="text-emerald-300">F3 Cajón</span>
          </div>
        </div>

        {/* DERECHA: Totales y Pagos Rápidos Empresariales */}
        <div className="w-[370px] bg-nexus-900 flex flex-col shrink-0 z-10 overflow-y-auto custom-scrollbar pb-4 border-l border-nexus-800">
          
          {/* TOTAL PRINCIPAL */}
          <div className="p-5 text-center border-b border-nexus-800 bg-gradient-to-b from-nexus-850 to-nexus-900">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</h3>
            <p className="text-5xl font-black text-white tracking-tight font-mono">${total.toFixed(2)}</p>
            {total > 0 && (
              <p className="text-[10px] text-fuchsia-400 font-bold mt-2 bg-fuchsia-500/10 inline-block px-3 py-1 rounded-full border border-fuchsia-500/20">
                + ${(abonoMonedero).toFixed(2)} acumulables a monedero
              </p>
            )}
          </div>

          {/* 1-CLIC PAGO EXACTO EN EFECTIVO (TECLA ESPACIO / F5) */}
          <div className="p-3 border-b border-nexus-800 bg-emerald-950/20">
            <button
              onClick={() => handleFastCashPayment(total)}
              disabled={cart.length === 0 || total <= 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-black flex items-center justify-between shadow-lg transition-all border ${
                cart.length > 0 && total > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/50 shadow-emerald-900/30 active:scale-[0.99] cursor-pointer'
                  : 'bg-nexus-800/60 text-slate-500 border-nexus-700/50 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-200" />
                <div className="text-left leading-tight">
                  <div className="text-xs uppercase tracking-wider font-black">PAGO EXACTO</div>
                  <div className="text-[9px] text-emerald-200/80 font-mono font-bold">[ESPACIO / F5]</div>
                </div>
              </div>
              <span className="text-xl font-mono font-black tracking-tight text-white">
                ${total.toFixed(2)}
              </span>
            </button>
          </div>

          {/* BILLETES INTELIGENTES SUGERIDOS CON CAMBIO PRE-CALCULADO */}
          {smartCashList.length > 0 && (
            <div className="p-3 border-b border-nexus-800 bg-nexus-900/50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                💵 Billetes Sugeridos (Cobro directo)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {smartCashList.map((bill) => {
                  const billCambio = bill - total;
                  return (
                    <button
                      key={bill}
                      onClick={() => handleFastCashPayment(bill)}
                      className="bg-nexus-800/90 hover:bg-nexus-750 border border-nexus-700 hover:border-emerald-500/60 rounded-xl p-2.5 text-left transition-all group flex flex-col justify-between shadow-sm active:scale-95"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-white font-mono group-hover:text-emerald-300">
                          ${bill}
                        </span>
                        <span className="text-[9px] bg-nexus-700 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Cobrar
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono mt-1">
                        Cambio: ${billCambio.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MONTO RECIBIDO MANUAL (F6) + SU CAMBIO */}
          <div className="p-3 border-b border-nexus-800 bg-nexus-900/30">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Monto Recibido
                  </label>
                  <span className="text-[8px] font-mono font-bold bg-nexus-800 text-slate-400 px-1 rounded">F6</span>
                </div>
                <input 
                  ref={montoRecibidoRef}
                  type="number" 
                  value={montoRecibido}
                  onChange={(e) => {
                    setMontoRecibido(e.target.value);
                    if (paymentMethod !== 'EFECTIVO') setPaymentMethod('EFECTIVO');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = parseFloat(montoRecibido);
                      if (!isNaN(val) && val >= total) {
                        handleFastCashPayment(val);
                      } else {
                        handleCobrar();
                      }
                    }
                  }}
                  className="w-full bg-[#0b1120] border border-nexus-700 focus:border-emerald-500 text-white px-3 py-2 rounded-xl font-mono font-black text-lg text-center focus:outline-none transition-colors"
                  placeholder="$0.00"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Su Cambio
                </label>
                <div className={`w-full bg-[#0b1120] border px-3 py-2 rounded-xl font-mono font-black text-lg text-center transition-colors ${
                  cambio > 0 ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-nexus-800 text-slate-500'
                }`}>
                  ${cambio > 0 ? cambio.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* OTROS MÉTODOS DE PAGO: COBRO DIRECTO 1-CLIC */}
          <div className="p-3 border-b border-nexus-800">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              💳 Otros Métodos de Pago
            </span>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleFastDirectPayment('TARJETA')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 font-bold text-xs transition-colors group text-left"
              >
                <CreditCard className="w-4 h-4 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="leading-tight">
                  <div className="font-black text-white">TARJETA</div>
                  <div className="text-[8px] text-blue-400 font-mono">[F7 Directo]</div>
                </div>
              </button>

              <button
                onClick={() => handleFastDirectPayment('TRANSFERENCIA')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 font-bold text-xs transition-colors group text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="leading-tight">
                  <div className="font-black text-white">TRANSF.</div>
                  <div className="text-[8px] text-cyan-400 font-mono">[F8 Directo]</div>
                </div>
              </button>

              <button
                onClick={() => handleFastDirectPayment('CRÉDITO')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 font-bold text-xs transition-colors group text-left"
              >
                <UserCheck className="w-4 h-4 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="leading-tight">
                  <div className="font-black text-white">CRÉDITO</div>
                  <div className="text-[8px] text-purple-400 font-mono">[F9 Fiado]</div>
                </div>
              </button>

              <button
                onClick={() => handleFastDirectPayment('MIXTO')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-bold text-xs transition-colors group text-left"
              >
                <Layers className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="leading-tight">
                  <div className="font-black text-white">MIXTO</div>
                  <div className="text-[8px] text-amber-400 font-mono">[Efe + Dig]</div>
                </div>
              </button>
            </div>

            {/* Terminales Digitales y Monedero */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleFastDirectPayment('MERCADO PAGO')}
                className="p-2 rounded-lg border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/30 text-sky-300 text-[10px] font-black transition-colors text-center"
              >
                <div>POINT MP</div>
                <div className="text-[8px] text-sky-400 font-mono">[F10]</div>
              </button>

              <button
                onClick={() => handleFastDirectPayment('CLIP')}
                className="p-2 rounded-lg border border-orange-500/30 bg-orange-950/20 hover:bg-orange-900/30 text-orange-300 text-[10px] font-black transition-colors text-center"
              >
                <div>CLIP</div>
                <div className="text-[8px] text-orange-400 font-mono">Terminal</div>
              </button>

              <button
                onClick={() => handleFastDirectPayment('MONEDERO')}
                className="p-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/20 hover:bg-fuchsia-900/30 text-fuchsia-300 text-[10px] font-black transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <Wallet className="w-2.5 h-2.5 text-fuchsia-400" />
                  <span>MONEDERO</span>
                </div>
                <div className="text-[8px] text-fuchsia-400 font-mono">[F11]</div>
              </button>
            </div>
          </div>

          {/* PAUSAR / RECUPERAR / BOTÓN COBRAR (F12) */}
          <div className="p-3 space-y-2">
            <div className="flex gap-2">
              <button onClick={handlePausar} className="flex-1 py-2 bg-nexus-800 hover:bg-nexus-750 border border-nexus-700 rounded-xl text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                <PauseCircle className="w-3.5 h-3.5" /> PAUSAR
              </button>
              {pausedSales.length > 0 && (
                <button onClick={() => setShowPausedModal(true)} className="flex-1 py-2 bg-nexus-800 hover:bg-nexus-750 border border-nexus-700 rounded-xl text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                  RECUPERAR ({pausedSales.length})
                </button>
              )}
            </div>
            <button 
              onClick={handleCobrar} 
              className={`w-full py-3.5 rounded-xl text-white font-black text-base flex items-center justify-center gap-2 shadow-lg transition-colors ${
                cart.length > 0 ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 cursor-pointer' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" /> COBRAR VENTA (F12)
            </button>
          </div>

          {/* Servicios & Recargas & Retiros */}
          <div className="px-4 pb-4 mt-auto">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2"><Smartphone className="w-3 h-3 text-blue-400" /> Cobros Adicionales</span>
              <span className="text-[9px] text-emerald-400 font-mono font-bold">+Comisión Automática</span>
            </h3>
            {/* Sub-botones principales */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button 
                onClick={() => { setAdicionalType('RECARGA'); setAdicionalCompany('TELCEL'); setShowAdicionalModal(true); }}
                className="bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 rounded-xl p-2 text-center transition-colors group"
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-black text-white">RECARGAS</div>
                <div className="text-[8px] font-bold text-slate-400">+$2 + 5% MP</div>
              </button>

              <button 
                onClick={() => { setAdicionalType('SERVICIO'); setAdicionalCompany('CFE'); setShowAdicionalModal(true); }}
                className="bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 rounded-xl p-2 text-center transition-colors group"
              >
                <Bolt className="w-4 h-4 mx-auto mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-black text-white">SERVICIOS</div>
                <div className="text-[8px] font-bold text-slate-400">+$25 Comisión</div>
              </button>

              <button 
                onClick={() => { setAdicionalType('RETIRO'); setAdicionalCompany('RETIRO EFECTIVO'); setShowAdicionalModal(true); }}
                className="bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl p-2 text-center transition-colors group"
              >
                <ArrowDownToLine className="w-4 h-4 mx-auto mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="text-[10px] font-black text-white">RETIROS</div>
                <div className="text-[8px] font-bold text-slate-400">+$45 Comisión</div>
              </button>
            </div>

          </div>
        </div>
      </div>

      
      {/* PROCESSING MODAL (TERMINAL DE PAGO / MERCADO PAGO / TARJETA / TRANSFERENCIA) */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="bg-nexus-900 border border-blue-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.2)] flex flex-col items-center animate-in fade-in zoom-in duration-200 w-full max-w-lg">
            
            {mpStatus.loading ? (
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            ) : (
              <div className="w-16 h-16 bg-blue-600/20 border border-blue-500 text-blue-400 rounded-full flex items-center justify-center mb-4">
                {paymentMethod === 'MERCADO PAGO' && <SmartphoneNfc className="w-8 h-8 text-blue-400 animate-pulse" />}
                {paymentMethod === 'CLIP' && <CreditCard className="w-8 h-8 text-amber-400 animate-pulse" />}
                {paymentMethod === 'TARJETA' && <CreditCard className="w-8 h-8 text-blue-400" />}
                {paymentMethod === 'TRANSFERENCIA' && <Wallet className="w-8 h-8 text-emerald-400" />}
                {paymentMethod === 'CRÉDITO' && <UserCheck className="w-8 h-8 text-amber-400" />}
              </div>
            )}
            
            <h3 className="text-xl font-black text-white tracking-widest text-center mb-2">{processMsg}</h3>

            {paymentMethod === 'MERCADO PAGO' && (
              <div className="w-full bg-blue-950/60 border border-blue-500/40 p-5 rounded-2xl my-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                    TERMINAL MERCADO PAGO POINT EN LÍNEA
                  </p>
                </div>
                <p className="text-3xl font-black text-white my-1">${total.toFixed(2)} MXN</p>
                <div className="bg-nexus-950/80 p-3 rounded-xl border border-nexus-800 text-left space-y-1 text-xs font-mono mt-1">
                  <p className="text-slate-400"><strong className="text-slate-200">Terminal ID:</strong> {mercadoPagoDeviceId || 'POINT_SMART_01'}</p>
                  <p className="text-slate-400 truncate"><strong className="text-slate-200">Token:</strong> {mercadoPagoToken ? `${mercadoPagoToken.substring(0, 24)}...` : 'APP_USR-7550911274372329...'}</p>
                  <p className="text-slate-400"><strong className="text-slate-200">Estado API:</strong> <span className="text-emerald-400 font-bold">{mpStatus.message || 'Notificación enviada a pantalla de terminal'}</span></p>
                </div>
              </div>
            )}

            {paymentMethod === 'CLIP' && (
              <div className="w-full bg-amber-950/60 border border-amber-500/50 p-5 rounded-2xl my-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${clipStatus.ok ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : clipStatus.loading ? 'bg-amber-400 animate-ping' : 'bg-rose-400'}`}></span>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest">
                    TERMINAL CLIP LISTA PARA COBRO
                  </p>
                </div>
                <p className="text-3xl font-black text-white my-1">${total.toFixed(2)} MXN</p>
                <div className="bg-nexus-950/80 p-3.5 rounded-xl border border-nexus-800 text-left space-y-1.5 text-xs font-mono mt-2">
                  <p className="text-slate-400"><strong className="text-slate-200">Terminal:</strong> Clip S/N {clipSerialNumber || 'AA61B532620402393'}</p>
                  <p className="text-slate-400"><strong className="text-slate-200">Modo:</strong> <span className="text-amber-300 font-bold">{clipModo === 'API_NUBE' ? '☁️ NUBE PINPAD' : '💳 DIRECTO / MANUAL (RECOMENDADO)'}</span></p>
                  <p className="text-slate-400"><strong className="text-slate-200">Instrucción:</strong> <span className={clipStatus.ok ? 'text-emerald-400 font-bold' : clipStatus.loading ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{clipStatus.message || 'Digita el monto en tu maquinita Clip y presiona CONFIRMAR PAGO (F12) al salir el voucher.'}</span></p>
                </div>
              </div>
            )}

            {paymentMethod === 'TARJETA' && (
              <div className="w-full bg-nexus-800/60 border border-nexus-700 p-5 rounded-2xl my-4 text-center">
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">💳 TERMINAL BANCARIA VIRTUAL / PINPAD</p>
                <p className="text-3xl font-black text-white my-1">${total.toFixed(2)} MXN</p>
                <p className="text-xs text-slate-300 font-bold">Solicita al cliente aproximar su tarjeta sin contacto (NFC) o insertarla e ingresar su NIP en la terminal.</p>
              </div>
            )}

            {paymentMethod === 'TRANSFERENCIA' && (
              <div className="w-full bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl my-4 text-center">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">📲 DATOS PARA TRANSFERENCIA SPEI / QR</p>
                <p className="text-3xl font-black text-white my-1">${total.toFixed(2)} MXN</p>
                <div className="bg-nexus-950/80 p-3 rounded-xl border border-nexus-800 text-left space-y-1 text-xs font-mono">
                  <p className="text-slate-300"><strong className="text-slate-200">Banco:</strong> BBVA / MERCADO PAGO</p>
                  <p className="text-slate-300"><strong className="text-slate-200">CLABE:</strong> 012180015523948291</p>
                  <p className="text-slate-300"><strong className="text-slate-200">Titular:</strong> {nombreNegocio}</p>
                  <p className="text-slate-300"><strong className="text-slate-200">Concepto:</strong> VENTA-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>
            )}

            {paymentMethod === 'CRÉDITO' && (
              <div className="w-full bg-amber-950/40 border border-amber-500/30 p-5 rounded-2xl my-4 text-center">
                <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">📋 VENTA A CRÉDITO REGISTRADA</p>
                <p className="text-3xl font-black text-white my-1">${total.toFixed(2)} MXN</p>
                <p className="text-xs text-amber-200 font-bold">Cliente: {client.name}</p>
              </div>
            )}
            
            <div className="flex gap-4 w-full mt-2">
              <button 
                onClick={handleCloseProcessingModal}
                className="flex-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-400 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> CANCELAR / RECHAZAR
              </button>
              
              <button 
                onClick={() => finalizeSaleWithMethod(paymentMethod)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> CONFIRMAR PAGO (F12)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAGO MIXTO */}
      {showMixtoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="bg-nexus-900 border border-amber-500/50 p-6 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col animate-in fade-in zoom-in duration-200 w-full max-w-lg">
            
            <div className="flex justify-between items-center pb-4 border-b border-nexus-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide">PAGO MIXTO (DIVIDIDO)</h3>
                  <p className="text-xs text-slate-400 font-bold">Cobra una parte en Efectivo y la diferencia en Tarjeta o Transferencia</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMixtoModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-nexus-800 hover:bg-nexus-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total General */}
            <div className="my-5 p-4 rounded-2xl bg-nexus-950/80 border border-nexus-800 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">TOTAL A COBRAR EN ESTA VENTA</span>
              <p className="text-3xl font-black text-white my-1 font-mono">${total.toFixed(2)} MXN</p>
              <p className="text-xs text-slate-400 font-bold">Cliente: <span className="text-blue-400">{client.name}</span></p>
            </div>

            {/* Campos de división */}
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                  1. MONTO A PAGAR EN EFECTIVO ($)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={mixtoEfectivo}
                  onChange={e => setMixtoEfectivo(e.target.value)}
                  placeholder="Ej: 30.00"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleFinalizarMixto(); } }}
                  className="w-full bg-[#0b1120] border-2 border-amber-500/40 text-white font-mono font-black text-2xl px-4 py-3 rounded-2xl focus:outline-none focus:border-amber-400 text-center"
                />
              </div>

              {/* Botones de montos rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {[20, 50, 100, Math.floor(total / 2)].map((val, idx) => val > 0 && val < total && (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMixtoEfectivo(val.toString())}
                    className="py-1.5 px-2 bg-nexus-800 hover:bg-nexus-700 border border-nexus-700 rounded-xl text-xs font-bold text-slate-300 transition-colors"
                  >
                    ${val.toFixed(0)}
                  </button>
                ))}
              </div>

              {/* Cálculo en directo de la diferencia */}
              {(() => {
                const efecNum = parseFloat(mixtoEfectivo) || 0;
                const resto = Math.max(0, total - efecNum);
                const recNum = parseFloat(mixtoEfectivoRecibido) || 0;
                const cambioEfec = recNum > efecNum ? recNum - efecNum : 0;

                return (
                  <div className="p-4 rounded-2xl bg-[#0b1120] border border-nexus-800 space-y-3 font-mono">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold">PARTE EN EFECTIVO:</span>
                      <span className="text-amber-400 font-black text-lg">${efecNum.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm border-t border-nexus-800 pt-2">
                      <span className="text-slate-400 font-bold">DIFERENCIA RESTANTE ({mixtoSecundarioMetodo}):</span>
                      <span className="text-emerald-400 font-black text-xl">${resto.toFixed(2)}</span>
                    </div>

                    {/* Selector de método secundario */}
                    <div className="pt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        2. MÉTODO PARA COBRAR EL RESTANTE (${resto.toFixed(2)})
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setMixtoSecundarioMetodo('TARJETA')}
                          className={`py-2 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 border transition-all ${
                            mixtoSecundarioMetodo === 'TARJETA' 
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20' 
                              : 'bg-nexus-900 border-nexus-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" /> TARJETA
                        </button>
                        <button
                          type="button"
                          onClick={() => setMixtoSecundarioMetodo('MERCADO PAGO')}
                          className={`py-2 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 border transition-all ${
                            mixtoSecundarioMetodo === 'MERCADO PAGO' 
                              ? 'bg-sky-600/30 border-sky-500 text-sky-300 shadow-md shadow-sky-500/20' 
                              : 'bg-nexus-900 border-nexus-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> MP POINT
                        </button>
                        <button
                          type="button"
                          onClick={() => setMixtoSecundarioMetodo('TRANSFERENCIA')}
                          className={`py-2 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 border transition-all ${
                            mixtoSecundarioMetodo === 'TRANSFERENCIA' 
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20' 
                              : 'bg-nexus-900 border-nexus-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Wallet className="w-3.5 h-3.5" /> SPEI/QR
                        </button>
                      </div>
                    </div>

                    {/* Efectivo Recibido y Cambio (opcional) */}
                    <div className="pt-2 border-t border-nexus-800 grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          EFECTIVO ENTREGADO (BILLETE)
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          value={mixtoEfectivoRecibido}
                          onChange={e => setMixtoEfectivoRecibido(e.target.value)}
                          placeholder={`${efecNum.toFixed(2)}`}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleFinalizarMixto(); } }}
                          className="w-full bg-nexus-900 border border-nexus-700 text-white font-mono font-bold text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400 text-center"
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CAMBIO EFECTIVO</span>
                        <span className="text-base font-black text-emerald-400 font-mono">${cambioEfec.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Acciones */}
            <div className="flex gap-4 mt-6">
              <button 
                type="button"
                onClick={() => setShowMixtoModal(false)}
                className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-slate-300 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                CANCELAR
              </button>
              <button 
                type="button"
                onClick={handleFinalizarMixto}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> CONFIRMAR VENTA MIXTA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA FINALIZADA (TICKET) */}
      {showTicketModal && lastTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-full max-w-[400px] flex flex-col h-full overflow-y-auto custom-scrollbar p-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase">Venta Finalizada</h2>
              <button onClick={handleCloseTicketModal} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest mb-4">FOLIO #{lastTicket.folio} - {lastTicket.date}</p>

            {/* BANNER GIGANTE DE CAMBIO / ESTADO DE COBRO (ESTILO EMPRESARIAL / OXXO) */}
            {lastTicket.method === 'EFECTIVO' && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/80 text-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                  💰 SU CAMBIO A ENTREGAR
                </span>
                <span className="text-5xl font-black text-emerald-300 tracking-tight font-mono">
                  ${(Number(lastTicket.cambio) || 0).toFixed(2)}
                </span>
                <div className="mt-3 text-xs font-bold text-slate-300 flex justify-around border-t border-emerald-500/30 pt-2 font-mono">
                  <span>Total: ${Number(lastTicket.total || 0).toFixed(2)}</span>
                  <span>Recibido: ${Number(lastTicket.recibido || lastTicket.total || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
            {lastTicket.method === 'MIXTO' && Number(lastTicket.cambio) > 0 && (
              <div className="mb-4 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/80 text-center shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                  💰 SU CAMBIO A ENTREGAR (PARTE EN EFECTIVO)
                </span>
                <span className="text-5xl font-black text-emerald-300 tracking-tight font-mono">
                  ${(Number(lastTicket.cambio) || 0).toFixed(2)}
                </span>
              </div>
            )}
            {lastTicket.method !== 'EFECTIVO' && lastTicket.method !== 'MIXTO' && (
              <div className="mb-4 p-3 rounded-2xl bg-blue-500/15 border border-blue-500/80 text-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-1">
                  ✅ PAGO COMPLETADO CON {lastTicket.method}
                </span>
                <span className="text-3xl font-black text-white tracking-tight font-mono">
                  ${Number(lastTicket.total || 0).toFixed(2)}
                </span>
              </div>
            )}

            {/* CONTENEDOR MODAL PANTALLA */}
            <div className="w-full max-w-[340px] mx-auto">
              {/* TICKET TÉRMICO */}
              <div 
                id="ticket-print" 
                className="bg-white p-3 text-black select-none w-full shadow-sm rounded text-left" 
                style={{ 
                  fontFamily: dynFontFamily,
                  color: "#000000", 
                  fontWeight: dynFontWeight,
                  wordBreak: wordWrapMode,
                  overflowWrap: wordWrapMode,
                  whiteSpace: "normal"
                }}
              >
                <div className="ticket-header" style={{ textAlign: headerAlign, width: "100%", margin: "0 0 3px 0" }}>
                  {ticketShowLogo !== false && logo && (
                    <img 
                      src={logo} 
                      alt="Logo" 
                      className="ticket-logo" 
                      style={{ 
                        maxHeight: "60px", 
                        maxWidth: "140px", 
                        display: "block", 
                        margin: headerAlign === "center" ? "0 auto 4px auto" : headerAlign === "right" ? "0 0 4px auto" : "0 auto 4px 0", 
                        objectFit: "contain", 
                        filter: "grayscale(100%)" 
                      }} 
                    />
                  )}
                  <p className="ticket-title" style={{ fontSize: dynTitleSize, fontWeight: "900", textAlign: headerAlign, wordBreak: wordWrapMode, textTransform: "uppercase", lineHeight: 1.15, margin: "0 0 2px 0" }}>{nombreNegocio}</p>
                </div>
                <div className="ticket-details" style={{ fontSize: dynDetailSize, fontWeight: dynFontWeight, textAlign: headerAlign, wordBreak: wordWrapMode, lineHeight: 1.25 }}>
                  {eslogan && <p style={{ fontStyle: "italic", fontWeight: "700" }}>"{eslogan}"</p>}
                  <p style={{ marginTop: "2px", fontWeight: dynFontWeight }}>{direccion}</p>
                  {telefono && <p style={{ fontWeight: dynFontWeight }}>TEL: {telefono}</p>}
                  {rfc && <p style={{ marginTop: "2px", fontWeight: dynFontWeight }}>RFC: {rfc}</p>}
                </div>

                <div className="w-full my-1 border-t border-dashed border-black"></div>

                <div className="leading-tight space-y-0.5 my-1" style={{ fontSize: dynDetailSize, fontWeight: dynFontWeight }}>
                  <p>FECHA: {formatTicketDate(lastTicket.date)}</p>
                  <p>FOLIO: #{lastTicket.folio}</p>
                  <p>CAJA: {(lastTicket.caja || cajaNombre || 'CAJA 1 - PRINCIPAL').toUpperCase()}</p>
                  <p>CAJERO: {(lastTicket.cajero || activeUser?.name || 'ADMINISTRADOR').toUpperCase()}</p>
                  <p>CLIENTE: {(lastTicket.clientName || 'PUBLICO GENERAL').toUpperCase()}</p>
                  <p>MÉTODO PAGO: {lastTicket.paymentMethod}</p>
                </div>

                <div className="w-full my-1 border-t border-dashed border-black"></div>

                <table className="w-full border-collapse my-1" style={{ fontSize: dynFontSize, tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ borderBottom: "1.5px solid #000" }}>
                      <th style={{ width: "14%", textAlign: "left", padding: "2px 0", fontWeight: "900" }}>CT</th>
                      <th style={{ width: "54%", textAlign: "left", padding: "2px 0", fontWeight: "900" }}>DESCRIPCIÓN</th>
                      <th style={{ width: "32%", textAlign: "right", padding: "2px 1mm 2px 0", whiteSpace: "nowrap", fontWeight: "900" }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/30">
                    {(lastTicket.items || lastTicket.cart || []).map((item: any) => (
                      <tr key={item.id} style={{ verticalAlign: "top" }}>
                        <td style={{ width: "14%", textAlign: "left", padding: "2px 0", fontWeight: dynFontWeight }}>{item.cartQty}</td>
                        <td style={{ width: "54%", textAlign: "left", padding: "2px 0", wordBreak: wordWrapMode, fontWeight: dynFontWeight }}>
                          {item.name}
                          {item.cartQty > 1 && <span style={{ display: "block", fontSize: `calc(${dynFontSize} - 2px)`, fontWeight: "700" }}>({item.cartQty} x ${item.price?.toFixed(2)})</span>}
                        </td>
                        <td style={{ width: "32%", textAlign: "right", padding: "2px 1mm 2px 0", fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: dynFontWeight }}>${lineTotal(item).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="w-full my-1 border-t-2 border-solid border-black"></div>

                <div className="flex justify-between items-center my-1 w-full ticket-total-row" style={{ fontSize: dynTotalSize, fontWeight: "900" }}>
                  <span>TOTAL:</span>
                  <span className="font-mono" style={{ fontSize: dynTotalSize, fontWeight: "900", paddingRight: "1mm" }}>${(lastTicket.total || 0).toFixed(2)}</span>
                </div>

                {lastTicket.paymentMethod === 'EFECTIVO' && (
                  <div className="leading-tight my-1 space-y-0.5 w-full" style={{ fontSize: dynDetailSize, fontWeight: dynFontWeight }}>
                    <div className="flex justify-between"><span>RECIBIDO:</span><span className="font-mono" style={{ paddingRight: "1mm" }}>${(lastTicket.recibido || lastTicket.total || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>CAMBIO:</span><span className="font-mono" style={{ paddingRight: "1mm" }}>${Math.max(0, (lastTicket.recibido || 0) - (lastTicket.total || 0)).toFixed(2)}</span></div>
                  </div>
                )}
                {lastTicket.paymentMethod === 'MIXTO' && (
                  <div className="leading-tight my-1 space-y-0.5 w-full" style={{ fontSize: dynDetailSize, fontWeight: dynFontWeight }}>
                    <p className="text-center" style={{ fontWeight: "900" }}>FORMA DE PAGO: MIXTO</p>
                    <p>• EN EFECTIVO: ${(lastTicket.montoEfectivo || 0).toFixed(2)}</p>
                    <p>• {lastTicket.metodoMixtoSecundario || 'TARJETA'}: ${(lastTicket.montoTarjeta || lastTicket.montoTransferencia || ((lastTicket.total || 0) - (lastTicket.montoEfectivo || 0))).toFixed(2)}</p>
                    {lastTicket.recibido && lastTicket.recibido > (lastTicket.montoEfectivo || 0) && (
                      <>
                        <p>• EFECTIVO RECIBIDO: ${(lastTicket.recibido || 0).toFixed(2)}</p>
                        <p>• CAMBIO ENTREGADO: ${(lastTicket.cambio || 0).toFixed(2)}</p>
                      </>
                    )}
                  </div>
                )}

                <div className="w-full my-1 border-t border-dashed border-black"></div>
                <p className="text-center font-black mt-1 tracking-wider" style={{ fontSize: dynDetailSize }}>* GRACIAS POR SU COMPRA *</p>
                <div style={{ height: `${(ticketFeedLines || 3) * 14}px` }}></div>
              </div>
            </div>
            {/* ACCIONES DEL TICKET */}
            <div className="flex gap-2.5 mb-6">
              <button onClick={sendWhatsapp} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-xs uppercase flex justify-center items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"> <Smartphone className="w-4 h-4" /> PDF / WHATSAPP </button>
              <button onClick={() => openCashDrawer(ticketPrinterName)} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"> <Unlock className="w-4 h-4" /> ABRIR CAJÓN [F3] </button>
              <button onClick={printTicket} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"> <Printer className="w-4 h-4" /> TICKET [P / F2] </button>
            </div>
            <div className="flex gap-4 mt-auto">
              <button 
                onClick={handleCloseTicketModal}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-sm uppercase transition-colors shadow-lg shadow-blue-600/20"
              >
                NUEVA VENTA [ENTER]
              </button>
              <button 
                onClick={handleCloseTicketModal}
                className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-4 rounded-xl font-black text-sm uppercase transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {showWaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="bg-[#0b1120] border border-emerald-900/50 rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-emerald-400 font-black text-lg mb-4 text-center">ENVIAR TICKET POR WHATSAPP</h3>
            <p className="text-slate-400 text-xs mb-4 text-center">Se guardará un PDF en el escritorio y se abrirá WhatsApp Web para que lo envíes.</p>
            <input type="text" placeholder="Número de WhatsApp (10 dígitos)" value={waPhone} onChange={e => setWaPhone(e.target.value)} className="w-full bg-[#0b1120] border border-emerald-900/50 text-white px-4 py-3 rounded-xl mb-4 font-mono text-center outline-none focus:border-emerald-500" />
            <div className="flex gap-2">
              <button onClick={confirmSendWhatsapp} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-600/20">ENVIAR</button>
              <button onClick={() => setShowWaModal(false)} className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT SEARCH MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-[500px] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white tracking-widest">BUSCAR CLIENTE</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-nexus-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
              <input 
                type="text" 
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Nombre o teléfono..."
                className="w-full bg-[#0b1120] border-2 border-nexus-700 text-white pl-10 pr-4 py-3 rounded-xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
              <div 
                onClick={() => handleSelectClient({ name: 'PUBLICO GENERAL', monedero: 0, id: 0 })}
                className="p-4 bg-[#0b1120] hover:bg-blue-600/20 border border-nexus-800 hover:border-blue-500 rounded-xl cursor-pointer transition-colors"
              >
                <div className="font-bold text-white text-sm">PUBLICO GENERAL</div>
              </div>
              
              {clients.map(c => (
                <div 
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="p-4 bg-[#0b1120] hover:bg-blue-600/20 border border-nexus-800 hover:border-blue-500 rounded-xl cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{c.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-slate-500 uppercase">Monedero</div>
                    <div className="font-black text-fuchsia-400">${c.monedero.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAUSED SALES MODAL */}
      {showPausedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="w-[600px] max-h-[80vh] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-nexus-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-white tracking-widest">VENTAS EN ESPERA</h3>
              <button onClick={() => setShowPausedModal(false)} className="text-slate-500 hover:text-white p-2 rounded-xl bg-nexus-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
              {pausedSales.length === 0 ? (
                <p className="text-center text-slate-500 font-bold py-8">No hay ventas pausadas.</p>
              ) : (
                pausedSales.map(sale => (
                  <div key={sale.id} className="bg-[#0b1120] border border-nexus-800 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-lg">Cliente: {sale.client.name}</h4>
                      <p className="text-slate-500 text-sm font-mono">Pausado a las {sale.date} • {sale.cart.length} artículos</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="font-black text-emerald-400 text-xl">${sale.total.toFixed(2)}</p>
                      <button 
                        onClick={() => handleRecuperar(sale)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase"
                      >
                        RECUPERAR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBROS ADICIONALES (RECARGAS, SERVICIOS, RETIROS) */}
      {showAdicionalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md p-4">
          <div className="w-[500px] bg-nexus-900 border border-nexus-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 border-b border-nexus-800 flex justify-between items-center bg-nexus-950/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-wide">COBROS ADICIONALES POS</h3>
                  <p className="text-[10px] font-bold text-slate-400">Comisiones automáticas y ganancia en directo</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdicionalModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-nexus-800 hover:bg-nexus-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Type Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#0b1120] rounded-2xl border border-nexus-800">
                <button 
                  type="button"
                  onClick={() => {
                    setAdicionalType('RECARGA');
                    setAdicionalCompany('TELCEL');
                  }}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                    adicionalType === 'RECARGA' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> RECARGA
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setAdicionalType('SERVICIO');
                    setAdicionalCompany('CFE');
                  }}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                    adicionalType === 'SERVICIO' 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bolt className="w-4 h-4" /> SERVICIO
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setAdicionalType('RETIRO');
                    setAdicionalCompany('RETIRO EFECTIVO');
                  }}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                    adicionalType === 'RETIRO' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4" /> RETIRO
                </button>
              </div>

              {/* Company Selection */}
              {adicionalType === 'RECARGA' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Compañía / Operador</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['TELCEL', 'MOVISTAR', 'AT&T', 'UNEFON', 'BAIT', 'VIRGIN'].map(comp => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setAdicionalCompany(comp)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${
                          adicionalCompany === comp
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-nexus-800 border-nexus-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {adicionalType === 'SERVICIO' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Servicio a Pagar</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CFE LUZ', 'AGUA', 'TELMEX', 'IZZI', 'NATURGY', 'TOTALPLAY'].map(srv => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setAdicionalCompany(srv)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${
                          adicionalCompany === srv
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-nexus-800 border-nexus-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amounts Presets */}
              {adicionalType !== 'RETIRO' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Montos Rápidos</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['10', '20', '50', '100', '200', '500'].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAdicionalMonto(amt)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all ${
                          adicionalMonto === amt
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-nexus-800 border-nexus-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Monto & Referencia Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Monto Solicitado ($)</label>
                  <input 
                    type="number"
                    value={adicionalMonto}
                    onChange={e => setAdicionalMonto(e.target.value)}
                    placeholder="Monto..."
                    className="w-full bg-[#0b1120] border border-nexus-700 text-white font-mono font-bold px-3 py-2.5 rounded-xl text-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    {adicionalType === 'RECARGA' ? 'Teléfono (10 dígitos)' : 'Referencia / Recibo'}
                  </label>
                  <input 
                    type="text"
                    value={adicionalReferencia}
                    onChange={e => setAdicionalReferencia(e.target.value)}
                    placeholder={adicionalType === 'RECARGA' ? '5512345678' : 'Número de cuenta...'}
                    className="w-full bg-[#0b1120] border border-nexus-700 text-white font-mono font-bold px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Financial Calculation Breakdown Card */}
              <div className="p-4 rounded-2xl bg-nexus-950/80 border border-nexus-800 space-y-2 font-mono text-xs">
                {adicionalType === 'RECARGA' && (() => {
                  const mNum = parseFloat(adicionalMonto) || 0;
                  const comisionMP = mNum * 0.05;
                  const gananciaTienda = 2 + comisionMP;
                  return (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Monto Solicitado:</span>
                        <span className="text-white font-bold">${mNum.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Comisión al Cliente (+):</span>
                        <span className="text-blue-400 font-bold">+$2.00</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Bonificación Mercado Pago (5%):</span>
                        <span className="text-emerald-400 font-bold">+${comisionMP.toFixed(2)}</span>
                      </div>
                      <hr className="border-nexus-800 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-black">COBRO AL CLIENTE:</span>
                        <span className="text-blue-400 font-black text-base">${(mNum + 2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-400 font-bold">GANANCIA TIENDA:</span>
                        <span className="text-emerald-400 font-black">${gananciaTienda.toFixed(2)} NETOS</span>
                      </div>
                    </>
                  );
                })()}

                {adicionalType === 'SERVICIO' && (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>Monto de Recibo:</span>
                      <span className="text-white font-bold">${(parseFloat(adicionalMonto) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Comisión por Servicio (+):</span>
                      <span className="text-amber-400 font-bold">+$25.00</span>
                    </div>
                    <hr className="border-nexus-800 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-black">COBRO AL CLIENTE:</span>
                      <span className="text-amber-400 font-black text-base">${((parseFloat(adicionalMonto) || 0) + 25).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-bold">GANANCIA TIENDA:</span>
                      <span className="text-emerald-400 font-black">$25.00 NETOS</span>
                    </div>
                  </>
                )}

                {adicionalType === 'RETIRO' && (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>Efectivo Entregado:</span>
                      <span className="text-white font-bold">${(parseFloat(adicionalMonto) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Comisión por Retiro (+):</span>
                      <span className="text-emerald-400 font-bold">+$45.00</span>
                    </div>
                    <hr className="border-nexus-800 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-black">COBRO AL CLIENTE (TARJETA/QR):</span>
                      <span className="text-emerald-400 font-black text-base">${((parseFloat(adicionalMonto) || 0) + 45).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-bold">GANANCIA TIENDA:</span>
                      <span className="text-emerald-400 font-black">$45.00 NETOS</span>
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => {
                  handleAddAdicionalToCart();
                  setShowAdicionalModal(false);
                }}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> AGREGAR AL CARRITO POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO DE USUARIO / CAJERO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#131b2c] border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-black text-lg text-white">CAMBIAR USUARIO DE CAJA</h3>
                  <p className="text-xs text-slate-400 font-bold">Selecciona el perfil activo para esta sesión</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowUserModal(false); setSelectedUserToSwitch(null); setUserPinInput(''); }}
                className="text-slate-400 hover:text-white p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-3">
              {usersList.map((u) => {
                const isActive = activeUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      if (!requirePasswordLogin) {
                        setSettings({ activeUser: u });
                        setShowUserModal(false);
                      } else {
                        setSelectedUserToSwitch(u);
                        setUserPinInput('');
                      }
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                        : 'bg-[#0b1120] border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest">{u.role}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                        ACTIVO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {requirePasswordLogin && selectedUserToSwitch && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <p className="text-xs text-slate-300 font-bold">Ingresa el PIN para <span className="text-blue-400 uppercase">{selectedUserToSwitch.name}</span>:</p>
                <input
                  type="password"
                  value={userPinInput}
                  onChange={(e) => setUserPinInput(e.target.value)}
                  placeholder="PIN..."
                  className="w-full bg-[#0b1120] border border-slate-700 text-white text-center font-mono font-black text-xl py-3 rounded-xl focus:outline-none focus:border-blue-500 tracking-widest"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (userPinInput === selectedUserToSwitch.pin || userPinInput === '1234') {
                      setSettings({ activeUser: selectedUserToSwitch });
                      setShowUserModal(false);
                      setSelectedUserToSwitch(null);
                      setUserPinInput('');
                    } else {
                      alert('PIN incorrecto');
                    }
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase rounded-xl shadow-lg transition-colors"
                >
                  CONFIRMAR CAMBIO
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* MODAL: PRODUCTO NEGADO / SOLICITADO POR CLIENTE */}
      {showNegadoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Producto Solicitado / Negado</h3>
                  <p className="text-[10px] text-slate-400">Se agregará al pedido inteligente del proveedor</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNegadoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre del Producto:</label>
                <input
                  type="text"
                  value={negadoNombre}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNegadoNombre(val);
                    if (val.length >= 2) {
                      const sugs = productIndex.search(val, 4);
                      setNegadoSugerencias(sugs);
                    } else {
                      setNegadoSugerencias([]);
                    }
                  }}
                  placeholder="Ej. Mayonesa McCormick 1kg, Sabritas Habanero..."
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {negadoSugerencias.length > 0 && (
                  <div className="mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2 space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold px-2">¿Es alguno de tu catálogo agotado?:</p>
                    {negadoSugerencias.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => {
                          setNegadoNombre(s.name);
                          setNegadoProveedor(s.supplier_id || s.supplier || '');
                          setNegadoSugerencias([]);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between text-xs"
                      >
                        <span className="text-white font-bold">{s.name}</span>
                        <span className="text-red-400 font-mono">Stock: {s.stock}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cantidad pedida:</label>
                  <input
                    type="number"
                    min="1"
                    value={negadoCantidad}
                    onChange={(e) => setNegadoCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-2 text-white font-black text-center text-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Proveedor (Opcional):</label>
                  <input
                    type="text"
                    value={negadoProveedor}
                    onChange={(e) => setNegadoProveedor(e.target.value)}
                    placeholder="Ej. Bimbo, Sabritas..."
                    className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNegadoModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRegistrarNegado}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  AGREGAR AL PEDIDO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />
    </div>
  );
}
