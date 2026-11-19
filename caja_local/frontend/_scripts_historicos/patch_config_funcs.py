import os

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

functions = """
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        setLogo(base64);
        localStorage.setItem('ticketLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo('');
    localStorage.removeItem('ticketLogo');
  };

  const downloadManualBackup = async () => {
    const products = await db.products.toArray();
    const clients = await db.clients.toArray();
    const tickets = await db.tickets.toArray();
    const providers = await db.providers.toArray();
    const kardex = await db.kardex.toArray();
    const cortes = await db.cortes.toArray();
    
    const data = {
      version: 1,
      type: 'nexus_backup',
      timestamp: new Date().toISOString(),
      collections: { products, clients, tickets, providers, kardex, cortes }
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXUS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
"""

c = c.replace("return (", functions + "\n  return (")

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Restored missing functions in Config.tsx")
