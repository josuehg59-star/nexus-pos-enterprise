with open('src/store/database.ts', encoding='utf-8') as f:
    content = f.read()

# 1. Add KardexMovement interface after CorteZ interface
movement_interface = """
export interface KardexMovement {
  id?: number;
  fecha: string;        // ISO date string
  tipo: string;         // ENTRADA | DEVOLUCION | MERMA
  sku: string;
  productName: string;
  cantidad: number;
  costo: number;
  precio: number;
  total: number;
  folio: string;
  proveedor: string;
}
"""

content = content.replace(
    "export class NexusDatabase extends Dexie {",
    movement_interface + "\nexport class NexusDatabase extends Dexie {"
)

# 2. Add Table declaration
content = content.replace(
    "  cortes!: Table<CorteZ, number>;",
    "  cortes!: Table<CorteZ, number>;\n  kardex!: Table<KardexMovement, number>;"
)

# 3. Bump DB version and add kardex table
content = content.replace(
    "    this.version(3).stores({",
    "    this.version(4).stores({"
)
content = content.replace(
    "      cortes: '++id, date'\n    });",
    "      cortes: '++id, date',\n      kardex: '++id, fecha, sku, tipo'\n    });"
)

with open('src/store/database.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('database.ts: Added KardexMovement table')
