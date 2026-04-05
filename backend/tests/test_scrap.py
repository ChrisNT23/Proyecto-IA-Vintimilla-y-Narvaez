import os
import csv

BASE_DIR = "data_clock_original"

OUTPUT_CSV = "clock_labels_full.csv"

rows = []

for class_name in ["correct", "incorrect"]:
    class_dir = os.path.join(BASE_DIR, class_name)
    
    for img in os.listdir(class_dir):
        if img.lower().endswith((".jpg", ".png", ".jpeg")):
            
            # Inicialmente marcar todo como 1 si es correct
            if class_name == "correct":
                contorno = 1
                numeros = 1
                agujas = 1
            else:
                # Para incorrect dejamos vacío para que tú lo completes
                contorno = ""
                numeros = ""
                agujas = ""

            rows.append({
                "filename": f"{class_name}/{img}",
                "contorno": contorno,
                "numeros": numeros,
                "agujas": agujas
            })

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["filename", "contorno", "numeros", "agujas"])
    writer.writeheader()
    writer.writerows(rows)

print("Plantilla de etiquetado creada:", OUTPUT_CSV)