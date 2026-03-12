import os

folder_path = "data_clock_original/correct"
valid_ext = (".jpg", ".jpeg", ".png")

images = [f for f in os.listdir(folder_path) if f.lower().endswith(valid_ext)]
images.sort()

print(f"Total imágenes encontradas: {len(images)}")

# ---------------------------
# PASO 1: nombres temporales
# ---------------------------
temp_names = []

for i, filename in enumerate(images):
    old_path = os.path.join(folder_path, filename)
    ext = os.path.splitext(filename)[1]

    temp_name = f"temp_{i}{ext}"
    temp_path = os.path.join(folder_path, temp_name)

    os.rename(old_path, temp_path)
    temp_names.append(temp_name)

# ---------------------------
# PASO 2: nombres finales
# ---------------------------
for i, filename in enumerate(temp_names, start=1):

    old_path = os.path.join(folder_path, filename)
    ext = os.path.splitext(filename)[1]

    new_name = f"reloj_{i:03d}{ext}"
    new_path = os.path.join(folder_path, new_name)

    os.rename(old_path, new_path)

    print(f"{filename} -> {new_name}")

print("Renombrado completado correctamente.")