import matplotlib.pyplot as plt
import numpy as np

# Datos
labels = ['Cubo', 'Reloj', 'Emociones']
baseline_scores = [82.0, 74.0, 58.0]
ajustado_scores = [99.5, 96.4, 67.7]

x = np.arange(len(labels))  # Posiciones de las etiquetas
width = 0.35  # Ancho de las barras

fig, ax = plt.subplots(figsize=(10, 6))

rects1 = ax.bar(x - width/2, baseline_scores, width, label='Baseline', color='#94a3b8') # Slate 400
rects2 = ax.bar(x + width/2, ajustado_scores, width, label='Ajustado (Final)', color='#3b82f6') # Blue 500

# Añadir etiquetas y estilo
ax.set_ylabel('Exactitud (Accuracy %)')
ax.set_title('Comparativa de Rendimiento: Modelo Baseline vs. Modelo Ajustado')
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.set_ylim(0, 115) # Espacio para las etiquetas de datos
ax.legend()

# Función para añadir etiquetas sobre las barras
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(f'{height}%',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom',
                    fontweight='bold')

autolabel(rects1)
autolabel(rects2)

plt.grid(axis='y', linestyle='--', alpha=0.3)
plt.tight_layout()

# Guardar la imagen
plt.savefig('comparativa_modelos_ia.png', dpi=300)
print("Gráfica generada: comparativa_modelos_ia.png")
