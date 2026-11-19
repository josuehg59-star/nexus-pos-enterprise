import os
import re

with open('src/pages/PosTerminal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add the import and hook
if "useSettings" not in code:
    code = code.replace("import { usePosStore } from '../store/useStore';", "import { usePosStore } from '../store/useStore';\nimport { useSettings } from '../store/useSettings';")

if "const { nombreNegocio } = useSettings();" not in code:
    code = code.replace("export default function PosTerminal() {\n", "export default function PosTerminal() {\n  const { nombreNegocio } = useSettings();\n")

with open('src/pages/PosTerminal.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("PosTerminal.tsx FIXED!")
