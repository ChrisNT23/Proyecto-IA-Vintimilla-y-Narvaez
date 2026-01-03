import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  FaComments, 
  FaBrain, 
  FaBars, 
  FaSignOutAlt, 
  FaCogs, 
  FaUsers, 
  FaQuestionCircle,
  FaChevronDown,
  FaRegChartBar,
  FaUserCircle
} from "react-icons/fa";
import logo from "../assets/clinicamora.png";
import { useSelector, useDispatch } from "react-redux";
import { useLogoutMutation } from "../slices/usersApiSlice";
import { logout } from "../slices/authSlice";
import { useGetPatientsQuery } from "../slices/patientApiSlice";
import '../assets/styles/Header.css';

const Header = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
    setIsDropdownOpen(false);
  };

  return (
    <header className="saas-header">
      <div className="header-container">
        {/* Logo */}
        <div 
          className="header-logo" 
          onClick={() => navigateTo('/', 'home')}
        >
          <img src={logo} alt="Logo" className="logo-image" />
        </div>

        {/* Navegación Desktop */}
        <nav className="header-nav">
          {userInfo && userInfo.isAdmin === false && (
            <>
              <button 
                className="nav-link-ghost"
                onClick={() => navigateTo('/api/treatments/activities', 'actividades')}
              >
                <FaBrain className="nav-icon" />
                <span>Actividades</span>
              </button>
              <button 
                className="nav-link-ghost"
                onClick={() => navigateTo(`/moca/patient/${myPatientId}`, 'moca')}
                disabled={!myPatientId}
              >
                <FaBrain className="nav-icon" />
                <span>MoCA</span>
              </button>
            </>
          )}
          {userInfo && userInfo.isAdmin && (
            <>
              <button 
                className="nav-link-ghost"
                onClick={() => navigateTo('/profile', 'profile')}
              >
                <FaUserCircle className="nav-icon" />
                <span>Perfil Público</span>
              </button>
              
              <button 
                className="nav-link-ghost"
                onClick={() => navigateTo('/reports', 'reports')}
              >
                <FaRegChartBar className="nav-icon" />
                <span>Reportes</span>
              </button>
              
              <button 
                className="nav-link-ghost"
                onClick={() => navigateTo('/mocaPanel', 'moca')}
              >
                <FaBrain className="nav-icon" />
                <span>MoCA</span>
              </button>
            </>
          )}
        </nav>

        {/* Acciones del Header */}
        <div className="header-actions">
          {/* Botón Chat - Ghost Style */}
          <button 
            className="btn-ghost"
            onClick={() => navigateTo('/chat', 'chat')}
          >
            <FaComments className="btn-icon" />
            <span>Chat</span>
          </button>

          {/* Usuario autenticado */}
          {userInfo ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button 
                className="user-menu-trigger"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="user-avatar">
                  {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name">{userInfo.name || 'Usuario'}</span>
                <FaChevronDown className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="user-dropdown">
                  {userInfo.isAdmin && (
                    <>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigateTo('/admin/help', 'help')}
                      >
                        <FaQuestionCircle className="dropdown-icon" />
                        <span>Ayuda</span>
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigateTo('/admin/configuration', 'config')}
                      >
                        <FaCogs className="dropdown-icon" />
                        <span>Configuración</span>
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => navigateTo('/admin/userlist', 'users')}
                      >
                        <FaUsers className="dropdown-icon" />
                        <span>Usuarios</span>
                      </button>
                    </>
                  )}
                  {userInfo.isAdmin === false && (
                    <button 
                      className="dropdown-item"
                      onClick={() => navigateTo('/profile', 'profile')}
                    >
                      <FaUsers className="dropdown-icon" />
                      <span>Perfil de usuario</span>
                    </button>
                  )}
                  <div className="dropdown-divider"></div>
                  <button 
                    className="dropdown-item logout"
                    onClick={logoutHandler}
                  >
                    <FaSignOutAlt className="dropdown-icon" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Botón Iniciar Sesión - CTA Pill */
            <button 
              className="btn-cta"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </button>
          )}

          {/* Botón menú móvil (solo admin) */}
          {userInfo && userInfo.isAdmin && (
            <button 
              className="menu-toggle-btn"
              onClick={handleMenuToggle}
              aria-label="Toggle menu"
            >
              <FaBars />
            </button>
          )}
        </div>
      </div>

      {/* Menú lateral solo para administradores */}
      {userInfo && userInfo.isAdmin && (
        <>
          <div 
            className={`sidebar-overlay ${isMenuOpen ? 'active' : ''}`}
            onClick={handleMenuToggle}
          ></div>
          <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3 className="sidebar-title">Menú</h3>
              <button className="sidebar-close" onClick={handleMenuToggle}>×</button>
            </div>
            <nav className="sidebar-menu">
              <button 
                className={selectedOption === 'profile' ? 'active' : ''} 
                onClick={() => navigateTo('/profile', 'profile')}
              >
                <FaUsers className="sidebar-icon" />
                <span>Perfil Público</span>
              </button>
              <button 
                className={selectedOption === 'config' ? 'active' : ''} 
                onClick={() => navigateTo('/admin/configuration', 'config')}
              >
                <FaCogs className="sidebar-icon" />
                <span>Configuración</span>
              </button>
              <button 
                className={selectedOption === 'reports' ? 'active' : ''} 
                onClick={() => navigateTo('/reports', 'reports')}
              >
                <FaCogs className="sidebar-icon" />
                <span>Reportes</span>
              </button>
              <button 
                className={selectedOption === 'activities' ? 'active' : ''} 
                onClick={() => navigateTo('/activities', 'activities')}
              >
                <FaBrain className="sidebar-icon" />
                <span>Actividades</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
