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

    const modules = mocaRecord.modulesData || {};
    const consolidated = Array.isArray(mocaRecord.consolidatedResults) ? mocaRecord.consolidatedResults : [];

    // --- 1. Hallazgos Visuoespaciales Granulares ---
    const visuo = modules.Visuoespacial || {};
    
    // Hallazgo general original
    if (visuo.total !== undefined && visuo.total < 5) {
        findings.push({
            title: "Error visoespacial detectado",
            description: "Se observan distorsiones significativas en la representación de profundidad y posicionamiento temporal en las pruebas de dibujo.",
            type: "danger"
        });
    }

    if (visuo.alternancia === 0) {
        findings.push({
            title: "Déficit en flexibilidad cognitiva",
            description: "Dificultad marcada en la alternancia conceptual (1-A-2-B), lo que sugiere compromiso en funciones ejecutivas frontales.",
            type: "danger"
        });
    }
    if (visuo.cube === 0) {
        findings.push({
            title: "Falla constructiva (Cubo)",
            description: "La incapacidad para replicar el cubo tridimensional indica posibles dificultades en el procesamiento visual-constructivo.",
            type: "warning"
        });
    }
    if (visuo.clock !== undefined && visuo.clock < 3) {
        findings.push({
            title: "Desorganización espacial (Reloj)",
            description: `Puntaje de ${visuo.clock}/3. Se detectan omisiones o errores de posicionamiento en la prueba del dibujo del reloj.`,
            type: "warning"
        });
    }

    // --- 2. Análisis de Dominios Cognitivos ---
    const scores = {
        visuo: { score: modules.Visuoespacial?.total || 0, max: 5 },
        ident: { score: modules.Identificación?.total || 0, max: 3 },
        atencion: { score: modules.Atencion?.total || 0, max: 6 },
        lenguaje: { score: modules.Lenguaje?.total || 0, max: 3 }
    };

    const findWeakest = () => {
        let weakest = null;
        let minRatio = 1;
        for (const [key, data] of Object.entries(scores)) {
            const ratio = data.score / data.max;
            if (ratio < minRatio) {
                minRatio = ratio;
                weakest = key;
            }
        }
        return weakest;
    };

    const weakestDomain = findWeakest();
    if (weakestDomain && scores[weakestDomain].score / scores[weakestDomain].max < 0.6) {
        const domainNames = { visuo: 'Visuoespacial', ident: 'Identificación', atencion: 'Atención', lenguaje: 'Lenguaje' };
        findings.push({
            title: `Dominio de ${domainNames[weakestDomain]} afectado`,
            description: `Se observa un rendimiento significativamente menor en el área de ${domainNames[weakestDomain].toLowerCase()} comparado con otros dominios.`,
            type: "danger"
        });
    }

    // --- 3. Correlación Emocional y Bloqueos ---
    if (mocaRecord.emotionData?.derivedVariables) {
        const { stressIndex, emotionalVariabilityIndex } = mocaRecord.emotionData.derivedVariables;
        const captures = mocaRecord.emotionData.captures || [];
        
        // Buscar si hubo picos de tristeza/enojo/miedo en módulos específicos
        const negativeCaptures = captures.filter(c => ['sad', 'angry', 'fear', 'disgust'].includes(c.emotion.toLowerCase()));
        
        if (negativeCaptures.length >= 3) {
            const problematicModule = negativeCaptures[0].currentModule;
            findings.push({
                title: "Bloqueo por frustración",
                description: `Se detectó una alta carga emocional negativa predominante durante el módulo de ${problematicModule}, sugiriendo estrés ante la tarea.`,
                type: "warning"
            });
        }

        if (emotionalVariabilityIndex > 0.6) {
            findings.push({
                title: "Inestabilidad emocional reactiva",
                description: "Alta fluctuación de estados emocionales durante la prueba, lo que puede interferir con el rendimiento cognitivo real.",
                type: "warning"
            });
        }

        // --- Nuevos Hallazgos Emocionales Profundos ---
        const probs = mocaRecord.emotionData.derivedVariables.averageEmotionProbabilities || {};
        
        // 1. Aplanamiento Afectivo (Exceso de Neutralidad)
        if (probs.neutral > 0.85) {
            findings.push({
                title: "Posible aplanamiento afectivo",
                description: "Se observa una reactividad emocional extremadamente baja (predominio neutral >85%), lo cual es un indicador clínico relevante.",
                type: "warning"
            });
        }

        // 2. Patrones de Ansiedad (Presencia de Miedo/Miedo en módulos difíciles)
        const fearCaptures = captures.filter(c => c.emotion.toLowerCase() === 'fear');
        if (fearCaptures.length >= 2) {
            findings.push({
                title: "Patrón de ansiedad detectado",
                description: "Presencia recurrente de expresiones compatibles con miedo/inseguridad ante las tareas evaluadas.",
                type: "warning"
            });
        }

        // 3. Engagement Positivo (Felicidad tras completar)
        const happyCaptures = captures.filter(c => c.emotion.toLowerCase() === 'happy');
        if (happyCaptures.length >= 1) {
            findings.push({
                title: "Respuesta positiva al logro",
                description: "El paciente muestra micro-expresiones de satisfacción al completar satisfactoriamente las actividades del test.",
                type: "info"
            });
        }
    }

    // --- 4. Detección de Fatiga Cognitiva ---
    // Si falla en Atención o Lenguaje (módulos finales) pero estuvo bien al inicio
    if (scores.lenguaje.score === 0 && scores.visuo.score / scores.visuo.max > 0.8) {
        findings.push({
            title: "Fatiga cognitiva detectada",
            description: "El rendimiento decae notablemente hacia las fases finales de la evaluación, indicando posible agotamiento de reserva cognitiva.",
            type: "info"
        });
    }

    // --- 5. Análisis Histórico y Longitudinal ---
    if (history.length > 1) {
        const sortedHistory = [...history].sort((a, b) => new Date(b.testDate) - new Date(a.testDate));
        const latestOnes = sortedHistory.slice(1, 4); // Las 3 anteriores
        
        // A. Persistencia de errores (ej: Reloj)
        const clockFailures = latestOnes.filter(h => h.modulesData?.Visuoespacial?.clock < 3).length;
        if (visuo.clock < 3 && clockFailures >= 2) {
            findings.push({
                title: "Déficit visuo-constructivo persistente",
                description: "Se confirma un patrón recurrente de error en la organización espacial del reloj en las últimas evaluaciones.",
                type: "danger"
            });
        }

        // B. Tendencia de Mejora
        const avgPrevScore = latestOnes.reduce((acc, curr) => acc + curr.totalScore, 0) / latestOnes.length;
        if (mocaRecord.totalScore > avgPrevScore + 2) {
            findings.push({
                title: "Evolución cognitiva positiva",
                description: "El puntaje actual muestra una mejora significativa respecto al promedio de las evaluaciones anteriores.",
                type: "info"
            });
        }

        // C. Evolución Emocional vs Promedio Histórico
        const histVariability = latestOnes.reduce((acc, curr) => acc + (curr.emotionData?.derivedVariables?.emotionalVariabilityIndex || 0), 0) / latestOnes.length;
        if (mocaRecord.emotionData?.derivedVariables?.emotionalVariabilityIndex > histVariability + 0.3) {
            findings.push({
                title: "Incremento de reactividad emocional",
                description: "Se observa un aumento inusual en la fluctuación emocional comparado con el perfil histórico del paciente.",
                type: "warning"
            });
        }

        // D. Alerta de decremento progresivo (Refinada)
        const previousEval = sortedHistory[1];
        if (previousEval && mocaRecord.totalScore < previousEval.totalScore) {
            const diff = previousEval.totalScore - mocaRecord.totalScore;
            if (diff >= 2) {
                findings.push({
                    title: "Alerta de decremento progresivo",
                    description: `Pérdida de ${diff} puntos respecto a la evaluación anterior del ${new Date(previousEval.testDate).toLocaleDateString()}.`,
                    type: "danger"
                });
            }
        }
    }

    // Si no hay hallazgos críticos/advertencias, añadir uno positivo
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
