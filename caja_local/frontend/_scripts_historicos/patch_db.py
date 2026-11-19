import os
import re

with open('src/store/database.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Add Turno interface
if "export interface Turno {" not in code:
    interface_block = """export interface Turno {
  id?: number;
  folio: string;
  fechaApertura: string;
  fechaCierre?: string;
  montoInicial: number;
  estado: string; // 'ACTIVO' | 'CERRADO'
  cajero?: string;
}

export interface"""
    code = code.replace("export interface", interface_block, 1)

# Add turnos to Dexie stores
if "turnos: '++id, folio, fechaApertura, estado'," not in code:
    code = code.replace("cortes: '++id, date',", "cortes: '++id, date',\n      turnos: '++id, folio, fechaApertura, estado',")

# Add turnos property to class PosDatabase
if "turnos!: Table<Turno>;" not in code:
    code = code.replace("cortes!: Table<CorteZ>;", "cortes!: Table<CorteZ>;\n  turnos!: Table<Turno>;")

with open('src/store/database.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("database.ts updated with Turnos table")
