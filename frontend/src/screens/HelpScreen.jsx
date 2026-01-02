import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import dev1Pic from '../assets/Thyara.jpg';
import dev2Pic from '../assets/Sebas.jpg';
import '../assets/styles/HelpScreen.css';

const HelpScreen = () => {
  return (
    <Container className="help-screen my-5">
      <h1 className="text-center mb-4">¿Necesitas Ayuda?</h1>
      <p className="text-center intro-text">
        Ponte en contacto con nuestro equipo de desarrolladores. <br />
        Estamos aquí para asistirte en todo lo que necesites.
      </p>

      <Row className="justify-content-center mt-5">
        {/* Tarjeta del Desarrollador 1 */}
        <Col xs={12} md={6} lg={4} className="mb-4 d-flex justify-content-center">
          <Card className="developer-card">
            <div className="card-img-wrapper">
              <Card.Img
                variant="top"
                src={dev1Pic}
                alt="Foto del Desarrollador 1"
              />
            </div>
            <Card.Body>
              <Card.Title className="developer-name">Thyara Vintimilla</Card.Title>
              <Card.Text>
                <label className="label-field">Teléfono:</label>
                <span className="value-field">0990722955</span>
              </Card.Text>
              <Card.Text>
                <label className="label-field">Email:</label>
                <span className="value-field">tita072002@hotmail.com</span>
              </Card.Text>
              <Card.Text>
                <label className="label-field">Rol:</label>
                <span className="value-field">Ingeniera de software</span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Tarjeta del Desarrollador 2 */}
        <Col xs={12} md={6} lg={4} className="mb-4 d-flex justify-content-center">
          <Card className="developer-card">
            <div className="card-img-wrapper">
              <Card.Img
                variant="top"
                src={dev2Pic}
                alt="Foto del Desarrollador 2"
              />
            </div>
            <Card.Body>
              <Card.Title className="developer-name">Sebastián Valverde</Card.Title>
              <Card.Text>
                <label className="label-field">Teléfono:</label>
                <span className="value-field">0999915931</span>
              </Card.Text>
              <Card.Text>
                <label className="label-field">Email:</label>
                <span className="value-field">sebas@hotmail.com</span>
              </Card.Text>
              <Card.Text>
                <label className="label-field">Rol:</label>
                <span className="value-field">Ingeniero de software</span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="additional-info text-center mt-5">
        <h2>Información Adicional</h2>
        <p>
          También puedes consultar nuestra página de <strong>Preguntas Frecuentes (FAQ)</strong> 
          para resolver dudas rápidamente, o envíanos un ticket de soporte a través de tu perfil 
          de usuario. ¡Con gusto te ayudaremos!
        </p>
      </div>
    </Container>
  );
};

export default HelpScreen;
