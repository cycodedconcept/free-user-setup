import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config/constant';
import axios from 'axios';

const defaultPagination = {
    page: 1,
    limit: 20,
    total_pages: 0,
    total_items: 0
};

const normalizeStoreId = (storeId) => {
    if (storeId === undefined || storeId === null || storeId === '') {
        return null;
    }

    if (typeof storeId === 'string') {
        try {
            const parsedStoreId = JSON.parse(storeId);
            return parsedStoreId === '' ? null : parsedStoreId;
        } catch {
            return storeId;
        }
    }

    return storeId;
};

const normalizeInvoicesResponse = (payload) => {
    const responseData = payload?.data ?? payload ?? {};
    const source =
        responseData?.invoices ||
        responseData?.items ||
        responseData?.results ||
        Array.isArray(responseData?.data) ||
        responseData?.pagination
            ? responseData
            : responseData?.data && typeof responseData.data === 'object'
                ? responseData.data
                : responseData;

    const invoices =
        source?.invoices ??
        source?.items ??
        source?.results ??
        source?.data ??
        [];

    const pagination = source?.pagination ?? responseData?.pagination ?? {};
    const limit =
        Number(pagination?.limit) ||
        Number(pagination?.per_page) ||
        defaultPagination.limit;
    const totalItems =
        Number(pagination?.total_items) ||
        Number(pagination?.totalItems) ||
        Number(pagination?.total) ||
        Number(source?.total) ||
        Number(responseData?.total) ||
        (Array.isArray(invoices) ? invoices.length : 0);

    return {
        data: Array.isArray(invoices) ? invoices : [],
        pagination: {
            page: Number(pagination?.page) || defaultPagination.page,
            limit,
            total_pages:
                Number(pagination?.total_pages) ||
                Number(pagination?.totalPages) ||
                (limit > 0 ? Math.ceil(totalItems / limit) : 0),
            total_items: totalItems
        },
        total: totalItems
    };
};

const extractInvoiceFromPayload = (payload) => {
    const responseData = payload?.data ?? payload ?? {};
    const data = responseData?.data ?? {};
    const invoice =
        responseData?.invoice ??
        data?.invoice ??
        (data && !Array.isArray(data) ? data : null) ??
        responseData;

    if (!invoice || typeof invoice !== 'object' || Array.isArray(invoice)) {
        return null;
    }

    return invoice;
};

const initialState = {
    loading: false,
    error: null,
    success: false,
    invoiceData: {
        data: [],
        pagination: defaultPagination,
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

            const normalizedResponse = normalizeInvoicesResponse(response.data);
            localStorage.setItem("invoice", JSON.stringify(normalizedResponse.data))
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
    async ({ token, issue_date, due_date, currency, items, tax_rate, discount_amount, notes, online_store_id, store_id }, { rejectWithValue }) => {
        try {
            const resolvedStoreId = normalizeStoreId(online_store_id ?? store_id);

            if (!resolvedStoreId) {
                return rejectWithValue({ message: 'Online store ID not found' });
            }

            const payload = {
                issue_date,
                due_date,
                currency,
                items,
                tax_rate,
                discount_amount,
                notes
            };

            payload.online_store_id = resolvedStoreId;

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

export const updateInvoice = createAsyncThunk(
    'invoice/updateInvoice',
    async (
        {
            token,
            id,
            invoiceId,
            store_id,
            online_store_id,
            issue_date,
            due_date,
            currency,
            items,
            tax_rate,
            discount_amount,
            notes
        },
        { rejectWithValue }
    ) => {
        try {
            const resolvedInvoiceId = id ?? invoiceId;

            if (!resolvedInvoiceId) {
                return rejectWithValue({ message: 'Invoice ID is required' });
            }

            const resolvedStoreId = normalizeStoreId(store_id ?? online_store_id);
            const payload = {
                store_id: resolvedStoreId ?? null,
                issue_date,
                due_date,
                currency,
                items,
                tax_rate,
                discount_amount,
                notes
            };

            const response = await axios.put(`${API_URL}/invoices/${resolvedInvoiceId}`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const updateInvoiceStatus = createAsyncThunk(
    'invoice/updateInvoiceStatus',
    async (
        {
            token,
            id,
            invoiceId,
            status,
            payment_method,
            payment_date
        },
        { rejectWithValue }
    ) => {
        try {
            const resolvedInvoiceId = id ?? invoiceId;

            if (!resolvedInvoiceId) {
                return rejectWithValue({ message: 'Invoice ID is required' });
            }

            const response = await axios.patch(
                `${API_URL}/invoices/${resolvedInvoiceId}/status`,
                {
                    status,
                    payment_method,
                    payment_date
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

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
            state.invoiceData = normalizeInvoicesResponse(action.payload);
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
        .addCase(updateInvoice.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateInvoice.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;

            const updatedInvoice = extractInvoiceFromPayload(action.payload);

            if (!updatedInvoice?.id) {
                return;
            }

            state.invoiceData.data = state.invoiceData.data.map((invoice) =>
                invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice
            );
        })
        .addCase(updateInvoice.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateInvoiceStatus.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;

            const updatedInvoice =
                extractInvoiceFromPayload(action.payload) || {
                    id: action.meta.arg.id ?? action.meta.arg.invoiceId,
                    status: action.meta.arg.status,
                    payment_method: action.meta.arg.payment_method,
                    payment_date: action.meta.arg.payment_date
                };

            if (!updatedInvoice?.id) {
                return;
            }

            state.invoiceData.data = state.invoiceData.data.map((invoice) =>
                invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice
            );
        })
        .addCase(updateInvoiceStatus.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = invoicesSlice.actions;
export default invoicesSlice.reducer;
