import { MOCA_SUBTESTS_CONFIG } from '../config/mocaSubtestsConfig';

/**
 * Consolidates an array of standardized MoCA results into a single summary JSON.
 * 
 * @param {string} userId - The unique identifier of the user/patient
 * @param {Array<object>} results - Array of standardized result objects built by buildMocaResult
 * @returns {object} Consolidated summary
 */
export const buildMocaSummary = (userId, results) => {
  if (!userId) {
    console.warn("[buildMocaSummary] No se proporcionó userId. Se establecerá como 'desconocido'.");
  }

  const validResults = Array.isArray(results) ? results : [];

  let totalScore = 0;
  validResults.forEach(res => {
    if (res && typeof res.score === 'number') {
      totalScore += res.score;
    }
  });

  // Calcular el puntaje máximo siempre en base a la configuración oficial (22)
  const totalMaxScore = Object.values(MOCA_SUBTESTS_CONFIG).reduce(
    (acc, test) => acc + (test.maxScore || 0), 0
  );

  return {
    userId: userId || "desconocido",
    results: validResults,
    totalScore,
    totalMaxScore
  };
};
