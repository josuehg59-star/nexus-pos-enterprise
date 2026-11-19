import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Remove showTerminalModal usage in payment click
old_payment_click = """
  const handlePaymentClick = (met: string) => {
    if ((met === 'MONEDERO' || met === 'CRÉDITO') && client.name === 'PUBLICO GENERAL') {
      alert('Para pagar con ' + met + ' debes seleccionar un cliente primero.');
      setShowClientModal(true);
    } else if (met === 'MERCADO PAGO' && !terminalLinked) {
      setShowTerminalModal(true);
    } else {
      setPaymentMethod(met);
    }
  };
"""

new_payment_click = """
  const handlePaymentClick = (met: string) => {
    if ((met === 'MONEDERO' || met === 'CRÉDITO') && client.name === 'PUBLICO GENERAL') {
      alert('Para pagar con ' + met + ' debes seleccionar un cliente primero.');
      setShowClientModal(true);
    } else {
      setPaymentMethod(met);
    }
  };
"""

c = c.replace(old_payment_click.strip(), new_payment_click.strip())

# Remove terminalLinked state
c = re.sub(r"const \[terminalLinked[\s\S]*?;", "", c)

# Remove showTerminalModal state
c = re.sub(r"const \[showTerminalModal[\s\S]*?;", "", c)

# Remove the Modal JSX
c = re.sub(r"\{\/\* TERMINAL LINK MODAL \*\/\}[\s\S]*?\{\/\* PAUSED SALES MODAL \*\/\}", "{/* PAUSED SALES MODAL */}", c)

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Terminal Modal removed from PosTerminal")
