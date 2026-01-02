// src/components/ActivitiesList.jsx

import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';

const ActivitiesList = ({ activities }) => {
  console.log('Actividades Completadas:', activities); // Para depuración

  return (
    <Card style={{ marginBottom: '20px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Actividades Completadas
        </Typography>
        {(!activities || activities.length === 0) ? (
          <Typography variant="body1">No hay actividades completadas.</Typography>
        ) : (
          <List>
            {activities.map((completedActivity) => {
              // Verificar si 'completedActivity' y 'completedActivity.activity' están definidos
              if (!completedActivity || !completedActivity.activity) {
                console.warn('Actividad incompleta:', completedActivity);
                return (
                  <ListItem key={completedActivity._id || Math.random()} divider>
                    <ListItemText
                      primary="Actividad Desconocida"
                      secondary={`Paciente: ${completedActivity?.patient?.idPaciente || 'N/A'} - ${completedActivity?.patient?.user?.name || 'N/A'} ${completedActivity?.patient?.user?.lastName || 'N/A'} | Score: ${completedActivity?.scoreObtained || 'N/A'} | Progreso: ${completedActivity?.progress || 'N/A'}`}
                    />
                  </ListItem>
                );
              }

              // Verificar si 'completedActivity.activity.name' está definido
              if (!completedActivity.activity.name) {
                console.warn('Nombre de actividad faltante:', completedActivity.activity);
                return (
                  <ListItem key={completedActivity._id || Math.random()} divider>
                    <ListItemText
                      primary="Nombre de Actividad Desconocido"
                      secondary={`Paciente: ${completedActivity.patient.idPaciente} - ${completedActivity.patient.user.name} ${completedActivity.patient.user.lastName} | Score: ${completedActivity.scoreObtained} | Progreso: ${completedActivity.progress}`}
                    />
                  </ListItem>
                );
              }

              return (
                <ListItem key={completedActivity._id || `${completedActivity.activity._id}-${completedActivity.dateCompleted}`} divider>
                  <ListItemText
                    primary={completedActivity.activity.name}
                    secondary={`Paciente: ${completedActivity.patient.idPaciente} - ${completedActivity.patient.user.name} ${completedActivity.patient.user.lastName} | Score: ${completedActivity.scoreObtained} | Progreso: ${completedActivity.progress}`}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivitiesList;
