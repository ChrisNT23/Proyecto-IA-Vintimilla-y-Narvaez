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
import ActivitiesListScreen from "./screens/Médico/ActivitiesListScreen.jsx";
import ActivityEditScreen from "./screens/Médico/ActivityEditScreen.jsx";
import ActivitiesScreen from "./screens/ActivitiesScreen.jsx";
import ActivityScreen1 from "./screens/ActivityScreen1.jsx";
import ActivityScreen2 from "./screens/ActivityScreen2.jsx";
import ActivityScreen3 from "./screens/ActivityScreen3.jsx";
import ActivityScreen4 from "./screens/ActivityScreen4.jsx";
import ActivityScreen5 from "./screens/ActivityScreen5.jsx";
import ActivityScreen6 from "./screens/ActivityScreen6.jsx";
import ActivityScreen7 from "./screens/ActivityScreen7.jsx";
import ActivityScreen8 from "./screens/ActivityScreen8.jsx";
import ActivityScreen9 from "./screens/ActivityScreen9.jsx";
import ActivityScreen10 from "./screens/ActivityScreen10.jsx";
import ActivitiesL2Screen from "./screens/ActivitiesL2Screen.jsx";
import ActivitiesL3Screen from "./screens/ActivitiesL3Screen.jsx";
import Activity1L2Screen from "./screens/Activity1L2Screen.jsx";
import Activity2L2Screen from "./screens/Activity2L2Screen.jsx";
import Activity3L2Screen from "./screens/Activity3L2Screen.jsx";
import Activity4L2Screen from "./screens/Activity4L2Screen.jsx";
import Activity5L2Screen from "./screens/Activity5L2Screen.jsx";
import Activity6L2Screen from "./screens/Activity6L2Screen.jsx";
import Activity7L2Screen from "./screens/Activity7L2Screen.jsx";
import Activity8L2Screen from "./screens/Activity8L2Screen.jsx";
import Activity9L2Screen from "./screens/Activity9L2Screen.jsx";
import Activity1L3Screen from "./screens/Activity1L3Screen.jsx";
import Activity2L3Screen from "./screens/Activity2L3Screen.jsx";
import Activity3L3Screen from "./screens/Activity3L3Screen.jsx";
import Activity4L3Screen from "./screens/Activity4L3Screen.jsx";
import Activity5L3Screen from "./screens/Activity5L3Screen.jsx";
import Activity6L3Screen from "./screens/Activity6L3Screen.jsx";
import Activity7L3Screen from "./screens/Activity7L3Screen.jsx";
import Activity8L3Screen from "./screens/Activity8L3Screen.jsx";
import Activity9L3Screen from "./screens/Activity9L3Screen.jsx";
import ReportsScreen from "./screens/Reports/ReportsScreen.jsx";
import MoodScreen from "./screens/Reports/MoodScreen.jsx";
import ActivitiesReportScreen from "./screens/Reports/activitiesReportScreen.jsx";
import PatientsProgress from "./screens/Reports/PatientsProgress.jsx";
import DashboardScreen from "./screens/DashboardScreen.jsx";
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
import Abstraccion from "./screens/MOCAmodules/Abstraccion.jsx";
import RecuerdoDiferido from "./screens/MOCAmodules/RecuerdoDiferido.jsx";
import Orientacion from "./screens/MOCAmodules/Orientacion.jsx";
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
        <Route path="/activities" element={<ActivitiesScreen />} />
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
        <Route
          path="/activities/play/:activityId"
          element={<ActivityScreen2 />}
        />

        <Route
          path="/api/treatments/activities"
          element={<ActivitiesL2Screen />}
        />

        {/* Actividades Nivel 2 */}
        {/* 
        <Route path="/activity/level2/1" element={<Activity1L2Screen />} />
        <Route path="/activity/level2/2" element={<Activity2L2Screen />} />
        <Route path="/activity/level2/3" element={<Activity3L2Screen />} />
        <Route path="/activity/level2/4" element={<Activity4L2Screen />} />
        <Route path="/activity/level2/5" element={<Activity5L2Screen />} />
        <Route path="/activity/level2/6" element={<Activity6L2Screen />} />
        <Route path="/activity/level2/7" element={<Activity7L2Screen />} />
        <Route path="/activity/level2/8" element={<Activity8L2Screen />} />
        <Route path="/activity/level2/9" element={<Activity9L2Screen />} />
        */}

        {/* Actividades Nivel 3 */}
        <Route path="/activitiesL3" element={<ActivitiesL3Screen />} />
        <Route path="/activity/level3/1" element={<Activity1L3Screen />} />
        <Route path="/activity/level3/2" element={<Activity2L3Screen />} />
        <Route path="/activity/level3/3" element={<Activity3L3Screen />} />
        <Route path="/activity/level3/4" element={<Activity4L3Screen />} />
        <Route path="/activity/level3/5" element={<Activity5L3Screen />} />
        <Route path="/activity/level3/6" element={<Activity6L3Screen />} />
        <Route path="/activity/level3/7" element={<Activity7L3Screen />} />
        <Route path="/activity/level3/8" element={<Activity8L3Screen />} />
        <Route path="/activity/level3/9" element={<Activity9L3Screen />} />
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
        <Route path="/admin/activities" element={<ActivitiesListScreen />} />
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
        <Route
          path="/admin/activities/:id/edit"
          element={<ActivityEditScreen />}
        />
        <Route path="/dashboard" element={<DashboardScreen />} />
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
      <Route path="/moca/abstraccion" element={<Abstraccion />} />
      <Route path="/moca/recuerdo-diferido" element={<RecuerdoDiferido />} />
      <Route path="/moca/orientacion" element={<Orientacion />} />
      <Route path="/moca-final/:id" element={<MocaFinalScreen />} />
    </Route>
  )
);

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