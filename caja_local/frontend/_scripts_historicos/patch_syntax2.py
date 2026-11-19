import os

with open('src/pages/Reports.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace </table>\n\n            {activeTab === 'MATRIZ 24H' with </table>\n            )}\n\n            {activeTab === 'MATRIZ 24H'
if "</table>\n\n\n            {activeTab === 'MATRIZ 24H'" in c:
    c = c.replace("</table>\n\n\n            {activeTab === 'MATRIZ 24H'", "</table>\n            )}\n\n            {activeTab === 'MATRIZ 24H'")
elif "</table>\n\n            {activeTab === 'MATRIZ 24H'" in c:
    c = c.replace("</table>\n\n            {activeTab === 'MATRIZ 24H'", "</table>\n            )}\n\n            {activeTab === 'MATRIZ 24H'")
else:
    # Just generic replace
    c = c.replace("</table>\n\n            {activeTab === 'MATRIZ", "</table>\n            )}\n\n            {activeTab === 'MATRIZ")

with open('src/pages/Reports.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Syntax error fixed (added closing brace and parenthesis)")
