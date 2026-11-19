with open('src/pages/PosTerminal.tsx', encoding='utf-8') as f:
    c = f.read()
start = c.find('<input')
while start != -1:
    end = c.find('>', start)
    print(c[start:end+1])
    start = c.find('<input', end)
