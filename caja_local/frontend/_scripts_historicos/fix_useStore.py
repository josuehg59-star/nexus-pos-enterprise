with open('src/store/useStore.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()
lines[1] = "import { type Product, type Client } from './database';\n"
with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
