import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const DASHBOARD_ROUTE = "/vendor/store";
const FAVICON_SRC = "/vite.svg";

const pageStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffffff",
  padding: "24px",
};

const cardStyles = {
  width: "100%",
  maxWidth: "400px",
  background: "#ffffff",
  borderRadius: "28px",
  border: "1px solid #eef2f7",
  boxShadow: "0 24px 55px rgba(15, 23, 42, 0.08)",
  padding: "40px 32px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  fontFamily: "Poppins, Open Sans, sans-serif",
};

const logoStyles = {
  width: "156px",
  maxWidth: "70%",
  height: "auto",
  marginBottom: "24px",
};

const codeStyles = {
  margin: 0,
  fontSize: "clamp(56px, 10vw, 84px)",
  lineHeight: 1,
  fontWeight: 700,
  color: "#1c1917",
};

const headingStyles = {
  margin: "16px 0 10px",
  fontSize: "28px",
  lineHeight: 1.2,
  fontWeight: 600,
  color: "#1c1917",
};

const descriptionStyles = {
  margin: 0,
  fontSize: "15px",
  lineHeight: 1.7,
  color: "#78716c",
  maxWidth: "290px",
};

const buttonStyles = {
  width: "100%",
  marginTop: "28px",
  padding: "14px 20px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: 600,
};

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={pageStyles}>
      <div style={cardStyles}>
        <img src={FAVICON_SRC} alt="Mycroshop" style={logoStyles} />
        <p style={codeStyles}>404</p>
        <h1 style={headingStyles}>Page Not Found</h1>
        <p style={descriptionStyles}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Button
          type="button"
          variant="blueButton"
          size="lg"
          style={buttonStyles}
          onClick={() => navigate(DASHBOARD_ROUTE)}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
