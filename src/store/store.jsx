import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../slice/authSlice';
import countryReducer from '../slice/countriesSlice'
import storeReducer from '../slice/onlineStoreSlice'
import invoiceReducer from '../slice/invoiceSlice'
import paymentReducer from '../slice/paymentSlice'
import customerReducer from '../slice/customerFacingSlice'
import domainReducer from "../slice/domainSlice"
import orderReducer from "../slice/order"
import inventoryReducer from "../slice/inventory"

const store = configureStore({
  reducer: {
    country: countryReducer,
    user: userReducer,
    store: storeReducer,
    invoice: invoiceReducer,
    payment: paymentReducer,
    customer: customerReducer,
    domain: domainReducer,
    order: orderReducer,
    inventory: inventoryReducer
  },
});

export default store;
