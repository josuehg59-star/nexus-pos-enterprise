import re

# 1. ImpresionEtiquetas.tsx
with open('src/pages/ImpresionEtiquetas.tsx', encoding='utf-8') as f:
    c = f.read()

# Fix React unused
c = c.replace("import React, { useState, useRef } from 'react';", "import { useState, useRef } from 'react';")

# Replace hook usage with component usage or fix the hook
# Let's fix the hook to use the v3 API `contentRef` which is standard in latest versions, 
# or just use the component <ReactToPrint>
if 'useReactToPrint({' in c:
    # We will just change it to contentRef if that's the error
    # Actually, the error says: 'content' does not exist in type 'UseReactToPrintOptions'
    # The new API for useReactToPrint is useReactToPrint({ contentRef: printRef })
    c = c.replace("content: () => printRef.current,", "contentRef: printRef,")

with open('src/pages/ImpresionEtiquetas.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# 2. useStore.ts
with open('src/store/useStore.ts', encoding='utf-8') as f:
    us = f.read()

us = re.sub(r'import \{[\s]*Ticket[\s]*\} from', 'import {} from', us)
us = re.sub(r'import \{[\s]*Ticket,[\s]*', 'import { ', us)
us = re.sub(r',[\s]*Ticket[\s]*\}', ' }', us)

with open('src/store/useStore.ts', 'w', encoding='utf-8') as f:
    f.write(us)

print("TS errors fixed")
