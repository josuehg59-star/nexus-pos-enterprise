import os
import re

with open('src/pages/CajaZ.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove the trailing `)}` from the end of the file that is causing the JSX adjacent error
code = code.replace("      )}</>\n  );\n}", "      </>\n  );\n}")

# Now, we need to properly close the `{!activeTurno ? (...) : (` ternary.
# We know the grid block ends after the REALIZAR CORTE Z button's wrapper.
# Looking at the tail:
#             <button onClick={handleCorteZ} ...>
#               <Lock className="w-6 h-6" /> REALIZAR CORTE Z
#             </button>
# 
#           </div>
#         </div>
#       </div>
#     </div>

# The `grid grid-cols-12` wrapper is closed by the second `</div>` after the button.
# Let's target this exact sequence:
pattern_end = """            <button onClick={handleCorteZ} className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-3">
              <Lock className="w-6 h-6" /> REALIZAR CORTE Z
            </button>

          </div>
        </div>"""

replacement_end = """            <button onClick={handleCorteZ} className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-3">
              <Lock className="w-6 h-6" /> REALIZAR CORTE Z
            </button>

          </div>
        </div>
        )}"""

if pattern_end in code:
    code = code.replace(pattern_end, replacement_end)
else:
    print("Could not find the exact button block to close the ternary.")

with open('src/pages/CajaZ.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed syntax in CajaZ.tsx")
