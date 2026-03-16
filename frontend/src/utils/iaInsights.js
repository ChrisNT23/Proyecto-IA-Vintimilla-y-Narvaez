// src/utils/iaInsights.js

/**
 * Genera hallazgos de IA basados en los resultados de la prueba MoCA y datos de emociones.
 * @param {Object} mocaRecord Registro de MoCA (mocaSelfRecord)
 * @param {Array} history Historial de evaluaciones del paciente
 * @returns {Array} Lista de hallazgos [{ title, description, type }]
 */
export const generateIAInsights = (mocaRecord, history = []) => {
    const findings = [];

    if (!mocaRecord) return findings;

    // 1. Hallazgos Visuoespaciales
    const consolidated = Array.isArray(mocaRecord.consolidatedResults) ? mocaRecord.consolidatedResults : [];
    const visuoResult = consolidated.find(r => r.module === 'visuoespacial');
    if (visuoResult && visuoResult.score < visuoResult.maxScore) {
        findings.push({
            title: "Error visoespacial detectado",
            description: "Se observan distorsiones significativas en la representación de profundidad y posicionamiento temporal en las pruebas de dibujo.",
            type: "danger"
        });
    }

    // 2. Hallazgos Emocionales (si hay datos de emociones)
    if (mocaRecord.emotionData?.derivedVariables) {
        const { stressIndex, anxietyIndex, emotionalVariabilityIndex } = mocaRecord.emotionData.derivedVariables;
        
        if (stressIndex > 0.6 || emotionalVariabilityIndex > 0.7) {
            findings.push({
                title: "Alta confusión emocional",
                description: "El análisis prosódico y facial durante la sesión indica niveles elevados de frustración al completar tareas complejas.",
                type: "warning"
            });
        }
    }

    // 3. Tendencias Longitudinales (Comparación con historial)
    if (history.length > 1) {
        const sortedHistory = [...history].sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        const previousEval = sortedHistory[1]; // La anterior a la actual
        
        if (previousEval && mocaRecord.totalScore < previousEval.totalScore) {
            const decline = ((previousEval.totalScore - mocaRecord.totalScore) / previousEval.totalScore) * 100;
            if (decline >= 5) {
                findings.push({
                    title: "Posible deterioro cognitivo leve",
                    description: `La tendencia del MoCA muestra una declinación del ${decline.toFixed(0)}% en comparación con la evaluación anterior.`,
                    type: "warning"
                });
            }
        }
    }

    // Si no hay hallazgos negativos, añadir uno positivo
    if (findings.length === 0) {
        findings.push({
            title: "Estado cognitivo estable",
            description: "No se han detectado anomalías significativas en el procesamiento visuoespacial ni alteraciones emocionales fuera de los rangos normales.",
            type: "info"
        });
    }

    return findings;
};

/**
 * Calcula el riesgo de deterioro basado en el score actual y la tendencia.
 * @param {number} currentScore 
 * @param {Array} history 
 */
export const calculateDeteriorationRisk = (currentScore, history = []) => {
    let baseRisk = 0;
    
    // Riesgo base por puntaje
    if (currentScore >= 26) baseRisk = 15;
    else if (currentScore >= 18) baseRisk = 45;
    else baseRisk = 75;

    // Ajuste por tendencia
    if (history.length > 1) {
        const sortedHistory = [...history].sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        const prev = sortedHistory[1];
        if (prev && currentScore < prev.totalScore) {
            baseRisk += 10;
        } else if (prev && currentScore > prev.totalScore) {
            baseRisk -= 5;
        }
    }

    return Math.min(Math.max(baseRisk, 5), 95); // Mantener entre 5% y 95%
};
