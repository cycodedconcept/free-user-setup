import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from '../config/constant';
import axios from 'axios';

const getPricingKey = (domain, year) => `${domain?.toLowerCase?.() || ""}-${year}`;

const initialState = {
    loading: false,
    error: null,
    success: false,
    myDomain: null,
    domainPricing: {},
    pricingStatus: {},
    paymentLoading: false,
    paymentError: null,
    paymentData: null
};

export const getDomains = createAsyncThunk(
    'domain/getDomains',
    async ({token, domain}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/domains/check?domain=${domain}`, {
                headers: {
                    Authorization: `Bearer ${token}`
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

export const getDomainPrice = createAsyncThunk(
    'domain/getDomainPrice',
    async ({ token, domain, year }, { rejectWithValue }) => {
        try {
            const response = await axios.get(
                `${API_URL}/domains/pricing?domain=${domain}&year=${year}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return {
                domain,
                year,
                data: response.data
            };
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue({
                    domain,
                    year,
                    error: error.response.data
                });
            }
            return rejectWithValue({
                domain,
                year,
                error: error.message || "Something went wrong"
            });
        }
    }
);

export const payForDomain = createAsyncThunk(
    'domain/payForDomain',
    async({token, domain, firstName, lastName, email, phone, address1, city, stateProvince, postalCode, online_store_id, callback_url}, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/domains/checkout`, {
                domain,
                firstName,
                lastName,
                email,
                phone,
                address1, 
                city,
                stateProvince, 
                postalCode,
                online_store_id,
                callback_url
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
)


const domainSlice = createSlice({
    name: 'domain',
    initialState,
    reducers: {
        resetStatus: (state) => {
            state.loading = false;
            state.success = false;
            state.error = null;
            state.myDomain = null;
            state.paymentLoading = false;
            state.paymentError = null;
            state.paymentData = null;
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(getDomains.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
            state.myDomain = null;
        })
        .addCase(getDomains.fulfilled, (state, action) => {
            state.loading = false;
            state.myDomain = action.payload;
            state.success = true;
        })
        .addCase(getDomains.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getDomainPrice.pending, (state, action) => {
            const { domain, year } = action.meta.arg;
            const pricingKey = getPricingKey(domain, year);
            state.pricingStatus[pricingKey] = {
                loading: true,
                error: null
            };
        })
        .addCase(getDomainPrice.fulfilled, (state, action) => {
            const { domain, year, data } = action.payload;
            const pricingKey = getPricingKey(domain, year);
            state.domainPricing[pricingKey] = data;
            state.pricingStatus[pricingKey] = {
                loading: false,
                error: null
            };
        })
        .addCase(getDomainPrice.rejected, (state, action) => {
            const fallbackArgs = action.meta.arg || {};
            const domain = action.payload?.domain || fallbackArgs.domain;
            const year = action.payload?.year || fallbackArgs.year;
            const pricingKey = getPricingKey(domain, year);
            state.pricingStatus[pricingKey] = {
                loading: false,
                error: action.payload?.error || action.error?.message || "Something went wrong"
            };
        })
        .addCase(payForDomain.pending, (state) => {
            state.paymentLoading = true;
            state.paymentError = null;
            state.paymentData = null;
        })
        .addCase(payForDomain.fulfilled, (state, action) => {
            state.paymentLoading = false;
            state.paymentError = null;
            state.paymentData = action.payload;
        })
        .addCase(payForDomain.rejected, (state, action) => {
            state.paymentLoading = false;
            state.paymentError = action.payload || action.error?.message || "Something went wrong";
            state.paymentData = null;
        })
    }
})

export const { resetStatus } = domainSlice.actions;
export default domainSlice.reducer;
