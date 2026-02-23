import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config/constant';
import axios from 'axios';

const initialState = {
    regUser: null,
    logUser: null,
    loading: false,
    error: null,
    success: false
};

export const registerForm = createAsyncThunk(
    'user/register',
    async ({name, subdomain, adminEmail, adminPassword}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register-free`, {
                name,
                subdomain,
                adminEmail,
                adminPassword
            });

            console.log('Response data:', response.data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const loginForm = createAsyncThunk(
    'user/login',
    async ({email, password}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            })

            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user))

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
)

const userSlice = createSlice({
    name: 'user',
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
        .addCase(registerForm.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(registerForm.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
            state.regUser = action.payload
        })
        .addCase(registerForm.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(loginForm.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(loginForm.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
            state.logUser = action.payload
        })
        .addCase(loginForm.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
    }
})

export const { resetStatus } = userSlice.actions;
export default userSlice.reducer;