const lic = require('C:\\\\Users\\\\JOSUE\\\\Desktop\\\\SISTEMA_CREDITO_COBRANZA\\\\licencias.js');

const res = lic.generarSerialLicencia('FINANCIERA CREDITO FACIL', 5, 'MENSUAL', 60);
console.log('Serial generado:', res);

const val = lic.validarSerialLicencia(res.serial, 'FINANCIERA CREDITO FACIL');
console.log('Validacion:', val);
