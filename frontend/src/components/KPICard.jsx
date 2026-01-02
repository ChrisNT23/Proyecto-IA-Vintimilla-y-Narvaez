// src/components/KPICard.jsx

import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

const KPICard = ({ title, value, subtitle }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        <Typography color="textSecondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );
};

export default KPICard;
