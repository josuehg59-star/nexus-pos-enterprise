// CONTROL INDEPENDIENTE - COCA COLA FEMSA (COMPRAS, VENTAS, GASTOS Y EFECTIVO)
// Soporte y Autor: JOSUE HERNANDEZ GUTIERREZ | TEL: 9612765041

const catalogoCocaOriginal = [
  {"sku":"7501055305742","name":"AGUA CIEL MINERALIZADA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.75,"price":31,"stock":5},
  {"sku":"7501055308248","name":"AGUA CIEL MINERALIZADA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":16.67,"price":20,"stock":4},
  {"sku":"7501055310883","name":"AGUA CIEL PURIFICADA BOTTLE 1 LTS NR","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":6.67,"price":16,"stock":24},
  {"sku":"7501055304721","name":"AGUA CIEL PURIFICADA BOTTLE 1.5 LTS NR","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":16.67,"price":19,"stock":13},
  {"sku":"7501055307906","name":"AGUA CIEL PURIFICADA BOTTLE 600 ML NR","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":10.83,"price":13,"stock":6},
  {"sku":"021136010541","name":"TOPO CHICO AGUA MINERAL NATURAL CARBONATADA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":19.33,"price":22,"stock":5},
  {"sku":"999966671","name":"ARETES O ANILLOS VARIOS MODELO","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":0.75,"price":1,"stock":23},
  {"sku":"613008772840","name":"ARIZONA LATA SANDIA 570 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.7,"price":21,"stock":26},
  {"sku":"9999041","name":"BOLSA DE REGALO MED","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":6,"price":8,"stock":3},
  {"sku":"746171034623","name":"CACAHUATE BOLSA 10 GRS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":5,"price":10,"stock":0},
  {"sku":"7501032485047","name":"CARIBE COOLER 300 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":21.67,"price":25,"stock":18},
  {"sku":"75004780","name":"CARRILLERA EL FUERTE","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":15.69,"price":25,"stock":11},
  {"sku":"7501011143999","name":"MOÑOS DE REGALOS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":0.8,"price":1,"stock":3},
  {"sku":"759684431050","name":"ACETONA & QUITA ESMALTE VARIOS 50 ML","category":"FARMACIA","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":15,"price":25,"stock":3},
  {"sku":"7502271917405","name":"CHTE SNIKETS 48 GR","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17,"price":21,"stock":0},
  {"sku":"7501055355310","name":"REFRESCO COCA COLA 250 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":10.58,"price":12,"stock":4},
  {"sku":"75062835","name":"DESODORANTE DOVE 45 GR","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":46,"price":60,"stock":0},
  {"sku":"7509546684741","name":"DESODORANTE LADY SPEED STICK DERMA 60 GR","category":"FARMACIA","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":48,"price":55,"stock":1},
  {"sku":"7501027286000","name":"DESODORANTE OBAO VARIOS AROMAS ROLL-ON","category":"FARMACIA","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":29,"price":35,"stock":14},
  {"sku":"7791293025797","name":"DESODORANTES AXE AERO SOL VARIOS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":50,"price":70,"stock":4},
  {"sku":"99992236","name":"DULCES CONFITADO BOLSA","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":5,"price":10,"stock":5},
  {"sku":"7501055317875","name":"FUZE TEA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":20.83,"price":24,"stock":6},
  {"sku":"75010564969","name":"GELATINAS VARIOS SABORES","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":5.17,"price":8,"stock":10},
  {"sku":"7501020554892","name":"JGO JUMEX LITRO","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.46,"price":32,"stock":8},
  {"sku":"7501055333851","name":"JGO VALLE 1 LT DIFERENTES SABORES PLASTICO","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":24,"price":31,"stock":8},
  {"sku":"7501055382224","name":"JGO VALLE 946 ML SABORES","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":24,"price":29,"stock":1},
  {"sku":"7501055334018","name":"JGO VALLE MEGALATA DURAZNO 453 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.5,"price":20,"stock":11},
  {"sku":"7501055334001","name":"JGO VALLE MEGALATA MANGO 453","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.5,"price":20,"stock":5},
  {"sku":"7501055356911","name":"JGO VALLE SURTIDO 237 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":6.25,"price":10,"stock":9},
  {"sku":"032239052017","name":"JUGO VALLE DURAZNO 413 ML VIDRIO","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.5,"price":20,"stock":3},
  {"sku":"032239052000","name":"JUGO VALLE MANGO 413 ML VIDRIO","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.5,"price":20,"stock":4},
  {"sku":"7501055377213","name":"LECHE SANTA CLARA CAPUCCINO 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":12.5,"price":15,"stock":1},
  {"sku":"7501055377183","name":"LECHE SANTA CLARA CHTE 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":12.5,"price":15,"stock":6},
  {"sku":"7501295600157","name":"LECHE SANTA CLARA DESLACTOSADA 1 LT","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":29.84,"price":33,"stock":9},
  {"sku":"7501055377206","name":"LECHE SANTA CLARA VAINILLA 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":12.5,"price":15,"stock":1},
  {"sku":"7503006698309","name":"MICRODACYN 60 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":90,"price":100,"stock":1},
  {"sku":"9999043","name":"MOÑOS GRANDES VARIOS COLORES","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":0.75,"price":1,"stock":0},
  {"sku":"999966670","name":"PAPAS CASERA 250 GRS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":16,"price":25,"stock":0},
  {"sku":"38000846755","name":"PAPAS PRINGLES QUESO 40GR","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.99,"price":21,"stock":0},
  {"sku":"999014","name":"PAPEL DE REGALO NUEVAS YUMI","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":13,"price":18,"stock":1},
  {"sku":"7501073800908","name":"PEÑAFIEL AGUA MINERAL 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.37,"price":32,"stock":3},
  {"sku":"7501073830509","name":"PEÑAFIEL AGUA MINERAL 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17,"price":21,"stock":12},
  {"sku":"7501073839892","name":"PEÑAFIEL LIMONADA /SANGRIA/MANZANITA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":31.5,"price":35,"stock":6},
  {"sku":"7501005102674","name":"JUGO ADES SABOR SOYA Y MANZANA 946 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":29.33,"price":32,"stock":3},
  {"sku":"7501073839861","name":"PEÑAFIEL NARANJANADA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":31.5,"price":36,"stock":2},
  {"sku":"7501073841949","name":"PEÑAFIEL PIÑADA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":31.5,"price":36,"stock":4},
  {"sku":"7501055317653","name":"POWER MORA 1 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":24,"price":35,"stock":9},
  {"sku":"7501055329267","name":"POWER MORA 500 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":21.67,"price":26,"stock":4},
  {"sku":"7501055317660","name":"POWER PONCHE DE FRUTAS 1 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":24,"price":35,"stock":6},
  {"sku":"7501055329298","name":"POWER PONCHE DE FRUTAS 500 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":21.5,"price":26,"stock":2},
  {"sku":"9002490100070","name":"RED BULL 250 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":38,"price":39,"stock":0},
  {"sku":"7501055371655","name":"REFRESCO COCA COLA 1.35 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":34.42,"price":38,"stock":1},
  {"sku":"7501055313532","name":"REFRESCO COCA COLA 1.75 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":39,"price":42,"stock":4},
  {"sku":"7501055310227","name":"REFRESCO COCA COLA 2.5 LTS RETORNABLE","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":39.75,"price":44,"stock":5},
  {"sku":"7501055304745","name":"REFRESCO COCA COLA 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":47.75,"price":53,"stock":13},
  {"sku":"75007614","name":"REFRESCO COCA COLA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":19.42,"price":21,"stock":20},
  {"sku":"7501055387908","name":"REFRESCO COCA COLA BACARDI 355 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.17,"price":30,"stock":5},
  {"sku":"7501055332175","name":"REFRESCO COCA COLA CHUBY 355 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":13.33,"price":15,"stock":11},
  {"sku":"7501055356256","name":"REFRESCO COCA COLA CHUBY S/A 355 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":8.75,"price":10,"stock":9},
  {"sku":"7501055361540","name":"REFRESCO COCA COLA LATA 355 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":20.42,"price":23,"stock":9},
  {"sku":"7501055320639","name":"REFRESCO COCA COLA SIN AZUCAR 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.58,"price":20,"stock":8},
  {"sku":"7501055300952","name":"REFRESCO COCA COLA VIDRIO 1.25 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.5,"price":29,"stock":10},
  {"sku":"75004699","name":"REFRESCO COCA COLA VIDRIO 500 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":15.04,"price":17,"stock":5},
  {"sku":"7501055308507","name":"REFRESCO FANTA DURAZNO 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":0},
  {"sku":"7501055310586","name":"REFRESCO FANTA FRESA 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":0},
  {"sku":"7501055305230","name":"REFRESCO FANTA FRESA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":0},
  {"sku":"7501055303878","name":"REFRESCO FANTA NARANJA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":35,"stock":3},
  {"sku":"7501055304790","name":"REFRESCO FANTA NARANJA 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":4},
  {"sku":"7501055303779","name":"REFRESCO FANTA NARANJA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":9},
  {"sku":"7501055317455","name":"REFRESCO FANTA PIÑA 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":3},
  {"sku":"7501055311149","name":"REFRESCO FANTA PIÑA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":4},
  {"sku":"7501055317462","name":"REFRESCO FANTA UVA 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":2},
  {"sku":"7501055302611","name":"REFRESCO FANTA UVA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":5},
  {"sku":"7501055303885","name":"REFRESCO FRESCA 2 LITROS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":35,"stock":0},
  {"sku":"7501055304813","name":"REFRESCO FRESCA 3 LITROS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":4},
  {"sku":"7501055303786","name":"REFRESCO FRESCA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":6},
  {"sku":"7501031311682","name":"REFRESCO PEPSI 1.5 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.25,"price":29,"stock":17},
  {"sku":"7501031310098","name":"REFRESCO PEPSI 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42.88,"price":47,"stock":3},
  {"sku":"7501055377022","name":"REFRESCO SENZAO 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":36,"stock":5},
  {"sku":"7501055308330","name":"REFRESCO SENZAO 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.34,"price":21,"stock":10},
  {"sku":"750105534002","name":"REFRESCO SIDRAL MUNDED MAZANA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":36,"stock":2},
  {"sku":"7501055340422","name":"REFRESCO SIDRAL MUNDET 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":1},
  {"sku":"7501055376681","name":"REFRESCO SIDRAL MUNDET KIWI 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":25,"price":32,"stock":1},
  {"sku":"7501055339983","name":"REFRESCO SIDRAL MUNDET MZNA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":0},
  {"sku":"7501055304806","name":"REFRESCO SPRITE 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":46,"stock":4},
  {"sku":"7501055305629","name":"REFRESCO SPRITE 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":18.33,"price":21,"stock":1},
  {"sku":"7501055320660","name":"REFRESCO COCA COLA ZERO 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":22,"price":30,"stock":3},
  {"sku":"7509546017808","name":"SUAVITEL FRESCA PRIMAVERA 450 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":16,"price":19,"stock":3},
  {"sku":"7501125144851","name":"SUERO ELECTROLIC SURTIDOS 625 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":20.25,"price":24,"stock":25},
  {"sku":"7501055330461","name":"VALLE FRUT PON CITRUS 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":36,"stock":7},
  {"sku":"7503027753629","name":"VOLT YELLOW ENERGY","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":15.33,"price":21,"stock":30},
  {"sku":"7501020570854","name":"YOMI LALA CHOCOLATE 180 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":9.5,"price":14,"stock":0},
  {"sku":"7501020570861","name":"YOMI LALA SABOR FRESA 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":8,"price":14,"stock":2},
  {"sku":"7501020570878","name":"YOMI LALA SABOR VAINILLA 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":10,"price":13,"stock":2},
  {"sku":"7501055377190","name":"LECHE SANTA CLARA FRESA 180 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":12.5,"price":15,"stock":5},
  {"sku":"7501055389100","name":"REFRESCO SENZAO 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42,"price":47,"stock":3},
  {"sku":"7590002012468","name":"VAPORUB VICK TARRO 100 GR","category":"FARMACIA","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":85,"price":100,"stock":0},
  {"sku":"7506174512200","name":"CHTE MILKYWAY 48 GR","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17,"price":21,"stock":1},
  {"sku":"194735057313","name":"PATINETAS HOLEKEELS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":35,"price":75,"stock":2},
  {"sku":"7501055330812","name":"VALLE FRUT 3 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":42.5,"price":47,"stock":4},
  {"sku":"7501073839212","name":"PEÑAFIEL MINERAL TWIST 1 LT","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":21.25,"price":24,"stock":6},
  {"sku":"7501055389636","name":"REFRESCO AMEYAL MANZANA DURAZNO 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":0,"price":21,"stock":0},
  {"sku":"7501013106824","name":"JGO BIDA VARIOS SABORES 234 ML","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":7.58,"price":9,"stock":23},
  {"sku":"7501055304691","name":"REFRESCO DELAWARE PUNCH UVA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":32.5,"price":37,"stock":2},
  {"sku":"75078911","name":"JGO JUMEX VARIOS SABORES 200 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":5,"price":10,"stock":0},
  {"sku":"7501055310487","name":"AGUA CIEL 5 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":31.75,"price":43,"stock":2},
  {"sku":"070847035916","name":"MOSTER ENERGY 473 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":31.75,"price":36,"stock":3},
  {"sku":"7501086802753","name":"AGUA EPURA 20 LTS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":44,"price":50,"stock":1},
  {"sku":"7501022016268","name":"REFRESCO SANGRIA CASERA 2.75 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":39.38,"price":45,"stock":4},
  {"sku":"7501441604121","name":"REFRESCO JARRITOS PIÑA 2 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.25,"price":30,"stock":3},
  {"sku":"75010221015292","name":"REFRESCO MIRINDA 1.5 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":26.25,"price":30,"stock":5},
  {"sku":"75010220099857","name":"GATORADE FIERCE MORAS 1 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":29.58,"price":37,"stock":5},
  {"sku":"036731326003","name":"GATORADE PONCHE DE FRUTAS 1 LTS","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":29.58,"price":37,"stock":6},
  {"sku":"7501055900039","name":"LECHE ALPURA CLASICA 1 LTS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":27.58,"price":32,"stock":4},
  {"sku":"7501055901425","name":"LECHE ALPURA DESLACTOZADA 1 LTS","category":"Abarrotes","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":28.5,"price":33,"stock":6},
  {"sku":"7501031310012","name":"REFRESCO PEPSI 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":17.5,"price":20,"stock":5},
  {"sku":"7501055392766","name":"TOPO CHICO NARANJADA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":14.93,"price":20,"stock":7},
  {"sku":"7501055392759","name":"TOPO CHICO LIMONADA 600 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":14.93,"price":20,"stock":4},
  {"sku":"7501055917761","name":"YOGHURT ALPURA FRESA 220 ML","category":"Bebidas","supplier":"COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)","cost":12.84,"price":15,"stock":2}
];

let productosCoca = [];
let ventasDetallePOS = [];
let modo = 'DIA';
let syncTimer = null;
let posServerIp = localStorage.getItem('pos_server_ip') || '192.168.100.38';

function getHoyLocal() {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  } catch(e) {
    return new Date().toISOString().split('T')[0];
  }
}

function getKey() {
  if (modo === 'ACUMULADO') return 'ACUMULADO';
  const d = document.getElementById('inputFecha');
  const fecha = d && d.value ? d.value : getHoyLocal();
  return modo === 'MES' ? fecha.slice(0, 7) : fecha;
}

function irAFecha(tipo) {
  const hoyStr = getHoyLocal();
  const d = new Date(hoyStr + 'T12:00:00');
  let target = hoyStr;

  if (tipo === 'HOY') {
    target = hoyStr;
  } else if (tipo === 'AYER') {
    d.setDate(d.getDate() - 1);
    target = d.toISOString().split('T')[0];
  }

  modo = 'DIA';
  actualizarBotonesModo(tipo);

  const inp = document.getElementById('inputFecha');
  if (inp) inp.value = target;

  cargarEfectivoGuardado();
  sincronizarConPOS(true);
}

function setModo(m) {
  modo = m;
  actualizarBotonesModo(m);
  cargarEfectivoGuardado();
  sincronizarConPOS(true);
}

function onFechaManualChange() {
  modo = 'DIA';
  actualizarBotonesModo('MANUAL');
  cargarEfectivoGuardado();
  sincronizarConPOS(true);
}

function actualizarBotonesModo(sel) {
  const btnHoy = document.getElementById('btnModoHoy');
  const btnAyer = document.getElementById('btnModoAyer');
  const btnMes = document.getElementById('btnModoMes');
  const btnAcum = document.getElementById('btnModoAcum');

  const inactivo = 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
  const activo = 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white';

  if (btnHoy) btnHoy.className = sel === 'HOY' ? activo : inactivo;
  if (btnAyer) btnAyer.className = sel === 'AYER' ? activo : inactivo;
  if (btnMes) btnMes.className = sel === 'MES' ? activo : inactivo;
  if (btnAcum) btnAcum.className = sel === 'ACUMULADO' ? activo : inactivo;
}

// CONTROL DE PESTAÑAS (TABS)
let pestanaActual = 'caja';
function cambiarPestana(p) {
  pestanaActual = p;
  const vCaja = document.getElementById('vistaCaja');
  const vCompras = document.getElementById('vistaCompras');
  const vCatalogo = document.getElementById('vistaCatalogo');

  const bCaja = document.getElementById('tabBtnCaja');
  const bCompras = document.getElementById('tabBtnCompras');
  const bCatalogo = document.getElementById('tabBtnCatalogo');

  const activo = 'py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all bg-emerald-600 text-white shadow-lg shadow-emerald-950/40';
  const inactivo = 'py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-white';

  if (vCaja) vCaja.className = p === 'caja' ? 'space-y-4' : 'hidden';
  if (vCompras) vCompras.className = p === 'compras' ? 'space-y-4' : 'hidden';
  if (vCatalogo) vCatalogo.className = p === 'catalogo' ? 'space-y-4' : 'hidden';

  if (bCaja) bCaja.className = p === 'caja' ? activo : inactivo;
  if (bCompras) bCompras.className = p === 'compras' ? activo : inactivo;
  if (bCatalogo) bCatalogo.className = p === 'catalogo' ? activo : inactivo;
}

// NOTIFICACIÓN TOAST SIN ALERT BLOQUEANTE
function showToast(msg, icon) {
  const toast = document.getElementById('toastNotif');
  const txt = document.getElementById('toastText');
  const ico = document.getElementById('toastIcon');
  if (!toast || !txt) return;

  txt.innerText = msg;
  if (ico) ico.innerText = icon || '✅';

  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 2500);
}

// COPIAR RESUMEN DEL DÍA PARA WHATSAPP O CORTE
function copiarResumenCorte() {
  const f = getKey();
  const v = document.getElementById('lblVentas')?.innerText || '$0.00';
  const ef = document.getElementById('inputEfectivoManual')?.value || '0.00';
  const c = document.getElementById('lblCompras')?.innerText || '$0.00';
  const g = document.getElementById('lblOtrosGastos')?.innerText || '$0.00';
  const tot = document.getElementById('lblEfectivoDisponible')?.innerText || '$0.00';

  const texto = 
    '📊 CORTE COCA-COLA FEMSA (' + f + ')\n' +
    '-----------------------------------\n' +
    '1. Ventas de Caja: ' + v + '\n' +
    '2. Efectivo en Mano: $' + parseFloat(ef).toFixed(2) + '\n' +
    '3. Compras al Camión: -' + c + '\n' +
    '4. Otros Gastos: -' + g + '\n' +
    '-----------------------------------\n' +
    '💰 TOTAL NETO EN CAJA: ' + tot + '\n' +
    'Fórmula: (Ventas + Efectivo) - Compras - Gastos';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(() => {
      showToast('¡Resumen del día copiado al portapapeles!', '📋');
    }).catch(() => {
      alert(texto);
    });
  } else {
    alert(texto);
  }
}

function inicializar() {
  try {
    const inputF = document.getElementById('inputFecha');
    if (inputF && !inputF.value) {
      inputF.value = getHoyLocal();
    }

    const ipInput = document.getElementById('inputPosIp');
    if (ipInput) ipInput.value = posServerIp;

    const localStock = localStorage.getItem('control_coca_femsa_stock');
    if (localStock) {
      const parsed = JSON.parse(localStock);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productosCoca = parsed;
      }
    }
  } catch(e) {
    console.error(e);
  }

  if (!productosCoca || productosCoca.length === 0) {
    productosCoca = JSON.parse(JSON.stringify(catalogoCocaOriginal));
    guardarCatalogoLocal();
  }

  cargarEfectivoGuardado();
  cargarDatosLocales();

  // Iniciar sincronización en vivo con la caja del POS
  sincronizarConPOS(true);

  // Iniciar timer automático de 5 segundos
  iniciarAutoSync();
}

function guardarIpConfig() {
  const ipInput = document.getElementById('inputPosIp');
  if (ipInput && ipInput.value.trim()) {
    posServerIp = ipInput.value.trim();
    localStorage.setItem('pos_server_ip', posServerIp);
    sincronizarConPOS(false);
  }
}

function toggleAutoSync(activo) {
  if (activo) {
    iniciarAutoSync();
  } else {
    if (syncTimer) clearInterval(syncTimer);
    syncTimer = null;
  }
}

function iniciarAutoSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(function() {
    const chk = document.getElementById('chkAutoSync');
    if (chk && chk.checked) {
      sincronizarConPOS(true);
    }
  }, 5000);
}

// SINCRONIZACIÓN EN VIVO CON LA COMPUTADORA (PUNTO DE VENTA)
async function sincronizarConPOS(silent) {
  const lblStatus = document.getElementById('lblSyncStatus');
  const lblDetail = document.getElementById('lblSyncDetail');
  const dotPing = document.getElementById('syncDotPing');
  const dot = document.getElementById('syncDot');

  const url = 'http://' + posServerIp + ':3008/api/coca/data?fecha=' + getKey();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error('Servidor respondió con código ' + resp.status);
    const data = await resp.json();

    if (!data.success) throw new Error(data.error || 'Error en respuesta');

    // 1. Actualizar catálogo y stock con la base de datos maestra
    if (Array.isArray(data.productos) && data.productos.length > 0) {
      productosCoca = data.productos;
      guardarCatalogoLocal();
    }

    // 2. Guardar ventas detalladas de hoy
    ventasDetallePOS = (data.ventas && data.ventas.detalle) || [];

    // 3. Actualizar tarjetas con datos en vivo
    const totalVentas = (data.ventas && Number(data.ventas.total)) || 0;
    const piezasVenta = (data.ventas && Number(data.ventas.piezas)) || 0;
    const totalCompras = (data.compras && Number(data.compras.total)) || 0;
    const totalGastos = (data.gastos && Number(data.gastos.total)) || 0;

    const lblV = document.getElementById('lblVentas');
    const lblPV = document.getElementById('lblPzsVendidas');
    const lblC = document.getElementById('lblCompras');
    const lblPC = document.getElementById('lblPzsCompradas');
    const lblOG = document.getElementById('lblOtrosGastos');
    const lblCG = document.getElementById('lblCantGastos');

    if (lblV) lblV.innerText = '$' + totalVentas.toFixed(2);
    if (lblPV) lblPV.innerText = piezasVenta + ' pzs vendidas en caja';
    if (lblC) lblC.innerText = '$' + totalCompras.toFixed(2);
    if (lblPC) lblPC.innerText = ((data.compras && data.compras.lista && data.compras.lista.length) || 0) + ' facturas pagadas';
    if (lblOG) lblOG.innerText = '$' + totalGastos.toFixed(2);
    if (lblCG) lblCG.innerText = ((data.gastos && data.gastos.lista && data.gastos.lista.length) || 0) + ' pagos manuales';

    // Efectivo físico guardado en servidor si existe y no está editando
    if (data.efectivoFisico !== null && data.efectivoFisico !== undefined) {
      const inputE = document.getElementById('inputEfectivoManual');
      if (inputE && (!inputE.value || inputE.value === '0')) {
        inputE.value = data.efectivoFisico;
      }
    }

    // Renderizar compras y entradas
    if (data.compras && Array.isArray(data.compras.lista)) {
      renderTablaCompras(data.compras.lista);
    } else {
      renderTablaCompras([]);
    }

    // Renderizar gastos
    if (data.gastos && Array.isArray(data.gastos.lista)) {
      renderTablaGastos(data.gastos.lista);
    } else {
      renderTablaGastos([]);
    }

    // Renderizar catálogo
    renderTabla(productosCoca);
    actualizarSelectSalidas(productosCoca);

    // Actualizar balance
    calcularBalance(totalVentas, totalCompras, totalGastos);

    // Estado online
    const hora = new Date().toLocaleTimeString();
    if (lblStatus) {
      lblStatus.className = 'text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black';
      lblStatus.innerText = 'EN LÍNEA (' + posServerIp + ') ' + hora;
    }
    if (lblDetail) {
      lblDetail.innerText = 'Sincronizado: ' + productosCoca.length + ' productos de Coca-Cola FEMSA y $' + totalVentas.toFixed(2) + ' en ventas.';
    }
    if (dotPing) dotPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
    if (dot) dot.className = 'relative inline-flex rounded-full h-3 w-3 bg-emerald-500';

    if (!silent) {
      alert('⚡ ¡Sincronización exitosa con la caja del Punto de Venta!\n\nProductos: ' + productosCoca.length + '\nVentas del día: $' + totalVentas.toFixed(2) + ' (' + piezasVenta + ' pzs)');
    }

  } catch(err) {
    // Si no conecta al POS por WiFi, operar en modo local sin trabas
    if (lblStatus) {
      lblStatus.className = 'text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-black';
      lblStatus.innerText = 'MODO LOCAL / OFFLINE';
    }
    if (lblDetail) {
      lblDetail.innerText = 'Usando datos guardados en este dispositivo. Para sincronizar en vivo conecta a la misma red Wi-Fi.';
    }
    if (dotPing) dotPing.className = 'hidden';
    if (dot) dot.className = 'relative inline-flex rounded-full h-3 w-3 bg-amber-500';

    if (!silent) {
      alert('⚠️ No se pudo conectar al Punto de Venta en ' + posServerIp + ':3008.\nVerifica que la computadora esté encendida y en el mismo Wi-Fi.\n\nLa app continuará funcionando en modo local.');
    }

    cargarDatosLocales();
  }
}

function guardarCatalogoLocal() {
  localStorage.setItem('control_coca_femsa_stock', JSON.stringify(productosCoca));
  const lblT = document.getElementById('lblTotalProd');
  if (lblT) lblT.innerText = productosCoca.length;
}

function toggleModalVentas() {
  const m = document.getElementById('modalVentas');
  if (!m) return;
  if (m.classList.contains('hidden')) {
    m.classList.remove('hidden');
    renderTablaVentasModal();
  } else {
    m.classList.add('hidden');
  }
}

function renderTablaVentasModal() {
  const tbody = document.getElementById('tablaVentasModalBody');
  const countLbl = document.getElementById('lblCountVentasModal');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (countLbl) countLbl.innerText = ventasDetallePOS.length + ' tickets';

  if (ventasDetallePOS.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-500 font-bold">No hay ventas registradas de Coca-Cola FEMSA para esta fecha.</td></tr>';
    return;
  }

  ventasDetallePOS.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors';
    tr.innerHTML = 
      '<td class="p-2 font-mono text-slate-400">' + (v.hora || '--:--') + '</td>' +
      '<td class="p-2 font-mono font-bold text-amber-400">#' + v.folio + '</td>' +
      '<td class="p-2 text-slate-400 text-[10px]">' + (v.caja || 'Caja 1') + '</td>' +
      '<td class="p-2 text-white font-bold">' + v.name + '</td>' +
      '<td class="p-2 text-center text-emerald-400 font-black">' + v.qty + '</td>' +
      '<td class="p-2 text-right font-mono text-slate-300">$' + Number(v.price).toFixed(2) + '</td>' +
      '<td class="p-2 text-right font-mono font-black text-emerald-400">$' + Number(v.total).toFixed(2) + '</td>';
    tbody.appendChild(tr);
  });
}

function toggleFormNuevoProd() {
  const f = document.getElementById('formNuevoProducto');
  const btn = document.getElementById('btnNuevoProdTexto');
  if (!f) return;
  if (f.style.display === 'none' || f.classList.contains('hidden')) {
    f.style.display = 'block';
    f.classList.remove('hidden');
    if (btn) btn.innerText = '✕ CERRAR FORMULARIO';
  } else {
    f.style.display = 'none';
    f.classList.add('hidden');
    if (btn) btn.innerText = '+ AGREGAR PRODUCTO NUEVO';
  }
}

function guardarNuevoProducto() {
  const sku = (document.getElementById('nuevoSku').value || '').trim();
  const name = (document.getElementById('nuevoNombre').value || '').trim();
  const cost = parseFloat(document.getElementById('nuevoCosto').value) || 0;
  const price = parseFloat(document.getElementById('nuevoPrecio').value) || 0;
  const stock = parseFloat(document.getElementById('nuevoStock').value) || 0;

  if (!sku || !name) {
    alert('Por favor ingresa al menos el SKU y el Nombre del producto.');
    return;
  }

  const nuevoItem = {
    sku,
    name,
    category: 'Bebidas',
    supplier: 'COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)',
    cost,
    price,
    stock
  };

  const existe = productosCoca.find(p => p.sku === sku);
  if (existe) {
    existe.name = name;
    existe.cost = cost;
    existe.price = price;
    existe.stock = stock;
    alert('✅ Producto ya existía. Existencias y precios actualizados.');
  } else {
    productosCoca.unshift(nuevoItem);
    alert('🎉 ¡Nuevo producto agregado con éxito a la lista de Coca-Cola FEMSA!');
  }

  guardarCatalogoLocal();

  // Intentar actualizar en servidor en segundo plano
  fetch('http://' + posServerIp + ':3008/api/coca/actualizar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoItem)
  }).catch(() => {});

  document.getElementById('nuevoSku').value = '';
  document.getElementById('nuevoNombre').value = '';
  document.getElementById('nuevoCosto').value = '';
  document.getElementById('nuevoPrecio').value = '';
  document.getElementById('nuevoStock').value = '';
  toggleFormNuevoProd();
  cargarDatosLocales();
}

function setModo(m) {
  modo = m;
  const btnD = document.getElementById('btnModoDia');
  const btnM = document.getElementById('btnModoMes');
  if (btnD && btnM) {
    btnD.className = m === 'DIA' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
    btnM.className = m === 'MES' ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white' : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
  }
  cargarEfectivoGuardado();
  sincronizarConPOS(true);
}

function cargarEfectivoGuardado() {
  const key = 'efectivo_COCA_' + getKey();
  const guardado = localStorage.getItem(key) || '';
  const inputE = document.getElementById('inputEfectivoManual');
  if (inputE) inputE.value = guardado;
}

function guardarEfectivoManual() {
  const key = 'efectivo_COCA_' + getKey();
  const inputE = document.getElementById('inputEfectivoManual');
  const valor = inputE ? (parseFloat(inputE.value) || 0) : 0;
  localStorage.setItem(key, String(valor));

  // Enviar a servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/guardar-efectivo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha: getKey(), monto: valor })
  }).catch(() => {});

  alert('✅ Efectivo en mano validado para Coca-Cola (' + getKey() + '): $' + valor.toFixed(2));
  calcularBalance();
}

function cargarDatosLocales() {
  cargarEfectivoGuardado();
  
  let totalVentas = 0;
  let pzsVendidas = 0;
  let totalCompras = 0;
  let totalOtrosGastos = 0;

  const comprasKey = 'compras_COCA_' + getKey();
  const comprasGuardadas = JSON.parse(localStorage.getItem(comprasKey) || '[]');
  for (const c of comprasGuardadas) {
    totalCompras += parseFloat(c.total || c.monto) || 0;
  }

  const salidasKey = 'salidas_COCA_' + getKey();
  const salidasGuardadas = JSON.parse(localStorage.getItem(salidasKey) || '[]');
  for (const s of salidasGuardadas) {
    totalVentas += parseFloat(s.total) || 0;
    pzsVendidas += parseInt(s.cantidad) || 0;
  }

  const gastosKey = 'otros_gastos_' + getKey();
  const gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
  for (const g of gastosGuardados) {
    totalOtrosGastos += parseFloat(g.total) || 0;
  }

  const lblV = document.getElementById('lblVentas');
  const lblPV = document.getElementById('lblPzsVendidas');
  const lblC = document.getElementById('lblCompras');
  const lblPC = document.getElementById('lblPzsCompradas');
  const lblOG = document.getElementById('lblOtrosGastos');
  const lblCG = document.getElementById('lblCantGastos');

  if (lblV) lblV.innerText = '$' + totalVentas.toFixed(2);
  if (lblPV) lblPV.innerText = pzsVendidas + ' piezas vendidas';
  if (lblC) lblC.innerText = '$' + totalCompras.toFixed(2);
  if (lblPC) lblPC.innerText = comprasGuardadas.length + ' notas pagadas';
  if (lblOG) lblOG.innerText = '$' + totalOtrosGastos.toFixed(2);
  if (lblCG) lblCG.innerText = gastosGuardados.length + ' pagos manuales';

  calcularBalance(totalVentas, totalCompras, totalOtrosGastos);
  renderTablaCompras(comprasGuardadas);
  renderTablaGastos(gastosGuardados);
  actualizarSelectSalidas(productosCoca);

  const busc = document.getElementById('inputBuscador');
  const q = (busc ? busc.value : '').toLowerCase().trim();
  if (q) {
    const filtrados = productosCoca.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.sku || '').toLowerCase().includes(q)
    );
    renderTabla(filtrados);
  } else {
    renderTabla(productosCoca);
  }
}

function renderTablaGastos(lista) {
  const seccion = document.getElementById('seccionListaGastos');
  const tbody = document.getElementById('tablaGastosBody');
  if (!seccion || !tbody) return;
  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    seccion.style.display = 'none';
    return;
  }
  seccion.style.display = 'block';

  let suma = 0;
  for (const g of lista) {
    suma += parseFloat(g.total) || 0;
    const tr = document.createElement('tr');
    const hora = (g.fecha || '').slice(11, 16) || '--:--';
    tr.innerHTML = '<td class="p-2 text-slate-400 font-mono">' + hora + '</td>' +
      '<td class="p-2 text-white font-bold uppercase">' + g.concepto + '</td>' +
      '<td class="p-2 text-slate-300">' + (g.detalle || '-') + '</td>' +
      '<td class="p-2 text-right text-amber-400 font-bold font-mono">-$' + parseFloat(g.total).toFixed(2) + '</td>' +
      '<td class="p-2 text-center"><button onclick="borrarGasto(' + g.id + ')" class="text-rose-400 hover:text-rose-300 font-bold text-xs">✕</button></td>';
    tbody.appendChild(tr);
  }
  const lblSuma = document.getElementById('lblSumaGastosHeader');
  if (lblSuma) lblSuma.innerText = 'Total descontado: $' + suma.toFixed(2);
}



function actualizarSelectSalidas(lista) {
  const sel = document.getElementById('selectSalidaProd');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Elige producto para salida --</option>';
  for (const p of lista) {
    const opt = document.createElement('option');
    opt.value = p.sku;
    opt.text = p.name + ' ($' + p.price + ' | Stock: ' + p.stock + ')';
    sel.appendChild(opt);
  }
}

// CÁLCULO DE BALANCE Y FLUJO DE EFECTIVO CON LA FÓRMULA DE JOSUÉ:
// TOTAL EN CAJA = (Ventas del Día + Efectivo que Hay en Caja) - Compras Camión - Otros Gastos
function calcularBalance(ventas, compras, otrosGastos) {
  const v = typeof ventas === 'number' ? ventas : parseFloat((document.getElementById('lblVentas')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const c = typeof compras === 'number' ? compras : parseFloat((document.getElementById('lblCompras')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const g = typeof otrosGastos === 'number' ? otrosGastos : parseFloat((document.getElementById('lblOtrosGastos')?.innerText || '0').replace(/[^0-9.]/g, '')) || 0;
  const efManual = parseFloat(document.getElementById('inputEfectivoManual')?.value || '0') || 0;

  // FÓRMULA EXACTA SOLICITADA POR JOSUÉ:
  // (Ventas cobradas + Efectivo en caja) - Compras al camión - Otros gastos
  const totalEnCaja = (v + efManual) - c - g;

  const lblDisp = document.getElementById('lblEfectivoDisponible');
  const lblFormula = document.getElementById('lblFormulaDisponible');
  if (lblDisp) {
    lblDisp.innerText = (totalEnCaja >= 0 ? '+$' : '-$') + Math.abs(totalEnCaja).toFixed(2);
    lblDisp.className = totalEnCaja >= 0 
      ? 'text-2xl sm:text-3xl font-black text-emerald-400' 
      : 'text-2xl sm:text-3xl font-black text-rose-400';
  }
  if (lblFormula) {
    lblFormula.innerText = '($' + v.toFixed(2) + ' Ventas + $' + efManual.toFixed(2) + ' Efectivo) - $' + c.toFixed(2) + ' Compras - $' + g.toFixed(2) + ' Gastos';
  }

  // Compatibilidad con elemento lblBalance si existe
  const lblBal = document.getElementById('lblBalance');
  if (lblBal) {
    lblBal.innerText = (totalEnCaja >= 0 ? '+$' : '-$') + Math.abs(totalEnCaja).toFixed(2);
    lblBal.className = totalEnCaja >= 0 ? 'text-xl sm:text-2xl font-black text-emerald-400' : 'text-xl sm:text-2xl font-black text-rose-400';
  }
}

// RENDER TABLA DE COMPRAS / ENTRADAS DEL DÍA
function renderTablaCompras(lista) {
  const seccion = document.getElementById('seccionListaCompras');
  const tbody = document.getElementById('tablaComprasBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-2 text-center text-slate-500 text-[10px]">Sin entradas de compras registradas en esta fecha.</td></tr>';
    const lblSuma = document.getElementById('lblSumaComprasHeader');
    if (lblSuma) lblSuma.innerText = '$0.00';
    return;
  }

  let suma = 0;
  for (const c of lista) {
    const monto = parseFloat(c.monto || c.total) || 0;
    suma += monto;
    const tr = document.createElement('tr');
    const hora = (c.fecha || '').slice(11, 16) || '--:--';
    tr.className = 'hover:bg-slate-800/40 transition-colors';
    tr.innerHTML = 
      '<td class="p-1.5 text-slate-400 font-mono text-[10px]">' + hora + '</td>' +
      '<td class="p-1.5 text-rose-400 font-bold font-mono text-[11px]">#' + (c.folioFactura || c.folio || 'S/N') + '</td>' +
      '<td class="p-1.5 text-slate-300 text-[10px] truncate max-w-[120px]">' + (c.detalle || c.notas || 'Camión Coca') + '</td>' +
      '<td class="p-1.5 text-right font-black font-mono text-rose-400">-$' + monto.toFixed(2) + '</td>' +
      '<td class="p-1.5 text-center"><button onclick="borrarCompra(' + c.id + ')" class="text-rose-400 hover:text-rose-300 font-black text-xs" title="Borrar entrada">✕</button></td>';
    tbody.appendChild(tr);
  }

  const lblSuma = document.getElementById('lblSumaComprasHeader');
  if (lblSuma) lblSuma.innerText = 'Total: $' + suma.toFixed(2);
}

// 1. REGISTRAR COMPRA RÁPIDA (FOLIO, MONTO, NOTAS)
function registrarCompraRapida() {
  const folio = (document.getElementById('compraFolio')?.value || '').trim();
  const total = parseFloat(document.getElementById('compraTotal')?.value) || 0;
  const notas = (document.getElementById('compraNotas')?.value || '').trim();

  if (total <= 0) {
    alert('Ingresa el total pagado al camión mayor a $0.');
    return;
  }

  const compraObj = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    folioFactura: folio || 'ENT-' + Date.now().toString().slice(-4),
    monto: total,
    total: total,
    detalle: notas || 'Entrada camión Coca-Cola',
    proveedor: 'COCA COLA-- FEMSA (FOMENTO ECONÓMICO MEXICANO, S.A.B. DE C.V.)'
  };

  // Guardar local
  const key = 'compras_COCA_' + getKey();
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(compraObj);
  localStorage.setItem(key, JSON.stringify(arr));

  // Enviar al servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/guardar-compra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compraObj)
  }).catch(() => {});

  // Limpiar campos
  const inFolio = document.getElementById('compraFolio');
  const inTot = document.getElementById('compraTotal');
  const inNot = document.getElementById('compraNotas');
  if (inFolio) inFolio.value = '';
  if (inTot) inTot.value = '';
  if (inNot) inNot.value = '';

  sincronizarConPOS(true);
}

// BORRAR COMPRA
function borrarCompra(id) {
  const key = 'compras_COCA_' + getKey();
  let arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr = arr.filter(c => c.id !== id);
  localStorage.setItem(key, JSON.stringify(arr));

  fetch('http://' + posServerIp + ':3008/api/coca/borrar-compra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  }).catch(() => {});

  sincronizarConPOS(true);
}

// 2. REGISTRAR OTRO GASTO MANUAL (CONCEPTO, MONTO, DETALLE)
function registrarOtroGasto() {
  const conc = (document.getElementById('gastoConcepto')?.value || '').trim();
  const monto = parseFloat(document.getElementById('gastoTotal')?.value) || 0;
  const det = (document.getElementById('gastoDetalle')?.value || '').trim();

  if (!conc) {
    alert('Ingresa el concepto del gasto (ej. Hielo, Comida).');
    return;
  }
  if (monto <= 0) {
    alert('Ingresa un monto válido mayor a $0.');
    return;
  }

  const gastoObj = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    concepto: conc,
    total: monto,
    detalle: det
  };

  // Guardar local
  const key = 'otros_gastos_' + getKey();
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(gastoObj);
  localStorage.setItem(key, JSON.stringify(arr));

  // Enviar a servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/guardar-gasto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gastoObj)
  }).catch(() => {});

  // Limpiar campos
  const inC = document.getElementById('gastoConcepto');
  const inM = document.getElementById('gastoTotal');
  const inD = document.getElementById('gastoDetalle');
  if (inC) inC.value = '';
  if (inM) inM.value = '';
  if (inD) inD.value = '';

  sincronizarConPOS(true);
}

function borrarGasto(id) {
  const gastosKey = 'otros_gastos_' + getKey();
  let gastosGuardados = JSON.parse(localStorage.getItem(gastosKey) || '[]');
  gastosGuardados = gastosGuardados.filter(g => g.id !== id);
  localStorage.setItem(gastosKey, JSON.stringify(gastosGuardados));

  fetch('http://' + posServerIp + ':3008/api/coca/borrar-gasto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  }).catch(() => {});

  sincronizarConPOS(true);
}


// 3. REGISTRAR SALIDA MANUAL (VENTA MANUAL)
function registrarSalida() {
  const sku = document.getElementById('selectSalidaProd')?.value;
  const cant = parseInt(document.getElementById('salidaCantidad')?.value) || 0;

  if (!sku) {
    alert('Selecciona un producto de Coca-Cola para la salida.');
    return;
  }
  if (cant <= 0) {
    alert('Ingresa una cantidad mayor a 0.');
    return;
  }

  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;

  const total = cant * prod.price;
  prod.stock = Math.max(0, prod.stock - cant);
  guardarCatalogoLocal();

  const salidaObj = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    sku: prod.sku,
    name: prod.name,
    cantidad: cant,
    precio: prod.price,
    total: total
  };

  const key = 'salidas_COCA_' + getKey();
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(salidaObj);
  localStorage.setItem(key, JSON.stringify(arr));

  // Actualizar stock en el servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/actualizar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: prod.sku, stock: prod.stock })
  }).catch(() => {});

  alert('✅ Salida registrada: ' + cant + 'x ' + prod.name + ' ($' + total.toFixed(2) + ').');
  document.getElementById('salidaCantidad').value = '1';

  sincronizarConPOS(true);
}

// MODIFICAR STOCK RÁPIDO (+ / -)
function modificarStock(sku, delta) {
  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;

  prod.stock = Math.max(0, prod.stock + delta);
  guardarCatalogoLocal();

  // Enviar al servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/actualizar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: prod.sku, stock: prod.stock })
  }).catch(() => {});

  const inp = document.getElementById('stockInput_' + sku);
  if (inp) inp.value = prod.stock;

  const lblVal = document.getElementById('valVenta_' + sku);
  if (lblVal) lblVal.innerText = '$' + (prod.stock * prod.price).toFixed(2);
}

// GUARDAR STOCK DIRECTO
function guardarStockManual(sku, inputElement) {
  const prod = productosCoca.find(p => p.sku === sku);
  if (!prod) return;

  const val = parseFloat(inputElement.value) || 0;
  prod.stock = Math.max(0, val);
  guardarCatalogoLocal();

  // Enviar al servidor POS
  fetch('http://' + posServerIp + ':3008/api/coca/actualizar-stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: prod.sku, stock: prod.stock })
  }).catch(() => {});

  const lblVal = document.getElementById('valVenta_' + sku);
  if (lblVal) lblVal.innerText = '$' + (prod.stock * prod.price).toFixed(2);
}

// BUSCADOR EN VIVO
function filtrarProductos() {
  const busc = document.getElementById('inputBuscador');
  const q = (busc ? busc.value : '').toLowerCase().trim();
  if (q) {
    const filtrados = productosCoca.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.sku || '').toLowerCase().includes(q)
    );
    renderTabla(filtrados);
  } else {
    renderTabla(productosCoca);
  }
}

// RENDER TABLA DE PRODUCTOS
function renderTabla(lista) {
  const tbody = document.getElementById('tablaProductosBody');
  const lblT = document.getElementById('lblTotalProd');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (lblT) lblT.innerText = lista.length;

  for (const p of lista) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 border-b border-slate-800/40 transition-colors';
    
    tr.innerHTML = 
      '<td class="p-3 font-mono text-slate-400 select-all">' + p.sku + '</td>' +
      '<td class="p-3 text-white font-bold">' +
        '<div>' + p.name + '</div>' +
        '<div class="text-[10px] text-slate-500 font-semibold">' + (p.category || 'Bebidas') + ' | ' + (p.supplier || 'COCA COLA-- FEMSA') + '</div>' +
      '</td>' +
      '<td class="p-3 text-right font-mono text-slate-400">$' + (p.cost || 0).toFixed(2) + '</td>' +
      '<td class="p-3 text-right font-mono font-bold text-emerald-400">$' + (p.price || 0).toFixed(2) + '</td>' +
      '<td class="p-3 text-center">' +
        '<input type="number" id="stockInput_' + p.sku + '" value="' + p.stock + '" step="1" min="0" onchange="guardarStockManual(\'' + p.sku + '\', this)" class="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-black text-amber-400 focus:outline-none focus:border-amber-400">' +
      '</td>' +
      '<td class="p-3 text-center">' +
        '<div class="flex items-center justify-center gap-1.5">' +
          '<button onclick="modificarStock(\'' + p.sku + '\', -1)" class="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 font-black text-sm active:scale-95 transition-all">-1</button>' +
          '<button onclick="modificarStock(\'' + p.sku + '\', 1)" class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-black text-sm active:scale-95 transition-all">+1</button>' +
        '</div>' +
      '</td>' +
      '<td class="p-3 text-right font-mono font-black text-white" id="valVenta_' + p.sku + '">$' + ((p.stock || 0) * (p.price || 0)).toFixed(2) + '</td>';

    tbody.appendChild(tr);
  }
}

// 4. SUBIR EXISTENCIAS POR EXCEL
function subirExcel(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    alert('Error: La librería de Excel no se ha cargado. Verifica tu conexión o recarga la página.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (!rows || rows.length === 0) {
        alert('El archivo Excel está vacío.');
        return;
      }

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const r = rows[i] || [];
        const str = r.map(c => (c || '').toString().toUpperCase()).join(' ');
        if (str.includes('SKU') || str.includes('CODIGO') || str.includes('PRODUCTO') || str.includes('STOCK')) {
          headerRowIndex = i;
          break;
        }
      }

      let actualizados = 0;
      let noCoca = 0;

      const headers = rows[headerRowIndex].map(h => (h || '').toString().toUpperCase().trim());
      let colSku = headers.findIndex(h => h.includes('SKU') || h.includes('CODIGO') || h.includes('CÓDIGO'));
      let colProv = headers.findIndex(h => h.includes('PROVEEDOR'));
      let colStock = headers.findIndex(h => h.includes('STOCK') || h.includes('EXISTENCIA') || h.includes('CANTIDAD'));
      let colCost = headers.findIndex(h => h.includes('COSTO'));
      let colPrecio = headers.findIndex(h => h.includes('PRECIO'));

      if (colSku === -1) colSku = 0;

      const itemsParaServidor = [];

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length === 0) continue;
        const sku = (r[colSku] || '').toString().trim();
        if (!sku) continue;

        const prov = colProv !== -1 && r[colProv] ? r[colProv].toString().toUpperCase() : 'COCA COLA-- FEMSA';
        
        if (!prov.includes('COCA COLA-- FEMSA') && !prov.includes('FEMSA') && !prov.includes('COCA')) {
          noCoca++;
          continue;
        }

        const stock = colStock !== -1 ? parseFloat(r[colStock].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
        const cost = colCost !== -1 ? parseFloat(r[colCost].toString().replace(/[^0-9.]/g, '')) || 0 : 0;
        const price = colPrecio !== -1 ? parseFloat(r[colPrecio].toString().replace(/[^0-9.]/g, '')) || 0 : 0;

        const existe = productosCoca.find(p => p.sku === sku);
        if (existe) {
          existe.stock = stock;
          if (cost > 0) existe.cost = cost;
          if (price > 0) existe.price = price;
          actualizados++;
          itemsParaServidor.push({ sku, stock, cost, price });
        }
      }

      guardarCatalogoLocal();

      // Enviar actualizaciones al servidor del POS
      if (itemsParaServidor.length > 0) {
        fetch('http://' + posServerIp + ':3008/api/coca/actualizar-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsParaServidor)
        }).catch(() => {});
      }

      alert('🎉 ¡Existencias de Coca-Cola FEMSA actualizadas con éxito!\n\nProductos actualizados: ' + actualizados);
      sincronizarConPOS(true);

    } catch (err) {
      console.error(err);
      alert('Error al leer el archivo Excel: ' + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
  event.target.value = '';
}

// 5. EXPORTAR EXCEL
function exportarExcel() {
  if (typeof XLSX === 'undefined') {
    alert('Error: La librería de Excel no está disponible.');
    return;
  }
  const data = productosCoca.map(p => ({
    'SKU': p.sku,
    'PRODUCTO': p.name,
    'CATEGORÍA': p.category,
    'PROVEEDOR': p.supplier,
    'COSTO UNITARIO': p.cost,
    'PRECIO VENTA': p.price,
    'STOCK ACTUAL': p.stock,
    'VALOR TOTAL VENTA': (p.stock * p.price).toFixed(2)
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Coca Cola FEMSA');
  XLSX.writeFile(wb, 'EXISTENCIAS_COCA_COLA_FEMSA_' + getKey() + '.xlsx');
}

// EXPORTACIÓN A WINDOW
window.setModo = setModo;
window.irAFecha = irAFecha;
window.onFechaManualChange = onFechaManualChange;
window.cargarDatos = cargarDatosLocales;
window.sincronizarConPOS = sincronizarConPOS;
window.guardarIpConfig = guardarIpConfig;
window.toggleAutoSync = toggleAutoSync;
window.toggleModalVentas = toggleModalVentas;
window.subirExcel = subirExcel;
window.exportarExcel = exportarExcel;
window.toggleFormNuevoProd = toggleFormNuevoProd;
window.guardarNuevoProducto = guardarNuevoProducto;
window.guardarEfectivoManual = guardarEfectivoManual;
window.guardarEfectivo = guardarEfectivoManual;
window.registrarCompra = registrarCompra;
window.registrarCompraRapida = registrarCompraRapida;
window.borrarCompra = borrarCompra;
window.registrarGasto = registrarGasto;
window.registrarOtroGasto = registrarOtroGasto;
window.borrarGasto = borrarGasto;
window.registrarSalida = registrarSalida;
window.cambiarPestana = cambiarPestana;
window.showToast = showToast;
window.copiarResumenCorte = copiarResumenCorte;
window.modificarStock = modificarStock;
window.guardarStockManual = guardarStockManual;
window.filtrarProductos = filtrarProductos;

// INICIAR AL CARGAR
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
