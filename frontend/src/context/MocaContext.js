import React, { createContext, useContext, useState } from "react";

const MocaContext = createContext();

export const MocaProvider = ({ children }) => {
  const [totalScore, setTotalScore] = useState(0);
  const [currentModule, setCurrentModule] = useState(0);

  const incrementScore = (points) => {
    setTotalScore((prevScore) => prevScore + points);
  };

  return (
    <MocaContext.Provider
      value={{
        totalScore,
        setTotalScore,
        incrementScore,
        currentModule,
        setCurrentModule,
      }}
    >
      {children}
    </MocaContext.Provider>
  );
};

// Hook para usar el contexto
export const useMoca = () => useContext(MocaContext);
