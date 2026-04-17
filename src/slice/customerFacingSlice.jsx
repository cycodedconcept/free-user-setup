import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import { API_URL } from '../config/constant';
import axios from 'axios';

const buildInitialBookingPayload = () => ({
  amount: null,
  email: "",
  tenant_id: null,
  callback_url: "",
  metadata: {
    is_booking: true,
    booking_type: "service",
    service_id: null,
    scheduled_at: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    timezone: "",
    location_type: "in_person",
    notes: null
  }
});

/** ✅ Checkout payload builder (matches your JSON format) */
const buildInitialCheckoutPayload = () => ({
  tenant_id: null,
  online_store_id: null,
  customer_name: "",
  customer_email: "",
  idempotency_key: "",
  customer_phone: "",
  customer_address: "",
  city: "",
  state: "",
  country: "",
  items: [],
  tax_rate: 0,
  shipping_amount: 0,
  discount_amount: 0
});

const initialState = {
  loading: false,
  error: null,
  success: false,
  content: {},
  myServices: {},
  myProducts: {},
  productDetails: {},
  storeThemes: [],
  storeThemesLoading: false,
  storeThemesError: null,
  storeThemesResponse: null,

  bookingLoading: false,
  bookingError: null,
  bookingSuccess: false,
  bookingResponse: null,
  bookingPayload: buildInitialBookingPayload(),

  /** ✅ Checkout states */
  checkoutLoading: false,
  checkoutError: null,
  checkoutSuccess: false,
  checkoutResponse: null,
  checkoutPayload: buildInitialCheckoutPayload(),
};

export const getOnlineEcommerceStore = createAsyncThunk(
  'customer/getOnlineEcommerceStore',
  async ({ token, tenant_id, store }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/public-store/${store}?tenant_id=${tenant_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const getOnlineStoreThemes = createAsyncThunk(
  'customer/getOnlineStoreThemes',
  async ({ token, id }, { rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue("Store id is required");

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(`${API_URL}/stores/online/${id}`, { headers });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const getServices = createAsyncThunk(
  'customer/getServices',
  async ({ tenant_id, page = 1, limit = 20, token, store }, { rejectWithValue }) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(
        `${API_URL}/public-store/${store}/services?tenant_id=${tenant_id}&page=${page}&limit=${limit}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const getProductOnline = createAsyncThunk(
  'customer/getProduct',
  async ({ tenant_id, page = 1, limit = 20, token, store }, { rejectWithValue }) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.get(
        `${API_URL}/public-store/${store}/products?tenant_id=${tenant_id}&page=${page}&limit=${limit}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const getProductDetails = createAsyncThunk(
  'customer/getProductDetails',
  async ({ tenant_id, token, store, productId }, { rejectWithValue }) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const resolvedStore = store;
      const resolvedProductId = productId;

      const response = await axios.get(
        `${API_URL}/public-store/${resolvedStore}/products/${resolvedProductId}?tenant_id=${tenant_id}`,
        { headers }
      );
      console.log("Product details response:", response.data); // Debug log
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const bookService = createAsyncThunk(
  'customer/bookService',
  async ({ payload, token }, { rejectWithValue }) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post(`${API_URL}/payments/initialize`, payload, { headers });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

export const proceedToPayment = createAsyncThunk(
  'customer/proceedToPayment', 
  async ({tenant_id, order_id, amount, email, name, currency, callback_url, token}, {rejectWithValue}) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post(`${API_URL}/public-checkout/payments/initialize`, {
        tenant_id,
        order_id,
        amount,
        email,
        name,
        currency,
        callback_url
      }, {
        headers
      })

      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
)

/**
 * ✅ Checkout thunk (adjust endpoint to your backend route if different)
 * Example assumed endpoint: POST /public-store/:store/checkout?tenant_id=...
 */
export const checkoutProduct = createAsyncThunk(
  'customer/checkoutProduct',
  async ({ payload, token }, { rejectWithValue }) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.post(
        `${API_URL}/public-checkout/orders`,
        payload,
        { headers }
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) return rejectWithValue(error.response.data);
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);

// helpers for cart ops
const itemKey = (it) => `${it.product_id}:${it.variation_id ?? ''}:${it.variation_option_id ?? ''}`;
const toNum = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const extractThemeList = (payload) => {
  const candidates = [
    payload?.data?.themes,
    payload?.data?.suggested_themes,
    payload?.data?.store?.themes,
    payload?.data?.store?.suggested_themes,
    payload?.data?.onlineStore?.themes,
    payload?.data?.onlineStore?.suggested_themes,
    payload?.themes,
    payload?.suggested_themes,
    payload?.store?.themes,
    payload?.store?.suggested_themes,
    payload?.onlineStore?.themes,
    payload?.onlineStore?.suggested_themes
  ];

  return candidates.find(Array.isArray) || [];
};

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },

    // Booking reducers
    resetBookingStatus: (state) => {
      state.bookingLoading = false;
      state.bookingSuccess = false;
      state.bookingError = null;
      state.bookingResponse = null;
    },
    setBookingPayload: (state, action) => {
      state.bookingPayload = action.payload;
    },
    updateBookingField: (state, action) => {
      const { field, value } = action.payload;
      state.bookingPayload[field] = value;
    },
    updateBookingMetadataField: (state, action) => {
      const { field, value } = action.payload;
      state.bookingPayload.metadata = {
        ...state.bookingPayload.metadata,
        [field]: value
      };
    },

    /** ✅ Checkout reducers */
    resetCheckoutStatus: (state) => {
      state.checkoutLoading = false;
      state.checkoutSuccess = false;
      state.checkoutError = null;
      state.checkoutResponse = null;
    },
    setCheckoutPayload: (state, action) => {
      state.checkoutPayload = action.payload;
      if (!Array.isArray(state.checkoutPayload.items)) state.checkoutPayload.items = [];
    },
    updateCheckoutField: (state, action) => {
      const { field, value } = action.payload;
      state.checkoutPayload[field] = value;
    },
    ensureCheckoutIdempotencyKey: (state) => {
      if (!state.checkoutPayload.idempotency_key) {
        state.checkoutPayload.idempotency_key = nanoid();
      }
    },
    addCheckoutItem: (state, action) => {
      const incoming = action.payload;
      const idx = state.checkoutPayload.items.findIndex((it) => itemKey(it) === itemKey(incoming));
      const qty = Math.max(1, toNum(incoming.quantity, 1));
      const price = Math.max(0, toNum(incoming.unit_price, 0));

      if (idx >= 0) {
        state.checkoutPayload.items[idx].quantity = toNum(state.checkoutPayload.items[idx].quantity, 0) + qty;
        state.checkoutPayload.items[idx].unit_price = price; // keep latest
      } else {
        state.checkoutPayload.items.push({
          product_id: incoming.product_id,
          quantity: qty,
          unit_price: price,
          variation_id: incoming.variation_id ?? null,
          variation_option_id: incoming.variation_option_id ?? null
        });
      }
    },
    updateCheckoutItem: (state, action) => {
      const { match, changes } = action.payload; // match: {product_id, variation_id, variation_option_id}
      const idx = state.checkoutPayload.items.findIndex((it) => itemKey(it) === itemKey(match));
      if (idx === -1) return;

      const next = { ...state.checkoutPayload.items[idx], ...changes };
      if ('quantity' in changes) next.quantity = Math.max(1, toNum(next.quantity, 1));
      if ('unit_price' in changes) next.unit_price = Math.max(0, toNum(next.unit_price, 0));

      state.checkoutPayload.items[idx] = next;
    },
    removeCheckoutItem: (state, action) => {
      const match = action.payload;
      state.checkoutPayload.items = state.checkoutPayload.items.filter((it) => itemKey(it) !== itemKey(match));
    },
    clearCheckoutItems: (state) => {
      state.checkoutPayload.items = [];
    },
    resetCheckoutPayload: (state) => {
      state.checkoutPayload = buildInitialCheckoutPayload();
    }
  },

  extraReducers: (builder) => {
    builder
      // store
      .addCase(getOnlineEcommerceStore.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(getOnlineEcommerceStore.fulfilled, (state, action) => {
        state.loading = false;
        state.content = action.payload;
        state.success = true;
      })
      .addCase(getOnlineEcommerceStore.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // store themes
      .addCase(getOnlineStoreThemes.pending, (state) => {
        state.storeThemesLoading = true;
        state.storeThemesError = null;
      })
      .addCase(getOnlineStoreThemes.fulfilled, (state, action) => {
        state.storeThemesLoading = false;
        state.storeThemesResponse = action.payload;
        state.storeThemes = extractThemeList(action.payload);
      })
      .addCase(getOnlineStoreThemes.rejected, (state, action) => {
        state.storeThemesLoading = false;
        state.storeThemesError = action.payload;
      })

      // booking
      .addCase(bookService.pending, (state) => {
        state.bookingLoading = true;
        state.bookingSuccess = false;
        state.bookingError = null;
      })
      .addCase(bookService.fulfilled, (state, action) => {
        state.bookingLoading = false;
        state.bookingSuccess = true;
        state.bookingResponse = action.payload;
      })
      .addCase(bookService.rejected, (state, action) => {
        state.bookingLoading = false;
        state.bookingSuccess = false;
        state.bookingError = action.payload;
      })

      // services
      .addCase(getServices.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(getServices.fulfilled, (state, action) => {
        state.loading = false;
        state.myServices = action.payload;
        state.success = true;
      })
      .addCase(getServices.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // products
      .addCase(getProductOnline.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(getProductOnline.fulfilled, (state, action) => {
        state.loading = false;
        state.myProducts = action.payload;
        state.success = true;
      })
      .addCase(getProductOnline.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // product details
      .addCase(getProductDetails.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetails = action.payload;
        state.success = true;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      .addCase(proceedToPayment.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(proceedToPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload;
        state.success = true;
      })
      .addCase(proceedToPayment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      /** ✅ checkout */
      .addCase(checkoutProduct.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutSuccess = false;
        state.checkoutError = null;
        state.checkoutResponse = null;
      })
      .addCase(checkoutProduct.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutSuccess = true;
        state.checkoutResponse = action.payload;
      })
      .addCase(checkoutProduct.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutSuccess = false;
        state.checkoutError = action.payload;
      });
  }
});

export const {
  resetStatus,
  resetBookingStatus,
  setBookingPayload,
  updateBookingField,
  updateBookingMetadataField,

  resetCheckoutStatus,
  setCheckoutPayload,
  updateCheckoutField,
  ensureCheckoutIdempotencyKey,
  addCheckoutItem,
  updateCheckoutItem,
  removeCheckoutItem,
  clearCheckoutItems,
  resetCheckoutPayload
} = customerSlice.actions;

export default customerSlice.reducer;
