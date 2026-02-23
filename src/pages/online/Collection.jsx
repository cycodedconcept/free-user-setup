import React, {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createCollection, resetStatus, getCollectionForProduct, productAddedToCollection, productImageForCollection, getAllProductForCollection, addBulkImageProductToCollection, removeProductFromCollection, updateSortOrderPinned, updateCollection, getProductOfSingleCollection, deleteProductCollection } from '../../slice/onlineStoreSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen, faPlus, faTableColumns, faThumbtack, faTrashCan, faEllipsisV, faSort } from '@fortawesome/free-solid-svg-icons';
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';

const Collection = ({setItemData}) => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");

  const { loading, error, success, colDetails, collectionProducts, singleCollectionProducts } = useSelector((state) => state.store);
  const [cmode, setCmode] = useState(false);
  const [addButton, setAddButton] = useState(false);
  const [colData, setColData] = useState([]);
  const [hasCollection, setHasCollection] = useState(false);
  const [mode, setMode] = useState({isOpen: false, collectionId: null});
  const [productItem, setProductItem] = useState([]);
  const [visibleCollections, setVisibleCollections] = useState({});
  const [collectionServices, setCollectionServices] = useState({});
  const [tcol, setTcol] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkCurrentPage, setBulkCurrentPage] = useState(1);
  const [bulkCollectionId, setBulkCollectionId] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [sortModalData, setSortModalData] = useState({collectionId: null, productId: null, collectionProductId: null});
  const [sortData, setSortData] = useState({
    sort_order: '',
    is_pinned: false
  });
  const [editMode, setEditMode] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState(null);
  const [editCollectionData, setEditCollectionData] = useState({
    collection_name: '',
    collection_type: '',
    layout_type: '',
    is_pinned: false,
    is_visible: false
  });
  const [pdata, setPdata] = useState({
    product_id: '',
    is_pinned: false,
    sort_order: ''
  })

  const hideModal = () => {
    setCmode(false)
    setMode({isOpen: false, collectionId: null})
    setBulkModalOpen(false)
    setSelectedProducts([])
    setBulkCurrentPage(1)
    setSortModalOpen(false)
    setSortModalData({collectionId: null, productId: null, collectionProductId: null})
    setSortData({sort_order: '', is_pinned: false})
    setEditMode(false)
    setEditingCollectionId(null)
    setEditCollectionData({
      collection_name: '',
      collection_type: '',
      layout_type: '',
      is_pinned: false,
      is_visible: false
    })
  }

  const [collectionData, setCollectionData] = useState({
    collection_name: '',
    collection_type: '',
    layout_type: '',
    is_pinned: false,
    is_visible: false
  })


  useEffect(() => {
    if (token) {
      dispatch(getCollectionForProduct({ token, id: getId || '7'}));
      dispatch(getAllProductForCollection({ token, id: getId || '7', page: currentPage, limit: 20}))
    }
  }, [token, dispatch, currentPage])

  const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;

    if (dataset.form === "loadCollection") {
      setCollectionData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }

    if (dataset.form === "addProduct") {
      setPdata(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  };

  

  useEffect(() => {
    if (cmode || mode.isOpen) {
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        window.scrollTo(0, scrollY);
      };
    }
  }, [cmode, mode.isOpen]);

  useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('products')) || [];
    setProductItem(itemValue);
  }, [])

  useEffect(() => {
    const getCollectionItem = JSON.parse(localStorage.getItem("allcollectionsProduct"));
    if (Array.isArray(getCollectionItem)) {
      setColData(getCollectionItem);
      setTcol(getCollectionItem.length)
      setAddButton(true);
      setItemData(false);
    }
  }, [])

  const addCollection = async (e) => {
    e.preventDefault();

    const { collection_name, collection_type, layout_type, is_pinned, is_visible } = collectionData;

    if (!collection_name || !collection_type) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please fill in all fields",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    // Convert boolean values to 1 or 0, and set layout_type to 'list'
    const dataToSend = {
      collection_name,
      collection_type,
      layout_type,
      is_pinned: is_pinned ? 1 : 0,
      is_visible: is_visible ? 1 : 0
    };

    dispatch(createCollection({token, id: getId || '7', ...dataToSend}))
  }

  useEffect(() => {
    if (success) {
        Swal.fire({
            icon: "success",
            title: "added successfull",
            text: success.message,
            confirmButtonColor: "#0273F9",
        }).then(() => {
            dispatch(resetStatus());
            // Add the new collection to colData immediately
            if (success.data?.collection) {
              setColData(prev => [...prev, success.data.collection]);
            } else if (success.data) {
              setColData(prev => [...prev, success.data]);
            }
            setHasCollection(false);
            hideModal();
            setCollectionData({
                collection_name: '',
                collection_type: '',
                layout_type: '',
                is_pinned: false,
                is_visible: false
            })
            dispatch(getCollectionForProduct({ token, id: getId || '7'}));
        })
    }

    if (error) {
        Swal.fire({
            icon: "error",
            title: "failed to create collection",
            text: error.message,
            confirmButtonColor: "#0273F9",
        }).then(() => {
            dispatch(resetStatus());
        });
    }
  }, [success, error, dispatch])

  const putProduct = async (e) => {
    e.preventDefault();
    const collectionId = mode.collectionId;

    const { product_id, is_pinned, sort_order } = pdata;

    if (!product_id) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please fill in all fields",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    const dataSend = {
      product_id,
      is_pinned,
      sort_order
    };

    dispatch(productAddedToCollection({token, id: collectionId, ...dataSend}))
  }

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: 'success',
        title: "added successful",
        text: success.message,
        confirmButtonColor: "#0273F9",
      }).then(async () => {
        dispatch(resetStatus());
        dispatch(getCollectionForProduct({ token, id: getId || '7'}));
        
        // Refresh the specific collection's products
        if (mode.collectionId) {
          try {
            const response = await dispatch(productImageForCollection({token, id: mode.collectionId})).unwrap();
            setCollectionServices(prev => ({
              ...prev,
              [mode.collectionId]: response.data?.collection?.StoreCollectionProducts || []
            }));
          } catch (err) {
            console.error('Error refreshing collection:', err);
          }
        }
        
        hideModal();
        setPdata({
          product_id: '',
          is_pinned: false,
          sort_order: ''
        })
      })
    }
    if (error) {
      Swal.fire({
        icon: "error",
        title: "failed to add product collection",
        text: error.message,
        confirmButtonColor: "#0273F9",
      }).then(() => {
        dispatch(resetStatus());
      });
    }
  }, [success, error, dispatch, mode.collectionId])

  const handleCollectionCheckbox = async (e, id) => {
    const isChecked = e.target.checked;
    console.log('Collection ID:', id);
    setVisibleCollections(prev => ({
      ...prev,
      [id]: isChecked
    }));

    if (isChecked && !collectionServices[id]) {
      try {
        const response = await dispatch(productImageForCollection({token, id})).unwrap();
        setCollectionServices(prev => ({
          ...prev,
          [id]: response.data?.collection?.StoreCollectionProducts || []
        }));
      } catch (error) {
        console.error('Error fetching collection services:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load collection data. Please check your backend endpoint.',
          confirmButtonColor: '#0273F9'
        });
      }
    }
    
  }

  const openBulkProductModal = (collectionId) => {
    setBulkCollectionId(collectionId);
    setBulkModalOpen(true);
    setBulkCurrentPage(1);
    setSelectedProducts([]);
  }

  const openEditCollection = (collection) => {
    setEditingCollectionId(collection.id);
    setEditCollectionData({
      collection_name: collection.collection_name,
      collection_type: collection.collection_type,
      layout_type: collection.layout_type,
      is_pinned: collection.is_pinned ? true : false,
      is_visible: collection.is_visible ? true : false
    });
    setEditMode(true);
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditCollectionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  const updateCollectionSubmit = async (e) => {
    e.preventDefault();
    const { collection_name, collection_type, layout_type, is_pinned, is_visible } = editCollectionData;

    if (!collection_name || !collection_type) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please fill in all fields",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    const dataToSend = {
      collection_name,
      collection_type,
      layout_type,
      is_pinned: is_pinned ? 1 : 0,
      is_visible: is_visible ? 1 : 0
    };

    dispatch(updateCollection({token, id: editingCollectionId, ...dataToSend}))
  }

  useEffect(() => {
    if (success && editMode) {
      Swal.fire({
        icon: "success",
        title: "Collection Updated",
        text: success.message,
        confirmButtonColor: "#0273F9",
      }).then(async () => {
        dispatch(resetStatus());
        
        // Update the local colData state immediately
        setColData(prev => prev.map(col => {
          if (col.id === editingCollectionId) {
            return {
              ...col,
              ...editCollectionData,
              is_pinned: editCollectionData.is_pinned ? 1 : 0,
              is_visible: editCollectionData.is_visible ? 1 : 0
            };
          }
          return col;
        }));
        
        // Also refresh from API
        dispatch(getCollectionForProduct({ token, id: getId || '7'}));
        
        hideModal();
      })
    }
  }, [success, error, dispatch, editMode, editingCollectionId, editCollectionData])

  const handleProductCheckbox = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }

  const handleBulkProductSubmit = async () => {
    if (selectedProducts.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Products Selected',
        text: 'Please select at least one product to add to the collection',
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    Swal.fire({
      title: "Adding bulk products...",
      text: "Please wait while we process your request.",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
          Swal.showLoading();
      },
    });

    dispatch(addBulkImageProductToCollection({token, id: bulkCollectionId, product_ids: selectedProducts}))
  }

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: "success",
        title: "added successfull",
        text: success.message,
        confirmButtonColor: "#0273F9",
      }).then(async () => {
        dispatch(resetStatus());
        dispatch(getCollectionForProduct({ token, id: getId || '7'}));
        
        // Refresh the specific collection's products
        if (bulkCollectionId) {
          try {
            const response = await dispatch(productImageForCollection({token, id: bulkCollectionId})).unwrap();
            setCollectionServices(prev => ({
              ...prev,
              [bulkCollectionId]: response.data?.collection?.StoreCollectionProducts || []
            }));
          } catch (err) {
            console.error('Error refreshing collection:', err);
          }
        }
        
        hideModal();
      })
    }

    if (error) {
      Swal.fire({
        icon: "error",
        title: "failed to add bulk products",
        text: error.message,
        confirmButtonColor: "#0273F9",
      }).then(() => {
        dispatch(resetStatus());
      });
    }
  }, [success, error, dispatch, bulkCollectionId])

  const handleDeleteCollection = async (collectionId) => {
    Swal.fire({
      title: 'Confirm Delete',
      text: 'Are you sure you want to delete this collection? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#78716C',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove from UI immediately
        handleCollectionDelete(collectionId);
        // Send delete request to API
        dispatch(deleteProductCollection({token, id: collectionId}));
      }
    })
  }

  const handleDeleteProductFromCollection = async (collectionId, collectionProductId) => {
    Swal.fire({
      title: 'Confirm Delete',
      text: 'Are you sure you want to remove this product from the collection?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#78716C',
      confirmButtonText: 'Yes, delete it'
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(removeProductFromCollection({token, collectionId, productId: collectionProductId}))
      }
    })
  }

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Product Removed',
        text: 'Product has been removed from the collection.',
        confirmButtonColor: '#0273F9'
      }).then(async () => {
        dispatch(resetStatus());
        // Refresh the collection products
        if (bulkCollectionId) {
          try {
            const response = await dispatch(productImageForCollection({token, id: bulkCollectionId})).unwrap();
            setCollectionServices(prev => ({
              ...prev,
              [bulkCollectionId]: response.data?.collection?.StoreCollectionProducts || []
            }));
          } catch (err) {
            console.error('Error refreshing collection:', err);
          }
        }
        // Also refresh all visible collections
        Object.keys(visibleCollections).forEach(async (collId) => {
          if (visibleCollections[collId]) {
            try {
              const response = await dispatch(productImageForCollection({token, id: collId})).unwrap();
              setCollectionServices(prev => ({
                ...prev,
                [collId]: response.data?.collection?.StoreCollectionProducts || []
              }));
            } catch (err) {
              console.error('Error refreshing collection:', err);
            }
          }
        });
      });
    }
  }, [success, dispatch, bulkCollectionId, visibleCollections])

  const openSortModal = (collectionId, productId, collectionProductId) => {
    setSortModalData({collectionId, productId, collectionProductId});
    setSortModalOpen(true);
  }

  const handleSortChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSortData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSortSubmit = async (e) => {
    e.preventDefault();
    if (!sortData.sort_order) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please select a sort order",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    dispatch(updateSortOrderPinned({
      token,
      collectionid: sortModalData.collectionId,
      productid: sortModalData.productId,
      sort_order: sortData.sort_order,
      is_pinned: sortData.is_pinned
    }))
  }

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Updated Successfully',
        text: 'Sort order and pin status updated.',
        confirmButtonColor: '#0273F9'
      }).then(async () => {
        dispatch(resetStatus());
        // Refresh the collection products
        if (sortModalData.collectionId) {
          try {
            const response = await dispatch(productImageForCollection({token, id: sortModalData.collectionId})).unwrap();
            setCollectionServices(prev => ({
              ...prev,
              [sortModalData.collectionId]: response.data?.collection?.StoreCollectionProducts || []
            }));
          } catch (err) {
            console.error('Error refreshing collection:', err);
          }
        }
        hideModal();
      });
    }
  }, [success, dispatch, sortModalData.collectionId])

  const [deletedCollectionId, setDeletedCollectionId] = useState(null);

  useEffect(() => {
    if (success && success.message && (success.message.toLowerCase().includes('delete') || success.message.toLowerCase().includes('removed'))) {
      // Store the deleted ID from the response or from our state
      Swal.fire({
        icon: 'success',
        title: 'Deleted Successfully',
        text: 'Collection has been deleted.',
        confirmButtonColor: '#0273F9'
      }).then(() => {
        dispatch(resetStatus());
      });
    }
  }, [success, dispatch])

  // Handle deletion by removing from colData and collectionServices
  const handleCollectionDelete = (collectionId) => {
    setColData(prev => prev.filter(col => col.id !== collectionId));
    setCollectionServices(prev => {
      const newServices = { ...prev };
      delete newServices[collectionId];
      return newServices;
    });
    setVisibleCollections(prev => {
      const newVisible = { ...prev };
      delete newVisible[collectionId];
      return newVisible;
    });
  }

  const allProducts = collectionProducts?.data || [];
  const productsPerPage = 20;
  const totalBulkPages = collectionProducts?.pagination?.total_pages || 1;
  const startIdx = (bulkCurrentPage - 1) * productsPerPage;
  const paginatedProducts = allProducts.slice(startIdx, startIdx + productsPerPage);

  return (
    <>
      <div style={{background: '#fff', border: '1px solid #eee', borderRadius: '8px'}} className='px-3 py-2'>
        <div className='mt-2'>
          <p className="mx mb-2 p-0">Organize Collections</p>
          <p className="mb-0 mb-3" style={{ fontSize: '13px', color: '#78716C' }}>
            Group your products into collections to make them easy to browse.
          </p>

        </div>

        <div className="d-flex justify-content-between my-4">
          <div className='mt-3'>
            <p className='m-0'>{colData.length} {colData.length > 1 ? 'Collections' : 'Collection'} created</p>
          </div>

          {addButton && (
            <div>
              <button className={`${styles['si-btn']} px-5 py-3`} onClick={() => {setCmode(true)}}>Add Collection</button>
            </div>
          )}
          
        </div>

        {hasCollection ? (
          <>
            <div className="outer-box p-2" style={{background: '#fff', borderRadius: '12px', border: '2px dashed #EEEEEE'}}>
              <div className="inner-box text-center p-5" style={{borderRadius: '12px'}}>
                <p style={{color: '#78716C'}}>No collections created yet</p>
                <button className={`btn ${styles['add-btn']} px-3`} onClick={() => setCmode(true)} type='button'><span style={{fontSize: '17px'}}>+</span> Create Your First Collection</button>
              </div>
            </div>
          </>
        ) : (
        <>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : error ? (
            <p className="text-danger text-center">Something went wrong</p>
          ) : Array.isArray(colData) && colData.length > 0 ? (
            colData.map((collect) => (
              <div 
                key={collect.id} 
                style={{
                    background: '#F4F4F4',
                    border: '1px solid #EEEEEE',
                    borderRadius: '10px',
                    position: 'relative',
                    marginTop: '8px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    paddingLeft: '12px',
                    paddingRight: '12px'
                }}>
                <div className={`d-flex justify-content-between pe-1 ${styles.vala}`}>
                  <div>
                    <h6>
                      {collect.collection_name} 
                      <FontAwesomeIcon icon={faPen} style={{color: '#78716C', cursor: 'pointer'}} className='ms-2' onClick={() => openEditCollection(collect)}/>
                      <FontAwesomeIcon icon={faPlus} style={{color: '#0273F9', cursor: 'pointer'}} className='ms-2' title="Bulk add products" onClick={() => openBulkProductModal(collect.id)}/>
                    </h6>
                  </div>
                  <div>
                    <div className='d-flex gap-3'>
                      <p style={{color: '#78716C'}}><FontAwesomeIcon icon={faTableColumns} style={{color: '#78716C'}}/> Layout</p>
                      <FontAwesomeIcon icon={faThumbtack} style={{color: '#78716C'}} className='mt-1' title="Collection has pinned services"/>
                      <FontAwesomeIcon icon={faTrashCan} className={`${styles.icon} ${styles.red} mt-1`} style={{color: '#DC2626', cursor: 'pointer'}} onClick={() => handleDeleteCollection(collect.id)}/>
                      <label className={`${styles.switch} mt-1`}>
                          <input 
                            type="checkbox" 
                            checked={visibleCollections[collect.id] || false}
                            onChange={(e) => handleCollectionCheckbox(e, collect.id)}
                          />
                          <span className={`${styles.slider} round`}></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className={`position-absolute ${styles.sido}`} style={{top: '29px'}}>
                  <FontAwesomeIcon icon={faEllipsisV} className='me-1' style={{color: '#78716C', width: 'auto'}}/>
                  <FontAwesomeIcon icon={faEllipsisV} style={{color: '#78716C', width: 'auto'}}/>
                </div>

                {visibleCollections[collect.id] && (
                <div className="row p-3 m-3 rounded-3" style={{background: '#fafafa'}}>
                  {Array.isArray(collectionServices[collect.id]) &&
                  collectionServices[collect.id].length > 0 ? (
                    collectionServices[collect.id].map((item) => {
                      return (
                      <div 
                        className="col-md-4" 
                        key={item.id} 
                        style={{position: 'relative', aspectRatio: '1'}}
                        onMouseEnter={() => setHoveredProductId(item.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                      >
                        <img src={item.Product?.image_url} alt="" className='w-100 rounded-2' style={{objectFit: 'cover'}}/>
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '15px',
                          background: '#fff',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FontAwesomeIcon 
                            icon={faThumbtack} 
                            style={{
                              color: item.is_pinned ? '#0273F9' : '#999',
                              fontSize: '10px',
                              transform: 'rotate(45deg)'
                            }}
                          />
                        </div>
                        {hoveredProductId === item.id && (
                          <>
                            <div 
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '15px',
                                background: '#fff',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleDeleteProductFromCollection(collect.id, item.product_id || item.Product?.id)}
                            >
                              <FontAwesomeIcon 
                                icon={faTrashCan} 
                                style={{
                                  color: '#DC2626',
                                  fontSize: '10px'
                                }}
                              />
                            </div>
                            <div 
                              style={{
                                position: 'absolute',
                                top: '4px',
                                left: '45px',
                                background: '#fff',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => openSortModal(collect.id, item.id, item.product_id)}
                            >
                              <FontAwesomeIcon 
                                icon={faSort} 
                                style={{
                                  color: '#78716C',
                                  fontSize: '10px'
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                    })
                  ) : (
                    <p
                      className="text-center text-muted"
                      style={{ padding: "20px" }}
                    >
                      No Product found in this collection
                    </p>
                  )}
                </div>
                )}

                <div className="d-flex justify-content-between mx-2">
                  <div>
                    <small style={{color: '#1C1917', fontSize: '12px'}} className='nx mt-4 mb-0'>Products in collection</small>
                    <small style={{color: '#1C1917', fontSize: '12px'}} className='nx d-block'>{collect.totalItems} Product added</small>
                  </div>
                  <div className="text-end mt-2">
                    <button className={`${styles['si-btn']} px-4 mx rounded-2`} style={{fontSize: '12px'}} onClick={() => setMode({isOpen: true, collectionId: collect.id})}>Add Product</button>
                  </div>
                </div>
                
            </div>
            ))
          ) : (
            <p className="text-center text-muted">No collection available</p>
          )}
        </>
       )}
      </div>

      
      

      {cmode && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                  <h6>Add New Collections for Product</h6>
                  <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#FFF'}}>
                    <form onSubmit={addCollection}>

                        <div className="mb-3">
                            <label for="formGroupExampleInput" className="form-label">Collection Name</label>
                            <input type="text" className={styles['input-item']} placeholder="E.g., My Collection" name='collection_name' value={collectionData.collection_name} onChange={handleChange} data-form="loadCollection"/>
                        </div>

                        <div className="mb-3">
                            <label for="formGroupExampleInput" className='mb-2'>Collection Type</label>
                            <select className={styles['input-item']} data-form="loadCollection" name='collection_type' value={collectionData.collection_type} onChange={handleChange}>
                                <option value="">-select service type-</option>
                                <option value="service">Service</option>
                                <option value="product">Product</option>
                            </select>
                        </div>

                        <div className="mb-3">
                            <label for="formGroupExampleInput" className='mb-2'>Layout</label>
                            <select className={styles['input-item']} data-form="loadCollection" name='layout_type' value={collectionData.layout_type} onChange={handleChange}>
                                <option value="">-select layout type-</option>
                                <option value="grid">Grid</option>
                                <option value="list">List</option>
                                <option value="carousel">Carousel</option>
                            </select>
                        </div>

                        <hr className='m-0' style={{border: '1px solid #eee'}}/>

                        <div className={`px-3`}>
                            <label className={`${styles['custom-checkbox-wrapper']}`}>
                            <input 
                                className={`${styles['custom-checkbox']}`}
                                data-form="loadCollection"
                                type="checkbox" 
                                id="hideSocial"
                                name='is_visible'
                                checked={collectionData.is_visible}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.5)' }}
                            />
                            <span className={styles.checkmark}></span>
                            <span className="label-text nx">Pin this collection</span>
                            </label>
                        </div>

                        <div className={`px-3 py-3 mb-2`}>
                            <label className={`${styles['custom-checkbox-wrapper']}`}>
                            <input 
                                className={`${styles['custom-checkbox']}`}
                                data-form="loadCollection"
                                type="checkbox" 
                                id="pinnedToggle"
                                name='is_pinned'
                                checked={collectionData.is_pinned}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.5)' }}
                            />
                            <span className={styles.checkmark}></span>
                            <span className="label-text nx">Make this collection visible</span>
                            </label>
                        </div>


                        <div className="text-end mt-4">
                            <button className={`${styles['sk-btn']} me-2`}>Cancel</button>
                            <button className={`${styles['si-btn']} btn-lg px-5 py-3`}>
                                {
                                    loading ?(
                                        <>
                                        <div className="spinner-border spinner-border-sm text-light" role="status">
                                            <span className="sr-only"></span>
                                        </div>
                                        <span>Creating... </span>
                                        </>
                                        
                                    ): (
                                        'Add Collection'
                                    )
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
       </>
      )}

      {mode.isOpen && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between p-3">
                <h6>Add Product to Collection</h6>
                <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
              </div>
              <div className={`${styles['modal-body']} p-3`} style={{background: '#FFF'}}>
                <form onSubmit={putProduct}>
                  <div className="mb-3">
                      <label for="formGroupExampleInput" className='mb-2'>Products</label>
                      <select className={styles['input-item']} data-form="addProduct" name='product_id' value={pdata.product_id} onChange={handleChange}>
                        <option value="">-add product-</option>
                        {productItem.map((item) => 
                          <option value={item.id} key={item.id}>{item.name}</option>
                        )}
                      </select>
                  </div>

                  <hr className='m-0' style={{border: '1px solid #eee'}}/>

                  <div className={`px-3`}>
                      <label className={`${styles['custom-checkbox-wrapper']}`}>
                      <input 
                          className={`${styles['custom-checkbox']}`}
                          data-form="addProduct"
                          type="checkbox" 
                          id="hideSocial"
                          name='is_pinned'
                          checked={pdata.is_pinned}
                          onChange={handleChange}
                          style={{ transform: 'scale(1.5)' }}
                      />
                      <span className={styles.checkmark}></span>
                      <span className="label-text nx">Pin this collection</span>
                      </label>
                  </div>

                  <div className="row align-items-center mb-3">
                    <div className="col-auto">
                        <label htmlFor="sortOrderSelect" style={{color: '#78716C', fontSize: '13px', marginBottom: 0}}>Sort Order</label>
                    </div>
                    <div className="col-auto">
                        <select 
                          id="sortOrderSelect"
                          className={styles['input-item']} 
                          data-form="addProduct" 
                          name='sort_order' 
                          value={pdata.sort_order}
                          onChange={handleChange}
                          style={{ fontSize: '12px' }}
                      >
                          <option value="">-select-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                    </div>
                  </div>
                  <div className="text-end mt-4">
                    <button className={`${styles['sk-btn']} me-2`}>Cancel</button>
                    <button className={`${styles['si-btn']} btn-lg px-5 py-3`}>
                      {
                        loading ?(
                            <>
                            <div className="spinner-border spinner-border-sm text-light" role="status">
                                <span className="sr-only"></span>
                            </div>
                            <span>Adding... </span>
                            </>
                            
                        ): (
                          'Add Product Collection'
                        )
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {bulkModalOpen && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between p-3">
                <h6>Select Multiple Products to Add</h6>
                <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{cursor: 'pointer'}}/>
              </div>
              <div className={`${styles['modal-body']} p-3`}>
                <div className="row g-3">
                  {paginatedProducts && paginatedProducts.length > 0 ? (
                    paginatedProducts.map((product) => (
                      <div className="col-md-3 col-sm-6" key={product.id}>
                        <div style={{
                          position: 'relative',
                          border: selectedProducts.includes(product.id) ? '2px solid #0273F9' : '1px solid #ddd',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedProducts.includes(product.id) ? '#f0f7ff' : '#fff',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleProductCheckbox(product.id)}
                        >
                          <div style={{ borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                            <img src={product.image_url} alt={product.name} style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              display: 'block'
                            }}/>
                          </div>
                          <div style={{padding: '10px'}}>
                            <small style={{display: 'block', marginBottom: '5px', fontSize: '12px'}} className='text-truncate'>{product.name}</small>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <div>
                                <input 
                                  type="checkbox" 
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={() => handleProductCheckbox(product.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className={styles['glow-checkbox']}
                                />
                              </div>
                              <small style={{color: '#0273F9', fontWeight: 'bold'}}>ID: {product.id}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12">
                      <p className="text-center text-muted">No products available</p>
                    </div>
                  )}
                </div>

                {totalBulkPages > 1 && (
                  <div className="d-flex justify-content-center mt-4 gap-2">
                    <button 
                      onClick={() => setBulkCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={bulkCurrentPage === 1}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: bulkCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        backgroundColor: bulkCurrentPage === 1 ? '#f5f5f5' : '#fff',
                        opacity: bulkCurrentPage === 1 ? 0.5 : 1
                      }}
                    >
                      Previous
                    </button>
                    {Array.from({length: totalBulkPages}, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setBulkCurrentPage(page)}
                        style={{
                          padding: '8px 12px',
                          border: bulkCurrentPage === page ? '2px solid #0273F9' : '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: bulkCurrentPage === page ? '#0273F9' : '#fff',
                          color: bulkCurrentPage === page ? '#fff' : '#000',
                          fontWeight: bulkCurrentPage === page ? 'bold' : 'normal'
                        }}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setBulkCurrentPage(prev => Math.min(totalBulkPages, prev + 1))}
                      disabled={bulkCurrentPage === totalBulkPages}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: bulkCurrentPage === totalBulkPages ? 'not-allowed' : 'pointer',
                        backgroundColor: bulkCurrentPage === totalBulkPages ? '#f5f5f5' : '#fff',
                        opacity: bulkCurrentPage === totalBulkPages ? 0.5 : 1
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                  <small style={{color: '#78716C'}}>{selectedProducts.length} product(s) selected</small>
                  <div className="gap-2" style={{display: 'flex'}}>
                    <button 
                      className={`${styles['sk-btn']}`}
                      onClick={hideModal}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button 
                      className={`${styles['si-btn']}`}
                      onClick={handleBulkProductSubmit}
                      type="button"
                    >
                      Add Selected ({selectedProducts.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {sortModalOpen && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between p-3">
                <h6>Update Sort Order and Pin Status</h6>
                <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{cursor: 'pointer'}}/>
              </div>
              <div className={`${styles['modal-body']} p-3`}>
                <form onSubmit={handleSortSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Sort Order</label>
                    <select 
                      className={styles['input-item']} 
                      name='sort_order' 
                      value={sortData.sort_order}
                      onChange={handleSortChange}
                    >
                      <option value="">-select sort order-</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className={`${styles['custom-checkbox-wrapper']}`}>
                      <input 
                        className={styles['custom-checkbox']}
                        type="checkbox" 
                        name='is_pinned'
                        checked={sortData.is_pinned}
                        onChange={handleSortChange}
                        style={{ transform: 'scale(1.5)' }}
                      />
                      <span className={styles.checkmark}></span>
                      <span className="label-text nx">Pin this product</span>
                    </label>
                  </div>

                  <div className="text-end mt-4">
                    <button type="button" className={`${styles['sk-btn']} me-2`} onClick={hideModal}>Cancel</button>
                    <button type="submit" className={`${styles['si-btn']}`}>Update</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {editMode && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between p-3">
                <h6>Edit Collection</h6>
                <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{cursor: 'pointer'}}/>
              </div>
              <div className={`${styles['modal-body']} p-3`}>
                <form onSubmit={updateCollectionSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Collection Name</label>
                    <input 
                      type="text" 
                      className={styles['input-item']} 
                      placeholder="E.g., My Collection" 
                      name='collection_name' 
                      value={editCollectionData.collection_name}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className='mb-2'>Collection Type</label>
                    <select 
                      className={styles['input-item']} 
                      name='collection_type' 
                      value={editCollectionData.collection_type}
                      onChange={handleEditChange}
                    >
                      <option value="">-select collection type-</option>
                      <option value="service">Service</option>
                      <option value="product">Product</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className='mb-2'>Layout</label>
                    <select 
                      className={styles['input-item']} 
                      name='layout_type' 
                      value={editCollectionData.layout_type}
                      onChange={handleEditChange}
                    >
                      <option value="">-select layout type-</option>
                      <option value="grid">Grid</option>
                      <option value="list">List</option>
                      <option value="carousel">Carousel</option>
                    </select>
                  </div>

                  <hr className='m-0' style={{border: '1px solid #eee'}}/>

                  <div className={`px-3`}>
                    <label className={`${styles['custom-checkbox-wrapper']}`}>
                      <input 
                        className={styles['custom-checkbox']}
                        type="checkbox" 
                        name='is_visible'
                        checked={editCollectionData.is_visible}
                        onChange={handleEditChange}
                        style={{ transform: 'scale(1.5)' }}
                      />
                      <span className={styles.checkmark}></span>
                      <span className="label-text nx">Make this collection visible</span>
                    </label>
                  </div>

                  <div className={`px-3 py-3 mb-2`}>
                    <label className={`${styles['custom-checkbox-wrapper']}`}>
                      <input 
                        className={styles['custom-checkbox']}
                        type="checkbox" 
                        name='is_pinned'
                        checked={editCollectionData.is_pinned}
                        onChange={handleEditChange}
                        style={{ transform: 'scale(1.5)' }}
                      />
                      <span className={styles.checkmark}></span>
                      <span className="label-text nx">Pin this collection</span>
                    </label>
                  </div>

                  <div className="text-end mt-4">
                    <button type="button" className={`${styles['sk-btn']} me-2`} onClick={hideModal}>Cancel</button>
                    <button type="submit" className={`p-3 ${styles['si-btn']}`}>
                      {
                        loading ? (
                          <>
                            <div className="spinner-border spinner-border-sm text-light" role="status">
                              <span className="sr-only"></span>
                            </div>
                            <span> Updating...</span>
                          </>
                        ) : (
                          'Update Collection'
                        )
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Collection
