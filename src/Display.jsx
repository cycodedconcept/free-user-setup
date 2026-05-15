import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import WhatsAppConnectSuccess from "./pages/WhatsAppConnectSuccess";
import NotFound from "./pages/NotFound";
import VendorRoutes from "./routes/VendorRoutes";
import { readWhatsappOauthSession } from "./vendors/pages/settings/whatsappPlanPayment";

const RootRedirect = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasWhatsappOauthParams = searchParams.has("code") || searchParams.has("state");
  const { state } = readWhatsappOauthSession();

  if (hasWhatsappOauthParams && state) {
    return <Navigate to={`/vendor/whatsapp-link${location.search}`} replace />;
  }

  return <Navigate to="/vendor" replace />;
};

const SalesAgentRedirect = () => {
  const location = useLocation();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  if (!token) {
    return <Navigate to="/vendor/login" replace />;
  }

  return <Navigate to={`/vendor/ai/sales-agent${location.search || ""}`} replace />;
};

const Display = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/ai/sales-agent" element={<SalesAgentRedirect />} />
        <Route path="/whatsapp-connect-success" element={<WhatsAppConnectSuccess />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />

        {/* Legacy routes to avoid breaking existing links */}
        <Route path="/vendors/*" element={<Navigate to="/vendor" replace />} />
        <Route path="/welcome" element={<Navigate to="/vendor/welcome" replace />} />
        <Route path="/login" element={<Navigate to="/vendor/login" replace />} />
        <Route path="/store" element={<Navigate to="/vendor/store" replace />} />
        <Route path="/store-set-up" element={<Navigate to="/vendor/store-set-up" replace />} />
        <Route path="/my-store" element={<Navigate to="/vendor/my-store" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default Display
