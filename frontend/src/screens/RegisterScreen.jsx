import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterMutation } from "../slices/usersApiSlice.js";
import { setCredentials } from "../slices/authSlice.js";
import { toast } from "react-toastify";
import { Modal, Button } from "react-bootstrap";

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cardId, setCardId] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get("redirect") || "/";

  const [showTerms, setShowTerms] = useState(false);
  const handleOpenTerms = () => setShowTerms(true);
  const handleCloseTerms = () => setShowTerms(false);

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [userInfo, redirect, navigate]);

  // Ocultar el navbar en la pantalla de registro
  useEffect(() => {
    document.body.classList.add("no-navbar");
    return () => document.body.classList.remove("no-navbar");
  }, []);

  const validateCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) {
      return false;
    }
    const verificador = parseInt(cedula[9], 10);
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 0 || provincia > 24) return false;
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula[i], 10) * coeficientes[i];
      if (digito >= 10) digito -= 9;
      suma += digito;
    }
    const modulo = suma % 10;
    const resultadoFinal = modulo === 0 ? 0 : 10 - modulo;
    return resultadoFinal === verificador;
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (
      !name &&
      !lastName &&
      !cardId &&
      !email &&
      !phoneNumber &&
      !password &&
      !confirmPassword
    ) {
      toast.error("No se ha ingresado ningún campo.");
      return;
    }

    if (!name) {
      toast.error("El campo 'Nombre' es obligatorio.");
      return;
    }
    if (!lastName) {
      toast.error("El campo 'Apellido' es obligatorio.");
      return;
    }
    if (!cardId) {
      toast.error("El campo 'Cédula' es obligatorio.");
      return;
    }
    if (!email) {
      toast.error("El campo 'Email' es obligatorio.");
      return;
    }
    if (!phoneNumber) {
      toast.error("El campo 'Teléfono' es obligatorio.");
      return;
    }
    if (!password) {
      toast.error("El campo 'Contraseña' es obligatorio.");
      return;
    }
    if (!confirmPassword) {
      toast.error("El campo 'Confirmar Contraseña' es obligatorio.");
      return;
    }

    if (!validateCedula(cardId)) {
      toast.error(
        "Cédula inválida. Asegúrate de que tenga 10 dígitos y sea coherente."
      );
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await register({
        name,
        lastName,
        cardId,
        email,
        phoneNumber,
        password,
        role: "patient",
        isAdmin: false,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
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
          .no-navbar, .no-navbar body, .no-navbar #root, .no-navbar main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
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
      <div className="flex min-h-screen w-screen m-0 p-0 flex-col justify-center items-center bg-panel-dark font-display antialiased overflow-auto">
        <div className="w-full max-w-4xl flex-col justify-center bg-panel-dark px-6 py-6 z-10 relative rounded-2xl mx-4">
       

          {/* Header Text */}
          <div className="mb-4 text-center">
            <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white">
              Crea una cuenta
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
              Completa tus datos para registrarte en el portal y gestionar tus consultas de salud mental.
            </p>
          </div>

          {/* Registration Form */}
          <form className="flex flex-col gap-3" onSubmit={submitHandler}>
            {/* Grid for Name and Lastname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="nombre">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">person</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="nombre"
                    placeholder="Juan"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Lastname Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="apellido">
                  Apellido <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">person</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="apellido"
                    placeholder="Pérez"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="telefono">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">call</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="telefono"
                    placeholder="+593 999 999 999"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Cedula Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="cedula">
                  Cédula <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">badge</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="cedula"
                    placeholder="1234567890"
                    type="text"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="group relative">
              <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="email">
                Correo electrónico <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">mail</span>
                <input
                  className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-4 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                  id="email"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Password Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="password">
                  Contraseña <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">lock</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-10 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="group relative">
                <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-slate-300" htmlFor="confirm_password">
                  Confirmar <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-slate-500 text-[20px]">lock_reset</span>
                  <input
                    className="w-full rounded-lg border-none bg-slate-800 py-2.5 pl-11 pr-10 text-sm sm:text-base text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-slate-900/50 transition-all outline-none"
                    id="confirm_password"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <input
                className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-offset-slate-900 focus:ring-primary size-4"
                id="terms"
                type="checkbox"
                required
              />
              <label className="text-xs sm:text-sm text-slate-400 select-none" htmlFor="terms">
                Acepto los{" "}
                <button
                  type="button"
                  className="text-primary hover:text-blue-400 hover:underline font-medium"
                  onClick={handleOpenTerms}
                >
                  términos y condiciones
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="mt-2 flex w-full max-w-sm mx-auto items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-blue-600 hover:shadow-primary/50 active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Registrando..." : "Registrarse"}</span>
              {!isLoading && <span className="material-symbols-outlined text-[18px] sm:text-[20px]">how_to_reg</span>}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-4 text-center border-t border-slate-700/50 pt-4">
            <p className="text-xs sm:text-sm text-slate-400">
              ¿Ya tienes una cuenta?{" "}
              <Link
                className="font-semibold text-primary hover:text-blue-400 hover:underline transition-colors"
                to={redirect ? `/login?redirect=${redirect}` : "/login"}
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Terms Modal */}
        <Modal show={showTerms} onHide={handleCloseTerms} centered>
          <Modal.Header closeButton>
            <Modal.Title>Términos y Condiciones</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>1. Protección de Datos Personales</strong><br />
              Cumplimos con la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador. Tus datos serán tratados con estricta confidencialidad y usados solo para el seguimiento médico y mejoras del servicio.<br /><br />

              <strong>2. Recolección y Uso de Datos</strong><br />
              Recopilamos información como nombre, cédula, correo, teléfono y datos de salud. Estos serán utilizados exclusivamente para tu registro, monitoreo médico, y generación de informes.<br /><br />

              <strong>3. Seguridad</strong><br />
              Tus datos están protegidos mediante encriptación, autenticación segura y acceso restringido al personal autorizado.<br /><br />

              <strong>4. Derechos del Usuario</strong><br />
              Puedes acceder, rectificar, eliminar tus datos o revocar tu consentimiento enviando una solicitud a soporte@consultoriomora.com.<br /><br />

              <strong>5. Responsabilidades del Usuario</strong><br />
              Debes proporcionar información veraz, mantener la confidencialidad de tus credenciales y usar la plataforma solo para fines legítimos.<br /><br />
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseTerms}
              className="mb-2"
              style={{ margin: "0 auto" }}
            >
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default RegisterScreen;