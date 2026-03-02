import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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

const initialState = {
    loading: false,
    error: null,
    success: false,
    content: {},
    myServices: {},
    bookingLoading: false,
    bookingError: null,
    bookingSuccess: false,
    bookingResponse: null,
    bookingPayload: buildInitialBookingPayload()
};

export const getOnlineEcommerceStore = createAsyncThunk(
    'customer/getOnlineEcommerceStore',
    async ({token, tenant_id}, { rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/public-store/comfort?tenant_id=${tenant_id}`, {
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

export const getServices = createAsyncThunk(
    'customer/getServices',
    async ({ tenant_id, page = 1, limit = 20, token }, { rejectWithValue }) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
            const response = await axios.get(
                `${API_URL}/public-store/comfort/services?tenant_id=${tenant_id}&page=${page}&limit=${limit}`,
                { headers }
            );

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
)

export const bookService = createAsyncThunk(
    'customer/bookService',
    async ({ payload, token }, { rejectWithValue }) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
            const response = await axios.post(`${API_URL}/payments/initialize`, payload, { headers });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

const customerSlice = createSlice({
    name: 'customer',
    initialState,
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
        },
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
        }
    },
    extraReducers: (builder) => {
        builder
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
    }
});

export const { resetStatus, resetBookingStatus, setBookingPayload, updateBookingField, updateBookingMetadataField } = customerSlice.actions;
export default customerSlice.reducer
