import re

with open('src/App.tsx', encoding='utf-8') as f:
    c = f.read()

# Add logic inside useEffect of App component
# Wait, let's find the main useEffect or just add one right before return (
if 'setInterval(async () => {' not in c:
    backup_effect = """
  // AUTO-BACKUP CADA 1 MINUTO
  useEffect(() => {
    const backupInterval = setInterval(async () => {
      try {
        const { db } = await import('./store/database');
        const data = {
          formatName: 'NEXUS_POS_V2',
          timestamp: new Date().toISOString(),
          data: {
            products: await db.products.toArray(),
            clients: await db.clients.toArray(),
            tickets: await db.tickets.toArray(),
            cortes: await db.cortes.toArray(),
            kardex: await db.kardex.toArray(),
            providers: await db.providers.toArray()
          }
        };
        await fetch('/api/backup', { method: 'POST', body: JSON.stringify(data) });
      } catch (e) {
        console.error('Auto-backup failed:', e);
      }
    }, 60000); // 60 segundos
    return () => clearInterval(backupInterval);
  }, []);
"""
    c = c.replace('const [activeSubMenu, setActiveSubMenu] = useState<string>(\'Dashboard Principal\');', 'const [activeSubMenu, setActiveSubMenu] = useState<string>(\'Dashboard Principal\');\n' + backup_effect)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Added auto-backup to App.tsx')
