import os
import shutil
import random
import csv
import cv2
import numpy as np
import pandas as pd
from tqdm import tqdm
from sklearn.model_selection import train_test_split

CSV_PATH = "clock_labels_full.csv"
ORIGINAL_DIR = "data_clock_original"
BASE_OUTPUT = "data_clock"

TARGET_PER_CLASS = 1500
IMG_EXT = [".jpg", ".png", ".jpeg"]


def clean_dir(path):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path)


def augment_image(img):
    h, w = img.shape[:2]

    angle = random.uniform(-10, 10)
    M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1)
    img = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    tx = random.randint(-12, 12)
    ty = random.randint(-12, 12)
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    img = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    scale = random.uniform(0.9, 1.1)
    img = cv2.resize(img, None, fx=scale, fy=scale)
    img = cv2.resize(img, (w, h))

    noise = np.random.normal(0, 8, img.shape).astype(np.uint8)
    img = cv2.add(img, noise)

    return img


print("Cargando etiquetas reales...")
df = pd.read_csv(CSV_PATH)

# Crear una columna combinada para estratificación
df["combo"] = (
    df["contorno"].astype(str) +
    df["numeros"].astype(str) +
    df["agujas"].astype(str)
)

# Split 60/20/20
train_df, temp_df = train_test_split(
    df,
    test_size=0.40,
    stratify=df["combo"],
    random_state=42
)

val_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    stratify=temp_df["combo"],
    random_state=42
)

print("Train:", len(train_df))
print("Val:", len(val_df))
print("Test:", len(test_df))

# Crear estructura limpia
for folder in ["train", "val", "test", "train_aug"]:
    for c in ["correct", "incorrect"]:
        clean_dir(os.path.join(BASE_OUTPUT, folder, c))


def copy_split(split_df, folder_name):
    rows = []

    for _, row in split_df.iterrows():
        filename = row["filename"]
        contorno = row["contorno"]
        numeros = row["numeros"]
        agujas = row["agujas"]

        src = os.path.join(ORIGINAL_DIR, filename)
        dst = os.path.join(BASE_OUTPUT, folder_name, filename)

        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy(src, dst)

        rows.append({
            "filename": filename,
            "contorno": contorno,
            "numeros": numeros,
            "agujas": agujas
        })

    csv_out = os.path.join(BASE_OUTPUT, folder_name, f"{folder_name}_labels.csv")
    pd.DataFrame(rows).to_csv(csv_out, index=False)


copy_split(train_df, "train")
copy_split(val_df, "val")
copy_split(test_df, "test")

# =========================
# AUMENTAR SOLO TRAIN
# =========================

print("Generando train_aug...")

train_rows = []

for _, row in train_df.iterrows():
    filename = row["filename"]

    src = os.path.join(BASE_OUTPUT, "train", filename)
    dst = os.path.join(BASE_OUTPUT, "train_aug", filename)

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy(src, dst)

    train_rows.append({
        "filename": row["filename"],
        "contorno": row["contorno"],
        "numeros": row["numeros"],
        "agujas": row["agujas"]
    })

# Contar por combinación
combo_counts = train_df["combo"].value_counts().to_dict()

for combo, count in combo_counts.items():

    subset = train_df[train_df["combo"] == combo]

    needed = TARGET_PER_CLASS - count
    if needed <= 0:
        continue

    per_image = max(1, needed // len(subset))

    print(f"Combo {combo}: {per_image} augmentaciones por imagen")

    for _, row in tqdm(subset.iterrows(), total=len(subset)):

        filename = row["filename"]
        img_path = os.path.join(BASE_OUTPUT, "train", filename)
        img = cv2.imread(img_path)

        for i in range(per_image):
            aug = augment_image(img)
            name, ext = os.path.splitext(filename)
            new_name = f"{name}_aug{i}{ext}"
            full_path = os.path.join(BASE_OUTPUT, "train_aug", new_name)

            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            cv2.imwrite(full_path, aug)

            train_rows.append({
                "filename": new_name,
                "contorno": row["contorno"],
                "numeros": row["numeros"],
                "agujas": row["agujas"]
            })

# Guardar CSV aumentado
pd.DataFrame(train_rows).to_csv(
    os.path.join(BASE_OUTPUT, "train_aug", "train_labels.csv"),
    index=False
)

print("Dataset multi-label listo 🔥")