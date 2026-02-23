import { configureStore } from "@reduxjs/toolkit";
import userReducer from '../slice/authSlice';
import countryReducer from '../slice/countriesSlice'
import storeReducer from '../slice/onlineStoreSlice'
import invoiceReducer from '../slice/invoiceSlice'
import paymentReducer from '../slice/paymentSlice'

const store = configureStore({
  reducer: {
    country: countryReducer,
    user: userReducer,
    store: storeReducer,
    invoice: invoiceReducer,
    payment: paymentReducer
  },
});

export default store;
