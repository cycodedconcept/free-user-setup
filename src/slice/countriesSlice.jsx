import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from "axios";

const initialState = {
    success: false,
    loading: false,
    error: null,
    countryItem: []
};

export const getCountries = createAsyncThunk(
  'country/getCountries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("https://countriesnow.space/api/v0.1/countries/flag/images", {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(response.data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue(error.message || "Something went wrong");
    }
  }
);


const countrySlice = createSlice({
    name: 'country',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(getCountries.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getCountries.fulfilled, (state, action) => {
            state.loading = false;
            state.success = true;
            state.countryItem = action.payload
        })
        .addCase(getCountries.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload
        })
    }
});

export default countrySlice.reducer;