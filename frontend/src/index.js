// frontend/src/index.jsx

// Importaciones de React y ReactDOM
import React from "react";
import ReactDOM from "react-dom/client";

// Importaciones de React Router
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

// Importaciones de Redux
import { Provider, useSelector } from "react-redux";
import store from "./store.js";

// Importaciones de Middleware de Rutas
import PrivateRoute from "./components/PrivateRoutes.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

// Importaciones de Estilos
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/styles/bootstrap.custom.css";
import "./assets/styles/index.css";

// Importaciones de Componentes Principales
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// Importaciones de Contextos
import { MocaProvider } from "./context/MocaContext";

// Importaciones de Pantallas (Screens)
import HomeScreenPaciente from "./screens/HomeScreenPaciente";
import HomeScreenMedico from "./screens/Médico/HomeScreenMedico.jsx";
import Login from "./screens/Login";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import ChatScreen from "./screens/ChatScreen.jsx";
import UserListScreen from "./screens/Médico/UserListScreen.jsx";
import UserEditScreen from "./screens/Médico/UserEditScreen.jsx";
import ReportsScreen from "./screens/Reports/ReportsScreen.jsx";
import MoodScreen from "./screens/Reports/MoodScreen.jsx";
import ActivitiesReportScreen from "./screens/Reports/activitiesReportScreen.jsx";
import PatientsProgress from "./screens/Reports/PatientsProgress.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
import PatientSelectionScreen from "./screens/Reports/PatientSelectionScreen.jsx";
import DashboardIAScreen from "./screens/Reports/DashboardIAScreen.jsx";
import HistorialMocaScreen from "./screens/Reports/HistorialMocaScreen.jsx";
import MocaScreen from "./screens/Reports/MocaScreen.jsx";
import MocaPanel from "./screens/MocaScreen.jsx";
import MocaRegisterResults from "./screens/MocaRegisterResults.jsx";
import MocaHistory from "./screens/MocaHistory.jsx";
import MocaStart from "./screens/MocaStart.jsx";
import MocaAssign from "./screens/MocaAssign";
import MocaStartSelf from "./screens/MocaStartSelf.jsx";
import Visuoespacial from "./screens/MOCAmodules/Visuoespacial.jsx";
import Identificacion from "./screens/MOCAmodules/Identificacion.jsx";
import Memoria from "./screens/MOCAmodules/Memoria.jsx";
import Atencion from "./screens/MOCAmodules/Atencion.jsx";
import Lenguaje from "./screens/MOCAmodules/Lenguaje.jsx";

import MocaFinalScreen from "./screens/MOCAmodules/MocaFinalScreen.jsx";
import Configuration from "./screens/Médico/Configuration.jsx";
import UsersActivities from "./screens/Médico/UsersActivities.jsx";
import UserActivity from "./screens/Médico/UserActivity.jsx";
import TreatmentsScreen from "./screens/Médico/TreatmentsScreen.jsx";
import TreatmentsListScreen from "./screens/Médico/TreatmentsListScreen.jsx";
import EditTreatmentScreen from "./screens/Médico/treatmentsEditScreen.jsx";
import ActivityPlay from "./components/ActivityPlay.jsx";
import MedicalHistory from "./screens/Médico/medicalHistory.jsx";
import MedicalHistoryReport from "./screens/Reports/MedicalHistoryReport.jsx";
import Assignedactivities from "./screens/Médico/Assignedactivities.jsx";
import HelpScreen from "./screens/HelpScreen.jsx";

// Función para seleccionar la pantalla de inicio basada en el rol del usuario
const HomeScreenSelector = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && userInfo.isAdmin ? (
    <HomeScreenMedico />
  ) : (
    <HomeScreenPaciente />
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* Ruta de Inicio */}
      <Route index path="/" element={<HomeScreenSelector />} />

      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Rutas Privadas para Pacientes */}
      <Route path="" element={<PrivateRoute />}>
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
        <Route path="/estado-animo" element={<MoodScreen />} />
        <Route path="/admin/help" element={<HelpScreen />} />

        
        <Route
          path="/reports/activities"
          element={<ActivitiesReportScreen />}
        />
        <Route path="/progreso-paciente" element={<PatientsProgress />} />
        <Route
          path="/patients/:id/historial-medico"
          element={<MedicalHistory />}
        />
        <Route path="/historial-medico" element={<MedicalHistoryReport />} />

        <Route
          path="/treatments/:treatmentId/activities/play/:activityId"
          element={<ActivityPlay />}
        />
      </Route>

      {/* Rutas Admin/Médico */}
      <Route path="" element={<AdminRoute />}>
        <Route path="/admin/userlist" element={<UserListScreen />} />
        <Route path="/admin/user/:id/edit" element={<UserEditScreen />} />
        <Route path="/admin/treatments" element={<TreatmentsScreen />} />
        <Route
          path="/admin/treatments/:treatmentId/edit"
          element={<EditTreatmentScreen />}
        />
        <Route
          path="/admin/:patientId/UserActivity"
          element={<TreatmentsListScreen />}
        />
        <Route path="/admin/UsersActivities" element={<UsersActivities />} />
        <Route
          path="/admin/actividades-asignadas"
          element={<Assignedactivities />}
        />
        <Route
          path="/admin/:patientId/UserActivity"
          element={<UserActivity />}
        />
        <Route path="/admin/configuration" element={<Configuration />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/reports/dashboard-ia/selection" element={<PatientSelectionScreen />} />
        <Route path="/reports/dashboard-ia/:patientId" element={<DashboardIAScreen />} />
        <Route path="/reports/dashboard-ia/eval/:id" element={<DashboardIAScreen />} />
        <Route path="/reports/historial-moca" element={<HistorialMocaScreen />} />
      </Route>

      {/* Rutas de Evaluación MoCA */}
      <Route path="/moca" element={<MocaScreen />} />
      <Route path="/mocaPanel" element={<MocaPanel />} />
      <Route path="/moca/register/:id" element={<MocaRegisterResults />} />
      <Route path="/moca/history/:id" element={<MocaHistory />} />
      <Route path="/moca/start/:id" element={<MocaStart />} />
      <Route path="/moca/assign" element={<MocaAssign />} />
      <Route path="/moca/patient/:id" element={<MocaStartSelf />} />
      <Route path="/moca/start-self" element={<MocaStartSelf />} />
      <Route path="/moca/visuoespacial" element={<Visuoespacial />} />
      <Route path="/moca/identificacion" element={<Identificacion />} />
      <Route path="/moca/memoria" element={<Memoria />} />
      <Route path="/moca/atencion" element={<Atencion />} />
      <Route path="/moca/lenguaje" element={<Lenguaje />} />

      <Route path="/moca-final/:id" element={<MocaFinalScreen />} />
    </Route>
  )
);

// Manejador global de errores para silenciar errores de extensiones de Chrome
window.addEventListener('error', (event) => {
  const errorMessage = event.message || '';
  // Silenciar errores conocidos de extensiones de Chrome
  if (
    errorMessage.includes('message channel') ||
    errorMessage.includes('listener') ||
    errorMessage.includes('channel closed') ||
    errorMessage.includes('Extension context invalidated')
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Manejador de promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason) || '';
  // Silenciar errores conocidos de extensiones de Chrome
  if (
    errorMessage.includes('message channel') ||
    errorMessage.includes('listener') ||
    errorMessage.includes('channel closed') ||
    errorMessage.includes('Extension context invalidated')
  ) {
    event.preventDefault();
    return false;
  }
});

// Renderizado de la Aplicación
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <MocaProvider>
        <RouterProvider router={router} />
      </MocaProvider>
    </Provider>
  </React.StrictMode>
);

// Medición de Rendimiento (Opcional)
reportWebVitals();