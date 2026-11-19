const fs = require('fs');
const path = require('path');

function updateComponents(baseDir) {
  // 1. Actualizar Config.tsx
  const configPath = path.join(baseDir, 'src', 'pages', 'Config.tsx');
  if (fs.existsSync(configPath)) {
    let conf = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

    // Agregar estados locales si no están
    if (!conf.includes('clipApiKey:')) {
      conf = conf.replace(
        "const { nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, setSettings } = useSettings();",
        "const { nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey, clipSerialNumber, clipModo, bancoDefault, setSettings } = useSettings();"
      );
      conf = conf.replace(
        "const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo });",
        "const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email, direccion, logo: storeLogo, cajaNombre, servidorIp, requirePasswordLogin, usersList, activeUser, mercadoPagoToken, mercadoPagoDeviceId, terminalBancariaModo, clipApiKey: clipApiKey || '', clipSerialNumber: clipSerialNumber || '', clipModo: clipModo || 'APP_MOVIL', bancoDefault: bancoDefault || 'BBVA / BANCOMER' });"
      );
    }

    // Reemplazar o enriquecer la sección de terminales bancarias y mercado pago
    const terminalBlockRegex = /{\/\* TERMINAL BANCARIA \*\/}[\s\S]*?{\/\* CONFIGURACIÓN TERMINALES Y MERCADO PAGO \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

    const newTerminalsUI = `{/* INTEGRACIÓN DE TERMINALES: MERCADO PAGO, CLIP Y BANCOS */}
              <div className="bg-[#0b1120] border border-nexus-800 rounded-2xl p-5 space-y-6">
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-emerald-400" /> VINCULACIÓN DE TERMINALES DE PAGO (MULTIPROVEEDOR)
                  </h4>
                  <p className="text-xs text-slate-400">Configura tus maquinitas de cobro. Mercado Pago y Clip operan sin interferir entre sí.</p>
                </div>

                {/* 1. MERCADO PAGO POINT */}
                <div className="bg-nexus-900/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase">
                      💙 1. TERMINAL MERCADO PAGO POINT (SMART / AIR)
                    </span>
                    <span className="text-[10px] bg-blue-900/50 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-700">API ACTIVA</span>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MERCADO PAGO ACCESS TOKEN</label>
                    <input
                      type="text"
                      value={localSettings.mercadoPagoToken}
                      onChange={e => setLocalSettings({...localSettings, mercadoPagoToken: e.target.value})}
                      placeholder="APP_USR-7550911274372329..."
                      className="w-full bg-[#0b1120] border border-nexus-700 text-emerald-400 px-3 py-2 rounded-lg font-mono text-xs font-bold focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">DEVICE ID (NÚMERO DE TERMINAL POINT)</label>
                    <input
                      type="text"
                      value={localSettings.mercadoPagoDeviceId}
                      onChange={e => setLocalSettings({...localSettings, mercadoPagoDeviceId: e.target.value})}
                      placeholder="POINT_SMART_01"
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. TERMINAL CLIP */}
                <div className="bg-nexus-900/80 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase">
                      🧡 2. TERMINAL CLIP (CLIP PLUS 2 / TOTAL / PRO / STAND)
                    </span>
                    <span className="text-[10px] bg-amber-900/50 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-700">COMPATIBLE</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MODO DE CONEXIÓN CLIP</label>
                      <select
                        value={localSettings.clipModo}
                        onChange={e => setLocalSettings({...localSettings, clipModo: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-amber-300 px-3 py-2 rounded-lg font-bold text-xs focus:border-amber-500 outline-none"
                      >
                        <option value="APP_MOVIL">📲 APP CLIP CELULAR (BLUETOOTH / DEEP LINK)</option>
                        <option value="API_NUBE">☁️ API NUBE CLIP EMPRESAS (WIFI / CHIP)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">NO. DE SERIE O SERIAL CLIP</label>
                      <input
                        type="text"
                        value={localSettings.clipSerialNumber}
                        onChange={e => setLocalSettings({...localSettings, clipSerialNumber: e.target.value})}
                        placeholder="Ej. CLIP-PRO-8849"
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">API KEY / AUTH TOKEN CLIP (OPCIONAL PARA MODO NUBE)</label>
                    <input
                      type="password"
                      value={localSettings.clipApiKey}
                      onChange={e => setLocalSettings({...localSettings, clipApiKey: e.target.value})}
                      placeholder="Basic Y2xpZW50X2lkOnNlY3Jld..."
                      className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-mono text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* 3. TERMINALES BANCARIAS TRADICIONALES */}
                <div className="bg-nexus-900/80 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200 flex items-center gap-1.5 uppercase">
                      🏛️ 3. TERMINAL BANCARIA (BBVA, BANORTE, CITIBANAMEX, HSBC, INBURSA, SANTANDER)
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-600">PINPAD / TPV</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">BANCO DE LA TERMINAL</label>
                      <select
                        value={localSettings.bancoDefault}
                        onChange={e => setLocalSettings({...localSettings, bancoDefault: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                      >
                        <option value="BBVA / BANCOMER">BBVA (BANCOMER)</option>
                        <option value="BANORTE">BANORTE (PAYWORKS)</option>
                        <option value="CITIBANAMEX">CITIBANAMEX</option>
                        <option value="HSBC">HSBC</option>
                        <option value="INBURSA">INBURSA</option>
                        <option value="SANTANDER">SANTANDER (GETNET)</option>
                        <option value="SCOTIABANK">SCOTIABANK</option>
                        <option value="NETPAY">NETPAY / SMART POS</option>
                        <option value="OTRO BANCO">OTRO BANCO NACIONAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">MODO DE REGISTRO</label>
                      <select
                        value={localSettings.terminalBancariaModo}
                        onChange={e => setLocalSettings({...localSettings, terminalBancariaModo: e.target.value})}
                        className="w-full bg-[#0b1120] border border-nexus-700 text-white px-3 py-2 rounded-lg font-bold text-xs focus:border-blue-500 outline-none"
                      >
                        <option value="TERMINAL_MANUAL_PINPAD">REGISTRO MANUAL CON VOUCHER</option>
                        <option value="TERMINAL_INTEGRADA_PINPAD">PINPAD BANCARIO INTEGRADO</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>`;

    if (terminalBlockRegex.test(conf)) {
      conf = conf.replace(terminalBlockRegex, newTerminalsUI);
      fs.writeFileSync(configPath, conf.replace(/\n/g, '\r\n'), 'utf8');
      console.log(`✅ Config.tsx actualizado con sección multiproveedor en ${baseDir}`);
    }
  }

  // 2. Actualizar CheckoutModal.tsx
  const checkoutPath = path.join(baseDir, 'src', 'components', 'CheckoutModal.tsx');
  if (fs.existsSync(checkoutPath)) {
    let check = fs.readFileSync(checkoutPath, 'utf8').replace(/\r\n/g, '\n');

    // Permitir nuevos métodos en el tipo
    check = check.replace(
      "paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO'",
      "paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MERCADO PAGO' | 'CLIP' | 'BANCO'"
    );
    check = check.replace(
      "useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO'>('EFECTIVO')",
      "useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO' | 'MERCADO PAGO' | 'CLIP' | 'BANCO'>('EFECTIVO')"
    );

    // Enriquecer la lista de métodos de pago visuales
    const oldMethodsGrid = `                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: ArrowRightLeft },
                  { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                  { id: 'CREDITO', label: 'Crédito', icon: Clock }
                ].map((m) => {`;

    const newMethodsGrid = `                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote, color: 'text-emerald-400' },
                  { id: 'MERCADO PAGO', label: 'Mercado Pago Point', icon: CreditCard, color: 'text-blue-400' },
                  { id: 'CLIP', label: 'Terminal Clip', icon: CreditCard, color: 'text-amber-400' },
                  { id: 'TARJETA', label: 'Tarjeta Banco (BBVA/Banorte)', icon: CreditCard, color: 'text-purple-400' },
                  { id: 'TRANSFERENCIA', label: 'Transferencia SPEI', icon: ArrowRightLeft, color: 'text-cyan-400' },
                  { id: 'CREDITO', label: 'Crédito / Fiado', icon: Clock, color: 'text-rose-400' }
                ].map((m) => {`;

    if (check.includes(oldMethodsGrid)) {
      check = check.replace(oldMethodsGrid, newMethodsGrid);
      fs.writeFileSync(checkoutPath, check.replace(/\n/g, '\r\n'), 'utf8');
      console.log(`✅ CheckoutModal.tsx actualizado con Clip y Mercado Pago en ${baseDir}`);
    }
  }

  // 3. Actualizar PosTerminal.tsx
  const posPath = path.join(baseDir, 'src', 'pages', 'PosTerminal.tsx');
  if (fs.existsSync(posPath)) {
    let pos = fs.readFileSync(posPath, 'utf8').replace(/\r\n/g, '\n');

    // Enriquecer la botonera de métodos de pago en PosTerminal.tsx
    const oldPosButtons = `                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'TARJETA', label: 'Tarjeta (TDC/TDD)', icon: CreditCard },
                    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: SmartphoneNfc },
                    { id: 'MERCADO PAGO', label: 'Mercado Pago', icon: Smartphone },
                    { id: 'MIXTO', label: 'Pago Mixto', icon: Layers },
                    { id: 'CRÉDITO', label: 'Crédito', icon: UserCheck },
                    { id: 'MONEDERO', label: 'Monedero', icon: Wallet },
                  ].map(m => {`;

    const newPosButtons = `                  {[
                    { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { id: 'MERCADO PAGO', label: 'Mercado Pago', icon: Smartphone },
                    { id: 'CLIP', label: 'Terminal Clip', icon: CreditCard },
                    { id: 'TARJETA', label: 'Tarjeta Bancos', icon: CreditCard },
                    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: SmartphoneNfc },
                    { id: 'MIXTO', label: 'Pago Mixto', icon: Layers },
                    { id: 'CRÉDITO', label: 'Crédito', icon: UserCheck },
                    { id: 'MONEDERO', label: 'Monedero', icon: Wallet },
                  ].map(m => {`;

    if (pos.includes(oldPosButtons)) {
      pos = pos.replace(oldPosButtons, newPosButtons);
    }

    // Mensaje para CLIP en el modal de cobro
    if (!pos.includes("paymentMethod === 'CLIP'")) {
      pos = pos.replace(
        "{paymentMethod === 'TARJETA' && '💳 Cobro con Terminal Bancaria / Pinpad.'}",
        `{paymentMethod === 'CLIP' && '🧡 Cobro con Terminal Clip (Acerque o deslice la tarjeta en Clip).'}\n                    {paymentMethod === 'TARJETA' && '💳 Cobro con Terminal Bancaria (BBVA, Banorte, Citibanamex, HSBC, etc.).'}`
      );
      pos = pos.replace(
        "{paymentMethod === 'TARJETA' && <CreditCard className=\"w-8 h-8 text-blue-400\" />}",
        `{paymentMethod === 'CLIP' && <CreditCard className=\"w-8 h-8 text-amber-400 animate-pulse\" />}\n                {paymentMethod === 'TARJETA' && <CreditCard className=\"w-8 h-8 text-blue-400\" />}`
      );
      pos = pos.replace(
        "{paymentMethod === 'TARJETA' && (\n              <div className=\"w-full bg-nexus-800/60 border border-nexus-700 p-5 rounded-2xl my-4 text-center\">",
        `{paymentMethod === 'CLIP' && (
              <div className=\"w-full bg-amber-950/40 border border-amber-500/40 p-5 rounded-2xl my-4 text-center\">
                <div className=\"flex items-center justify-center gap-2 mb-2\">
                  <span className=\"w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping\"></span>
                  <p className=\"text-xs font-black text-amber-400 uppercase tracking-widest\">
                    TERMINAL CLIP ACTIVA
                  </p>
                </div>
                <p className=\"text-3xl font-black text-white my-1\">\${total.toFixed(2)} MXN</p>
                <p className=\"text-xs text-amber-200 font-bold mt-1\">Acerque la tarjeta o dispositivo NFC a la terminal Clip o confirme en la app.</p>
              </div>
            )}

            {paymentMethod === 'TARJETA' && (\n              <div className=\"w-full bg-nexus-800/60 border border-nexus-700 p-5 rounded-2xl my-4 text-center\">`
      );
      fs.writeFileSync(posPath, pos.replace(/\n/g, '\r\n'), 'utf8');
      console.log(`✅ PosTerminal.tsx actualizado con Clip en ${baseDir}`);
    }
  }

  // 4. Actualizar CajaZ.tsx
  const cajazPath = path.join(baseDir, 'src', 'pages', 'CajaZ.tsx');
  if (fs.existsSync(cajazPath)) {
    let cz = fs.readFileSync(cajazPath, 'utf8').replace(/\r\n/g, '\n');
    if (!cz.includes("'CLIP'")) {
      cz = cz.replace(
        "const isCard = m === 'TARJETA' || m === 'CARD' || m === 'DEBITO' || m === 'CREDITO' || m === 'TDC' || m === 'TDD' || m === 'TERMINAL' || m === 'MERCADO PAGO' || m === 'MERCADOPAGO' || m === 'POINT';",
        "const isCard = m === 'TARJETA' || m === 'CARD' || m === 'DEBITO' || m === 'CREDITO' || m === 'TDC' || m === 'TDD' || m === 'TERMINAL' || m === 'MERCADO PAGO' || m === 'MERCADOPAGO' || m === 'POINT' || m === 'CLIP' || m === 'BANCO';"
      );
      fs.writeFileSync(cajazPath, cz.replace(/\n/g, '\r\n'), 'utf8');
      console.log(`✅ CajaZ.tsx actualizado en ${baseDir}`);
    }
  }
}

updateComponents(path.join(__dirname, 'caja_movil_app'));
updateComponents(path.join(__dirname, 'caja_local', 'frontend'));
