import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { AutoAwesome, LightbulbOutlined, ErrorOutline } from '@mui/icons-material';

/**
 * Panel rediseñado para mostrar la síntesis narrativa.
 * Sin bordes redundantes para integrarse al dashboard-card.
 */
const SynthesisTextPanel = ({ data, loading }) => {
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}>Generando síntesis cognitiva...</Box>;
  if (!data) return null;

  const { auto_insights, multimodal_synthesis } = data;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AutoAwesome sx={{ color: '#6366f1', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
          Síntesis Inteligente
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ 
        lineHeight: 1.8, 
        color: '#475569', 
        fontStyle: 'italic',
        p: 2.5,
        bgcolor: '#f8fafc',
        borderRadius: '16px',
        borderLeft: '5px solid #6366f1',
        mb: 3,
        flexGrow: 1
      }}>
        "{multimodal_synthesis}"
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LightbulbOutlined sx={{ color: '#f59e0b', mr: 1, fontSize: '1.2rem' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hallazgos Clave
          </Typography>
        </Box>
        
        {auto_insights && auto_insights.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {auto_insights.map((insight, idx) => (
              <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <ErrorOutline sx={{ fontSize: '1rem', color: '#6366f1' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={insight} 
                  primaryTypographyProps={{ variant: 'body2', color: '#64748b', fontWeight: 500 }} 
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="caption" color="textSecondary">
            No se han detectado inconsistencias adicionales.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SynthesisTextPanel;
