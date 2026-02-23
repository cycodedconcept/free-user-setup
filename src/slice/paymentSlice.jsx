import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_URL } from '../config/constant';
import axios from 'axios';

const initialState = {
    loading: false,
    error: null,
    success: false,
    payments: {}
};

export const addPaymentGateway = createAsyncThunk(
    'payment/addPaymentGateway',
    async ({token, gateway_name, public_key, secret_key, webhook_secret, test_mode, is_default}, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/payment-gateways`, {
                gateway_name,
                public_key,
                secret_key,
                webhook_secret,
                test_mode,
                is_default
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const getPaymentWays = createAsyncThunk(
    'payment/getPaymentWays',
    async ({token}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/payment-gateways/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
)

export const updatePaymentGateway = createAsyncThunk(
    'payment/updatePaymentGateway',
    async ({token, id, gateway_name, public_key, secret_key, webhook_secret, test_mode, is_default}, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/payment-gateways/${id}`, {
                gateway_name,
                public_key,
                secret_key,
                webhook_secret,
                test_mode,
                is_default
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const deletePaymentGateway = createAsyncThunk(
    'payment/deletePaymentGateway',
    async ({token, id}, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/payment-gateways/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

const paymentSlice = createSlice({
    name: 'payment',
    initialState,
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(addPaymentGateway.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(addPaymentGateway.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(addPaymentGateway.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getPaymentWays.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getPaymentWays.fulfilled, (state, action) => {
            state.loading = false;
            state.payments = action.payload;
        })
        .addCase(getPaymentWays.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updatePaymentGateway.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updatePaymentGateway.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updatePaymentGateway.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deletePaymentGateway.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deletePaymentGateway.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deletePaymentGateway.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = paymentSlice.actions;
export default paymentSlice.reducer;