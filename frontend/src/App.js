import React from "react";
import { Container } from "react-bootstrap";
import { Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { SnackbarProvider } from 'notistack';
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isAuthPage = isLoginPage || isRegisterPage;

  return (
    <>
      <SnackbarProvider maxSnack={3}>
        <Header />
        <main className={isAuthPage ? "" : "py-3"}>
          {isAuthPage ? (
            <Outlet />
          ) : (
            <Container>
              <Outlet />
            </Container>
          )}
        </main>
        {!isAuthPage && <Footer />}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }} // Asegura que los toasts estén por encima
        />
      </SnackbarProvider>
    </>
  );
};

export default App;
