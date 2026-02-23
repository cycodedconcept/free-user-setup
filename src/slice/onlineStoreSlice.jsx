import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config/constant';
import axios from 'axios';

const initialState = {
    loading: false,
    error: null,
    success: false,
    message: {},
    allStore: {},
    singleStore: {},
    collections: {},
    collectionProduct: {},
    collist: {},
    products: {},
    colDetails:{},
    myStore: {},
    previewDetails: {},
    collectionProducts: {
        data: [],
        pagination: {
            page: 1,
            limit: 20,
            total_pages: 0,
            total_items: 0
        },
        total: 0
    },
    singleCollectionProducts: {
        data: [],
        pagination: {
            page: 1,
            limit: 20,
            total_pages: 0,
            total_items: 0
        },
        total: 0
    }
}

export const createOnlineStore = createAsyncThunk(
    'store/createStore',
    async ({ token, username, store_name, store_description }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/setup`, {
                username,
                store_name,
                store_description
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            localStorage.setItem('itemId', response.data.data.onlineStore.id);

            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const getMyOnlineStore = createAsyncThunk(
    'store/getMyOnlineStore',
    async ({token, id}, {rejectWithValue}) => {
        console.debug('[getMyOnlineStore] request', { id });
        try {
            const response = await axios.get(`${API_URL}/stores/online/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            console.debug('[getMyOnlineStore] response', response?.data);
            return response.data.data;
        } catch (error) {
             console.error('[getMyOnlineStore] error', error?.response?.data || error?.message);
             if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
)

export const storeUpdateColors = createAsyncThunk(
    'store/storeUpdateColors',
    async ({token, background_color, button_style, button_color, button_font_color, id}, {rejectWithValue}) => {
        try {
            const response = await axios.put(`${API_URL}/stores/online/${id}/appearance`, {
                background_color,
                button_style,
                button_color,
                button_font_color
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

export const updateStoreImages = createAsyncThunk(
    'store/updateStoreImages',
    async ({token, formData, id}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/${id}/image`, formData, {
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


export const updateStoreLinks = createAsyncThunk(
    'store/updateLink',
    async ({token, id, show_location, country, state, is_location_based, allow_delievry_datetime, social_links }, {rejectWithValue}) => {
        try {
            const response = await axios.put(`${API_URL}/stores/online/${id}/information`, {
                show_location,
                country,
                state,
                is_location_based,
                allow_delievry_datetime,
                social_links
            },
            {
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


export const createService = createAsyncThunk (
    'store/createService',
    async ({formData, token, id}, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/${id}/services`, formData, {
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

export const updateService = createAsyncThunk (
    'store/updateService',
    async ({formData, token, serviceId}, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/stores/services/${serviceId}`, formData, {
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

export const getAllServices = createAsyncThunk(
    'store/getStores',
    async ({ token, id }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/stores/online/${id}/services`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            })

            localStorage.setItem('services', JSON.stringify(response.data.data.services))
            return response.data; 
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const getSingleStore = createAsyncThunk(
    'store/singleStore',
    async ({ token, id }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/stores/services/${id}`, {
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

export const deleteService = createAsyncThunk(
    'store/deleteService',
    async ({token, serviceId}, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/services/${serviceId}`, {
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

export const createCollection = createAsyncThunk(
    'store/createCollection',
    async ({ token, collection_name, collection_type, layout_type, is_pinned, is_visible, id }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/${id}/collections`, {
                collection_name,
                collection_type,
                layout_type,
                is_pinned,
                is_visible

            },{
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

export const getAllCollection = createAsyncThunk(
    'store/getCollections',
    async ({token, id}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/stores/online/${id}/collections?collection_type=service`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        localStorage.setItem('allcollections', JSON.stringify(response.data.data.collections))
        return response.data;
            
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }

    }
);

export const getCollectionForProduct = createAsyncThunk(
    'store/getCollectionsForProduct',
    async ({token, id}, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/stores/online/${id}/collections?collection_type=product`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        localStorage.setItem('allcollectionsProduct', JSON.stringify(response.data.data.collections))
        return response.data;
            
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }

    }
)

export const addServiceToCollection = createAsyncThunk(
    'store/addServiceToCollection',
    async ({token, service_id, is_pinned, sort_order, id}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/collections/${id}/services`, {
                service_id,
                is_pinned,
                sort_order
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return response.data
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const addBulkServicesToCollection = createAsyncThunk(
    'store/addBulkService',
    async ({token, service_ids, id}, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/stores/collections/${id}/services/bulk`, {
                service_ids,
            },{
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

export const getServiceCollection = createAsyncThunk(
    'store/getServiceCollection',
    async ({token, id}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/stores/collections/${id}/services`, {
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

export const updateServiceInCollection = createAsyncThunk(
    'store/updateServiceIncollection',
    async ({token, is_pinned, sort_order, coid, serviceid}, {rejectWithValue}) => {
        try {
            const response = await axios.patch(`${API_URL}/stores/collections/${coid}/services/${serviceid}`, {
                sort_order,
                is_pinned
            },{
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

export const deleteServiceInCollection = createAsyncThunk(
    'store/deleteServiceCollection',
    async ({token, colid, serviceid}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/collections/${colid}/services/${serviceid}`, {
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

export const deleteProductCollection = createAsyncThunk(
    'store/deleteProductCollection',
    async ({token, id}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/collections/${id}`, {
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

export const updateCollection = createAsyncThunk(
    'store/updateCollection',
    async ({token, collection_name, collection_type, layout_type, is_pinned, is_visible, sort_order, id }, {rejectWithValue}) => {
        try {
            const response = await axios.put(`${API_URL}/stores/collections/${id}`, {
                collection_name,
                collection_type,
                layout_type,
                is_pinned,
                is_visible,
                sort_order
            },{
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

export const deleteCollection = createAsyncThunk(
    'store/deleteCollection',
    async ({token, id}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/collections/${id}`, {
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

export const createProduct = createAsyncThunk(
    'store/createProduct',
    async ({token, formData, id}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/${id}/products`, formData, {
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

export const updateProduct = createAsyncThunk(
    'store/updateProduct',
    async ({token, formData, id, productId}, { rejectWithValue }) => {
        try {
            const response = await axios.put(`${API_URL}/stores/online/${id}/products/${productId}`, formData, {
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
)

export const getAllProductForCollection = createAsyncThunk(
    'store/getProductForCollection',
    async ({token, id, page = 1, limit = 20}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/stores/online/${id}/products?page=${page}&limit=${limit}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            localStorage.setItem("products", JSON.stringify(response.data.data.products))
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const getProductOfSingleCollection = createAsyncThunk(
    'store/getProductOfSingleCollection',
    async ({token, id, page = 1, limit = 20}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/stores/collections/${id}/products?page=${page}&limit=${limit}`, {
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
)

export const deleteProductFromStore = createAsyncThunk(
    'store/deleteProduct',
    async ({token, id, productId}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/online/${id}/products/${productId}`, {
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

export const publishProductToStore = createAsyncThunk(
    'store/publishProduct',
    async ({token, id, productId, value}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/online/${id}/products/${productId}/${value}`, {}, {
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

export const unpublishProductToStore = createAsyncThunk(
    'store/unpublishProduct',
    async ({token, id, productId, value}, {rejectWithValue}) => {
        try {
            const response = await axios.delete(`${API_URL}/stores/online/${id}/products/${productId}?unpublish_only=${value}`, {
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

export const productAddedToCollection = createAsyncThunk(
    'store/addedToCollection',
    async ({token, product_id, is_pinned, sort_order, id}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/collections/${id}/products`, {
                product_id,
                is_pinned,
                sort_order
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

export const productImageForCollection = createAsyncThunk(
    'store/productImage',
    async ({token, id}, {rejectWithValue}) => {
        try {
            const response = await axios.get(`${API_URL}/stores/collections/${id}`, {
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

export const addBulkImageProductToCollection = createAsyncThunk(
    'store/bulkProductImage',
    async ({token, product_ids, id}, {rejectWithValue}) => {
        try {
            const response = await axios.post(`${API_URL}/stores/collections/${id}/products/bulk`, {
                product_ids
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

export const removeProductFromCollection = createAsyncThunk(
    'store/removeProductFromCollection',
    async ({token, collectionId, productId}, {rejectWithValue}) => {
        try {
            const endpoint = `${API_URL}/stores/collections/${collectionId}/products/${productId}`;
            const response = await axios.delete(endpoint, {
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

export const updateSortOrderPinned = createAsyncThunk(
    'store/sortOrderPinned',
    async ({token, sort_order, is_pinned, collectionid, productid}, {rejectWithValue}) => {
        try {
            const endpoint = `${API_URL}/stores/collections/${collectionid}/products/${productid}`;
            const response = await axios.patch(endpoint, {
                is_pinned,
                sort_order
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

export const getStorePreview = createAsyncThunk(
    'store/getStorePreview',
    async ({token}, {rejectWithValue}) => {
        try {
           const response = await axios.get(`${API_URL}/stores/online/preview`, {
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

const storeSlice = createSlice({
    name: 'store',
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
        .addCase(createOnlineStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(createOnlineStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
            state.message = action.payload;
        })
        .addCase(createOnlineStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateStoreLinks.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateStoreLinks.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload,
            state.message = action.payload
        })
        .addCase(updateStoreLinks.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(createService.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(createService.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
            state.message = action.payload
        })
        .addCase(createService.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateService.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateService.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
            state.message = action.payload
        })
        .addCase(updateService.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getAllServices.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getAllServices.fulfilled, (state, action) => {
            state.loading = false;
            state.allStore = action.payload;
        })
        .addCase(getAllServices.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getSingleStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getSingleStore.fulfilled, (state, action) => {
            state.loading = false;
            state.singleStore = action.payload;
        })
        .addCase(getSingleStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deleteService.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deleteService.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deleteService.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getAllCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getAllCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.collections = action.payload;
        })
        .addCase(getAllCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(createCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(createCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(createCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(addServiceToCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(addServiceToCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(addServiceToCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getServiceCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getServiceCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.collist = action.payload;
        })
        .addCase(getServiceCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(addBulkServicesToCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(addBulkServicesToCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(addBulkServicesToCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateServiceInCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateServiceInCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updateServiceInCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deleteServiceInCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deleteServiceInCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deleteServiceInCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updateCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deleteCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deleteCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deleteCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(createProduct.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(createProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(createProduct.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getAllProductForCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getAllProductForCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.collectionProducts = {
                data: action.payload.data.products || [],
                pagination: action.payload.data.pagination || {
                    page: 1,
                    limit: 20,
                    total_pages: 0,
                    total_items: 0
                },
                total: action.payload.data.total || 0
            };
        })
        .addCase(getAllProductForCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getProductOfSingleCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getProductOfSingleCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.singleCollectionProducts = {
                data: action.payload.data.products || [],
                pagination: action.payload.data.pagination || {
                    page: 1,
                    limit: 20,
                    total_pages: 0,
                    total_items: 0
                },
                total: action.payload.data.total || 0
            };
        })
        .addCase(getProductOfSingleCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateProduct.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updateProduct.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deleteProductFromStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deleteProductFromStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deleteProductFromStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(publishProductToStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(publishProductToStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(publishProductToStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(unpublishProductToStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(unpublishProductToStore.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(unpublishProductToStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getCollectionForProduct.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getCollectionForProduct.fulfilled, (state, action) => {
            state.loading = false;
            state.collectionProduct = action.payload;
        })
        .addCase(getCollectionForProduct.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(productAddedToCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(productAddedToCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(productAddedToCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(productImageForCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(productImageForCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.colDetails = action.payload;
        })
        .addCase(productImageForCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(addBulkImageProductToCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(addBulkImageProductToCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(addBulkImageProductToCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(removeProductFromCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(removeProductFromCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(removeProductFromCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateSortOrderPinned.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateSortOrderPinned.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updateSortOrderPinned.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(deleteProductCollection.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(deleteProductCollection.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(deleteProductCollection.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(storeUpdateColors.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(storeUpdateColors.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(storeUpdateColors.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(updateStoreImages.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(updateStoreImages.fulfilled, (state, action) => {
            state.loading = false;
            state.success = action.payload;
        })
        .addCase(updateStoreImages.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })
        .addCase(getMyOnlineStore.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getMyOnlineStore.fulfilled, (state, action) => {
            state.loading = false;
            state.myStore = action.payload;
        })
        .addCase(getMyOnlineStore.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        }) 
        .addCase(getStorePreview.pending, (state) => {
            state.loading = true;
            state.success = false;
            state.error = null;
        })
        .addCase(getStorePreview.fulfilled, (state, action) => {
            state.loading = false;
            state.previewDetails = action.payload;
        })
        .addCase(getStorePreview.rejected, (state, action) => {
            state.loading = false;
            state.success = false;
            state.error = action.payload;
        })   

    }
})

export const { resetStatus } = storeSlice.actions;
export default storeSlice.reducer;
