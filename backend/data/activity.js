import { patients } from "./users.js";
const activitys = [
    {
        nombre: 'Asociación de Fotos',
        descripcion: 'Seleccionar el nombre correcto para la imagen mostrada.',
        tipo: 'asociacion_fotos',
        reglas: 'Elige el nombre correcto entre 3 opciones en el menor tiempo posible.',
        puntajeMaximo: 100,
        pacienteId: patients[1]._id, // Asociado a Alice Brown
        fechaRealizacion: new Date('2024-09-10'),
        puntajeObtenido: 85,
        tiempoUtilizado: 120, // segundos
        nivelDificultad: 2, // Dificultad intermedia
        observaciones: 'Buena precisión pero requiere mejorar en tiempo de respuesta.',
        progreso: 'mejorando',
    },
    {
        nombre: 'Juego de Memoria',
        descripcion: 'Recordar y emparejar imágenes iguales en pares.',
        tipo: 'memoria',
        reglas: 'Encuentra los pares de imágenes en el menor número de movimientos.',
        puntajeMaximo: 150,
        pacienteId: patients[1]._id, // Asociado a Bob Green
        fechaRealizacion: new Date('2024-09-08'),
        puntajeObtenido: 120,
        tiempoUtilizado: 200, // segundos
        nivelDificultad: 1, // Dificultad fácil
        observaciones: 'Mejor desempeño en comparación con la sesión anterior.',
        progreso: 'mejorando',
    },
    {
        nombre: 'Coordinación Motora',
        descripcion: 'Tocar los círculos en la pantalla a medida que aparecen.',
        tipo: 'coordinacion_motora',
        reglas: 'Presiona los círculos lo más rápido posible antes de que desaparezcan.',
        puntajeMaximo: 50,
        pacienteId: patients[0]._id, // Asociado a Charlie White
        fechaRealizacion: new Date('2024-09-09'),
        puntajeObtenido: 40,
        tiempoUtilizado: 60, // segundos
        nivelDificultad: 3, // Dificultad avanzada
        observaciones: 'Tiempo de reacción mejorado pero aún con algunos errores.',
        progreso: 'estable',
    },
    {
        nombre: 'Suma y Resta',
        descripcion: 'Resolver ecuaciones matemáticas sencillas lo más rápido posible.',
        tipo: 'matematicas',
        reglas: 'Resuelve las ecuaciones en menos de 5 segundos por operación.',
        puntajeMaximo: 80,
        pacienteId: patients[0]._id, // Asociado a Alice Brown
        fechaRealizacion: new Date('2024-09-07'),
        puntajeObtenido: 70,
        tiempoUtilizado: 90, // segundos
        nivelDificultad: 2, // Dificultad intermedia
        observaciones: 'Resultados precisos pero requiere mejorar en velocidad.',
        progreso: 'mejorando',
    },
    {
        nombre: 'Secuencias Numéricas',
        descripcion: 'Identificar el número que falta en una secuencia numérica.',
        tipo: 'secuencia_numerica',
        reglas: 'Completa la secuencia en el menor tiempo posible.',
        puntajeMaximo: 90,
        pacienteId: patients[1]._id, // Asociado a Bob Green
        fechaRealizacion: new Date('2024-09-05'),
        puntajeObtenido: 85,
        tiempoUtilizado: 100, // segundos
        nivelDificultad: 1, // Dificultad fácil
        observaciones: 'Buen desempeño general, especialmente en secuencias cortas.',
        progreso: 'mejorando',
    }
];

export { activitys };
