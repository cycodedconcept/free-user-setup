import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from '../config/constant';
import axios from 'axios';

const getPricingKey = (domain, year) => `${domain?.toLowerCase?.() || ""}-${year}`;

const defaultPagination = {
    page: 1,
    limit: 20,
    totalPages: 0,
    totalItems: 0
};

const initialState = {
    loading: false,
    error: null,
    success: false,
    myDomain: null,
    domainPricing: {},
    pricingStatus: {},
    paymentLoading: false,
    paymentError: null,
    paymentData: null,
    dns: {},
    allDomains: {
        data: [],
        pagination: { ...defaultPagination },
        total: 0
    }
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
);

export const getAllDomains = createAsyncThunk(
    'domain/getAllDomains',
    async({ token, page = 1, limit = 20}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/domains?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            localStorage.setItem("dom", JSON.stringify(response.data?.data?.domains || []))
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const linkStore = createAsyncThunk(
    'domain/linkStore',
    async({token, domainId, online_store_id }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/domains/${domainId}/link`, {
                online_store_id
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

export const unLinkStore = createAsyncThunk(
    'domain/unLinkStore',
    async({token, domainId}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/domains/${domainId}/unlink`, {}, {
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

export const getDnsRecord = createAsyncThunk(
    'domain/getDnsRecord',
    async({token, domainId}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/domains/${domainId}/dns`, {
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

export const updateDnsRecord = createAsyncThunk(
    'domain/updateDnsRecord',
    async({token, domainId, records}, {rejectWithValue}) => {
        try {
            const response = await axios.put(`${API_URL}/domains/${domainId}/dns`, {
                records
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

export const addSsl = createAsyncThunk(
    'domain/addSsl',
    async({token, domainId}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/domains/${domainId}/ssl`, {}, {
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

export const getSSLDomain = createAsyncThunk(
    'domain/getSSLDomain',
    async({token, domainId}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/domains/${domainId}/ssl`, {
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
        .addCase(getAllDomains.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getAllDomains.fulfilled, (state, action) => {
            const pagination = action.payload?.data?.pagination || {};
            const domains = action.payload?.data?.domains || [];
            state.loading = false;
            state.success = true;
            state.allDomains = {
                data: domains,
                pagination: {
                    page: pagination.page || defaultPagination.page,
                    limit: pagination.limit || defaultPagination.limit,
                    totalPages: pagination.totalPages || pagination.total_pages || defaultPagination.totalPages,
                    totalItems: pagination.total || pagination.totalItems || pagination.total_items || action.payload?.data?.total || domains.length
                },
                total: action.payload?.data?.total || pagination.total || pagination.totalItems || pagination.total_items || domains.length
            };
        })
        .addCase(getAllDomains.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(linkStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(linkStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.paymentData = action.payload;
        })
        .addCase(linkStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(unLinkStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(unLinkStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.paymentData = action.payload;
        })
        .addCase(unLinkStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getDnsRecord.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getDnsRecord.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.dns = action.payload;
        })
        .addCase(getDnsRecord.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateDnsRecord.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateDnsRecord.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.dns = action.payload;
        })
        .addCase(updateDnsRecord.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(addSsl.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(addSsl.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.paymentData = action.payload;
        })
        .addCase(addSsl.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getSSLDomain.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getSSLDomain.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.paymentData = action.payload;
        })
        .addCase(getSSLDomain.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = domainSlice.actions;
export default domainSlice.reducer;
