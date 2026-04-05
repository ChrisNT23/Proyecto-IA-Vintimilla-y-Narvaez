import React from 'react';
import { Typography, Box, Grid, Tooltip, Chip } from '@mui/material';
import { InfoOutlined, WarningAmber, CheckCircleOutline } from '@mui/icons-material';

/**
 * Componente rediseñado para mostrar los índices y la confiabilidad multimodal.
 * Estilo "Incrustado" para mejor integración con el dashboard.
 */
const MultimodalInsightsCard = ({ data, loading }) => {
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Calculando métricas mixtas...</Box>;
  if (!data) return null;

  const {
    result_reliability,
    cog_emotional_coherence,
    composite_indices,
    alert_flags
  } = data;

  const getReliabilityColor = (rel) => {
    if (rel === 'alta') return '#10b981';
    if (rel === 'media') return '#f59e0b';
    return '#ef4444';
  };

  const IndexBox = ({ label, value, tooltip, icon: Icon, color }) => (
    <Box sx={{ 
      p: 2, 
      bgcolor: '#f8fafc', 
      borderRadius: '16px', 
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-4px)', 
        bgcolor: 'white',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
        borderColor: color || '#3b82f6'
      }
    }}>
      <Tooltip title={tooltip}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, color: color || '#3b82f6' }}>
          <Icon sx={{ fontSize: '1.2rem' }} />
        </Box>
      </Tooltip>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#64748b', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
        {value}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
        <Grid container spacing={2}>
          {/* Confiabilidad y Coherencia */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>CONFIABILIDAD</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={result_reliability?.toUpperCase()} 
                  size="small"
                  sx={{ 
                    bgcolor: getReliabilityColor(result_reliability), 
                    color: 'white', 
                    fontWeight: 800,
                    fontSize: '0.7rem'
                  }} 
                />
                {result_reliability === 'baja' ? <WarningAmber sx={{ color: '#ef4444', fontSize: '1.2rem' }} /> : <CheckCircleOutline sx={{ color: '#10b981', fontSize: '1.2rem' }} />}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>COHERENCIA</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                {cog_emotional_coherence?.toUpperCase()}
              </Typography>
            </Box>
          </Grid>

          {/* Grid de Índices */}
          <Grid item xs={12}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <IndexBox 
                  label="Carga Emocional" 
                  value={`${composite_indices?.ICEN}%`} 
                  tooltip="ICEN: Nivel de emociones negativas detectadas"
                  icon={InfoOutlined}
                  color="#6366f1"
                />
              </Grid>
              <Grid item xs={6}>
                <IndexBox 
                  label="Volatilidad" 
                  value={composite_indices?.IVE} 
                  tooltip="IVE: Grado de inestabilidad emocional"
                  icon={InfoOutlined}
                  color="#ec4899"
                />
              </Grid>
              <Grid item xs={6}>
                <IndexBox 
                  label="Rendimiento V-E" 
                  value={composite_indices?.IRV} 
                  tooltip="IRV: Score combinado de Cubo y Reloj"
                  icon={InfoOutlined}
                  color="#0284c7"
                />
              </Grid>
              <Grid item xs={6}>
                <IndexBox 
                  label="Coherencia ICM" 
                  value={composite_indices?.ICM} 
                  tooltip="ICM: Ajuste entre rendimiento y perfil emocional"
                  icon={InfoOutlined}
                  color="#10b981"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Alertas */}
          {alert_flags && alert_flags.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {alert_flags.map((flag, idx) => (
                  <Chip 
                    key={idx} 
                    label={flag.replace(/_/g, ' ')} 
                    variant="outlined"
                    sx={{ height: '20px', fontSize: '0.6rem', color: '#ef4444', borderColor: '#fee2e2', bgcolor: '#fef2f2' }} 
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
    </Box>
  );
};

export default MultimodalInsightsCard;

