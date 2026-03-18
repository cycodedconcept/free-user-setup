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
  receiptsLoading: false,
  receiptsError: null,
  receiptsData: {
    data: [],
    pagination: defaultPagination,
    total: 0,
  },
  orderDetailsLoading: false,
  orderDetailsError: null,
  orderDetails: null,
  orderStatusUpdating: false,
  orderStatusUpdateError: null,
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

const normalizeOrderDetailsResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};

  return (
    responseData?.order ||
    responseData?.online_store_order ||
    responseData?.data?.order ||
    responseData?.data?.online_store_order ||
    responseData
  );
};

const normalizeReceiptsResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.receipts ||
    responseData?.items ||
    responseData?.results ||
    Array.isArray(responseData?.data) ||
    responseData?.pagination
      ? responseData
      : responseData?.data && typeof responseData.data === "object"
        ? responseData.data
        : responseData;

  const receipts =
    source?.receipts ??
    source?.items ??
    source?.results ??
    source?.data ??
    [];
  const pagination = source?.pagination ?? responseData?.pagination ?? {};

  return {
    data: Array.isArray(receipts) ? receipts : [],
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
        (Array.isArray(receipts) ? receipts.length : 0),
    },
    total:
      Number(source?.total) ||
      Number(responseData?.total) ||
      Number(pagination?.total_items) ||
      (Array.isArray(receipts) ? receipts.length : 0),
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

export const getOnlineStoreOrderDetails = createAsyncThunk(
  "order/getOnlineStoreOrderDetails",
  async ({ token, id }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/online-store-orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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

export const getReceipts = createAsyncThunk(
  "order/getReceipts",
  async (
    {
      token,
      search = "",
      status = "",
      start_date = "",
      end_date = "",
      page = 1,
      limit = 10,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(`${API_URL}/receipts/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          search,
          status,
          start_date,
          end_date,
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

export const updateOnlineStoreOrderStatus = createAsyncThunk(
  "order/updateOnlineStoreOrderStatus",
  async ({ token, id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/online-store-orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    resetOrderStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = null;
      state.receiptsLoading = false;
      state.receiptsError = null;
      state.orderDetailsLoading = false;
      state.orderDetailsError = null;
      state.orderStatusUpdating = false;
      state.orderStatusUpdateError = null;
    },
    resetOrderDetails: (state) => {
      state.orderDetailsLoading = false;
      state.orderDetailsError = null;
      state.orderDetails = null;
      state.receiptsLoading = false;
      state.receiptsError = null;
      state.receiptsData = {
        data: [],
        pagination: defaultPagination,
        total: 0,
      };
      state.orderStatusUpdating = false;
      state.orderStatusUpdateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getReceipts.pending, (state) => {
        state.receiptsLoading = true;
        state.receiptsError = null;
      })
      .addCase(getReceipts.fulfilled, (state, action) => {
        state.receiptsLoading = false;
        state.receiptsError = null;
        state.receiptsData = normalizeReceiptsResponse(action.payload);
      })
      .addCase(getReceipts.rejected, (state, action) => {
        state.receiptsLoading = false;
        state.receiptsError = action.payload;
      })
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
      })
      .addCase(getOnlineStoreOrderDetails.pending, (state) => {
        state.orderDetailsLoading = true;
        state.orderDetailsError = null;
      })
      .addCase(getOnlineStoreOrderDetails.fulfilled, (state, action) => {
        state.orderDetailsLoading = false;
        state.orderDetailsError = null;
        state.orderDetails = normalizeOrderDetailsResponse(action.payload);
      })
      .addCase(getOnlineStoreOrderDetails.rejected, (state, action) => {
        state.orderDetailsLoading = false;
        state.orderDetailsError = action.payload;
      })
      .addCase(updateOnlineStoreOrderStatus.pending, (state) => {
        state.orderStatusUpdating = true;
        state.orderStatusUpdateError = null;
      })
      .addCase(updateOnlineStoreOrderStatus.fulfilled, (state, action) => {
        state.orderStatusUpdating = false;
        state.orderStatusUpdateError = null;

        const normalizedOrder = normalizeOrderDetailsResponse(action.payload);
        const targetId = action.meta.arg.id;
        const nextStatus = normalizedOrder?.status || action.meta.arg.status;

        state.ordersData.data = (state.ordersData.data || []).map((order) =>
          `${order?.id}` === `${targetId}`
            ? {
                ...order,
                ...(normalizedOrder && typeof normalizedOrder === "object" ? normalizedOrder : {}),
                status: nextStatus,
              }
            : order
        );

        if (`${state.orderDetails?.id}` === `${targetId}`) {
          state.orderDetails = {
            ...state.orderDetails,
            ...(normalizedOrder && typeof normalizedOrder === "object" ? normalizedOrder : {}),
            status: nextStatus,
          };
        }
      })
      .addCase(updateOnlineStoreOrderStatus.rejected, (state, action) => {
        state.orderStatusUpdating = false;
        state.orderStatusUpdateError = action.payload;
      });
  },
});

export const { resetOrderStatus, resetOrderDetails } = orderSlice.actions;
export default orderSlice.reducer;
