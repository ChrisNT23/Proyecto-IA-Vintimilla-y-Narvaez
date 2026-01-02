// frontend/src/screens/Médico/UserEditScreen.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Container,
  Spinner,
  Alert,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  useUpdateUserMutation,
  useGetUserDetailsQuery,
} from "../../slices/usersApiSlice";
import { useGetDoctorsQuery } from "../../slices/doctorApiSlice";
import FormContainer from "../../components/FormContainer";
import Loader from "../../components/Loader";
import Message from "../../components/Message";

const UserEditScreen = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [doctorId, setDoctorId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const {
    data: user,
    isLoading: loadingUser,
    error: errorUser,
    refetch,
  } = useGetUserDetailsQuery(userId);

  const {
    data: doctors,
    isLoading: loadingDoctors,
    error: errorDoctors,
  } = useGetDoctorsQuery();

  const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setLastName(user.lastName || "");
      setEmail(user.email);
      setPhoneNumber(user.phoneNumber);
      setRole(user.isAdmin ? "doctor" : "patient");
      setIsActive(user.isActive);
      if (!user.isAdmin && user.doctor) {
        setDoctorId(user.doctor.toString());
      }
    }
  }, [user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateUser({
        userId,
        name,
        lastName,
        email,
        phoneNumber,
        password: password || undefined,
        role,
        doctorId: role === "patient" ? doctorId : null,
        isActive,
      }).unwrap();

      toast.success("Usuario actualizado correctamente");
      refetch();
      navigate("/admin/userlist");
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <>
      {/* Floating Back Button */}
      <Link
        to="/admin/userlist"
        className="btn btn-light position-fixed"
        style={{ bottom: '20px', right: '20px', borderRadius: '50%', padding: '15px', zIndex: 1000 }}
      >
        Volver
      </Link>

      <Container fluid className="py-4">
        <FormContainer>
          <Card className="p-4 shadow-sm">
            <h2 className="mb-4">Editar Usuario</h2>
            {(loadingUpdate || loadingUser || loadingDoctors) && (
              <div className="text-center my-3">
                <Spinner animation="border" role="status" />
              </div>
            )}
            {errorUser && (
              <Alert variant="danger">{errorUser?.data?.message || errorUser.error}</Alert>
            )}
            {errorDoctors && (
              <Alert variant="danger">{errorDoctors?.data?.message || errorDoctors.error}</Alert>
            )}
            {user && (
              <Form onSubmit={submitHandler}>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="name" className="mb-3">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingrese el nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="lastName" className="mb-3">
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingrese el apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="email" className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Ingrese el email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="phoneNumber" className="mb-3">
                      <Form.Label>Número de Teléfono</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ingrese el número de teléfono"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group controlId="password" className="mb-3">
                      <Form.Label>Contraseña</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Ingrese la contraseña (deje en blanco para mantener la actual)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="isActive" className="mb-3 d-flex align-items-center mt-4">
                      <Form.Check
                        type="checkbox"
                        label="Activo"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="ms-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group controlId="role" className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Control
                    as="select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="patient">Paciente</option>
                  </Form.Control>
                </Form.Group>

                {role === "patient" && (
                  <Form.Group controlId="doctor" className="mb-3">
                    <Form.Label>Doctor Responsable</Form.Label>
                    {loadingDoctors ? (
                      <Loader />
                    ) : errorDoctors ? (
                      <Message variant="danger">{errorDoctors?.data?.message || errorDoctors.error}</Message>
                    ) : (
                      <Form.Control
                        as="select"
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        required
                      >
                        <option value="">Seleccione un doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor._id} value={doctor._id}>
                            {doctor.user.name} - {doctor.especialidad}
                          </option>
                        ))}
                      </Form.Control>
                    )}
                  </Form.Group>
                )}

                {role === "patient" && user.doctor && (
                  <Card className="mt-4 p-3 bg-light">
                    <h5>Doctor Asignado</h5>
                    <p>
                      <strong>Nombre:</strong> {user.doctor.user.name} <br />
                      <strong>Especialidad:</strong> {user.doctor.especialidad}
                    </p>
                  </Card>
                )}

                <Button type="submit" variant="primary" className="w-100 mt-4">
                  Actualizar
                </Button>
              </Form>
            )}
          </Card>
        </FormContainer>
      </Container>
    </>
  );
};

export default UserEditScreen;
