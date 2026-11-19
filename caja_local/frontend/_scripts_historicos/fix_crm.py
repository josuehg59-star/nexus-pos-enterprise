with open('src/pages/Crm.tsx', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 35-36 are now JSX inside the component body but outside a function - remove them
# Find the end of handleSaveClient (line 33 is '  };\n') and line 34 is empty
# Lines 35-36 are stray JSX. Remove them.
# Actually the script cut too much. Let me find where the return starts.

# Find the line with '<Users className' and remove JSX lines until we hit a valid JS line
new_lines = []
skip = False
for i, line in enumerate(lines):
    if '<Users className="w-8 h-8 text-fuchsia-500"' in line:
        skip = True
    if skip and line.strip().startswith('const '):
        skip = False
    if not skip:
        new_lines.append(line)

with open('src/pages/Crm.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

# Verify
lines2 = open('src/pages/Crm.tsx', encoding='utf-8').readlines()
for i,l in enumerate(lines2[30:50], 31): print(i, repr(l))
