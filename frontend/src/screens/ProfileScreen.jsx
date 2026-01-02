import { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../components/Loader";
import { useProfileMutation } from "../slices/usersApiSlice";
import { setCredentials } from "../slices/authSlice";
import * as faceapi from "face-api.js";
import {
  FaUser,
  FaUserCircle,
  FaIdCard,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCamera,
} from "react-icons/fa";

// Importamos el archivo CSS
import "../assets/styles/ProfileScreen.css";

const ProfileScreen = () => {
  // Estados para los campos
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cardId, setCardId] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Redux
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  // Mutations
  const [updateProfile, { isLoading: loadingUpdateProfile }] =
    useProfileMutation();

  // Efecto para setear datos de usuario en el form
  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setLastName(userInfo.lastName);
      setCardId(userInfo.cardId);
      setEmail(userInfo.email);
      setPhoneNumber(userInfo.phoneNumber);
    }
  }, [userInfo]);

  // Cargar modelos y pedir acceso a la cámara
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    };

    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          toast.error("No se pudo acceder a la cámara.");
        });
    };

    loadModels().then(startVideo);
  }, []);

  // Captura de rostro
  const captureFace = async () => {
    if (videoRef.current) {
      const detections = await faceapi
        .detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const descriptor = detections.descriptor;
        const descriptorArray = Array.from(descriptor);
        setFaceDescriptor(descriptorArray);
        toast.success("¡Rostro capturado con éxito!");
      } else {
        toast.error("No se detectó ningún rostro. Inténtalo de nuevo.");
      }
    }
  };

  // Validar cédula
  const validateCedula = (cedula) => {
    if (!/^\d{10}$/.test(cedula)) {
      return false;
    }
    const verificador = parseInt(cedula[9], 10);
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 0 || provincia > 24) {
      return false;
    }
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula[i], 10) * coeficientes[i];
      if (digito >= 10) {
        digito -= 9;
      }
      suma += digito;
    }
    const modulo = suma % 10;
    const resultadoFinal = modulo === 0 ? 0 : 10 - modulo;
    return resultadoFinal === verificador;
  };

  // Validar correo
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Submit del formulario
  const submitHandler = async (e) => {
    e.preventDefault();

    // Validar cédula
    if (!validateCedula(cardId)) {
      toast.error(
        "Cédula inválida. Asegúrate de que tenga 10 dígitos y sea coherente."
      );
      return;
    }

    // Validar email
    if (!validateEmail(email)) {
      toast.error("Correo electrónico inválido. Formato incorrecto.");
      return;
    }

    // Validar contraseñas
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    // Actualizar perfil
    try {
      const res = await updateProfile({
        _id: userInfo._id,
        name,
        lastName,
        cardId,
        email,
        phoneNumber,
        password,
        faceDescriptor,
      }).unwrap();

      dispatch(setCredentials(res));
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <Container className="profile-screen-container">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="profile-card">
            <Card.Header className="profile-card-header">
              <FaUserCircle size={24} className="me-2" />
              <h4 className="mb-0">Perfil de Usuario</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={submitHandler}>
                <Row>
                  <Col md={6}>
                    {/* Nombre */}
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label>
                        <FaUser className="me-1" /> Nombre
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingresa tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Form.Group>

                    {/* Apellido */}
                    <Form.Group controlId="lastName" className="mb-3">
                      <Form.Label>
                        <FaUser className="me-1" /> Apellido
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingresa tu apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </Form.Group>

                    {/* Cédula (read only) */}
                    <Form.Group controlId="cardId" className="mb-3">
                      <Form.Label>
                        <FaIdCard className="me-1" /> Cédula
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={cardId}
                        readOnly
                        className="profile-readonly"
                      />
                      <Form.Text className="text-muted">
                        Este campo no se puede editar
                      </Form.Text>
                    </Form.Group>

                    {/* Email (read only) */}
                    <Form.Group controlId="email" className="mb-3">
                      <Form.Label>
                        <FaEnvelope className="me-1" /> Correo electrónico
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        readOnly
                        className="profile-readonly"
                      />
                      <Form.Text className="text-muted">
                        Este campo no se puede editar
                      </Form.Text>
                    </Form.Group>

                    {/* Teléfono */}
                    <Form.Group controlId="phoneNumber" className="mb-3">
                      <Form.Label>
                        <FaPhone className="me-1" /> Número de teléfono
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej. 0999999999"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    {/* Contraseña */}
                    <Form.Group controlId="password" className="mb-3">
                      <Form.Label>
                        <FaLock className="me-1" /> Contraseña
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Form.Group>

                    {/* Confirmar Contraseña */}
                    <Form.Group controlId="confirmPassword" className="mb-3">
                      <Form.Label>
                        <FaLock className="me-1" /> Confirmar Contraseña
                      </Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirma tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Form.Group>

                    {/* Sección de cámara y captura de rostro */}
                    <div className="mb-3">
                      <Form.Label className="d-block">
                        <FaCamera className="me-1" /> Captura de Rostro
                      </Form.Label>
                      <div className="profile-camera-section">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="profile-video"
                        />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                        <Button
                          type="button"
                          variant="outline-secondary"
                          className="mt-2"
                          onClick={captureFace}
                        >
                          Capturar Rostro
                        </Button>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Botón de actualizar */}
                <div className="d-flex justify-content-end">
                  <Button type="submit" variant="primary">
                    {loadingUpdateProfile ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Actualizando...
                      </>
                    ) : (
                      "Actualizar"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Loader si lo necesitas */}
      {loadingUpdateProfile && <Loader />}
    </Container>
  );
};

export default ProfileScreen;
