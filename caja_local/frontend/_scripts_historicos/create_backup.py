import os
import zipfile

source_dir = r"c:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE\caja_local\frontend"
backup_path = r"c:\Users\JOSUE\Desktop\NEXUS_POS_ENTERPRISE\respaldo_etiquetas_pos58.zip"

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        # Exclude node_modules and .git
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist']]
        for file in files:
            file_path = os.path.join(root, file)
            # Create a relative path for the zip file
            rel_path = os.path.relpath(file_path, path)
            ziph.write(file_path, rel_path)

with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir(source_dir, zipf)

print(f"Respaldo creado exitosamente en: {backup_path}")
