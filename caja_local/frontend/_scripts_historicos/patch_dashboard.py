import os

with open('src/pages/DashboardBI.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace hardcoded chart data with dynamic data
old_chart = """
  const chartData = useMemo(() => {
    const months = ['ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP'];
    // Para que se vea bonito como en la imagen, si no hay datos históricos, mostramos un estimado
    // basado en la imagen del usuario
    const baseData = [
      { name: 'ABR', ventas: 135000 },
      { name: 'MAY', ventas: 142000 },
      { name: 'JUN', ventas: 138000 },
      { name: 'JUL', ventas: 151000 },
      { name: 'AGO', ventas: 158000 },
      { name: 'SEP', ventas: 125000 },
    ];
    return baseData;
  }, []);
"""

new_chart = """
  const chartData = useMemo(() => {
    // Generate the last 6 months dynamically based on the current date and tickets
    const data: {name: string, ventas: number}[] = [];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[d.getMonth()];
      
      // Calculate real sales for this month
      const monthStart = d.getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime();
      
      const realSales = tickets.filter(t => {
        const time = new Date(t.date).getTime();
        return time >= monthStart && time <= monthEnd;
      }).reduce((sum, t) => sum + t.total, 0);

      data.push({
        name: monthName,
        ventas: realSales > 0 ? realSales : 0 // Remove hardcoded mock if they want real DB data
      });
    }
    return data;
  }, [tickets]);
"""

c = c.replace(old_chart.strip(), new_chart.strip())

# Also fix the timeFilter for top metrics
time_filter_regex = """
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ticketsHoy = tickets.filter(t => new Date(t.date).getTime() >= startOfDay);
"""

new_time_filter = """
  const now = new Date();
  const ticketsHoy = useMemo(() => {
    let start = 0;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (timeFilter === 'Hoy') {
      start = today;
    } else if (timeFilter === 'Esta Semana') {
      const d = new Date(now);
      const day = d.getDay() || 7;
      d.setHours(-24 * (day - 1));
      d.setHours(0,0,0,0);
      start = d.getTime();
    } else if (timeFilter === 'Este Mes') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (timeFilter === 'Este Año') {
      start = new Date(now.getFullYear(), 0, 1).getTime();
    } else {
      start = 0; // Todo histórico
    }
    
    return tickets.filter(t => new Date(t.date).getTime() >= start);
  }, [tickets, timeFilter]);
"""

c = c.replace(time_filter_regex.strip(), new_time_filter.strip())


with open('src/pages/DashboardBI.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("DashboardBI dynamic data activated")
