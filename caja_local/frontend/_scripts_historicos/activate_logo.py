import re

with open('src/pages/Config.tsx', encoding='utf-8') as f:
    c = f.read()

# 1. Add state and ref
if 'const logoInputRef' not in c:
    c = c.replace("const manualBackupRef = useRef<HTMLInputElement>(null);",
                  "const manualBackupRef = useRef<HTMLInputElement>(null);\n  const logoInputRef = useRef<HTMLInputElement>(null);\n  const [logo, setLogo] = useState(localStorage.getItem('ticketLogo') || '');")

# 2. Add handleLogoUpload logic
if 'handleLogoUpload' not in c:
    logo_handler = """
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogo(base64);
      localStorage.setItem('ticketLogo', base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogo('');
    localStorage.removeItem('ticketLogo');
  };
"""
    c = c.replace("const generateNexusBackup = async () => {", logo_handler + "\n  const generateNexusBackup = async () => {")

# 3. Update the UI block
old_logo_box = """              {/* LOGO BOX */}
              <div className="w-40 shrink-0 flex flex-col items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">LOGOTIPO TICKET</label>
                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-2 mb-2">
                  <div className="text-pink-500 font-black text-5xl text-center leading-none">M<br/><span className="text-[8px] text-pink-400 block mt-1">MISCELÁNEA</span></div>
                </div>
                <button onClick={() => alert("Logotipo removido. Haz clic en Guardar Configuración.")} className="text-red-500 text-[10px] font-black hover:text-red-400 uppercase tracking-widest">QUITAR</button>
              </div>"""

new_logo_box = """              {/* LOGO BOX */}
              <div className="w-40 shrink-0 flex flex-col items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">LOGOTIPO TICKET</label>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center p-2 mb-2 cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors overflow-hidden relative group"
                >
                  {logo ? (
                    <img src={logo} alt="Logo Ticket" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-pink-500 font-black text-5xl text-center leading-none group-hover:opacity-50 transition-opacity">M<br/><span className="text-[8px] text-pink-400 block mt-1">MISCELÁNEA</span></div>
                  )}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">CAMBIAR</span>
                  </div>
                </div>
                <button onClick={removeLogo} className="text-red-500 text-[10px] font-black hover:text-red-400 uppercase tracking-widest">QUITAR</button>
              </div>"""

c = c.replace(old_logo_box, new_logo_box)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Activated logo button')
