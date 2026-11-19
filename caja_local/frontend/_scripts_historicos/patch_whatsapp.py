import os
import re

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add handleWhatsApp logic
whatsapp_logic = """
  const handleWhatsApp = (ticket: any) => {
    let text = `*TICKET #${ticket.id?.substring(0,8).toUpperCase()}*\\n`;
    text += `Fecha: ${new Date(ticket.date).toLocaleString()}\\n`;
    text += `Método: ${ticket.paymentMethod}\\n\\n`;
    ticket.items.forEach((item: any) => {
      text += `• ${item.cartQty}x ${item.name} - $${(item.price * item.cartQty).toFixed(2)}\\n`;
    });
    text += `\\n*TOTAL: $${ticket.total.toFixed(2)}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
"""

if "const handleWhatsApp" not in c:
    c = c.replace("const handleDevolver = async (ticket: any) => {", whatsapp_logic + "\n  const handleDevolver = async (ticket: any) => {")

# Attach to button
c = c.replace('<button className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-900/50 flex items-center gap-2 transition-colors">\n                 <MessageCircle className="w-4 h-4" /> WHATSAPP\n              </button>', '<button onClick={() => handleWhatsApp(selectedTicket)} className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-900/50 flex items-center gap-2 transition-colors">\n                 <MessageCircle className="w-4 h-4" /> WHATSAPP\n              </button>')

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("WhatsApp button enabled")
