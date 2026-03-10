import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

# =========================
# CONFIGURACIÓN
# =========================

CSV_PATH = "clock_labels_full.csv"
ORIGINAL_DIR = "data_clock_original"
OUTPUT_DIR = "data_clock"

MIN_VAL = 60
MIN_TEST = 60

# =========================
# LIMPIAR DIRECTORIOS
# =========================

def clean_dir(path):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path)

for folder in ["train", "val", "test"]:
    clean_dir(os.path.join(OUTPUT_DIR, folder))

# =========================
# CARGAR CSV
# =========================

df = pd.read_csv(CSV_PATH)
df.columns = df.columns.str.strip()

df["combo"] = (
    df["contorno"].astype(str) +
    df["numeros"].astype(str) +
    df["agujas"].astype(str)
)

# =========================
# SPLIT ESTRATIFICADO
# =========================

train_df, temp_df = train_test_split(
    df,
    test_size=0.40,
    stratify=df["combo"],
    random_state=42
)

# Ajustar tamaño val/test manualmente
val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    stratify=temp_df["combo"],
    random_state=42
)

print("Train inicial:", len(train_df))
print("Val inicial:", len(val_df))
print("Test inicial:", len(test_df))

# =========================
# FUNCIÓN PARA COPIAR
# =========================

def copy_split(split_df, split_name):
    rows = []

    for _, row in split_df.iterrows():
        filename = row["filename"]
        src = os.path.join(ORIGINAL_DIR, filename)
        dst = os.path.join(OUTPUT_DIR, split_name, filename)

        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(src, dst)

        rows.append({
            "filename": filename,
            "contorno": row["contorno"],
            "numeros": row["numeros"],
            "agujas": row["agujas"]
        })

    csv_out = os.path.join(OUTPUT_DIR, split_name, f"{split_name}_labels.csv")
    pd.DataFrame(rows).to_csv(csv_out, index=False)

# =========================
# COPIAR SPLITS
# =========================

copy_split(train_df, "train")
copy_split(val_df, "val")
copy_split(test_df, "test")

print("\nNuevo split creado correctamente")