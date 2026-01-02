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
import historialMedicoImg from '../../images/Reports/historial-medico.webp';
import resultadosMocaImg from '../../images/Reports/resultados-moca.webp';
import progresoPacienteImg from '../../images/Reports/progreso-paciente.webp';
import resultadosActividadesImg from '../../images/Reports/resultados-actviidades.webp';
import estadoAnimoImg from '../../images/Reports/estado-ánimo.webp';
import dashboardImg from '../../images/Reports/estado-ánimo.webp'; 

const ReportsScreen = () => {
  const navigate = useNavigate();

  const reportOptions = [
    { title: 'Historial Médico', img: historialMedicoImg, route: '/historial-medico' },
    { title: 'Resultados MOCA', img: resultadosMocaImg, route: '/moca' },
    /*{ title: 'Progreso del Paciente', img: progresoPacienteImg, route: '/progreso-paciente' },*/
    { title: 'Resultados de Actividades', img: resultadosActividadesImg, route: '/reports/activities' },
    { title: 'Resultados de Estado de Ánimo', img: estadoAnimoImg, route: '/estado-animo' },
    { title: 'Dashboard', img: progresoPacienteImg, route: '/dashboard' },
  ];

  return (
    <Container maxWidth="lg" style={{ padding: '2rem 0' }}>
      {/* Título Principal */}
      <Typography variant="h4" align="center" gutterBottom>
        Seleccionar Reporte
      </Typography>
      
      {/* Grid de Reportes */}
      <Grid container spacing={4} justifyContent="center">
        {reportOptions.map((option, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Card
              sx={{
                maxWidth: 300,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 6,
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
                    paddingTop: '75%',
                    overflow: 'hidden',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={option.img}
                    alt={option.title}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
                
                {/* Contenido de la Tarjeta */}
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div" align="center">
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
