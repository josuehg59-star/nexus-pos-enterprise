import os

file_path = r"C:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE\SISTEMA_RETAILPOS_MOVIL\index.html"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(":3000/api/", ":3008/api/")
text = text.replace('placeholder="Ej: 192.168.100.38"', 'placeholder="Ej: 192.168.100.38:3008"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("PORT REPLACED SUCCESSFULLY IN MOBILE INDEX.HTML")
