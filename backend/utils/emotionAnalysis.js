/**
 * Utilidades para análisis de datos biométricos emocionales
 * Incluye cálculo de variables derivadas, índices y análisis temporal
 */

/**
 * Calcula el índice de variabilidad emocional
 * Mide qué tan variable son las emociones durante el test
 * @param {Array} captures - Array de capturas emocionales
 * @returns {Number} Índice entre 0 (muy estable) y 1 (muy variable)
 */
export const calculateEmotionalVariabilityIndex = (captures) => {
  if (captures.length < 2) return 0;

  // Contar transiciones entre emociones diferentes
  let transitions = 0;
  for (let i = 1; i < captures.length; i++) {
    if (captures[i].emotion !== captures[i - 1].emotion) {
      transitions++;
    }
  }

  // Normalizar por número de capturas
  const maxPossibleTransitions = captures.length - 1;
  return transitions / maxPossibleTransitions;
};

/**
 * Calcula la consistencia temporal de expresiones
 * Mide qué tan consistentes son las expresiones a lo largo del tiempo
 * @param {Array} captures - Array de capturas emocionales ordenadas por timestamp
 * @returns {Number} Índice entre 0 (inconsistente) y 1 (muy consistente)
 */
export const calculateTemporalConsistency = (captures) => {
  if (captures.length < 2) return 1;

  // Agrupar por ventanas de tiempo (ej: cada 30 segundos)
  const windowSize = 30000; // 30 segundos en ms
  const windows = {};
  
  captures.forEach((capture) => {
    const window = Math.floor(
      (new Date(capture.timestamp) - new Date(captures[0].timestamp)) / windowSize
    );
    if (!windows[window]) {
      windows[window] = [];
    }
    windows[window].push(capture.emotion);
  });

  // Calcular consistencia dentro de cada ventana
  let totalConsistency = 0;
  let windowCount = 0;

  Object.values(windows).forEach((emotions) => {
    if (emotions.length > 1) {
      // Calcular entropía (diversidad de emociones)
      const emotionCounts = {};
      emotions.forEach((emotion) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });

      // Entropía de Shannon
      let entropy = 0;
      const total = emotions.length;
      Object.values(emotionCounts).forEach((count) => {
        const p = count / total;
        entropy -= p * Math.log2(p);
      });

      // Normalizar (max entropy = log2(num_emotions))
      const maxEntropy = Math.log2(Object.keys(emotionCounts).length);
      const consistency = 1 - (entropy / maxEntropy);
      totalConsistency += consistency;
      windowCount++;
    }
  });

  return windowCount > 0 ? totalConsistency / windowCount : 1;
};

/**
 * Calcula probabilidades promedio por emoción
 * @param {Array} captures - Array de capturas con emotionProbabilities
 * @returns {Map} Mapa de emoción -> probabilidad promedio
 */
export const calculateAverageEmotionProbabilities = (captures) => {
  const emotionSums = {};
  const emotionCounts = {};

  captures.forEach((capture) => {
    if (capture.emotionProbabilities && capture.emotionProbabilities.size > 0) {
      capture.emotionProbabilities.forEach((prob, emotion) => {
        emotionSums[emotion] = (emotionSums[emotion] || 0) + prob;
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    } else {
      // Si no hay probabilidades, usar la emoción detectada como 1.0
      emotionSums[capture.emotion] = (emotionSums[capture.emotion] || 0) + capture.confidence / 100;
      emotionCounts[capture.emotion] = (emotionCounts[capture.emotion] || 0) + 1;
    }
  });

  const averages = new Map();
  Object.keys(emotionSums).forEach((emotion) => {
    averages.set(emotion, emotionSums[emotion] / emotionCounts[emotion]);
  });

  return averages;
};

/**
 * Calcula transiciones emocionales
 * @param {Array} captures - Array de capturas ordenadas por timestamp
 * @returns {Map} Mapa de "emotion1->emotion2" -> frecuencia
 */
export const calculateEmotionTransitions = (captures) => {
  const transitions = new Map();

  for (let i = 1; i < captures.length; i++) {
    const from = captures[i - 1].emotion;
    const to = captures[i].emotion;
    const key = `${from}->${to}`;
    transitions.set(key, (transitions.get(key) || 0) + 1);
  }

  return transitions;
};

/**
 * Calcula índice de estrés basado en emociones negativas
 * @param {Array} captures - Array de capturas
 * @returns {Number} Índice entre 0 (sin estrés) y 1 (muy estresado)
 */
export const calculateStressIndex = (captures) => {
  if (captures.length === 0) return 0;

  const stressEmotions = ['angry', 'fearful', 'sad'];
  let stressCount = 0;
  let totalConfidence = 0;

  captures.forEach((capture) => {
    if (stressEmotions.includes(capture.emotion)) {
      stressCount++;
      totalConfidence += capture.confidence;
    }
  });

  // Ponderar por frecuencia y confianza
  const frequencyWeight = stressCount / captures.length;
  const confidenceWeight = totalConfidence / (stressCount * 100 || 1);

  return (frequencyWeight * 0.6 + confidenceWeight * 0.4);
};

/**
 * Calcula índice de ansiedad
 * @param {Array} captures - Array de capturas
 * @returns {Number} Índice entre 0 (sin ansiedad) y 1 (muy ansioso)
 */
export const calculateAnxietyIndex = (captures) => {
  if (captures.length === 0) return 0;

  const anxietyEmotions = ['fearful', 'surprised'];
  let anxietyCount = 0;
  let totalConfidence = 0;

  captures.forEach((capture) => {
    if (anxietyEmotions.includes(capture.emotion)) {
      anxietyCount++;
      totalConfidence += capture.confidence;
    }
  });

  const frequencyWeight = anxietyCount / captures.length;
  const confidenceWeight = totalConfidence / (anxietyCount * 100 || 1);

  return (frequencyWeight * 0.6 + confidenceWeight * 0.4);
};

/**
 * Calcula variabilidad temporal (cambios por segundo)
 * @param {Array} captures - Array de capturas ordenadas por timestamp
 * @returns {Number} Cambios emocionales por segundo
 */
export const calculateTemporalVariability = (captures) => {
  if (captures.length < 2) return 0;

  const startTime = new Date(captures[0].timestamp);
  const endTime = new Date(captures[captures.length - 1].timestamp);
  const durationSeconds = (endTime - startTime) / 1000;

  if (durationSeconds === 0) return 0;

  let changes = 0;
  for (let i = 1; i < captures.length; i++) {
    if (captures[i].emotion !== captures[i - 1].emotion) {
      changes++;
    }
  }

  return changes / durationSeconds;
};

/**
 * Calcula todas las variables derivadas para un conjunto de capturas
 * @param {Array} captures - Array de capturas emocionales
 * @returns {Object} Objeto con todas las variables derivadas
 */
export const calculateAllDerivedVariables = (captures) => {
  if (!captures || captures.length === 0) {
    return {
      emotionalVariabilityIndex: 0,
      temporalConsistency: 1,
      averageEmotionProbabilities: new Map(),
      emotionTransitions: new Map(),
      stressIndex: 0,
      anxietyIndex: 0,
      temporalVariability: 0,
    };
  }

  // Ordenar por timestamp
  const sortedCaptures = [...captures].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return {
    emotionalVariabilityIndex: calculateEmotionalVariabilityIndex(sortedCaptures),
    temporalConsistency: calculateTemporalConsistency(sortedCaptures),
    averageEmotionProbabilities: calculateAverageEmotionProbabilities(sortedCaptures),
    emotionTransitions: calculateEmotionTransitions(sortedCaptures),
    stressIndex: calculateStressIndex(sortedCaptures),
    anxietyIndex: calculateAnxietyIndex(sortedCaptures),
    temporalVariability: calculateTemporalVariability(sortedCaptures),
  };
};

/**
 * Convierte Map a objeto para JSON
 * @param {Map} map - Mapa a convertir
 * @returns {Object} Objeto plano
 */
export const mapToObject = (map) => {
  const obj = {};
  if (map) {
    map.forEach((value, key) => {
      obj[key] = value;
    });
  }
  return obj;
};

