import numpy as np

def calculate_emotional_interference(emotion_dist, volatility):
    """
    Calcula el nivel de interferencia emocional estimada.
    """
    negative_ratio = (
        emotion_dist.get('angry', 0) +
        emotion_dist.get('fear', 0) +
        emotion_dist.get('sad', 0) +
        emotion_dist.get('disgust', 0)
    )

    if negative_ratio >= 0.50 or volatility >= 0.40:
        return "alta"
    elif negative_ratio >= 0.25 or volatility >= 0.20:
        return "moderada"
    else:
        return "baja"

def calculate_reliability(moca_score, emotional_interference, emotion_volatility):
    """
    Evalúa la confiabilidad del resultado MoCA (Escala 16).
    Leve: 13-16 | Moderado: 7-12 | Grave: 0-6
    """
    if emotional_interference == "alta" and emotion_volatility >= 0.35:
        return "baja"
    elif emotional_interference == "moderada" or (moca_score <= 12 and emotion_volatility >= 0.25):
        return "media"
    else:
        return "alta"

def calculate_cog_emotional_coherence(moca_score, dominant_emotion, negative_ratio):
    """
    Evalúa si el patrón emocional es coherente con el nivel de rendimiento cognitivo.
    Leve: 13-16 | Moderado: 7-12 | Grave: 0-6
    """
    if moca_score <= 6 and negative_ratio >= 0.35:
        return "alta"  # deterioro grave con emociones negativas: coherente
    elif moca_score >= 13 and negative_ratio >= 0.50:
        return "baja"  # deterioro leve con muchas emociones negativas: incoherente
    elif moca_score <= 12 and dominant_emotion in ['sad', 'fear', 'angry']:
        return "alta"
    else:
        return "media"

def calculate_composite_indices(inputs):
    """
    Calcula índices compuestos (ICEN, IVE, IRV, ICM).
    """
    emotions = inputs.get('emotions', {})
    dist = emotions.get('distribution', {})
    
    # ICEN - Índice de Carga Emocional Negativa (Incluye Disgusto)
    icen = (dist.get('angry', 0) + dist.get('fear', 0) + 
            dist.get('sad', 0) + dist.get('disgust', 0)) * 100
    
    # IVE - Índice de Volatilidad Emocional
    ive = emotions.get('volatility', 0)
    
    # IRV - Índice de Rendimiento Visuoespacial
    cube = inputs.get('cube', {})
    clock = inputs.get('clock', {})
    irv = (cube.get('score', 0) * 0.33) + (clock.get('score', 0) / 3 * 0.67)
    
    # ICM - Índice de Coherencia Multimodal
    moca_normalized = inputs.get('moca', {}).get('total_score', 0) / 16
    icen_normalized = icen / 100
    expected_emotion = 1 - moca_normalized
    discrepancy = abs(expected_emotion - icen_normalized)
    icm = round(1 - discrepancy, 2)
    
    return {
        "ICEN": round(icen, 1),
        "IVE": round(ive, 2),
        "IRV": round(irv, 2),
        "ICM": icm
    }

def generate_insights(inputs, interference, reliability, coherence):
    """
    Genera una lista de observaciones automáticas.
    """
    insights = []
    moca = inputs.get('moca', {})
    domains = moca.get('domain_scores', {})
    clock = inputs.get('clock', {})
    cube = inputs.get('cube', {})
    history = inputs.get('history', {})

    if clock.get('detail', {}).get('agujas') == 0 and domains.get('visuoespacial', 0) <= 1:
        insights.append(
            "Consistencia visuoespacial: El modelo de reloj detectó falla en agujas, "
            "alineada con bajo puntaje en dominio visuoespacial."
        )

    if interference == "alta" and domains.get('atencion', 0) <= 2:
        insights.append(
            "La alta interferencia emocional detectada podría explicar el bajo rendimiento "
            "en tareas de atención y concentración."
        )

    if history.get('score_trend') == "deterioro":
        insights.append(
            "Tendencia de deterioro progresivo detectada en evaluaciones históricas. "
            "Se recomienda seguimiento clínico prioritario."
        )

    if cube.get('score') == 0 and clock.get('score', 0) <= 1:
        insights.append(
            "Ambas tareas visuoespaciales muestran rendimiento bajo. "
            "Posible afectación significativa de habilidades de construcción y planificación."
        )

    # Alertas por dominancia de emociones negativas
    dom_em = inputs.get('emotions', {}).get('dominant_emotion')
    if dom_em in ['angry', 'fear', 'sad'] and moca.get('total_score', 0) <= 12:
        insights.append(
            f"Presencia dominante de {dom_em} durante la prueba, coherente con el nivel de deterioro detectado."
        )

    return insights

def generate_synthesis(inputs, interference, reliability, coherence):
    """
    Genera la síntesis narrativa final basada en plantillas.
    """
    moca_score = inputs.get('moca', {}).get('total_score', 0)
    deterioro = inputs.get('moca', {}).get('deterioro_label', 'no especificado')
    
    emotions = inputs.get('emotions', {})
    dist = emotions.get('distribution', {})
    
    # Normalizar dist para que las claves sean todas minúsculas
    dist = {k.lower(): v for k, v in dist.items()}
    
    neutral = round(dist.get('neutral', 0) * 100)
    important_neg = []
    for em in ['sad', 'fear', 'angry', 'disgust']:
        if dist.get(em, 0) > 0.15:
            important_neg.append(f"{em} ({round(dist[em]*100)}%)")
    
    if dist.get('surprise', 0) > 0.15:
        surprise_text = f" y sorpresa ({round(dist['surprise']*100)}%)"
    else:
        surprise_text = ""
    
    neg_text = " y presencia de " + ", ".join(important_neg) if important_neg else ""
    neg_text += surprise_text
    
    synthesis = (
        f"El paciente obtuvo un puntaje MoCA de {moca_score}/16, categorizado como {deterioro}. "
        f"Durante la evaluación predominó el estado neutral ({neutral}%){neg_text}, lo que genera "
        f"una interferencia emocional {interference} en el rendimiento cognitivo. "
    )
    
    if inputs.get('cube', {}).get('score') == 0 or inputs.get('clock', {}).get('score', 0) <= 1:
        synthesis += "Se observan dificultades marcadas en tareas visuoespaciales, "
    
    if inputs.get('history', {}).get('score_trend') == "deterioro":
        synthesis += "el patrón es coherente con la evolución histórica de deterioro progresivo detectada. "
    
    synthesis += "Se recomienda complementar con evaluación neuropsicológica especializada."
    
    return synthesis

def run_multimodal_analysis(inputs):
    """
    Función principal que orquesta el análisis multimodal (Camino A).
    """
    emotions = inputs.get('emotions', {})
    dist = emotions.get('distribution', {})
    volatility = emotions.get('volatility', 0)
    moca_score = inputs.get('moca', {}).get('total_score', 0)
    dom_em = emotions.get('dominant_emotion')
    
    neg_ratio = sum([dist.get(e, 0) for e in ['angry', 'fear', 'sad', 'disgust']])
    
    # Cálculos Core
    interference = calculate_emotional_interference(dist, volatility)
    reliability = calculate_reliability(moca_score, interference, volatility)
    coherence = calculate_cog_emotional_coherence(moca_score, dom_em, neg_ratio)
    
    # Índices e Insights
    indices = calculate_composite_indices(inputs)
    insights = generate_insights(inputs, interference, reliability, coherence)
    synthesis = generate_synthesis(inputs, interference, reliability, coherence)
    
    # Flags
    flags = []
    if interference == "alta": flags.append("HIGH_EMOTIONAL_INTERFERENCE")
    if reliability == "baja": flags.append("LOW_RESULT_RELIABILITY")
    if inputs.get('cube', {}).get('score') == 0 and inputs.get('clock', {}).get('score', 0) <= 1:
        flags.append("VISUOSPATIAL_DUAL_FAILURE")
    if inputs.get('history', {}).get('score_trend') == "deterioro":
        flags.append("SCORE_DECLINE_TREND")

    return {
        "emotional_interference": interference,
        "result_reliability": reliability,
        "cog_emotional_coherence": coherence,
        "composite_indices": indices,
        "auto_insights": insights,
        "alert_flags": flags,
        "multimodal_synthesis": synthesis
    }
