// src/components/MedicationsList.jsx

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';

const MedicationsList = ({ medications, onMedicationTaken }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Medicamentos
        </Typography>
        {medications.length === 0 ? (
          <Typography variant="body1">No hay medicamentos asignados.</Typography>
        ) : (
          <List>
            {medications.map((med) => (
              <ListItem key={med._id} divider>
                <ListItemText
                  primary={med.name || 'Sin Nombre'}
                  secondary={`Dosis: ${med.dosage || 'N/A'} | Frecuencia: ${med.frequency || 'N/A'} | Inicio: ${med.startDate ? new Date(med.startDate).toLocaleDateString() : 'N/A'}${med.endDate ? ` | Fin: ${new Date(med.endDate).toLocaleDateString()}` : ''}`}
                />
                {!med.takenToday ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onMedicationTaken(med._id, med.treatmentId)} // Pasar treatmentId por medicamento
                  >
                    Tomado
                  </Button>
                ) : (
                  <Typography variant="body2" color="green">
                    Tomado hoy
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationsList;
