import { create } from 'zustand';

export interface UserItem {
  id: string;
  name: string;
  role: 'ADMINISTRADOR' | 'CAJERO' | 'AUDITOR';
  pin: string;
}

interface SettingsState {
  nombreNegocio: string;
  rfc: string;
  eslogan: string;
  telefono: string;
  email: string;
  direccion: string;
  logo: string;
  cajaNombre: string;
  servidorIp: string;
  mercadoPagoToken: string;
  mercadoPagoDeviceId: string;
  terminalBancariaModo: string;
  clipApiKey: string;
  clipSecretKey: string;
  clipSerialNumber: string;
  clipModo: string;
  bancoDefault: string;
  requirePasswordLogin: boolean;
  preventNegativeStock: boolean;
  ticketPrinterName: string;
  ticketFontFamily: 'sans-serif' | 'monospace';
  ticketFontWeight: 'bold' | 'black' | 'normal';
  ticketTitleSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  ticketDetailSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  ticketFontSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  ticketTotalSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  ticketWidth: '58mm' | '80mm';
  ticketCharsPerLine: number;
  ticketFeedLines: number;
  ticketHeaderAlign: 'center' | 'left';
  ticketWordWrap: boolean;
  ticketShowLogo: boolean;
  activeUser: UserItem;
  usersList: UserItem[];
  setSettings: (settings: Partial<SettingsState>) => void;
}

const USER_MP_TOKEN = 'APP_USR-7550911274372329-020913-4c9391b9edb39d57a3c97e1af4c86c0f-3193296364';

const defaultUsers: UserItem[] = [
  { id: '1', name: 'ADMINISTRADOR', role: 'ADMINISTRADOR', pin: '1234' },
  { id: '2', name: 'CAJERO 1', role: 'CAJERO', pin: '0000' },
  { id: '3', name: 'AUDITOR / ALMACÉN', role: 'AUDITOR', pin: '1111' }
];

const savedUsersRaw = localStorage.getItem('nexus_usersList');
let savedUsers: UserItem[] = defaultUsers;
if (savedUsersRaw) {
  try { savedUsers = JSON.parse(savedUsersRaw); } catch (e) {}
}

const savedActiveUserRaw = localStorage.getItem('nexus_activeUser');
let savedActiveUser: UserItem = savedUsers[0] || defaultUsers[0];
if (savedActiveUserRaw) {
  try { savedActiveUser = JSON.parse(savedActiveUserRaw); } catch (e) {}
}

export const useSettings = create<SettingsState>((set) => ({
  nombreNegocio: localStorage.getItem('nexus_nombreNegocio') || localStorage.getItem('titan_master_name') || 'MI TIENDITA "MISCELANEA BRITTANY"',
  rfc: localStorage.getItem('nexus_rfc') || 'HEGJ8004018I9',
  eslogan: localStorage.getItem('nexus_eslogan') || 'TU TIENDA DE CONFIANZA',
  telefono: localStorage.getItem('nexus_telefono') || '9612765041',
  email: localStorage.getItem('nexus_email') || 'miscelaneabrittany@gmail.com',
  direccion: localStorage.getItem('nexus_direccion') || 'AV. 16 DE SEPTIEMBRE 903, COL. BIENESTAR SOCIAL, TUXTLA GUTIERREZ, CHIAPAS. CP 29077',
  logo: localStorage.getItem('nexus_logo') || localStorage.getItem('ticketLogo') || '',
  cajaNombre: localStorage.getItem('nexus_cajaNombre') || 'CAJA MÓVIL (CELULAR)',
  servidorIp: localStorage.getItem('nexus_servidorIp') || '192.168.100.38:3008',
  mercadoPagoToken: localStorage.getItem('nexus_mercadoPagoToken') || USER_MP_TOKEN,
  mercadoPagoDeviceId: localStorage.getItem('nexus_mercadoPagoDeviceId') || 'POINT_SMART_01',
  terminalBancariaModo: localStorage.getItem('nexus_terminalBancariaModo') || 'TERMINAL_MANUAL_PINPAD',
  clipApiKey: localStorage.getItem('nexus_clipApiKey') || '',
  clipSecretKey: localStorage.getItem('nexus_clipSecretKey') || '',
  clipSerialNumber: localStorage.getItem('nexus_clipSerialNumber') || '',
  clipModo: localStorage.getItem('nexus_clipModo') || 'APP_MOVIL',
  bancoDefault: localStorage.getItem('nexus_bancoDefault') || 'BBVA / BANCOMER',
  requirePasswordLogin: localStorage.getItem('nexus_requirePasswordLogin') === 'true',
  preventNegativeStock: localStorage.getItem('nexus_preventNegativeStock') !== 'false',
  ticketPrinterName: localStorage.getItem('nexus_selected_printer') || '',
  ticketFontFamily: ((localStorage.getItem('nexus_ticketFontFamily') as any) || 'monospace'),
  ticketFontWeight: ((localStorage.getItem('nexus_ticketFontWeight') as any) || 'black'),
  ticketTitleSize: ((localStorage.getItem('nexus_ticketTitleSize') as any) || 'md'),
  ticketDetailSize: ((localStorage.getItem('nexus_ticketDetailSize') as any) || 'md'),
  ticketFontSize: ((localStorage.getItem('nexus_ticketFontSize') as any) || 'md'),
  ticketTotalSize: ((localStorage.getItem('nexus_ticketTotalSize') as any) || 'md'),
  ticketWidth: ((localStorage.getItem('nexus_ticketWidth') as any) || '58mm'),
  ticketCharsPerLine: parseInt(localStorage.getItem('nexus_ticketCharsPerLine') || '32', 10),
  ticketFeedLines: parseInt(localStorage.getItem('nexus_ticketFeedLines') || '3', 10),
  ticketHeaderAlign: ((localStorage.getItem('nexus_ticketHeaderAlign') as any) || 'center'),
  ticketWordWrap: localStorage.getItem('nexus_ticketWordWrap') !== 'false',
  ticketShowLogo: localStorage.getItem('nexus_ticketShowLogo') !== 'false',
  activeUser: savedActiveUser,
  usersList: savedUsers,
  setSettings: (settings) => {
    if (settings.direccion !== undefined) localStorage.setItem('nexus_direccion', settings.direccion);
    if (settings.nombreNegocio !== undefined) localStorage.setItem('nexus_nombreNegocio', settings.nombreNegocio);
    if (settings.rfc !== undefined) localStorage.setItem('nexus_rfc', settings.rfc);
    if (settings.eslogan !== undefined) localStorage.setItem('nexus_eslogan', settings.eslogan);
    if (settings.telefono !== undefined) localStorage.setItem('nexus_telefono', settings.telefono);
    if (settings.email !== undefined) localStorage.setItem('nexus_email', settings.email);
    if (settings.logo !== undefined) {
      localStorage.setItem('nexus_logo', settings.logo);
      localStorage.setItem('ticketLogo', settings.logo);
    }
    if (settings.cajaNombre !== undefined) localStorage.setItem('nexus_cajaNombre', settings.cajaNombre);
    if (settings.servidorIp !== undefined) localStorage.setItem('nexus_servidorIp', settings.servidorIp);
    if (settings.mercadoPagoToken !== undefined) localStorage.setItem('nexus_mercadoPagoToken', settings.mercadoPagoToken);
    if (settings.mercadoPagoDeviceId !== undefined) localStorage.setItem('nexus_mercadoPagoDeviceId', settings.mercadoPagoDeviceId);
    if (settings.terminalBancariaModo !== undefined) localStorage.setItem('nexus_terminalBancariaModo', settings.terminalBancariaModo);
    if (settings.clipApiKey !== undefined) localStorage.setItem('nexus_clipApiKey', settings.clipApiKey);
    if (settings.clipSecretKey !== undefined) localStorage.setItem('nexus_clipSecretKey', settings.clipSecretKey);
    if (settings.clipSerialNumber !== undefined) localStorage.setItem('nexus_clipSerialNumber', settings.clipSerialNumber);
    if (settings.clipModo !== undefined) localStorage.setItem('nexus_clipModo', settings.clipModo);
    if (settings.bancoDefault !== undefined) localStorage.setItem('nexus_bancoDefault', settings.bancoDefault);
    if (settings.requirePasswordLogin !== undefined) localStorage.setItem('nexus_requirePasswordLogin', String(settings.requirePasswordLogin));
    if (settings.preventNegativeStock !== undefined) localStorage.setItem('nexus_preventNegativeStock', String(settings.preventNegativeStock));
    if (settings.ticketPrinterName !== undefined) localStorage.setItem('nexus_selected_printer', settings.ticketPrinterName);
    if (settings.ticketFontFamily !== undefined) localStorage.setItem('nexus_ticketFontFamily', settings.ticketFontFamily);
    if (settings.ticketFontWeight !== undefined) localStorage.setItem('nexus_ticketFontWeight', settings.ticketFontWeight);
    if (settings.ticketTitleSize !== undefined) localStorage.setItem('nexus_ticketTitleSize', settings.ticketTitleSize);
    if (settings.ticketDetailSize !== undefined) localStorage.setItem('nexus_ticketDetailSize', settings.ticketDetailSize);
    if (settings.ticketFontSize !== undefined) localStorage.setItem('nexus_ticketFontSize', settings.ticketFontSize);
    if (settings.ticketTotalSize !== undefined) localStorage.setItem('nexus_ticketTotalSize', settings.ticketTotalSize);
    if (settings.ticketWidth !== undefined) localStorage.setItem('nexus_ticketWidth', settings.ticketWidth);
    if (settings.ticketCharsPerLine !== undefined) localStorage.setItem('nexus_ticketCharsPerLine', String(settings.ticketCharsPerLine));
    if (settings.ticketFeedLines !== undefined) localStorage.setItem('nexus_ticketFeedLines', String(settings.ticketFeedLines));
    if (settings.ticketHeaderAlign !== undefined) localStorage.setItem('nexus_ticketHeaderAlign', settings.ticketHeaderAlign);
    if (settings.ticketWordWrap !== undefined) localStorage.setItem('nexus_ticketWordWrap', String(settings.ticketWordWrap));
    if (settings.ticketShowLogo !== undefined) localStorage.setItem('nexus_ticketShowLogo', String(settings.ticketShowLogo));
    if (settings.activeUser !== undefined) localStorage.setItem('nexus_activeUser', JSON.stringify(settings.activeUser));
    if (settings.usersList !== undefined) localStorage.setItem('nexus_usersList', JSON.stringify(settings.usersList));
    set(settings);
  }
}));


