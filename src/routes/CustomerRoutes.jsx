import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomersHome from "../customers/pages/CustomersHome";
import Checkout from "../customers/pages/Checkout";
import OrderDetails from "../customers/pages/OrderDetails";
import PaymentCallback from "../customers/pages/PaymentCallback";
import NotFound from "../pages/NotFound";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route index element={<CustomersHome />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="order" element={<OrderDetails />} />
      <Route path="payment-callback" element={<PaymentCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default CustomerRoutes;
