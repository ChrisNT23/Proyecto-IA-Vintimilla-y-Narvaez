import os

# Ruta de la carpeta donde se encuentran las imágenes
folder_path = r"C:\Users\asval\Downloads\tesis\Proyecto-capstone-Vintimilla-y-Valverde\backend\received_images"

def rename_images(folder_path):
    try:
        # Obtener todos los archivos en la carpeta
        files = sorted(os.listdir(folder_path))
        
        # Filtrar solo los archivos con extensiones de imagen
        images = [file for file in files if file.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        # Contador para los nombres
        counter = 1
        
        for image in images:
            # Construir el nuevo nombre
            new_name = f"reloj_{counter:02d}.jpg"  # Formato reloj_01.jpg, reloj_02.jpg, etc.
            
            # Rutas completas para el archivo original y el renombrado
            original_path = os.path.join(folder_path, image)
            new_path = os.path.join(folder_path, new_name)
            
            # Renombrar el archivo
            os.rename(original_path, new_path)
            print(f"Renombrado: {original_path} -> {new_path}")
            
            counter += 1
        
        print("Renombrado completo.")
    
    except Exception as e:
        print(f"Error al renombrar imágenes: {e}")

# Ejecutar la función
rename_images(folder_path)
