
import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen, faTrashCan, faThumbtack, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, getAllProductForCollection, updateProduct, deleteProductFromStore, publishProductToStore, unpublishProductToStore } from '../../slice/onlineStoreSlice';
import { Ac } from '../../assets';
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';
import Pagination from '../../components/Pagination'

const Product = ({setProCol}) => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");

  const { loading, error, success, collectionProducts} = useSelector((state) => state.store);
  const [prod, setProd] = useState(true);
  const [mode, setMode] = useState(false);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);

  const [categories, setCategories] = useState(['Electronics', 'Clothing', 'Home & Garden', 'Sports']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [productItem, setProductItem] = useState([])
  const [serlist, setSerList] = useState('')
  const [im, setIm] = useState({
    profile: null,
    cover: null,
  });
  const [variations, setVariations] = useState([]);
  const [currentVariation, setCurrentVariation] = useState({
    variation_name: '',
    variation_type: '',
    options: []
  });
  const [currentOption, setCurrentOption] = useState({
    value: '',
    price: '',
    stock: '',
    image_url: ''
  });
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: ''
  });
  const [showVariationSection, setShowVariationSection] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const profileInputRef = useRef(null);
  const optionImageRef = useRef(null);

  const handleImageChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setIm((prev) => ({
          ...prev,
          [key]: reader.result,
        }));
      reader.readAsDataURL(file);
    }
  };


  useEffect(() => {
    if (token) {
      dispatch(getAllProductForCollection({ token, id: getId || '7', page: currentPage, limit: 20}))
    }
  }, [token, dispatch, currentPage])

  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          setProd(false);
        }
      } catch (error) {
        console.error('Error parsing products from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(collectionProducts.data)) {
      setProductItem([...collectionProducts.data]);
      setProd(false);
      setProCol(false)
    }
  }, [collectionProducts]);

  useEffect(() => {
    const product = JSON.parse(localStorage.getItem('products'));
    if (Array.isArray(product)) {
      setSerList(product.length);
    }
  }, []);

  

  const triggerInput = (ref) => ref.current.click();

  const hideModal = () => {
    setMode(false);
    setEditMode(false);
    setEditingProductId(null);
    setProductForm({
      name: '',
      sku: '',
      description: '',
      price: '',
      stock: ''
    });
    setSelectedCategory('');
    setCategoryInput('');
    setIm({profile: null, cover: null});
    setVariations([]);
    setCurrentVariation({variation_name: '', variation_type: '', options: []});
    setCurrentOption({value: '', price: '', stock: '', image_url: ''});
    setShowVariationSection(false);
  }

  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description,
      price: product.price || '',
      stock: product.stock || ''
    });
    setSelectedCategory(product.category || '');
    setCategoryInput(product.category || '');
    if (product.image_url) {
      setIm({...im, profile: product.image_url});
    }
    // Load variations if product has them
    if (product.variations && Array.isArray(product.variations) && product.variations.length > 0) {
      setVariations(product.variations);
      setShowVariationSection(true);
    }
    setEditMode(true);
  }

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryInput(category);
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (e) => {
    const value = e.target.value;
    setCategoryInput(value);
    setSelectedCategory(value);
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()]);
      setSelectedCategory(categoryInput.trim());
    }
  };

  const handleCategoryInputBlur = () => {
    if (categoryInput.trim()) {
      handleAddCategory();
    }
    setTimeout(() => setShowCategoryDropdown(false), 200);
  };

  const handleCategoryInputFocus = () => {
    setShowCategoryDropdown(true);
  };

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleVariationNameChange = (e) => {
    setCurrentVariation({...currentVariation, variation_name: e.target.value});
  };

  const handleVariationTypeChange = (e) => {
    setCurrentVariation({...currentVariation, variation_type: e.target.value});
  };

  const handleOptionValueChange = (e) => {
    setCurrentOption({...currentOption, value: e.target.value});
  };

  const handleOptionPriceChange = (e) => {
    setCurrentOption({...currentOption, price: parseFloat(e.target.value) || ''});
  };

  const handleOptionStockChange = (e) => {
    setCurrentOption({...currentOption, stock: parseInt(e.target.value) || ''});
  };

  const handleOptionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentOption({...currentOption, image_url: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const addOption = () => {
    if (currentOption.value && currentOption.price !== '' && currentOption.stock !== '') {
      setCurrentVariation({
        ...currentVariation,
        options: [...currentVariation.options, {...currentOption}]
      });
      setCurrentOption({value: '', price: '', stock: '', image_url: ''});
    } else {
      alert('Please fill in all required fields: Option Value, Price, and Stock');
    }
  };

  const removeOption = (index) => {
    setCurrentVariation({
      ...currentVariation,
      options: currentVariation.options.filter((_, i) => i !== index)
    });
  };

  const addVariation = () => {
    if (currentVariation.variation_name && currentVariation.variation_type && currentVariation.options.length > 0) {
      setVariations([...variations, currentVariation]);
      setCurrentVariation({variation_name: '', variation_type: '', options: []});
    }
  };

  const removeVariation = (index) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const generateSKU = (name) => {
    if (!name.trim()) return '';
    
    // Get first few letters of product name (max 6 chars, uppercase)
    const namePrefix = name.trim().substring(0, 6).toUpperCase();
    
    // Generate random alphanumeric suffix
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${namePrefix}-${randomPart}`;
  };

  const handleProductNameChange = (e) => {
    const name = e.target.value;
    const newSKU = generateSKU(name);
    setProductForm({
      ...productForm,
      name,
      sku: newSKU,
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: '',
    });
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value
    });
  };

  const toggleVariationSection = () => {
    if (!showVariationSection) {
      // Opening variation section - clear price and stock inputs
      setProductForm({
        ...productForm,
        price: '',
        stock: ''
      });
    } else {
      // Closing variation section - reset variation data
      setCurrentVariation({variation_name: '', variation_type: '', options: []});
      setCurrentOption({value: '', price: '', stock: '', image_url: ''});
    }
    setShowVariationSection(!showVariationSection);
  };

  const calculateTotalPrice = () => {
    let total = 0;
    variations.forEach(variation => {
      variation.options.forEach(option => {
        total += parseFloat(option.price) || 0;
      });
    });
    return total;
  };

  const calculateTotalStock = () => {
    let total = 0;
    variations.forEach(variation => {
      variation.options.forEach(option => {
        total += parseInt(option.stock) || 0;
      });
    });
    return total;
  };

  const hasVariations = variations.length > 0;
  const totalPrice = hasVariations ? calculateTotalPrice() : 0;
  const totalStock = hasVariations ? calculateTotalStock() : 0;

  // const createProduct = () => {
  //   setProd(false)
  // }

  // const addProduct = () => {
  //   setProd(false);
  //   setProCol(false)
  //   hideModal()
  // }

   // Update items per slide based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setItemsPerSlide(2.5); // lg: 2.5 items (shows 2 full + half of 3rd)
      } else if (window.innerWidth >= 768) {
        setItemsPerSlide(2); // md: 2 items
      } else {
        setItemsPerSlide(1); // sm: 1 item
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const addProductToStore = async (e) => {
    e.preventDefault();

    // Check if variations exist - if yes, price/stock can be 0
    const priceValid = hasVariations || (productForm.price !== '' && productForm.price !== 0);
    const stockValid = hasVariations || (productForm.stock !== '' && productForm.stock !== 0);

    if (!productForm.name || !productForm.sku || !productForm.description || !selectedCategory || !priceValid || !stockValid) {
      Swal.fire({
        icon: "info",
        title: editMode ? "Updating product" : "Creating product",
        text: 'All required fields must be filled! If using variations, add them before submitting.',
        confirmButtonColor: '#0273F9'
      })
      return;
    }

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('sku', productForm.sku);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    formData.append('stock', productForm.stock);
    formData.append('category', selectedCategory);
    
    // Append product image if available - convert base64 to File
    if (im.profile) {
      const imageFile = base64ToFile(im.profile, `product-${productForm.sku}.jpg`);
      formData.append('product_image', imageFile);
    }
    
    // Append variations as JSON string
    if (variations.length > 0) {
      formData.append('variations', JSON.stringify(variations));
    }
    
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.type})` : value);
    }
    
    Swal.fire({
      icon: "success",
      title: "Valid Input!",
      text: editMode ? "Product is being updated..." : "Product is being created...",
      timer: 1500,
      showConfirmButton: false,
    });

    try {
      Swal.fire({
        title: editMode ? "Updating Product..." : "Creating Product...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
      });

      let response;
      if (editMode) {
        // Update product
        response = await dispatch(updateProduct({ formData, token, id: getId || '7', productId: editingProductId })).unwrap();
      } else {
        // Create new product
        response = await dispatch(createProduct({ formData, token, id: getId || '7'})).unwrap();
      }

      if (response.success === true) {
        Swal.fire({
          icon: "success",
          title: editMode ? "Product Updated!" : "Product Created!",
          text: `${response.message}`,
        });
        hideModal();
        dispatch(getAllProductForCollection({ token, id: getId || '7'}))
        setProductForm({
          name: '',
          sku: '',
          description: '',
          price: '',
          stock: ''
        })
        setCurrentOption({
          value: '',
          price: '',
          stock: '',
          image_url: ''
        })
        setCurrentVariation({
          variation_name: '',
          variation_type: '',
          options: []
        })
        setVariations([]);
      }

      else {
        Swal.fire({
          icon: "info",
          title: editMode ? "Product Update" : "Product Creation",
          text: `${response.message}`,
          confirmButtonColor: '#0273F9'
        });
      }
    } catch (error) {
      let errorMessage = "Something went wrong";
                      
      if (error && typeof error === "object") {
        if (Array.isArray(error)) {
            errorMessage = error.map(item => item.message).join(", ");
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.response && error.response.data) {
            errorMessage = Array.isArray(error.response.data) 
                ? error.response.data.map(item => item.message).join(", ") 
                : error.response.data.message || JSON.stringify(error.response.data);
        }
      }
  
      Swal.fire({
        icon: "error",
        title: "Error Occurred",
        text: errorMessage,
      });
    }
    
  }

  const deleteProduct = async (productId, productName) => {
    Swal.fire({
      title: 'Delete Product?',
      html: `Are you sure you want to delete <span style="color: #DC2626; font-weight: bold;">"${productName}</span>"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Deleting Product...",
            text: "Please wait while we process your request.",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const response = await dispatch(deleteProductFromStore({token, id: getId || '7', productId: productId})).unwrap();

          if (response.success === true) {
            Swal.fire({
              icon: "success",
              title: "Product Deleted!",
              text: `${response.message}`,
            });

            dispatch(getAllProductForCollection({ token, id: getId || '7', page: currentPage, limit: 20}))
          }

          else {
            Swal.fire({
              icon: "info",
              title: "Product Deletion",
              text: `${response.message}`,
            });
          }
          
        } catch (error) {
          let errorMessage = "Something went wrong";
                              
          if (error && typeof error === "object") {
            if (Array.isArray(error)) {
              errorMessage = error.map(item => item.message).join(", ");
            } else if (error.message) {
              errorMessage = error.message;
            } else if (error.response && error.response.data) {
                errorMessage = Array.isArray(error.response.data) 
                    ? error.response.data.map(item => item.message).join(", ") 
                    : error.response.data.message || JSON.stringify(error.response.data);
            }
          }
          
          Swal.fire({
            icon: "error",
            title: "Error Occurred",
            text: errorMessage,
          });
        }
      }
    })
  }

  const togglePublishProduct = async (productId, isPublished) => {
    try {
      const currentToken = localStorage.getItem("token");
      const currentId = localStorage.getItem("itemId");

      
      if (!currentToken) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Authentication token not found. Please login again.',
          confirmButtonColor: '#0273F9'
        });
        return;
      }

      Swal.fire({
        title: isPublished ? "Unpublishing Product..." : "Publishing Product...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let response;
      if (isPublished) {
        // Unpublish product
        response = await dispatch(unpublishProductToStore({ 
          token: currentToken, 
          id: currentId || '7', 
          productId: productId,
          value: true
        })).unwrap();
      } else {
        // Publish product
        response = await dispatch(publishProductToStore({ 
          token: currentToken, 
          id: currentId || '7', 
          productId: productId,
          value: 'publish'
        })).unwrap();
      }

      if (response.success === true) {
        const newStatus = isPublished ? 'unpublished' : 'published';
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `Product has been ${newStatus}`,
          confirmButtonColor: '#0273F9'
        });
        
        // Refresh product list to get updated is_published status
        dispatch(getAllProductForCollection({ token: currentToken, id: currentId || '7', page: currentPage, limit: 20}));
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Action Failed',
          text: response.message || 'Failed to update product status',
          confirmButtonColor: '#0273F9'
        });
      }
    } catch (error) {
      let errorMessage = "Something went wrong";
      
      if (error && typeof error === "object") {
        if (Array.isArray(error)) {
          errorMessage = error.map(item => item.message).join(", ");
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.response && error.response.data) {
          errorMessage = Array.isArray(error.response.data) 
            ? error.response.data.map(item => item.message).join(", ") 
            : error.response.data.message || JSON.stringify(error.response.data);
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#0273F9'
      });
    }
  }

  return (
    <>
      
       {prod ? (
        <>
          <div className="outer-box p-2" style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
            <div className="inner-box text-center p-5" style={{background: '#FAFAFA', borderRadius: '12px'}}>
              <p style={{color: '#78716C'}}>No Product information available</p>
              <button className={`btn ${styles['add-btn']} px-4`} onClick={() => setMode(true)}>Add Product</button>
            </div>
          </div>

        </>
        ) : (
        <>
        <div style={{background: '#fff', border: '1px solid #eee', borderRadius: '8px'}} className='px-3 py-2'>
          <div className='mt-2'>
            <p className="mx mb-2 p-0">Add Products</p>
            <p className="mb-0 mb-3" style={{ fontSize: '13px', color: '#78716C' }}>
              Add products to your store. You can add more products later.
            </p>

          </div>

          <div className="d-flex justify-content-between mt-4">
            <div>
              <p className='m-0'>{serlist} Products added</p>
              <small className="d-block" style={{color: '#78716C'}}>0 pinned to top</small>
            </div>
            <div>
              <button className={`${styles['si-btn']} px-5 py-3`} onClick={() => {setMode(true)}}>Add Product</button>
            </div>
          </div>

          <div className="row mt-4">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : error ? (
              <p className="text-danger text-center">Something went wrong</p>
            ) : Array.isArray(productItem) && productItem.length > 0 ? (
              productItem.map((product) => (
                <div className="col-12 col-sm-6 col-md-6 col-lg-4 mb-4" key={product.id}>
                  <div className="item-section" style={{height: '280px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px'}}>
                    <div className="item-img" style={{flex: '0 0 180px', overflow: 'hidden'}}>
                      <img src={product.image_url} alt="" className='w-100' style={{height: '100%', objectFit: 'cover'}}/>
                    </div>
                    <div className="item-body p-2" style={{flex: '1', border: "1px solid #eee", borderTop: 'none', overflow: 'auto'}}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <small className='mx d-block' style={{fontSize: '12px'}}>{product.name}</small>
                        </div>
                        <div className='d-flex gap-2'>
                          <FontAwesomeIcon icon={faPen} style={{fontSize: '14px', color: '#141b34', cursor: 'pointer'}} onClick={() => openEditProduct(product)}/>
                          <FontAwesomeIcon icon={faThumbtack} style={{fontSize: '14px', color: '#141b34'}}/>
                          <FontAwesomeIcon icon={faTrashCan} style={{fontSize: '14px', color: '#DC2626', cursor: 'pointer'}} onClick={() => deleteProduct(product.id, product.name)}/>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <small className='d-block bx' style={{color: '#0273F9'}}>₦{Number(product.price).toLocaleString()}</small>
                          <small className='d-block' style={{color: '#78716C', fontSize: '11px'}}>{product.stock === null ? 'out of stock' : 'in stock'}</small>
                        </div>
                        <button 
                          type="button"
                          onClick={() => togglePublishProduct(product.id, product.is_published)}
                          style={{
                            background: product.is_published ? '#10B981' : '#EF4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '9px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          {product.is_published ? 'Published' : 'Publish'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted">No Product available</p>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={collectionProducts.pagination.page || currentPage}
            totalPages={collectionProducts.pagination.total_pages || 1}
            onPageChange={setCurrentPage}
            itemsPerPage={collectionProducts.pagination.limit || 20}
            totalItems={collectionProducts.pagination.total_items || 0}
            maxVisiblePages={5}
            showItemInfo={true}
          />
        </div>
        </>
        )}

        {mode && (
          <>
            <div className={styles['modal-overlay']} onClick={hideModal} style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className={styles['modal-content2']} style={{
                background: '#fff',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto'
              }} onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex justify-content-between p-3">
                    <h6>Add New Product</h6>
                    <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{cursor: 'pointer'}}/>
                  </div>
                  <div>
                    <div className={`${styles['modal-body']} p-3`}>
                      <form onSubmit={addProductToStore}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Product Name <span className='text-danger'>*</span></label>
                              <input 
                                type="text" 
                                className={styles['input-item']} 
                                placeholder="Product name"
                                value={productForm.name}
                                onChange={handleProductNameChange}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Stock Keeping Unit(SKU)</label>
                              <input 
                                type="text" 
                                className={styles['input-item']} 
                                placeholder="Auto-generated"
                                value={productForm.sku}
                                readOnly
                                style={{backgroundColor: '#f5f5f5', color: '#666'}}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className='mb-2' style={{fontSize: '15px'}}>Product Description</label>
                              <textarea className={styles['input-item']} placeholder="Provide Product description" style={{height: '100px'}} name="description" value={productForm.description} onChange={handleProductFormChange}></textarea>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Product Price <span className='text-danger'>*</span></label>
                              <input 
                                type="number" 
                                className={styles['input-item']} 
                                placeholder="0" 
                                name="price" 
                                value={productForm.price} 
                                onChange={handleProductFormChange}
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Stock</label>
                              <input 
                                type="number" 
                                className={styles['input-item']} 
                                placeholder="0" 
                                name="stock" 
                                value={productForm.stock} 
                                onChange={handleProductFormChange}
                              />
                            </div>
                          </div>
                          
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Category</label>
                              <div style={{position: 'relative'}}>
                                <input 
                                  type="text" 
                                  className={styles['input-item']} 
                                  placeholder="Select or type category" 
                                  value={categoryInput}
                                  onChange={handleCategoryInputChange}
                                  onFocus={handleCategoryInputFocus}
                                  onBlur={handleCategoryInputBlur}
                                  style={{width: '100%', paddingRight: '35px'}}
                                />
                                <FontAwesomeIcon 
                                  icon={faCaretDown} 
                                  style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#78716C',
                                    pointerEvents: 'none',
                                    fontSize: '16px'
                                  }}
                                />
                                {showCategoryDropdown && filteredCategories.length > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    zIndex: 10,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}>
                                    {filteredCategories.map((cat, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => handleCategorySelect(cat)}
                                        style={{
                                          padding: '10px 12px',
                                          cursor: 'pointer',
                                          backgroundColor: selectedCategory === cat ? '#E8F4FF' : '#fff',
                                          borderBottom: '1px solid #f0f0f0',
                                          color: selectedCategory === cat ? '#0273F9' : '#333',
                                          fontWeight: selectedCategory === cat ? '500' : 'normal'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedCategory === cat ? '#E8F4FF' : '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCategory === cat ? '#E8F4FF' : '#fff'}
                                      >
                                        {cat}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-md-12">
                            <label className="form-label" style={{fontSize: '15px'}}>Product Image</label>
                            <div style={dropStyles.container}>
                              <label htmlFor="imageUpload" style={dropStyles.imageWrapper}>
                                  <div style={dropStyles.imageCircle} onClick={() => triggerInput(profileInputRef)}>
                                  {im.profile ? (
                                    <img src={im.profile} alt="Preview" style={dropStyles.previewImage} />
                                  ) : (
                                    <div style={dropStyles.placeholderCircle} />
                                  )}
                      
                                  </div>
                      
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={profileInputRef}
                                    onChange={(e) => handleImageChange(e, "profile")}
                                    style={{ display: "none" }}
                                  />
                                  <button style={dropStyles.uploadBtn} onClick={() => triggerInput(profileInputRef)} type='button'>
                                    <img src={Ac} alt="" style={{width: '15%'}} className='me-2'/>
                                    Upload Image
                                  </button>
                              </label>
                              <p style={dropStyles.note}>Recommended: Square image, at least 300×300px</p>
                            </div>
                          </div>
                        </div>


                        <div className="col-md-12">
                            <button 
                              type="button" 
                              onClick={toggleVariationSection}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#0273F9',
                                cursor: 'pointer',
                                fontSize: '15px',
                                padding: '8px 0',
                                fontWeight: '500'
                              }}
                            >
                              {showVariationSection ? '− Hide Variations' : '+ Add Variations'}
                            </button>
                          </div>

                          
                        {showVariationSection && (
                        <div className="rounded-3 mt-4" style={{border: '1px solid #eee'}}>
                          <small className="d-block mx p-2">Variation (Optional)</small>

                          <hr className='m-0' style={{border: '1px solid #eee'}}/>

                          {/* Current Variation Input Section */}
                          <div className="m-3 p-3" style={{border: '1px solid #eee', background: '#fafafa'}}>
                            <h6 className="mb-3">Add Variation</h6>
                            <div className="row">
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '13px'}}>Variant Name</label>
                                  <input 
                                    type="text" 
                                    className={styles['input-item']} 
                                    placeholder="e.g., Color, Size" 
                                    value={currentVariation.variation_name}
                                    onChange={handleVariationNameChange}
                                  />
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '13px'}}>Variant Type</label>
                                  <select 
                                    className={styles['input-item']} 
                                    style={{fontSize: '13px'}}
                                    value={currentVariation.variation_type}
                                    onChange={handleVariationTypeChange}
                                  >
                                    <option value="">--select type--</option>
                                    <option value="color">Color</option>
                                    <option value="size">Size</option>
                                    <option value="material">Material</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Option Input Section */}
                            <hr className="my-3" style={{border: '1px solid #ddd'}}/>
                            <h6 className="mb-3">Add Option Values</h6>
                            <div className="row">
                              <div className="col-md-3">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '12px'}}>Option Value</label>
                                  <input 
                                    type="text" 
                                    className={styles['input-item']} 
                                    placeholder="e.g., Red, Large" 
                                    value={currentOption.value}
                                    onChange={handleOptionValueChange}
                                    style={{fontSize: '12px'}}
                                  />
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '12px'}}>Price</label>
                                  <input 
                                    type="number" 
                                    className={styles['input-item']} 
                                    placeholder="0.00" 
                                    value={currentOption.price}
                                    onChange={handleOptionPriceChange}
                                    step="0.01"
                                    style={{fontSize: '12px'}}
                                  />
                                </div>
                              </div>
                              <div className="col-md-2">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '12px'}}>Stock</label>
                                  <input 
                                    type="number" 
                                    className={styles['input-item']} 
                                    placeholder="0" 
                                    value={currentOption.stock}
                                    onChange={handleOptionStockChange}
                                    style={{fontSize: '12px'}}
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="mb-3">
                                  <label className="form-label" style={{fontSize: '12px'}}>Option Image</label>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={optionImageRef}
                                    onChange={handleOptionImageChange}
                                    style={{fontSize: '12px'}}
                                    className={styles['input-item']}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mb-3">
                              <button 
                                type="button" 
                                onClick={addOption}
                                className={`${styles['sk-btn']} me-2`}
                                style={{fontSize: '13px'}}
                              >
                                Add Option
                              </button>
                            </div>

                            {/* Display Current Options */}
                            {currentVariation.options.length > 0 && (
                              <div className="mb-3">
                                <h6 className="mb-2" style={{fontSize: '13px'}}>Options Added:</h6>
                                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                                  {currentVariation.options.map((opt, idx) => (
                                    <div key={idx} style={{
                                      background: '#E8F4FF',
                                      border: '1px solid #0273F9',
                                      borderRadius: '6px',
                                      padding: '8px 12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontSize: '12px'
                                    }}>
                                      <span>{opt.value} - ${opt.price} (Stock: {opt.stock})</span>
                                      <button 
                                        type="button" 
                                        onClick={() => removeOption(idx)}
                                        style={{background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0}}
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-3">
                              <button 
                                type="button" 
                                onClick={addVariation}
                                className={`${styles['si-btn']}`}
                                style={{fontSize: '13px'}}
                              >
                                Add Variation
                              </button>
                            </div>
                          </div>

                          {/* Display Added Variations */}
                          {variations.length > 0 && (
                            <div className="m-3 p-3" style={{background: '#fafafa'}}>
                              <h6 className="mb-3">Variations Added:</h6>
                              {variations.map((variation, idx) => (
                                <div key={idx} style={{
                                  background: '#fff',
                                  border: '1px solid #ddd',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  marginBottom: '10px'
                                }}>
                                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                                    <div>
                                      <strong style={{fontSize: '14px'}}>{variation.variation_name}</strong>
                                      <span style={{fontSize: '12px', color: '#666', marginLeft: '10px'}}>Type: {variation.variation_type}</span>
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={() => removeVariation(idx)}
                                      style={{background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '18px'}}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div style={{fontSize: '12px'}}>
                                    <strong>Options:</strong>
                                    <ul style={{marginTop: '5px', paddingLeft: '20px'}}>
                                      {variation.options.map((opt, optIdx) => (
                                        <li key={optIdx}>{opt.value} - ${opt.price} (Stock: {opt.stock})</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        )}
                        <div className="mt-3">
                          <label className="form-label" style={{fontSize: '15px'}}>Image Url <span className='text-danger'>*</span></label>
                          <input type="text" className={styles['input-item']} placeholder="Enter Image url" value={productForm.image_url} onChange={handleProductNameChange}/>
                        </div>
                        <div className="text-end mt-4 m-4">
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
                                  'Add Product'
                              )
                            }
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
              </div>
          </div>
          </>
        )}

        {editMode && (
          <>
            <div className={styles['modal-overlay']} onClick={hideModal} style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className={styles['modal-content2']} style={{
                background: '#fff',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto'
              }} onClick={(e) => e.stopPropagation()}>
                  <div className="d-flex justify-content-between p-3">
                    <h6>Edit Product</h6>
                    <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{cursor: 'pointer'}}/>
                  </div>
                  <div>
                    <div className={`${styles['modal-body']} p-3`}>
                      <form onSubmit={addProductToStore}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Product Name <span className='text-danger'>*</span></label>
                              <input 
                                type="text" 
                                className={styles['input-item']}
                                placeholder="Product name"
                                value={productForm.name}
                                onChange={handleProductNameChange}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Stock Keeping Unit(SKU)</label>
                              <input 
                                type="text" 
                                className={styles['input-item']} 
                                placeholder="Auto-generated"
                                value={productForm.sku}
                                readOnly
                                style={{backgroundColor: '#f5f5f5', color: '#666'}}
                              />
                            </div>
                          </div>
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className='mb-2' style={{fontSize: '15px'}}>Product Description</label>
                              <textarea className={styles['input-item']} placeholder="Provide Product description" style={{height: '100px'}} name="description" value={productForm.description} onChange={handleProductFormChange}></textarea>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Product Price <span className='text-danger'>*</span></label>
                              <input 
                                type="number" 
                                className={styles['input-item']} 
                                placeholder="0" 
                                name="price" 
                                value={productForm.price} 
                                onChange={handleProductFormChange}
                                step="0.01"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Stock</label>
                              <input 
                                type="number" 
                                className={styles['input-item']} 
                                placeholder="0" 
                                name="stock" 
                                value={productForm.stock} 
                                onChange={handleProductFormChange}
                              />
                            </div>
                          </div>
                          
                          <div className="col-md-12">
                            <div className="mb-3">
                              <label className="form-label" style={{fontSize: '15px'}}>Category</label>
                              <div style={{position: 'relative'}}>
                                <input 
                                  type="text" 
                                  className={styles['input-item']} 
                                  placeholder="Select or type category" 
                                  value={categoryInput}
                                  onChange={handleCategoryInputChange}
                                  onFocus={handleCategoryInputFocus}
                                  onBlur={handleCategoryInputBlur}
                                  style={{width: '100%', paddingRight: '35px'}}
                                />
                                <FontAwesomeIcon 
                                  icon={faCaretDown} 
                                  style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#78716C',
                                    pointerEvents: 'none',
                                    fontSize: '16px'
                                  }}
                                />
                                {showCategoryDropdown && filteredCategories.length > 0 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: '#fff',
                                    border: '1px solid #ddd',
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    zIndex: 10,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}>
                                    {filteredCategories.map((cat, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => handleCategorySelect(cat)}
                                        style={{
                                          padding: '10px 12px',
                                          cursor: 'pointer',
                                          backgroundColor: selectedCategory === cat ? '#E8F4FF' : '#fff',
                                          borderBottom: '1px solid #f0f0f0',
                                          color: selectedCategory === cat ? '#0273F9' : '#333',
                                          fontWeight: selectedCategory === cat ? '500' : 'normal'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedCategory === cat ? '#E8F4FF' : '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCategory === cat ? '#E8F4FF' : '#fff'}
                                      >
                                        {cat}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-md-12">
                            <label className="form-label" style={{fontSize: '15px'}}>Product Image</label>
                            <div style={dropStyles.container}>
                              <label htmlFor="imageUpload" style={dropStyles.imageWrapper}>
                                  <div style={dropStyles.imageCircle} onClick={() => triggerInput(profileInputRef)}>
                                  {im.profile ? (
                                    <img src={im.profile} alt="Preview" style={dropStyles.previewImage} />
                                  ) : (
                                    <div style={dropStyles.placeholderCircle} />
                                  )}
                      
                                  </div>
                      
                                  <input
                                    type="file"
                                    accept="image/*"
                                    ref={profileInputRef}
                                    onChange={(e) => handleImageChange(e, "profile")}
                                    style={{ display: "none" }}
                                  />
                                  <button style={dropStyles.uploadBtn} onClick={() => triggerInput(profileInputRef)} type='button'>
                                    <img src={Ac} alt="" style={{width: '15%'}} className='me-2'/>
                                    Upload Image
                                  </button>
                              </label>
                              <p style={dropStyles.note}>Recommended: Square image, at least 300×300px</p>
                            </div>
                          </div>
                        </div>

                        <div className="text-end mt-4 m-4">
                          <button className={`${styles['sk-btn']} me-2`} onClick={hideModal} type="button">Cancel</button>
                          <button className={`${styles['si-btn']} btn-lg px-5 py-3`} type="submit">Update Product</button>
                        </div>
                      </form>
                    </div>
                  </div>
              </div>
          </div>
          </>
        )}

      <style jsx>{`
        .card-section:hover .product-image {
          transform: scale(1.05);
        }
        
        .card-section {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .card-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .carousel-btn:hover {
          background-color: #f8f9fa !important;
          transform: scale(1.1);
        }
        
        @media (max-width: 768px) {
          .carousel-btn {
            display: none;
          }
        }
        
        .add-btn {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
        }
        
        .add-btn:hover {
          background-color: #0056b3;
          color: white;
        }
      `}</style>
    </>
  )
}

// const dropStyles = {
//   dropdownWrapper: {
//     width: '100%',
//     fontFamily: 'Arial',
//     fontSize: '14px',
//     borderRadius: '10px',
//     border: '1px solid #eee',
//     background: '#FBFDFF',
//   },
//   dropdownHeader: {
//     padding: '12px 16px',
//     cursor: 'pointer',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderBottom: '1px solid #EEEEEE'
//   },
//   arrow: {
//     fontSize: '12px',
//     color: '#666',
//   },
//   dropdownList: {
//     padding: '8px 16px 16px',
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   item: {
//     padding: '6px 0',
//     display: 'flex',
//     alignItems: 'center',
//   },
// };

const dropStyles = {
  container: {
    width: "100%",
    margin: "auto",
    padding: "2rem",
    borderRadius: "12px",
    border: "1px dashed #ddd",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  imageWrapper: {
    cursor: "pointer",
    display: "inline-block",
  },
  imageCircle: {
    width: "200px",
    height: "150px",
    margin: "auto",
    borderRadius: "2%",
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginBottom: "1rem",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  placeholderCircle: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D9D9D9",
  },
  uploadBtn: {
    padding: "8px 16px",
    backgroundColor: "#fff",
    border: "1px solid #EEEEEE",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    color: '#0273F9'
  },
  note: {
    fontSize: "12px",
    color: "#78716C",
    marginTop: "1rem",
  },
};

export default Product;