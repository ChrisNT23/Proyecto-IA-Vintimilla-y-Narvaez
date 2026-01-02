import React, { useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import {
  Table,
  Button,
  ButtonGroup,
  InputGroup,
  FormControl,
  Modal,
  Tooltip,
  OverlayTrigger,
  Container,
  Row,
  Col,
  Card,
} from 'react-bootstrap';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { toast } from 'react-toastify';
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useEnableUserMutation,
} from '../../slices/usersApiSlice';

// Importar la hoja de estilos personalizada
import '../../assets/styles/UserListScreen.css';

const UserListScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: users = [], isLoading, error, refetch } = useGetUsersQuery();
  const [deleteUser, { isLoading: loadingDelete }] = useDeleteUserMutation();
  const [enableUser] = useEnableUserMutation();

  // Estado para manejar el modal de confirmación (habilitar/deshabilitar)
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // Manejo de modal
  const handleShowModal = (action, user) => {
    setModalContent({ action, user });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalContent({});
  };

  // Lógica de deshabilitar/habilitar usuarios
  const deleteHandler = async () => {
    const { user } = modalContent;
    try {
      await deleteUser(user._id);
      toast.success('Usuario deshabilitado correctamente');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Ha ocurrido un error');
    }
    handleCloseModal();
  };

  const enableUserHandler = async () => {
    const { user } = modalContent;
    try {
      await enableUser(user._id);
      toast.success('Usuario habilitado correctamente');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Ha ocurrido un error');
    }
    handleCloseModal();
  };

  // Filtrado por término de búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tooltip personalizado
  const renderTooltip = (props, text) => (
    <Tooltip id="button-tooltip" {...props}>
      {text}
    </Tooltip>
  );

  // Cuerpo del modal
  const renderModalBody = () => {
    const { action, user } = modalContent;
    if (!action || !user) return null;

    return (
      <>
        <p>
          {action === 'disable'
            ? '¿Estás seguro de que deseas deshabilitar este usuario?'
            : '¿Estás seguro de que deseas habilitar este usuario?'}
        </p>
        <p>
          <strong>{user.name}</strong> ({user.email})
        </p>
      </>
    );
  };

  return (
    <div className="user-list-wrapper">
      {/* Sección tipo "banner" */}
      <div className="banner-section">
        <h1 className="page-title">Gestión de Usuarios</h1>
        <p className="page-subtitle">
          Administra, habilita y deshabilita los usuarios de forma sencilla
        </p>
      </div>

      {/* Contenido principal */}
      <Container className="mt-4">
        {/* Barra de búsqueda */}
        <Row className="mb-4 justify-content-center">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text id="search-icon" className="search-icon">
                <FaSearch />
              </InputGroup.Text>
              <FormControl
                placeholder="Buscar usuarios por nombre o email..."
                aria-label="Buscar usuarios"
                aria-describedby="search-icon"
                value={searchTerm}
                onChange={handleSearch}
              />
            </InputGroup>
          </Col>
        </Row>

        {/* Loader si se está borrando/recargando */}
        {loadingDelete && (
          <Row>
            <Col>
              <Loader />
            </Col>
          </Row>
        )}

        {isLoading ? (
          <Row>
            <Col>
              <Loader />
            </Col>
          </Row>
        ) : error ? (
          <Row>
            <Col>
              <Message variant="danger">
                {error.message || 'Ha ocurrido un error'}
              </Message>
            </Col>
          </Row>
        ) : (
          // Card que envuelve la tabla
          <Card className="users-card">
            <Card.Header className="users-card-header">
              <h3 className="m-0">Listado de Usuarios</h3>
            </Card.Header>

            <Card.Body className="users-card-body">
              {filteredUsers.length === 0 ? (
                <Message variant="info">
                  No se encontraron usuarios con ese criterio de búsqueda.
                </Message>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="users-table align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>NOMBRE</th>
                        <th>EMAIL</th>
                        <th>ADMIN</th>
                        <th>ACTIVO</th>
                        <th>ACCIÓN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user._id}</td>
                          <td>{user.name}</td>
                          <td>
                            <a
                              href={`mailto:${user.email}`}
                              className="email-link"
                            >
                              {user.email}
                            </a>
                          </td>
                          <td>
                            {user.isAdmin ? (
                              <span className="status-badge admin-badge">
                                <FaCheck />
                              </span>
                            ) : (
                              <span className="status-badge not-admin-badge">
                                <FaTimes />
                              </span>
                            )}
                          </td>
                          <td>
                            {user.isActive ? (
                              <span className="status-badge active-badge">
                                <FaCheck />
                              </span>
                            ) : (
                              <span className="status-badge inactive-badge">
                                <FaTimes />
                              </span>
                            )}
                          </td>
                          <td>
                          <div className="action-buttons">
                            {/* Botón de Editar (icónico, redondo) */}
                            <OverlayTrigger
                              placement="top"
                              delay={{ show: 250, hide: 400 }}
                              overlay={(props) => renderTooltip(props, 'Editar Usuario')}
                            >
                              <LinkContainer to={`/admin/user/${user._id}/edit`}>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="action-btn"
                                >
                                  <FaEdit />
                                </Button>
                              </LinkContainer>
                            </OverlayTrigger>

                            {/* Botón de Habilitar/Deshabilitar (icónico, redondo) */}
                            <OverlayTrigger
                              placement="top"
                              delay={{ show: 250, hide: 400 }}
                              overlay={(props) =>
                                renderTooltip(
                                  props,
                                  user.isActive ? 'Deshabilitar Usuario' : 'Habilitar Usuario'
                                )
                              }
                            >
                              <Button
                                variant={user.isActive ? 'outline-danger' : 'outline-success'}
                                size="sm"
                                className="action-btn"
                                onClick={() =>
                                  handleShowModal(user.isActive ? 'disable' : 'enable', user)
                                }
                              >
                                {user.isActive ? <FaTrash /> : <FaCheck />}
                              </Button>
                            </OverlayTrigger>
                          </div>
                        </td>

                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Container>

      {/* Modal de Confirmación */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalContent.action === 'disable'
              ? 'Deshabilitar Usuario'
              : 'Habilitar Usuario'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalBody()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          {modalContent.action === 'disable' ? (
            <Button variant="danger" onClick={deleteHandler}>
              Deshabilitar
            </Button>
          ) : (
            <Button variant="success" onClick={enableUserHandler}>
              Habilitar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserListScreen;
