import React from "react";
import { Routes, Route } from "react-router-dom";
import CustomersHome from "../customers/pages/CustomersHome";
import Checkout from "../customers/pages/Checkout";

const CustomerRoutes = () => {
  return (
    <Routes>
      <Route index element={<CustomersHome />} />
      <Route path="checkout" element={<Checkout />} />
    </Routes>
  );
};

export default CustomerRoutes;
