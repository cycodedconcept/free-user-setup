import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_URL } from "../config/constant";

const defaultPagination = {
  page: 1,
  limit: 50,
  total_pages: 0,
  total_items: 0,
};

const initialState = {
  loading: false,
  error: null,
  success: false,
  message: null,
  collectionsLoading: false,
  collectionsError: null,
  categoriesLoading: false,
  categoriesError: null,
  inventoryProducts: {
    data: [],
    pagination: defaultPagination,
    total: 0,
  },
  inventoryCollections: [],
  inventoryCategories: [],
};

const normalizeInventoryResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;
  const products = source?.products ?? responseData?.products ?? [];
  const pagination = source?.pagination ?? responseData?.pagination ?? {};

  return {
    data: Array.isArray(products) ? products : [],
    pagination: {
      page: Number(pagination?.page) || 1,
      limit: Number(pagination?.limit) || 50,
      total_pages:
        Number(pagination?.total_pages) ||
        Number(pagination?.totalPages) ||
        0,
      total_items:
        Number(pagination?.total_items) ||
        Number(pagination?.totalItems) ||
        Number(pagination?.total) ||
        (Array.isArray(products) ? products.length : 0),
    },
    total:
      Number(source?.total) ||
      Number(responseData?.total) ||
      Number(pagination?.totalItems) ||
      Number(pagination?.total) ||
      (Array.isArray(products) ? products.length : 0),
  };
};

const normalizeCollectionsResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;
  const collections = source?.collections ?? responseData?.collections ?? [];

  return Array.isArray(collections) ? collections : [];
};

const normalizeCategoriesResponse = (payload) => {
  const responseData = payload?.data ?? payload ?? {};
  const source =
    responseData?.data && typeof responseData.data === "object"
      ? responseData.data
      : responseData;
  const categories = source?.categories ?? responseData?.categories ?? [];

  return Array.isArray(categories) ? categories : [];
};

export const getInventoryProducts = createAsyncThunk(
  "inventory/getInventoryProducts",
  async (
    {
      token,
      page = 1,
      search = "",
      category = "",
      isActive,
      isPublished,
      stock_status = "",
      // collection_id,
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      params.set("page", String(page));

      if (search) {
        params.set("search", search);
      }

      if (category) {
        params.set("category", category);
      }

      if (typeof isActive === "boolean") {
        params.set("isActive", String(isActive));
      }

      if (typeof isPublished === "boolean") {
        params.set("isPublished", String(isPublished));
      }

      if (stock_status) {
        params.set("stock_status", stock_status);
      }

      // if (collection_id !== undefined && collection_id !== null && collection_id !== "") {
      //   params.set("collection_id", String(collection_id));
      // }

      const response = await axios.get(`${API_URL}/inventory?${params.toString()}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
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

export const getInventoryCollections = createAsyncThunk(
  "inventory/getInventoryCollections",
  async ({ token, id } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/stores/online/${id}/collections`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
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

export const getInventoryCategories = createAsyncThunk(
  "inventory/getInventoryCategories",
  async ({ token } = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/inventory/categories`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
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

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getInventoryProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(getInventoryProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload?.message || null;
        state.inventoryProducts = normalizeInventoryResponse(action.payload);
      })
      .addCase(getInventoryProducts.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          action.payload ||
          "Unable to fetch inventory products.";
      })
      .addCase(getInventoryCollections.pending, (state) => {
        state.collectionsLoading = true;
        state.collectionsError = null;
      })
      .addCase(getInventoryCollections.fulfilled, (state, action) => {
        state.collectionsLoading = false;
        state.inventoryCollections = normalizeCollectionsResponse(action.payload);
      })
      .addCase(getInventoryCollections.rejected, (state, action) => {
        state.collectionsLoading = false;
        state.collectionsError =
          action.payload?.message ||
          action.payload?.error ||
          action.payload ||
          "Unable to fetch inventory collections.";
      })
      .addCase(getInventoryCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(getInventoryCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.inventoryCategories = normalizeCategoriesResponse(action.payload);
      })
      .addCase(getInventoryCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload?.message ||
          action.payload?.error ||
          action.payload ||
          "Unable to fetch inventory categories.";
      });
  },
});

export default inventorySlice.reducer;
