import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../slice/authSlice';
import countryReducer from '../slice/countriesSlice'
import storeReducer from '../slice/onlineStoreSlice'
import invoiceReducer from '../slice/invoiceSlice'
import paymentReducer from '../slice/paymentSlice'
import domainReducer from "../slice/domainSlice"
import orderReducer from "../slice/order"
import inventoryReducer from "../slice/inventory"
import whatsappPlanReducer from "../slice/whatsappPlanSlice"
import dashboardReducer from "../slice/dashboard"

const store = configureStore({
  reducer: {
    country: countryReducer,
    user: userReducer,
    store: storeReducer,
    invoice: invoiceReducer,
    payment: paymentReducer,
    domain: domainReducer,
    order: orderReducer,
    inventory: inventoryReducer,
    whatsappPlan: whatsappPlanReducer,
    dashboard: dashboardReducer
  },
});

export default store;
