import { MOCA_SUBTESTS_CONFIG } from '../config/mocaSubtestsConfig';

/**
 * Builds a standardized MoCA result object for a specific subtest.
 * 
 * @param {string} subtestName - The name of the subtest (e.g., "Alternancia Conceptual", "Cubo")
 * @param {number} rawScore - The raw score obtained in the activity
 * @returns {object} Standardized result object
 */
export const buildMocaResult = (subtestName, rawScore) => {
  const config = MOCA_SUBTESTS_CONFIG[subtestName];

  if (!config) {
    console.warn(`[buildMocaResult] subtestName "${subtestName}" no encontrado en la configuración. Usando valores por defecto.`);
    return {
      module: "Desconocido",
      subtest: subtestName,
      score: isNaN(Number(rawScore)) ? 0 : Number(rawScore),
      maxScore: 1
    };
  }

  // Validaciones globales
  let score = isNaN(Number(rawScore)) ? 0 : Number(rawScore);
  if (score < 0) score = 0;
  if (score > config.maxScore) score = config.maxScore;

  console.log(`[buildMocaResult] subtest: ${subtestName}, score: ${score}`);

  return {
    module: config.module,
    subtest: subtestName,
    score: score,
    maxScore: config.maxScore
  };
};

