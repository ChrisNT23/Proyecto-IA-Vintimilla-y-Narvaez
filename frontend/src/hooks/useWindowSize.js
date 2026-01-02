// src/hooks/useWindowSize.js

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para obtener el tamaño de la ventana.
 * Retorna un objeto con las propiedades 'width' y 'height'.
 */
const useWindowSize = () => {
  // Verifica si el entorno es el cliente (navegador)
  const isClient = typeof window === 'object';

  // Función para obtener el tamaño actual de la ventana
  const getSize = () => ({
    width: isClient ? window.innerWidth : undefined,
    height: isClient ? window.innerHeight : undefined,
  });

  // Estado para almacenar el tamaño de la ventana
  const [windowSize, setWindowSize] = useState(getSize);

  useEffect(() => {
    if (!isClient) return;

    // Handler para actualizar el tamaño de la ventana
    const handleResize = () => {
      setWindowSize(getSize());
    };

    // Añadir el listener de resize
    window.addEventListener('resize', handleResize);

    // Llamar al handler de inmediato para capturar el tamaño inicial
    handleResize();

    // Remover el listener al desmontar el componente
    return () => window.removeEventListener('resize', handleResize);
  }, [isClient]); // Dependencia en isClient

  return windowSize;
};

export default useWindowSize;
