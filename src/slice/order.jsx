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
  createReceiptLoading: false,
  createReceiptError: null,
  createdReceipt: null,
  receiptsLoading: false,
  receiptsError: null,
  receiptsData: {
    data: [],
    pagination: defaultPagination,
    total: 0,
  },
  invoiceReceiptsLoading: false,
  invoiceReceiptsError: null,
  invoiceReceiptsData: {
    data: [],
    pagination: defaultPagination,
    total: 0,
  },
  receiptDetailsLoading: false,
  receiptDetailsError: null,
  receiptDetails: null,
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
      Number(source?.count) ||
      Number(responseData?.total) ||
      Number(responseData?.count) ||
      Number(pagination?.total_items) ||
      (Array.isArray(receipts) ? receipts.length : 0),
  };
};

const extractCreatedReceipt = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const data = responseData?.data ?? {};
  const receiptData = data?.receipt_data ?? responseData?.receipt_data ?? {};
  const receipt =
    responseData?.receipt ??
    data?.receipt ??
    (data && !Array.isArray(data) ? data : null) ??
    responseData;
  const previews = data?.previews ?? responseData?.previews ?? [];
  const primaryPreview = Array.isArray(previews) ? previews[0] : null;

  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) {
    return null;
  }

  return {
    ...(receiptData && typeof receiptData === "object" ? receiptData : {}),
    ...receipt,
    preview_url:
      receipt?.preview_url ||
      primaryPreview?.preview_url ||
      responseData?.preview_url ||
      data?.preview_url ||
      "",
    pdf_url:
      receipt?.pdf_url ||
      receipt?.document_url ||
      primaryPreview?.pdf_url ||
      responseData?.pdf_url ||
      data?.pdf_url ||
      "",
    download_url:
      receipt?.download_url ||
      receipt?.document_url ||
      primaryPreview?.pdf_url ||
      responseData?.download_url ||
      data?.download_url ||
      "",
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

export const createStandaloneReceipt = createAsyncThunk(
  "order/createStandaloneReceipt",
  async (
    {
      token,
      items,
      currency,
      currency_symbol,
      payment_method,
      customer_name,
      customer_phone,
      customer_email,
      notes,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/receipts/standalone`,
        {
          items,
          currency,
          currency_symbol,
          payment_method,
          customer_name,
          customer_phone,
          customer_email,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
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

export const getInvoiceReceipts = createAsyncThunk(
  "order/getInvoiceReceipts",
  async ({ token, invoiceId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/receipts/invoices/${invoiceId}/receipts`,
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

export const getReceiptDetails = createAsyncThunk(
  "order/getReceiptDetails",
  async ({ token, receiptId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/receipts/${receiptId}`, {
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

export const generateReceiptFromInvoice = createAsyncThunk(
  'order/generateReceiptFromInvoice',
  async ({token, invoiceId}, {rejectWithValue}) => {
    try {
      const response = await axios.post(
        `${API_URL}/receipts/invoices/${invoiceId}/generate`,
        {},
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
)

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    resetOrderStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.message = null;
      state.createReceiptLoading = false;
      state.createReceiptError = null;
      state.createdReceipt = null;
      state.receiptsLoading = false;
      state.receiptsError = null;
      state.invoiceReceiptsLoading = false;
      state.invoiceReceiptsError = null;
      state.invoiceReceiptsData = {
        data: [],
        pagination: defaultPagination,
        total: 0,
      };
      state.receiptDetailsLoading = false;
      state.receiptDetailsError = null;
      state.receiptDetails = null;
      state.orderDetailsLoading = false;
      state.orderDetailsError = null;
      state.orderStatusUpdating = false;
      state.orderStatusUpdateError = null;
    },
    resetCreatedReceipt: (state) => {
      state.createReceiptLoading = false;
      state.createReceiptError = null;
      state.createdReceipt = null;
    },
    resetInvoiceReceipts: (state) => {
      state.invoiceReceiptsLoading = false;
      state.invoiceReceiptsError = null;
      state.invoiceReceiptsData = {
        data: [],
        pagination: defaultPagination,
        total: 0,
      };
    },
    resetReceiptDetails: (state) => {
      state.receiptDetailsLoading = false;
      state.receiptDetailsError = null;
      state.receiptDetails = null;
    },
    resetOrderDetails: (state) => {
      state.orderDetailsLoading = false;
      state.orderDetailsError = null;
      state.orderDetails = null;
      state.createReceiptLoading = false;
      state.createReceiptError = null;
      state.createdReceipt = null;
      state.receiptsLoading = false;
      state.receiptsError = null;
      state.receiptsData = {
        data: [],
        pagination: defaultPagination,
        total: 0,
      };
      state.invoiceReceiptsLoading = false;
      state.invoiceReceiptsError = null;
      state.invoiceReceiptsData = {
        data: [],
        pagination: defaultPagination,
        total: 0,
      };
      state.receiptDetailsLoading = false;
      state.receiptDetailsError = null;
      state.receiptDetails = null;
      state.orderStatusUpdating = false;
      state.orderStatusUpdateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createStandaloneReceipt.pending, (state) => {
        state.createReceiptLoading = true;
        state.createReceiptError = null;
        state.createdReceipt = null;
      })
      .addCase(createStandaloneReceipt.fulfilled, (state, action) => {
        state.createReceiptLoading = false;
        state.createReceiptError = null;
        state.createdReceipt = extractCreatedReceipt(action.payload);
      })
      .addCase(createStandaloneReceipt.rejected, (state, action) => {
        state.createReceiptLoading = false;
        state.createReceiptError = action.payload;
        state.createdReceipt = null;
      })
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
      .addCase(getInvoiceReceipts.pending, (state) => {
        state.invoiceReceiptsLoading = true;
        state.invoiceReceiptsError = null;
        state.invoiceReceiptsData = {
          data: [],
          pagination: defaultPagination,
          total: 0,
        };
      })
      .addCase(getInvoiceReceipts.fulfilled, (state, action) => {
        state.invoiceReceiptsLoading = false;
        state.invoiceReceiptsError = null;
        state.invoiceReceiptsData = normalizeReceiptsResponse(action.payload);
      })
      .addCase(getInvoiceReceipts.rejected, (state, action) => {
        state.invoiceReceiptsLoading = false;
        state.invoiceReceiptsError = action.payload;
        state.invoiceReceiptsData = {
          data: [],
          pagination: defaultPagination,
          total: 0,
        };
      })
      .addCase(getReceiptDetails.pending, (state) => {
        state.receiptDetailsLoading = true;
        state.receiptDetailsError = null;
        state.receiptDetails = null;
      })
      .addCase(getReceiptDetails.fulfilled, (state, action) => {
        state.receiptDetailsLoading = false;
        state.receiptDetailsError = null;
        state.receiptDetails = extractCreatedReceipt(action.payload);
      })
      .addCase(getReceiptDetails.rejected, (state, action) => {
        state.receiptDetailsLoading = false;
        state.receiptDetailsError = action.payload;
        state.receiptDetails = null;
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
      })
      .addCase(generateReceiptFromInvoice.pending, (state) => {
        state.createReceiptLoading = true;
        state.createReceiptError = null;
        state.createdReceipt = null;
      })
      .addCase(generateReceiptFromInvoice.fulfilled, (state, action) => {
        state.createReceiptLoading = false;
        state.createReceiptError = null;
        state.createdReceipt = extractCreatedReceipt(action.payload);
        state.success = true;
        state.message = action.payload?.message || null;
      })
      .addCase(generateReceiptFromInvoice.rejected, (state, action) => {
        state.createReceiptLoading = false;
        state.createReceiptError = action.payload;
        state.createdReceipt = null;
        state.success = false;
        state.error = action.payload;
      })
  },
});

export const {
  resetOrderStatus,
  resetCreatedReceipt,
  resetInvoiceReceipts,
  resetReceiptDetails,
  resetOrderDetails,
} = orderSlice.actions;
export default orderSlice.reducer;
