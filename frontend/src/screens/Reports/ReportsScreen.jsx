// src/screens/Reports/ReportsScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Container,
  Box,
} from '@mui/material';
import '../../assets/styles/ReportsScreen.css';

// Importar las imágenes
import resultadosMocaImg from '../../images/Reports/resultados-moca.webp';
import progresoPacienteImg from '../../images/Reports/progreso-paciente.webp';
import estadoAnimoImg from '../../images/Reports/estado-ánimo.webp';
import dashboardIAImg from '../../images/Reports/dashboard-ia.png';
import mocaHistoryCoverImg from '../../images/Reports/moca_history_cover.jpg';

const ReportsScreen = () => {
  const navigate = useNavigate();

  const reportOptions = [
    // { title: 'Resultados MOCA', img: resultadosMocaImg, route: '/moca' },
    /*{ title: 'Progreso del Paciente', img: progresoPacienteImg, route: '/progreso-paciente' },*/
    // { title: 'Resultados de Estado de Ánimo', img: estadoAnimoImg, route: '/estado-animo' },
    { title: 'Dashboard IA', img: dashboardIAImg, route: '/reports/dashboard-ia/selection' },
    { title: 'Historial MoCA', img: mocaHistoryCoverImg, route: '/reports/historial-moca' },
    // { title: 'Dashboard', img: progresoPacienteImg, route: '/dashboard' },
  ];

  return (
    <Container maxWidth="lg" style={{ padding: '2rem 0' }}>
      {/* Título Principal */}
      <Typography variant="h4" align="center" gutterBottom>
        Seleccionar Reporte
      </Typography>

      {/* Grid de Reportes */}
      <Grid container spacing={6} justifyContent="center" sx={{ mt: 2 }}>
        {reportOptions.map((option, index) => (
          <Grid item key={index} xs={12} sm={6} md={5} lg={4}>
            <Card
              sx={{
                maxWidth: 340,
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                  '& .card-image': {
                    transform: 'scale(1.1)',
                  },
                },
                margin: '0 auto',
              }}
            >
              <CardActionArea onClick={() => navigate(option.route)}>
                {/* Box para mantener la relación de aspecto de la imagen */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '65%',
                    overflow: 'hidden',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={option.img}
                    alt={option.title}
                    className="card-image"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.6s ease',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))',
                    }}
                  />
                </Box>

                {/* Contenido de la Tarjeta */}
                <CardContent sx={{ py: 3, px: 2 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="div" 
                    align="center"
                    sx={{ 
                      fontWeight: 700, 
                      color: '#1a237e',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {option.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ReportsScreen;
