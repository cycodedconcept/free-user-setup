import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomersHome from "../customers/pages/CustomersHome";
import Checkout from "../customers/pages/Checkout";
import PaymentCallback from "../customers/pages/PaymentCallback";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route index element={<CustomersHome />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="payment-callback" element={<PaymentCallback />} />
    </Routes>
  );
};

export default CustomerRoutes;
