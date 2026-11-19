import os
import re

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

import_statement = "import { useSettings } from '../store/useSettings';\n"
if "useSettings" not in code:
    code = code.replace("import { useState, useRef } from 'react';", "import { useState, useRef } from 'react';\n" + import_statement)

# Add hooks inside component
state_hooks = """
  const { nombreNegocio, rfc, eslogan, telefono, email, setSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState({ nombreNegocio, rfc, eslogan, telefono, email });
"""
if "setLocalSettings" not in code:
    code = code.replace("const [logo, setLogo] = useState(localStorage.getItem('ticketLogo') || '');", "const [logo, setLogo] = useState(localStorage.getItem('ticketLogo') || '');\n" + state_hooks)

# Fix inputs
code = code.replace('defaultValue=\'Mi tiendita " MISCELANEA BRITTANY "\'', 'value={localSettings.nombreNegocio} onChange={e=>setLocalSettings({...localSettings, nombreNegocio: e.target.value})}')
code = code.replace('defaultValue="HEGJ8004018I9"', 'value={localSettings.rfc} onChange={e=>setLocalSettings({...localSettings, rfc: e.target.value})}')
code = code.replace('defaultValue="TU TIENDA DE CONFIANZA"', 'value={localSettings.eslogan} onChange={e=>setLocalSettings({...localSettings, eslogan: e.target.value})}')
code = code.replace('defaultValue="9612765041"', 'value={localSettings.telefono} onChange={e=>setLocalSettings({...localSettings, telefono: e.target.value})}')
code = code.replace('defaultValue="miscelaneabrittany@gmail.com"', 'value={localSettings.email} onChange={e=>setLocalSettings({...localSettings, email: e.target.value})}')

# Fix Guardar Configuración button
old_button = 'onClick={() => alert("Configuracin general guardada en la base de datos correctamente.")}'
new_button = 'onClick={() => { setSettings(localSettings); alert("Configuración general guardada y sincronizada correctamente."); }}'
# We have to use regex for the strange encoding characters
code = re.sub(r'onClick=\{.*?alert\("Configuraci.*?n general guardada en la base de datos correctamente\."\)\}', 'onClick={() => { setSettings(localSettings); alert("Configuración general guardada y sincronizada correctamente."); }}', code)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Config.tsx wired to useSettings")
