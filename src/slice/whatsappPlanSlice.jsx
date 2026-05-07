import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constant";

const resolveRejectedValue = (error) => {
  if (error.response && error.response.data) {
    return error.response.data;
  }

  return error.message || "Something went wrong";
};

const initialState = {
  loading: false,
  error: null,
  success: false,
  plans: [],
  subscribeLoading: false,
  subscribeError: null,
  checkout: null,
  connectLoading: false,
  connectError: null,
  connectData: null,
};

export const getWhatsappPlans = createAsyncThunk(
  "whatsappPlan/getWhatsappPlans",
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp-plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(resolveRejectedValue(error));
    }
  }
);

export const subscribeWhatsappPlan = createAsyncThunk(
  "whatsappPlan/subscribeWhatsappPlan",
  async ({ token, plan_id, email, callback_url }, { rejectWithValue }) => {
    const endpoint = `${API_URL}/whatsapp-plans/subscribe`;
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const payload = {
        plan_id,
        email,
      };

      if (callback_url) {
        payload.callback_url = callback_url;
      }

      const response = await axios.post(endpoint, payload, requestConfig);

      return response.data;
    } catch (error) {
      if (callback_url && [400, 422].includes(error?.response?.status || 0)) {
        try {
          const fallbackResponse = await axios.post(
            endpoint,
            { plan_id, email },
            requestConfig
          );
          return fallbackResponse.data;
        } catch (fallbackError) {
          return rejectWithValue(resolveRejectedValue(fallbackError));
        }
      }

      return rejectWithValue(resolveRejectedValue(error));
    }
  }
);

export const connectWhatsappAccount = createAsyncThunk(
  "whatsappPlan/connectWhatsappAccount",
  async ({ token }, { rejectWithValue }) => {
    const endpoint = `${API_URL}/meta-connection/whatsapp/connect`;
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await axios.get(endpoint, requestConfig);
      console.log(response.data)
      return response.data;
    } catch (error) {
      return rejectWithValue(resolveRejectedValue(error));
    }
  }
);

export const getAccessToken = createAsyncThunk(
  "whatsappPlan/getAccessToken",
  async ({ token, state, code }, { rejectWithValue }) => {
    const endpoint = `${API_URL}/meta-connection/whatsapp/callback?state=${state}&code=${code}`;
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    try {
      const response = await axios.get(endpoint, requestConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(resolveRejectedValue(error));
    }
  }
)

const whatsappPlanSlice = createSlice({
  name: "whatsappPlan",
  initialState,
  reducers: {
    resetWhatsappPlanStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetWhatsappCheckoutStatus: (state) => {
      state.subscribeLoading = false;
      state.subscribeError = null;
      state.checkout = null;
    },
    resetWhatsappConnectStatus: (state) => {
      state.connectLoading = false;
      state.connectError = null;
      state.connectData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWhatsappPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWhatsappPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.success ?? true;
        state.plans = Array.isArray(action.payload?.data) ? action.payload.data : [];
      })
      .addCase(getWhatsappPlans.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      .addCase(getAccessToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccessToken.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.success ?? true;
      })
      .addCase(getAccessToken.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })
      .addCase(subscribeWhatsappPlan.pending, (state) => {
        state.subscribeLoading = true;
        state.subscribeError = null;
      })
      .addCase(subscribeWhatsappPlan.fulfilled, (state, action) => {
        state.subscribeLoading = false;
        state.checkout = action.payload?.data || action.payload || null;
      })
      .addCase(subscribeWhatsappPlan.rejected, (state, action) => {
        state.subscribeLoading = false;
        state.subscribeError = action.payload;
      })
      .addCase(connectWhatsappAccount.pending, (state) => {
        state.connectLoading = true;
        state.connectError = null;
      })
      .addCase(connectWhatsappAccount.fulfilled, (state, action) => {
        state.connectLoading = false;
        state.connectData = action.payload?.data || action.payload || null;
      })
      .addCase(connectWhatsappAccount.rejected, (state, action) => {
        state.connectLoading = false;
        state.connectError = action.payload;
      });
  },
});

export const {
  resetWhatsappPlanStatus,
  resetWhatsappCheckoutStatus,
  resetWhatsappConnectStatus,
} = whatsappPlanSlice.actions;
export default whatsappPlanSlice.reducer;
