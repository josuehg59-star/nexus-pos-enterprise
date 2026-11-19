import os
import re

with open('src/pages/Config.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Make sure supplier name matching is case insensitive
old_provider_match = r"const providerNameToId = new Map\(existingProviders\.map\(p => \[p\.name, p\.id\]\)\);"
new_provider_match = "const providerNameToId = new Map(existingProviders.map(p => [String(p.name).trim().toUpperCase(), p.id]));"
code = re.sub(old_provider_match, new_provider_match, code)

old_prov_lookup = r"const existingId = providerNameToId\.get\(s\.name\);"
new_prov_lookup = "const existingId = providerNameToId.get(String(s.name).trim().toUpperCase());"
code = re.sub(old_prov_lookup, new_prov_lookup, code)

# Fix ticket ID generation so it uses the Titan ticket ID if available, OR a hash of date+total, to avoid duplicates on re-import
old_ticket_id = r"id: String\(s\.id \|\| crypto\.randomUUID\(\)\),"
new_ticket_id = "id: s.id ? String(s.id) : `tkt-${s.date}-${s.total}`.replace(/[^a-zA-Z0-9-]/g, ''),"
code = re.sub(old_ticket_id, new_ticket_id, code)

# Make sure clients matching is case insensitive
old_client_map = r"const clientNameToId = new Map\(existingClients\.map\(c => \[c\.name, c\.id\]\)\);"
new_client_map = "const clientNameToId = new Map(existingClients.map(c => [String(c.name).trim().toUpperCase(), c.id]));"
code = re.sub(old_client_map, new_client_map, code)

old_client_lookup = r"const existingId = clientNameToId\.get\(c\.name\);"
new_client_lookup = "const existingId = clientNameToId.get(String(c.name).trim().toUpperCase());"
code = re.sub(old_client_lookup, new_client_lookup, code)

with open('src/pages/Config.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Config.tsx deduplication hardened")
