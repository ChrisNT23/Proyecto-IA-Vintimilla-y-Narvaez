// src/hooks/useAuth.js
import { useSelector } from 'react-redux';
/**
 * Hook para acceder al estado de autenticación.
 * @returns {Object} - Contiene la información del usuario autenticado.
 */
const useAuth = () => {
  const userInfo = useSelector((state) => state.auth.userInfo);
  return { user: userInfo };
};

export default useAuth;
