import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Update handleCobrar to process all non-cash methods with a spinner
old_cobrar_match = re.search(r"const handleCobrar = async \(\) => \{[\s\S]*?const success = await processSale", c)
if old_cobrar_match:
    new_cobrar = """const handleCobrar = async () => {
    if (cart.length === 0) { 
      alert('El carrito está vacío. Agrega productos para cobrar.'); 
      return; 
    }
    
    if (paymentMethod !== 'EFECTIVO' && paymentMethod !== 'MONEDERO') {
      setIsProcessing(true);
      if (paymentMethod === 'MERCADO PAGO') {
        setProcessMsg('Conectando con Terminal Mercado Pago...');
      } else if (paymentMethod === 'TARJETA') {
        setProcessMsg('Enviando cobro a Terminal Bancaria...');
      } else if (paymentMethod === 'TRANSFERENCIA') {
        setProcessMsg('Verificando pago por Transferencia...');
      } else if (paymentMethod === 'CRÉDITO') {
        setProcessMsg('Autorizando Venta a Crédito...');
      } else {
        setProcessMsg('Procesando pago...');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
    }

    const success = await processSale"""
    
    c = c[:old_cobrar_match.start()] + new_cobrar + c[old_cobrar_match.end():]

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("handleCobrar updated with spinners")
