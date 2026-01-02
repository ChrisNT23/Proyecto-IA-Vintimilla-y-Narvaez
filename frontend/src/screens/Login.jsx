import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "../slices/usersApiSlice.js";
import { setCredentials } from "../slices/authSlice.js";
import { toast } from "react-toastify";
import * as faceapi from "face-api.js";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isFaceLogin, setIsFaceLogin] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [faceRecognitionStatus, setFaceRecognitionStatus] = useState("");
  const [storedDescriptor, setStoredDescriptor] = useState(null);
  const [matchPercentage, setMatchPercentage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get("redirect") || "/";

  // Hide navbar on login page
  useEffect(() => {
    document.body.classList.add("no-navbar");
    return () => document.body.classList.remove("no-navbar");
  }, []);

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
      stopVideo();
    }
  }, [userInfo, redirect, navigate]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      console.log("Modelos de face-api.js cargados");
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (showVideo && storedDescriptor) {
      startVideo();
      detectFace();
    }
    return () => {
      stopVideo();
    };
  }, [showVideo]); // eslint-disable-line react-hooks/exhaustive-deps

  const startVideo = async () => {
    try {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        videoRef.current.srcObject = stream;
        setIsDetecting(true);
      }
    } catch (err) {
      console.error("Error al acceder a la cámara: ", err);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    setIsDetecting(false);
  };

  const handleFaceLogin = async () => {
    if (!email) {
      toast.error("Por favor, ingresa tu email primero");
      return;
    }
    try {
      const { data } = await axios.post("/api/users/facedata", { email });
      if (!data.faceData || data.faceData.length === 0) {
        toast.error("No se encontraron datos faciales para este usuario");
        return;
      }
      const descriptor = new Float32Array(data.faceData);
      setStoredDescriptor(descriptor);
      setIsFaceLogin(true);
      setShowVideo(true);
    } catch (error) {
      console.error("Error al obtener datos faciales:", error);
      toast.error(
        error.response?.data?.message || "Error al obtener datos faciales"
      );
    }
  };

  const handleNormalLogin = () => {
    setIsFaceLogin(false);
    setShowVideo(false);
    setFaceRecognitionStatus("");
    setMatchPercentage(null);
    stopVideo();
  };

  const handleDetectAgain = () => {
    setIsDetecting(true);
    setFaceRecognitionStatus("");
    setMatchPercentage(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    detectFace();
  };

  const detectFace = async () => {
    if (
      videoRef.current &&
      canvasRef.current &&
      storedDescriptor &&
      isDetecting
    ) {
      try {
        const options = new faceapi.TinyFaceDetectorOptions();
        const result = await faceapi
          .detectSingleFace(videoRef.current, options)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (result) {
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight,
          };
          canvasRef.current.width = displaySize.width;
          canvasRef.current.height = displaySize.height;
          faceapi.matchDimensions(canvasRef.current, displaySize);

          const resizedResult = faceapi.resizeResults(result, displaySize);
          faceapi.draw.drawDetections(canvasRef.current, resizedResult);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedResult);

          const descriptor = result.descriptor;
          const distance = faceapi.euclideanDistance(
            storedDescriptor,
            descriptor
          );
          const percentage = Math.max(0, 1 - distance / 0.6) * 100;
          setMatchPercentage(percentage.toFixed(2));

          if (distance < 0.6) {
            setFaceRecognitionStatus("¡Cara reconocida exitosamente!");
            setIsDetecting(false);
            try {
              const res = await login({
                email,
                faceData: Array.from(descriptor),
              }).unwrap();
              dispatch(setCredentials({ ...res }));
              navigate(redirect);
              stopVideo();
            } catch (err) {
              console.error("Error al iniciar sesión:", err);
              setFaceRecognitionStatus("Error al iniciar sesión");
            }
          } else {
            setFaceRecognitionStatus(
              "Cara no reconocida. Intentando nuevamente..."
            );
          }
        } else {
          setFaceRecognitionStatus(
            "No se detectó ninguna cara. Por favor, colócate frente a la cámara."
          );
        }

        if (isDetecting) {
          animationFrameId.current = requestAnimationFrame(detectFace);
        }
      } catch (error) {
        console.error("Error en detectFace:", error);
        setFaceRecognitionStatus("Error en la detección facial");
        setIsDetecting(false);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener("play", () => {
        detectFace();
      });
    }
  }, [videoRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitHandler = async (e) => {
    e.preventDefault();
    if (isFaceLogin) {
      if (!email) {
        toast.error("Por favor, ingresa tu email");
        return;
      }
    } else {
      try {
        const res = await login({ email, password }).unwrap();
        dispatch(setCredentials({ ...res }));
        navigate(redirect);
        stopVideo();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <style>
        {`
          .no-navbar header {
              display: none !important;
          }
          .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
          }
        `}
      </style>
      <div className="flex min-h-screen w-screen m-0 p-0 flex-col lg:flex-row overflow-auto font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased">
        {/* Left Panel: Dark Form Area */}
        <div className="flex w-full flex-col justify-center bg-panel-dark px-6 py-4 sm:px-8 sm:py-6 lg:w-[40%] lg:px-12 xl:px-20 lg:min-h-screen shadow-2xl z-10 relative overflow-y-auto">
          {/* Logo Section */}
          <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">neurology</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Consultorio Mora</h2>
          </div>

          {/* Header Text */}
          <div className="mb-4 sm:mb-6">
            <h1 className="mb-1 sm:mb-2 text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white">
              Bienvenido
            </h1>
            <p className="text-sm sm:text-base text-slate-400">
              Accede a tu portal de salud mental y neurológica.
            </p>
          </div>

          {/* Login Form */}
          <form className="flex flex-col gap-3 sm:gap-4" onSubmit={submitHandler}>
            {/* Email Field */}
            <div className="group relative">
              <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="email">Correo electrónico</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500">mail</span>
                <input
                  className="w-full rounded-lg border-none bg-slate-800 py-3 sm:py-3.5 pl-12 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                  id="email"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group relative">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-slate-300" htmlFor="password">Contraseña</label>
                <a className="text-sm font-medium text-primary hover:text-blue-400 transition-colors cursor-pointer" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500">lock</span>
                <input
                  className="w-full rounded-lg border-none bg-slate-800 py-3 sm:py-3.5 pl-12 pr-12 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            {/* Primary Action */}
            <button
              className="mt-1 sm:mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-blue-600 hover:shadow-primary/50 active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Cargando..." : "Iniciar Sesión"}</span>
              {!isLoading && <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_forward</span>}
            </button>

            {/* Divider */}
            <div className="relative my-2 sm:my-3 flex items-center py-1">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="mx-3 sm:mx-4 flex-shrink-0 text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">O continúa con</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            {/* Face ID / Biometric Button */}
            <button
              className="flex w-full items-center justify-center gap-2 sm:gap-3 rounded-lg border border-slate-700 bg-transparent py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white hover:border-slate-600"
              type="button"
              onClick={handleFaceLogin}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">face</span>
              <span>Reconocimiento Facial</span>
            </button>
          </form>

          {/* Footer Meta */}
          <div className="mt-3 sm:mt-4 mb-2 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              ¿Nuevo usuario?{" "}
              <Link
                className="font-semibold text-primary hover:text-blue-400 hover:underline transition-colors"
                to={redirect ? `/register?redirect=${redirect}` : "/register"}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Right Panel: Visual / Animation (60% width, hidden on mobile) */}
        <div className="hidden lg:relative lg:flex lg:w-[60%] lg:items-center lg:justify-center overflow-hidden bg-slate-900">
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-overlay"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVTMq2R-ck0pH7AbE1nFTkHUBEv0JO7alGdBrPW3MAtURQrxAUinVa8IpJ9DAJgFh052F7aa8GAYNgfgwb5RuNUp-3Yy5iJZgVZT16fapVBxItAY2-Kyk_C5ZYE0YmB3c4WsV8OOKHipnB65SNxQipXbZzh-txYtlyHA8uC0WBJn8Wy8ix0JjuebiatojthF_SZKM93CQwclKoxMU1AUYF1UI_tkCzVoao23-G_qXxlNcQA-ujgZOAIlOCJAhQ5m--3YUFJzJLftM')" }}
          ></div>
          {/* Gradient Overlay for smoothness */}
          <div className="absolute inset-0 bg-gradient-to-br from-panel-dark via-transparent to-primary/40"></div>

          {/* Content overlay on image */}
          <div className="relative z-10 max-w-lg p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                <span className="material-symbols-outlined text-4xl text-white">self_improvement</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-md">Claridad Mental y Bienestar</h3>
            <p className="text-lg text-blue-100 font-light leading-relaxed drop-shadow-sm">
              Nuestra plataforma combina la neurociencia avanzada con el cuidado humano para ofrecerte el mejor tratamiento posible.
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-10 right-10 flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-white/50"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white/30"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-white/10"></div>
          </div>
        </div>
      </div>

      {/* Video Overlay Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative flex w-full max-w-lg flex-col items-center rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Reconocimiento Facial</h3>

            <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-video mb-4">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover"></video>
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
            </div>

            {faceRecognitionStatus && (
              <div className={`mb-4 w-full rounded p-3 text-center text-sm font-medium ${faceRecognitionStatus.includes("exitosamente")
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                {faceRecognitionStatus}
              </div>
            )}

            {matchPercentage && (
              <div className="mb-4 text-sm font-semibold text-primary">
                Coincidencia: {matchPercentage}%
              </div>
            )}

            <div className="flex w-full gap-3">
              <button
                onClick={handleDetectAgain}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                Reintentar
              </button>
              <button
                onClick={handleNormalLogin}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;