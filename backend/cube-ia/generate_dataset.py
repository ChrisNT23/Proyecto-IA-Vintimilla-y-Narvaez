import os
import cv2
import numpy as np
import random
import shutil
import uuid
from tqdm import tqdm
from sklearn.model_selection import train_test_split

# ==========================
# CONFIGURACIÓN
# ==========================

IMG_SIZE = 224
TOTAL_CORRECT = 6000
TOTAL_INCORRECT = 6000

TRAIN_SPLIT = 0.7
VAL_SPLIT = 0.15
TEST_SPLIT = 0.15

BASE_DIR = "data"

# ==========================
# CREAR / LIMPIAR DIRECTORIOS
# ==========================

def create_dirs():
    if os.path.exists(BASE_DIR):
        shutil.rmtree(BASE_DIR)

    for split in ["train", "val", "test"]:
        for label in ["correcto", "incorrecto"]:
            path = os.path.join(BASE_DIR, split, label)
            os.makedirs(path, exist_ok=True)

# ==========================
# UTILIDADES
# ==========================

def random_thickness():
    return random.randint(1, 4)

def add_noise(img):
    noise = np.random.normal(0, 10, img.shape).astype(np.uint8)
    img = cv2.add(img, noise)
    return img

def slight_warp(img):
    pts1 = np.float32([[0,0],[IMG_SIZE,0],[0,IMG_SIZE]])
    shift = 10
    pts2 = np.float32([
        [random.randint(0,shift), random.randint(0,shift)],
        [IMG_SIZE-random.randint(0,shift), random.randint(0,shift)],
        [random.randint(0,shift), IMG_SIZE-random.randint(0,shift)]
    ])
    M = cv2.getAffineTransform(pts1, pts2)
    return cv2.warpAffine(img, M, (IMG_SIZE, IMG_SIZE))

# ==========================
# GENERADOR CORRECTO
# ==========================

def generate_correct_cube():
    img = np.ones((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8) * 255

    thickness = random_thickness()

    min_size = 60
    max_size = 100

    size = random.randint(min_size, max_size)
    depth = random.randint(20, 50)
    margin = 20

    max_x = IMG_SIZE - size - depth - margin
    max_y = IMG_SIZE - size - margin

    if max_x <= margin:
        size = IMG_SIZE // 3
        depth = 30
        max_x = IMG_SIZE - size - depth - margin

    if max_y <= margin:
        size = IMG_SIZE // 3
        max_y = IMG_SIZE - size - margin

    x = random.randint(margin, max_x)
    y = random.randint(margin, max_y)

    # Frente
    p1 = (x, y)
    p2 = (x + size, y)
    p3 = (x + size, y + size)
    p4 = (x, y + size)

    # Fondo
    back = [(px + depth, py - depth) for (px, py) in [p1, p2, p3, p4]]

    # Dibujar frente
    for a, b in [(p1,p2),(p2,p3),(p3,p4),(p4,p1)]:
        cv2.line(img, a, b, (0,0,0), thickness)

    # Dibujar fondo
    for i in range(4):
        cv2.line(img, back[i], back[(i+1)%4], (0,0,0), thickness)

    # Conectar
    for i in range(4):
        cv2.line(img, [p1,p2,p3,p4][i], back[i], (0,0,0), thickness)

    if random.random() > 0.5:
        img = slight_warp(img)

    img = add_noise(img)

    return img

# ==========================
# GENERADOR INCORRECTO
# ==========================

def generate_incorrect():
    img = np.ones((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8) * 255
    thickness = random_thickness()

    choice = random.choice(["rectangulo", "lineas_sueltas", "cubo_mal_conectado", "incompleto"])

    if choice == "rectangulo":
        x1 = random.randint(40, 100)
        y1 = random.randint(40, 100)
        x2 = x1 + random.randint(80, 120)
        y2 = y1 + random.randint(80, 120)
        cv2.rectangle(img, (x1,y1), (x2,y2), (0,0,0), thickness)

    elif choice == "lineas_sueltas":
        for _ in range(random.randint(3,7)):
            pt1 = (random.randint(0,IMG_SIZE), random.randint(0,IMG_SIZE))
            pt2 = (random.randint(0,IMG_SIZE), random.randint(0,IMG_SIZE))
            cv2.line(img, pt1, pt2, (0,0,0), thickness)

    elif choice == "cubo_mal_conectado":
        img = generate_correct_cube()
        cv2.line(img,
                 (random.randint(0,IMG_SIZE), random.randint(0,IMG_SIZE)),
                 (random.randint(0,IMG_SIZE), random.randint(0,IMG_SIZE)),
                 (0,0,0),
                 thickness)

    elif choice == "incompleto":
        img = generate_correct_cube()
        x1 = random.randint(0, IMG_SIZE)
        y1 = random.randint(0, IMG_SIZE)
        x2 = random.randint(0, IMG_SIZE)
        y2 = random.randint(0, IMG_SIZE)
        cv2.line(img, (x1,y1), (x2,y2), (255,255,255), 6)

    img = add_noise(img)
    return img

# ==========================
# GUARDAR IMÁGENES
# ==========================

def save_images(images, label):
    train, temp = train_test_split(images, test_size=(1-TRAIN_SPLIT), random_state=42)
    val, test = train_test_split(temp, test_size=TEST_SPLIT/(VAL_SPLIT+TEST_SPLIT), random_state=42)

    splits = {
        "train": train,
        "val": val,
        "test": test
    }

    for split_name, imgs in splits.items():
        for img in imgs:
            unique_name = str(uuid.uuid4())
            path = os.path.join(BASE_DIR, split_name, label, f"{unique_name}.png")
            cv2.imwrite(path, img)

# ==========================
# MAIN
# ==========================

def main():
    print("🔄 Generando dataset sintético...")
    create_dirs()

    correct_images = [generate_correct_cube() for _ in tqdm(range(TOTAL_CORRECT))]
    incorrect_images = [generate_incorrect() for _ in tqdm(range(TOTAL_INCORRECT))]

    save_images(correct_images, "correcto")
    save_images(incorrect_images, "incorrecto")

    print("✅ Dataset generado correctamente")

if __name__ == "__main__":
    main()