import os

file_path = r"C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE\SISTEMA_RETAILPOS_MOVIL\index.html"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

old_checkout = """        async function performCheckout() {
            if(cart.length === 0) return;
            if(!isShiftActive()) return;

            const received = parseFloat(document.getElementById('pay-received').value || '0');
            if (checkoutPaymentMethod === 'Efectivo' && received < checkoutTotalValue) {
                alert('El monto recibido es menor al total.');
                return;
            }

            const sale = {
                date: new Date().toISOString(),
                total: checkoutTotalValue,
                items: JSON.stringify(cart),
                synced: 0,
                terminal: 'CELULAR-TITAN-PRO',
                paymentMethod: checkoutPaymentMethod,
                shiftStart: getShiftStart()
            };

            await db.sales.add(sale);
            clearCart();
            closeModal('modal-checkout');
            
            alert('¡VENTA REGISTRADA CON ÉXITO!');
            
            renderViews();
            updateStats();
            
            // Intento de sincronización automática e inmediata
            pushPendingSales();
        }"""

new_checkout = """        async function performCheckout() {
            if(cart.length === 0) return;
            if(!isShiftActive()) return;

            const received = parseFloat(document.getElementById('pay-received').value || '0');
            if (checkoutPaymentMethod.toLowerCase() === 'efectivo' && received < checkoutTotalValue) {
                alert('El monto recibido es menor al total.');
                return;
            }

            const folio = 'MOV-' + Math.floor(100000 + Math.random() * 900000);
            const met = (checkoutPaymentMethod || 'EFECTIVO').toUpperCase();

            const sale = {
                folio: folio,
                date: new Date().toISOString(),
                total: checkoutTotalValue,
                items: JSON.stringify(cart),
                cart: cart,
                synced: 0,
                terminal: 'CELULAR-TITAN-PRO',
                paymentMethod: met,
                shiftStart: getShiftStart()
            };

            // Descuento local de inventario y Kardex
            for (let item of cart) {
                try {
                    const p = await db.products.get(item.id);
                    if (p) {
                        const newStock = Math.max(0, (p.stock || 0) - (item.qty || 1));
                        await db.products.update(item.id, { stock: newStock });
                        if (db.kardex) {
                            await db.kardex.add({
                                date: new Date().toISOString(),
                                sku: p.sku || item.sku || 'N/A',
                                productName: p.name || item.name,
                                type: 'SALIDA_VENTA_MOVIL',
                                qty: item.qty || 1,
                                folio: folio,
                                user: 'CELULAR_MOVIL'
                            });
                        }
                    }
                } catch(err) {
                    console.warn('Error stock local:', err);
                }
            }

            await db.sales.add(sale);
            clearCart();
            closeModal('modal-checkout');
            
            alert(`¡VENTA REGISTRADA CON ÉXITO!\nFolio: #${folio}\nMétodo: ${met}`);
            
            renderViews();
            updateStats();
            
            // Intento de sincronización automática e inmediata a la PC Maestra (3008)
            pushPendingSales();
        }"""

if old_checkout in text:
    text = text.replace(old_checkout, new_checkout)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("PATCH CHECKOUT SUCCESSFUL")
else:
    print("CHECKOUT FUNCTION NOT MATCHED")
