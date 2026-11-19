async function test() {
  const genRes = await fetch('http://localhost:4000/api/licencia/generar-maestro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pinDev: '9612',
      empresa: 'FINANCIERA CRÉDITO FÁCIL',
      rutas: 5,
      tipo: 'MENSUAL',
      dias: 60
    })
  });
  const genData = await genRes.json();
  console.log('Generado:', genData.licencia.serial);

  const actRes = await fetch('http://localhost:4000/api/licencia/activar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serial: genData.licencia.serial })
  });
  const actData = await actRes.json();
  console.log('Activacion:', actData);
}

test();
