import React from "react";
import { Routes, Route } from "react-router-dom";
import Signup from "../components/auth/Signup";
import AuthWelcome from "../components/auth/AuthWelcome";
import Login from "../components/auth/Login";
import OnlineStore from "../vendors/pages/online/OnlineStore";
import OnlineStoreSingle from "../vendors/pages/online/OnlineStoreSingle";
import ViewStore from "../vendors/pages/online/ViewStore";

const VendorRoutes = () => {
  return (
    <Routes>
      <Route index element={<Signup />} />
      <Route path="welcome" element={<AuthWelcome />} />
      <Route path="login" element={<Login />} />
      <Route path="store" element={<OnlineStore />} />
      <Route path="store-set-up" element={<OnlineStoreSingle />} />
      <Route path="my-store" element={<ViewStore />} />
    </Routes>
  );
};

export default VendorRoutes;
