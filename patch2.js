const fs = require('fs');

function patchConfig() {
  const file = 'caja_local/frontend/src/pages/Config.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace alert in BUSCAR TERMINALES
  const buscarRegex = /<button onClick=\{\(\) => alert\("Buscando terminales Mercado Pago activas en la red local\.\.\."\)\} className="bg-blue-900\/30 hover:bg-blue-900\/50 text-blue-400 border border-blue-900\/50 px-4 py-2 rounded-xl font-black text-\[10px\] uppercase tracking-widest transition-colors flex items-center gap-2">[\s\S]*?BUSCAR TERMINALES[\s\S]*?<\/button>/;

  const newBuscarButton = `<button onClick={async () => {
                      if (!localSettings.mercadoPagoToken) {
                        return alert("Debes ingresar el Access Token de Mercado Pago primero.");
                      }
                      try {
                        // Buscar en v1/devices o point/integration-api/devices
                        let response = await fetch("https://api.mercadopago.com/point/integration-api/devices", {
                          headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken }
                        });
                        
                        let data = await response.json();
                        
                        if (!response.ok || !data.devices) {
                            // Fallback if the endpoint is different
                            response = await fetch("https://api.mercadopago.com/v1/pos", {
                                headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken }
                            });
                            data = await response.json();
                        }

                        const devices = data.devices || data.results || [];
                        if (devices.length === 0) {
                          alert("No se encontraron terminales vinculadas a este token.\\n\\nSi recién la vinculaste, asegúrate de haberla asignado a un local/caja en tu panel de Mercado Pago, o ingresa el DEVICE ID manualmente.");
                          return;
                        }

                        let msg = "Terminales encontradas:\\n";
                        devices.forEach((d: any, i: number) => {
                           msg += \`\${i + 1}. \${d.id} (\${d.operating_mode || d.name || 'Terminal'})\n\`;
                        });
                        msg += "\\nSe vinculará automáticamente a la primera terminal encontrada si confirmas. ¿Deseas vincular " + devices[0].id + "?";
                        
                        if (window.confirm(msg)) {
                           setLocalSettings({...localSettings, mercadoPagoDeviceId: devices[0].id || devices[0].device_id});
                           alert("¡Terminal vinculada! Recuerda Guardar la configuración abajo.");
                        }
                      } catch (e) {
                        alert("Error de conexión con Mercado Pago: " + (e as Error).message);
                      }
                    }} className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2">
                      <Search className="w-3 h-3" /> BUSCAR TERMINALES
                    </button>`;

  content = content.replace(buscarRegex, newBuscarButton);

  // Replace PROBAR CONEXIÓN
  const probarRegex = /<button onClick=\{\(\) => alert\("Conexión API Exitosa\. Webhooks configurados\."\)\} className="bg-emerald-900\/30 hover:bg-emerald-900\/50 text-emerald-500 border border-emerald-900\/50 px-4 py-2 rounded-xl font-black text-\[10px\] uppercase tracking-widest transition-colors">[\s\S]*?PROBAR CONEXIÓN API[\s\S]*?<\/button>/;

  const newProbarButton = `<button onClick={async () => {
                      if (!localSettings.mercadoPagoToken || !localSettings.mercadoPagoDeviceId) {
                        return alert("Debes ingresar el Token y el ID de Terminal.");
                      }
                      try {
                        const response = await fetch(\`https://api.mercadopago.com/point/integration-api/devices/\${localSettings.mercadoPagoDeviceId}\`, {
                          headers: { "Authorization": "Bearer " + localSettings.mercadoPagoToken }
                        });
                        const data = await response.json();
                        if (response.ok) {
                          alert("¡Conexión API Exitosa!\\nLa terminal está lista y conectada:\\n" + JSON.stringify(data, null, 2));
                        } else {
                          alert("Fallo la conexión:\\n" + (data.message || JSON.stringify(data)));
                        }
                      } catch (e) {
                        alert("Error de conexión: " + (e as Error).message);
                      }
                    }} className="bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-500 border border-emerald-900/50 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors">
                      PROBAR CONEXIÓN API
                    </button>`;

  content = content.replace(probarRegex, newProbarButton);
  fs.writeFileSync(file, content, 'utf8');
}

patchConfig();
console.log("Config patched!");
