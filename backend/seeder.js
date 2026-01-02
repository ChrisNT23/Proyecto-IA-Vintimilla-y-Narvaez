import mongoose from 'mongoose';
import connectDB from './config/db.js';
import colors from 'colors';
import dotenv from 'dotenv';
import Activity from './models/activityModel.js';
import { activities } from './data/users.js'; // Importa 'activities' desde el archivo existente

dotenv.config();

connectDB();

const importData = async () => {
    try {
        // 1. Eliminar las actividades existentes
        await Activity.deleteMany();

        // 2. Insertar actividades
        await Activity.insertMany(activities);

        console.log('Actividades importadas exitosamente!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error.message}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        // Eliminar todas las actividades
        await Activity.deleteMany();

        console.log('Actividades eliminadas'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error.message}`.red.inverse);
        process.exit(1);
    }
};

// Determinar si destruir o importar los datos
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
