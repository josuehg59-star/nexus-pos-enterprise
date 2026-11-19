import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the missing IIFE invocations
code = code.replace("})}", "})()}")
# But wait, that might replace legitimate closes. Let's be very specific:
code = code.replace("        )})}()", "        })()}") # Rollback if I messed up in thought
code = code.replace("        )})}()()", "        })()") 

# Let's do it safely using precise strings:
replacements = [
    ("        )})}  ", "        })()}  "),
    ("        )})}    ", "        })()}    "),
    ("        )})} \n", "        })()}\n"),
    ("        )})} \r", "        })()}\r"),
    ("        )})}\n", "        })()}\n")
]

for old, new in replacements:
    code = code.replace(old, new)

# Actually, my previous script injected:
#          </div>
#        )})}
# Let's just target `        )})}` if it's followed by a newline or space
code = code.replace("        )})}\n\n        {", "        })()}\n\n        {")
code = code.replace("        )})}\n\n        {activeTab", "        })()}\n\n        {activeTab")
code = code.replace("        )})}\n      </div>", "        })()}\n      </div>")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed Reports.tsx invocations!")
