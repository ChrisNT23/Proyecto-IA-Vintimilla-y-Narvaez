import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { 
  FaUser, 
  FaComments, 
  FaBrain, 
  FaBars, 
  FaBell, 
  FaTachometerAlt, 
  FaRegChartBar, 
  FaSignOutAlt, 
  FaCogs, 
  FaUsers, 
  FaQuestionCircle 
} from "react-icons/fa";
import logo from "../assets/logoHigeasinfondo.png";
import { LinkContainer } from "react-router-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../slices/usersApiSlice";
import { logout } from "../slices/authSlice";
import { useGetPatientsQuery } from "../slices/patientApiSlice"; // <--- Importa tu hook
import '../assets/styles/Header.css';

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // 1. Obtener pacientes
  const { data: patients = [], isLoading, isError } = useGetPatientsQuery();

  // 2. Buscar al paciente que corresponde al usuario logueado
  let myPatientId = null;
  if (!isLoading && !isError && userInfo && patients.length > 0) {
    const foundPatient = patients.find(
      (p) => p.user && p.user._id === userInfo._id
    );
    if (foundPatient) {
      myPatientId = foundPatient._id;
    }
  }

  // Maneja el cierre de sesión
  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Función para navegar
  const navigateTo = (path, option) => {
    setSelectedOption(option);
    if (userInfo) {
      navigate(path);
    } else {
      navigate("/login");
    }
    setIsMenuOpen(false);
  };

  return (
    <header>
      {/* Navbar principal */}
      <Navbar variant="dark" expand="lg" collapseOnSelect>
        <Container>
          {/* Botón para abrir el menú lateral (solo si es admin) */}
          {userInfo && userInfo.isAdmin && (
            <button className="menu-toggle-btn" onClick={handleMenuToggle}>
              <FaBars size={24} />
            </button>
          )}

          {/* Marca y logo con clase personalizada */}
          <Navbar.Brand 
            className="d-flex align-items-center clickable-logo" 
            onClick={() => navigateTo('/')}
          >
            <img src={logo} alt="Seguimiento" height="70" />
          </Navbar.Brand>

          {/* Menú de navegación principal */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" className="ms-auto" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {/* Enlace a Actividades */}
              {userInfo && userInfo.isAdmin==false && (
              <Nav.Link onClick={() => navigateTo('/api/treatments/activities', 'actividades')}>
                <FaBrain /> Actividades
              </Nav.Link>
              )}
              {/* Enlace a MoCA para usuario normal */}
              {userInfo && userInfo.isAdmin==false && (
              <Nav.Link
                onClick={() => navigateTo(`/moca/patient/${myPatientId}`, 'moca')}
                disabled={!myPatientId} // desactiva el link si no encuentra paciente
              >
                <FaBrain /> MoCA
              </Nav.Link>
              )}

              {/* Enlace a MoCA extra para admin (si es que quieres uno distinto) */}
              {userInfo && userInfo.isAdmin && (
                <Nav.Link onClick={() => navigateTo('/mocaPanel', 'moca')}>
                  <FaBrain /> MoCA
                </Nav.Link>
              )}

              {/* Enlace al chat */}
              <Nav.Link onClick={() => navigateTo('/chat', 'chat')}>
                <FaComments /> Chat
              </Nav.Link>

              {/* Dropdown de usuario */}
              {userInfo ? (
                <NavDropdown title={userInfo.name} id="username" className="custom-dropdown">
                  {userInfo && userInfo.isAdmin && (
                    <NavDropdown.Item onClick={() => navigateTo('/admin/help', 'orderlist')}>
                      <FaQuestionCircle className="dropdown-icon" /> Ayuda
                    </NavDropdown.Item>
                  )}
                  {userInfo && userInfo.isAdmin && (
                    <NavDropdown.Item onClick={() => navigateTo('/admin/configuration', 'productlist')}>
                      <FaCogs className="dropdown-icon" /> Configuración
                    </NavDropdown.Item>
                  )}
                  {userInfo && userInfo.isAdmin && (
                    <NavDropdown.Item onClick={() => navigateTo('/admin/userlist', 'userlist')}>
                      <FaUsers className="dropdown-icon" /> Usuarios
                    </NavDropdown.Item>
                  )}
                  {/*{userInfo && userInfo.isAdmin && (
                    <NavDropdown.Item onClick={() => navigateTo('/admin/activities', 'adminActivities')}>
                      <FaBrain className="dropdown-icon" /> Actividades (Admin)
                    </NavDropdown.Item>
                  )}*/}
                  {userInfo && userInfo.isAdmin==false && (
                  <NavDropdown.Item onClick={() => navigateTo('/profile', '´profile')}>
                      <FaUsers className="dropdown-icon" /> Perfil de usuario
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item onClick={logoutHandler}>
                    <FaSignOutAlt className="dropdown-icon" /> Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
    
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link>
                    <FaUser /> Iniciar Sesión
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Menú lateral solo para administradores */}
      {userInfo && userInfo.isAdmin && (
        <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <button className="close-btn" onClick={handleMenuToggle}>×</button>
          <div className="menu-title">Menu</div>
          <nav className="sidebar-menu">
            <button 
              className={selectedOption === 'profile' ? 'active' : ''} 
              onClick={() => navigateTo('/profile', 'profile')}
            >
              <FaUser /> Perfil Público
            </button>
            <button 
              className={selectedOption === 'config' ? 'active' : ''} 
              onClick={() => navigateTo('/admin/configuration', 'config')}
            >
              <FaRegChartBar /> Configuración
            </button>
            <button 
              className={selectedOption === 'reports' ? 'active' : ''} 
              onClick={() => navigateTo('/reports', 'reports')}
            >
              <FaRegChartBar /> Reportes
            </button>
            <button 
              className={selectedOption === 'activities' ? 'active' : ''} 
              onClick={() => navigateTo('/activities', 'activities')}
            >
              <FaBrain /> Actividades
            </button>
            <button 
              className={selectedOption === 'dashboard' ? 'active' : ''} 
              onClick={() => navigateTo('/dashboard', 'dashboard')}
            >
              <FaTachometerAlt /> Dashboard
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
