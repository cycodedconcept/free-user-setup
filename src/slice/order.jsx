import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constant";

const defaultPagination = {
  page: 1,
  limit: 10,
  total_pages: 0,
  total_items: 0,
};

const initialState = {
  loading: false,
  error: null,
  success: false,
  message: null,
  ordersData: {
    data: [],
    pagination: defaultPagination,
    total: 0,
  },
};

const normalizeOrdersResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.orders ||
    responseData?.online_store_orders ||
    responseData?.items ||
    responseData?.results ||
    Array.isArray(responseData?.data) ||
    responseData?.pagination
      ? responseData
      : responseData?.data && typeof responseData.data === "object"
        ? responseData.data
        : responseData;
  const orders =
    source?.orders ??
    source?.online_store_orders ??
    source?.items ??
    source?.results ??
    source?.data ??
    [];
  const pagination = source?.pagination ?? responseData?.pagination ?? {};

  return {
    data: Array.isArray(orders) ? orders : [],
    pagination: {
      page: Number(pagination?.page) || 1,
      limit: Number(pagination?.limit) || Number(pagination?.per_page) || 10,
      total_pages:
        Number(pagination?.total_pages) ||
        Number(pagination?.totalPages) ||
        0,
      total_items:
        Number(pagination?.total_items) ||
        Number(pagination?.totalItems) ||
        Number(pagination?.total) ||
        (Array.isArray(orders) ? orders.length : 0),
    },
    total:
      Number(source?.total) ||
      Number(responseData?.total) ||
      Number(pagination?.total_items) ||
      (Array.isArray(orders) ? orders.length : 0),
  };
};

export const getOnlineStoreOrders = createAsyncThunk(
  "order/getOnlineStoreOrders",
  async (
    {
      token,
      online_store_id,
      status = "",
      payment_status = "",
      start_date = "",
      end_date = "",
      order_type = "",
      search = "",
      page = 1,
      limit = 10,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(`${API_URL}/online-store-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          online_store_id,
          status,
          payment_status,
          start_date,
          end_date,
          order_type,
          search,
          page,
          limit,
        },
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

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    resetOrderStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getOnlineStoreOrders.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(getOnlineStoreOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload?.message || null;
        state.ordersData = normalizeOrdersResponse(action.payload);
      })
      .addCase(getOnlineStoreOrders.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetOrderStatus } = orderSlice.actions;
export default orderSlice.reducer;
