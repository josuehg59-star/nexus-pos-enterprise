const fs = require('fs');

let c = fs.readFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', 'utf8');

// 1. Add state
const stateInjection = `  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');`;
c = c.replace('  const [showTicketModal, setShowTicketModal] = useState(false);', stateInjection);

// 2. Change sendWhatsapp
const oldSendWa = `const sendWhatsapp = async () => {
    if (!lastTicket) return;
    let phone = window.prompt('Número de WhatsApp del cliente (10 dígitos):', '') || '';
    phone = phone.replace(/\\D/g, '');
    if (phone.length < 10) { alert('Número de WhatsApp inválido. Debe tener 10 dígitos.'); return; }`;
const newSendWa = `const sendWhatsapp = async () => {
    if (!lastTicket) return;
    setShowWaModal(true);
  };
  const confirmSendWhatsapp = async () => {
    let phone = waPhone.replace(/\\D/g, '');
    if (phone.length < 10) { alert('Número de WhatsApp inválido. Debe tener 10 dígitos.'); return; }
    setShowWaModal(false);`;
c = c.replace(oldSendWa, newSendWa);

// 3. Add Wa Modal JSX
const modalJSX = `
      {/* MODAL WHATSAPP */}
      {showWaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1120]/95 backdrop-blur-md">
          <div className="w-full max-w-sm bg-nexus-900 border border-emerald-500/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <h3 className="text-xl font-black text-white text-center mb-4 uppercase tracking-widest text-emerald-400">Enviar por WhatsApp</h3>
            <p className="text-xs font-bold text-slate-300 mb-2 text-center">Ingresa el número a 10 dígitos del cliente:</p>
            <input 
              autoFocus
              type="text" 
              maxLength={10}
              value={waPhone} 
              onChange={(e) => setWaPhone(e.target.value)} 
              className="w-full bg-nexus-950 border-2 border-emerald-500/50 rounded-xl p-3 text-center text-2xl text-white font-black tracking-widest focus:border-emerald-500 focus:outline-none mb-6"
              placeholder="0000000000"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmSendWhatsapp();
                }
              }}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWaModal(false)}
                className="flex-1 bg-nexus-800 hover:bg-nexus-700 text-white py-3 rounded-xl font-black text-xs uppercase"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSendWhatsapp}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20"
              >
                Enviar PDF
              </button>
            </div>
          </div>
        </div>
      )}
`;

const lastModalEnd = `      {/* MODAL COBROS ADICIONALES */}`;
c = c.replace(lastModalEnd, modalJSX + '\n' + lastModalEnd);

fs.writeFileSync('caja_local/frontend/src/pages/PosTerminal.tsx', c);
