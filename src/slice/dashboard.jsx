import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constant";

const initialState = {
    loading: false,
    error: null,
    success: false,
    dashItem: {},
    dashStats: {},
    profile: {}
}

export const getDashItem = createAsyncThunk(
    'dashboard/getDashItem',
    async ({token}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/reports/dashboard/stats`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

export const getTopPerformingProduct = createAsyncThunk(
    'dashboard/getTopPerformingProduct',
    async ({token}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/reports/products`, {
                headers: {
                    Authorization: `Bearer ${token}`,
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

export const getUserProfile = createAsyncThunk(
    'dashboard/getUserProfile',
    async ({token}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })

            localStorage.setItem("statusPlan", JSON.stringify(response.data))
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
)



const dashSlice = createSlice({
    name: 'dashboard',
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
        .addCase(getDashItem.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getDashItem.fulfilled, (state, action) => {
            state.loading = false;
            state.dashItem = action.payload
        })
        .addCase(getDashItem.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getTopPerformingProduct.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getTopPerformingProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.dashStats = action.payload
        })
        .addCase(getTopPerformingProduct.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getUserProfile.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getUserProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.profile = action.payload
        })
        .addCase(getUserProfile.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = dashSlice.actions;
export default dashSlice.reducer;