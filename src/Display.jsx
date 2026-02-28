import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import VendorRoutes from "./routes/VendorRoutes";
import CustomerRoutes from "./routes/CustomerRoutes";

const Display = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/vendor" replace />} />
        <Route path="/vendor/*" element={<VendorRoutes />} />
        <Route path="/customer/*" element={<CustomerRoutes />} />

        {/* Legacy routes to avoid breaking existing links */}
        <Route path="/vendors/*" element={<Navigate to="/vendor" replace />} />
        <Route path="/customers/*" element={<Navigate to="/customer" replace />} />
        <Route path="/welcome" element={<Navigate to="/vendor/welcome" replace />} />
        <Route path="/login" element={<Navigate to="/vendor/login" replace />} />
        <Route path="/store" element={<Navigate to="/vendor/store" replace />} />
        <Route path="/store-set-up" element={<Navigate to="/vendor/store-set-up" replace />} />
        <Route path="/my-store" element={<Navigate to="/vendor/my-store" replace />} />
        <Route path="*" element={<Navigate to="/vendor" replace />} />
      </Routes>
    </Router>
  )
}

export default Display
