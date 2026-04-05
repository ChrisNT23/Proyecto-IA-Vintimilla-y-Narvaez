// Frontend: Envío de imagen al backend (Visuoespacial.jsx)
const handleEvaluate = async () => {
  setIsLoading(true);
  const canvas = canvasRef.current;
  try {
    const imageData = canvas.toDataURL("image/png");
    const response = await fetch('/api/evaluate-cube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    const data = await response.json();
    setCubeScore(Number(data.score));
    // ... manejo de alertas
  } catch (err) {
    setError("Error al evaluar el cubo.");
  } finally {
    setIsLoading(false);
  }
};
