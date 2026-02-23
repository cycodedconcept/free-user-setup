import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config/constant';
import axios from 'axios';

const initialState = {
    loading: false,
    error: null,
    success: false,
    invoiceData: {
        data: [],
        pagination: {
            page: 1,
            limit: 20,
            total_pages: 0,
            total_items: 0
        },
        total: 0
    }
};

export const getAllInvoice = createAsyncThunk(
    'invoice/getAllInvoice',
    async ({ token, page = 1, limit = 20 }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/invoices?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            localStorage.setItem("invoice", JSON.stringify(response.data.data.invoices))
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const createInvoice = createAsyncThunk(
    'invoice/createInvoice',
    async ({ token, issue_date, due_date, currency, items, tax_rate, discount_amount, notes, store_id }, { rejectWithValue }) => {
        try {
            const payload = {
                issue_date,
                due_date,
                currency,
                items,
                tax_rate,
                discount_amount,
                notes
            };

            // Only include store_id if it exists
            if (store_id) {
                payload.store_id = store_id;
            }

            const response = await axios.post(`${API_URL}/invoices`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
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

const invoicesSlice = createSlice({
    name: 'invoice',
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
        .addCase(getAllInvoice.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getAllInvoice.fulfilled, (state, action) => {
            state.loading = false;
            state.invoiceData = {
                data: action.payload.data.invoices || [],
                pagination: action.payload.data.pagination || {
                    page: 1,
                    limit: 20,
                    total_pages: 0,
                    total_items: 0
                },
                total: action.payload.data.total || 0
            };
        })
        .addCase(getAllInvoice.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(createInvoice.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(createInvoice.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(createInvoice.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = invoicesSlice.actions;
export default invoicesSlice.reducer;