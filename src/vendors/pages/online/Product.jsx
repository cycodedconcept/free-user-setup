
import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen, faTrashCan, faThumbtack, faCaretDown, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, getAllProductForCollection, getProductDetails, updateProduct, deleteProductFromStore, publishProductToStore, unpublishProductToStore } from '../../../slice/onlineStoreSlice';
import { getImageSrc } from '../../../utils/getImageSrc';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';
import Pagination from '../../../components/Pagination'

const normalizeOption = (option = {}) => ({
  value: option?.value ?? option?.option_value ?? '',
  price: option?.price ?? option?.price_adjustment ?? '',
  stock: option?.stock ?? '',
  image_url: option?.image_url ?? '',
});

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeVariation = (variation = {}) => ({
  variation_name: variation?.variation_name ?? variation?.name ?? '',
  variation_type: variation?.variation_type ?? variation?.type ?? '',
  is_required:
    variation?.is_required === true ||
    variation?.is_required === 1 ||
    variation?.is_required === '1' ||
    variation?.is_required === 'true',
  options: Array.isArray(parseMaybeJson(variation?.options ?? variation?.variation_options ?? variation?.values))
    ? parseMaybeJson(variation?.options ?? variation?.variation_options ?? variation?.values).map(normalizeOption)
    : [],
});

const resolveProductVariations = (product = {}) => {
  const variationSource =
    product?.variations ??
    product?.product_variations ??
    product?.variation_groups ??
    product?.variant_groups ??
    [];

  const parsedVariations = parseMaybeJson(variationSource);

  if (!Array.isArray(parsedVariations)) {
    return [];
  }

  return parsedVariations.map(normalizeVariation).filter((variation) => {
    return variation.variation_name || variation.variation_type || variation.options.length > 0;
  });
};

const formatMoneyValue = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString('en-NG');
};

const buildVariantPreviewRows = (variationList = [], baseSku = '', basePrice = '') => {
  const validVariations = variationList
    .map(normalizeVariation)
    .filter((variation) => variation.options.length > 0);

  if (validVariations.length < 2) {
    return [];
  }

  const baseAmount = Number(basePrice) || 0;
  const safeSku = (baseSku || 'SKU').trim().toUpperCase();

  return validVariations.reduce((rows, variation) => {
    if (rows.length === 0) {
      return variation.options.map((option) => ({
        labels: [option.value],
        skuParts: [String(option.value || '').slice(0, 3).toUpperCase()],
        price: baseAmount + (Number(option.price) || 0),
        stock: Number(option.stock) || 0,
      }));
    }

    return rows.flatMap((row) =>
      variation.options.map((option) => ({
        labels: [...row.labels, option.value],
        skuParts: [...row.skuParts, String(option.value || '').slice(0, 3).toUpperCase()],
        price: row.price + (Number(option.price) || 0),
        stock: Math.min(row.stock, Number(option.stock) || 0),
      }))
    );
  }, []).map((row) => ({
    combination: row.labels.join(' / '),
    sku: `${safeSku}-${row.skuParts.join('-')}`,
    price: row.price,
    stock: row.stock,
  }));
};

const applyProductDetailsToForm = ({
  product,
  setEditingProductId,
  setProductForm,
  setSelectedCategory,
  setCategoryInput,
  setIm,
  setVariations,
  setShowVariationSection,
  setCurrentVariation,
  setCurrentOption,
  setEditMode,
  setMode
}) => {
  const productVariations = resolveProductVariations(product);
  const resolvedImageUrl = product?.image_url || product?.product_image || '';

  setEditingProductId(product?.id || null);
  setProductForm({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    image_url: resolvedImageUrl,
    expiry_date: product?.expiry_date || '',
    low_stock_threshold: product?.low_stock_threshold || '10',
    is_active: product?.is_active !== false && product?.is_active !== 0,
    is_published: product?.is_published === true || product?.is_published === 1,
    is_featured:
      product?.is_featured === true ||
      product?.is_featured === 1 ||
      product?.featured === true ||
      product?.featured === 1
  });

  const resolvedCategory = product?.category || product?.Category?.name || '';
  setSelectedCategory(resolvedCategory);
  setCategoryInput(resolvedCategory);
  setIm({ profile: resolvedImageUrl || null, cover: null });
  setVariations(productVariations);
  setShowVariationSection(productVariations.length > 0);
  setCurrentVariation({variation_name: '', variation_type: '', is_required: false, options: []});
  setCurrentOption({value: '', price: '', stock: '', image_url: ''});
  setEditMode(true);
  setMode(true);
};

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
    is_required: false,
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
    stock: '',
    image_url: '',
    expiry_date: '',
    low_stock_threshold: '10',
    is_active: true,
    is_published: false,
    is_featured: false
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
      reader.onloadend = () => {
        setIm((prev) => ({
          ...prev,
          [key]: reader.result,
        }));
        setProductForm((prev) => ({
          ...prev,
          image_url: '',
        }));
      };
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
      stock: '',
      image_url: '',
      expiry_date: '',
      low_stock_threshold: '10',
      is_active: true,
      is_published: false,
      is_featured: false
    });
    setSelectedCategory('');
    setCategoryInput('');
    setIm({profile: null, cover: null});
    setVariations([]);
    setCurrentVariation({variation_name: '', variation_type: '', is_required: false, options: []});
    setCurrentOption({value: '', price: '', stock: '', image_url: ''});
    setShowVariationSection(false);
  }

  const openEditProduct = async (product) => {
    const productId = product?.id;

    if (!productId || !token) {
      return;
    }

    try {
      Swal.fire({
        title: 'Loading Product...',
        text: 'Please wait while we fetch the product details.',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await dispatch(
        getProductDetails({ token, id: getId || '7', productId })
      ).unwrap();

      const detailedProduct = response?.data?.product || product;

      applyProductDetailsToForm({
        product: detailedProduct,
        setEditingProductId,
        setProductForm,
        setSelectedCategory,
        setCategoryInput,
        setIm,
        setVariations,
        setShowVariationSection,
        setCurrentVariation,
        setCurrentOption,
        setEditMode,
        setMode
      });

      Swal.close();
    } catch (submitError) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to Load Product',
        text: submitError?.message || submitError?.error || 'We could not load the product details for editing.',
        confirmButtonColor: '#0273F9'
      });
    }
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

  const handleVariationRequiredChange = (e) => {
    setCurrentVariation({...currentVariation, is_required: e.target.checked});
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
      Swal.fire({
        icon: 'info',
        title: 'Variation option',
        text: 'Please fill in option value, price adjustment, and stock before adding the option.',
        confirmButtonColor: '#0273F9'
      });
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
      setCurrentVariation({variation_name: '', variation_type: '', is_required: false, options: []});
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Variation',
        text: 'Add a variation name, variation type, and at least one option value first.',
        confirmButtonColor: '#0273F9'
      });
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
    });
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value
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
      setCurrentVariation({variation_name: '', variation_type: '', is_required: false, options: []});
      setCurrentOption({value: '', price: '', stock: '', image_url: ''});
    }
    setShowVariationSection(!showVariationSection);
  };

  const hasVariations = variations.length > 0;
  const variantPreviewRows = buildVariantPreviewRows(variations, productForm.sku, productForm.price);
  const normalizedVariations = variations.map(normalizeVariation);

  useEffect(() => {
    if (!variations.length) {
      return;
    }

    const variationImageDebug = variations.flatMap((variation, variationIndex) =>
      (Array.isArray(variation?.options) ? variation.options : []).map((option, optionIndex) => ({
        variationIndex,
        variationName: variation?.variation_name || '',
        optionIndex,
        optionValue: option?.value || '',
        rawImageUrl: option?.image_url || '',
        resolvedImageSrc: getImageSrc(option?.image_url || ''),
      }))
    );

    console.log('Variation image debug', variationImageDebug);
  }, [variations]);

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
    const priceValid = hasVariations || productForm.price !== '';
    const stockValid = hasVariations || productForm.stock !== '';

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
    formData.append('low_stock_threshold', productForm.low_stock_threshold || '10');
    formData.append('is_active', productForm.is_active ? 1 : 0);
    formData.append('is_published', productForm.is_published ? 1 : 0);
    formData.append('is_featured', productForm.is_featured ? 1 : 0);

    if (productForm.expiry_date) {
      formData.append('expiry_date', productForm.expiry_date);
    }
    
    // Append product image if available - convert base64 to File
    if (im.profile && im.profile.startsWith('data:')) {
      const imageFile = base64ToFile(im.profile, `product-${productForm.sku}.jpg`);
      formData.append('product_image', imageFile);
    }

    const resolvedImageUrl =
      productForm.image_url.trim() ||
      (im.profile && !im.profile.startsWith('data:') ? im.profile : '');

    if (resolvedImageUrl) {
      formData.append('image_url', resolvedImageUrl);
    }
    
    // Append variations as JSON string
    if (normalizedVariations.length > 0) {
      formData.append('variations', JSON.stringify(normalizedVariations));
    }

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
          stock: '',
          image_url: '',
          expiry_date: '',
          low_stock_threshold: '10',
          is_active: true,
          is_published: false,
          is_featured: false
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
          is_required: false,
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

  const renderProductModal = () => {
    if (!mode && !editMode) {
      return null;
    }

    const modalTitle = editMode ? 'Edit Product' : 'Add New Product';
    const submitLabel = editMode ? 'Update Product' : 'Save Product';

    return (
      <div
        className={styles['modal-overlay']}
        onClick={hideModal}
        style={{
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
        }}
      >
        <div
          className={styles['modal-content2']}
          style={{
            background: '#fff',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex justify-content-between align-items-center p-3">
            <div>
              <h6 className="mb-1">{modalTitle}</h6>
            </div>
            <FontAwesomeIcon icon={faTimes} onClick={hideModal} style={{ cursor: 'pointer' }} />
          </div>

          <div className={styles['modal-body']}>
            <form onSubmit={addProductToStore} className="p-3">
              <div
                className="p-3 mb-4"
                style={{ border: '1px solid #EEEEEE', borderRadius: '12px', background: '#FAFAFA' }}
              >
                <div className="mb-3">
                  <h6 className="mb-1">Basic Information</h6>
                  <small style={{ color: '#78716C' }}>
                    Add the main product details customers will see before purchase.
                  </small>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>
                        Product Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={styles['input-item']}
                        placeholder="e.g. Nike Air Max"
                        value={productForm.name}
                        onChange={handleProductNameChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>
                        SKU <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={styles['input-item']}
                        placeholder="e.g. NIKE-BLK-M"
                        value={productForm.sku}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                      />
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={styles['input-item']}
                        placeholder="Short product description"
                        style={{ minHeight: '100px' }}
                        name="description"
                        value={productForm.description}
                        onChange={handleProductFormChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>Category</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className={styles['input-item']}
                          placeholder="e.g. Sneakers"
                          value={categoryInput}
                          onChange={handleCategoryInputChange}
                          onFocus={handleCategoryInputFocus}
                          onBlur={handleCategoryInputBlur}
                          style={{ width: '100%', paddingRight: '35px' }}
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
                              >
                                {cat}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>
                        Expiry Date <small style={{ color: '#78716C' }}>(optional)</small>
                      </label>
                      <input
                        type="date"
                        className={styles['input-item']}
                        name="expiry_date"
                        value={productForm.expiry_date}
                        onChange={handleProductFormChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-1 d-flex justify-content-between align-items-center">
                      <label className="form-label mb-0" style={{ fontSize: '15px' }}>
                        Base Price {!hasVariations && <span className="text-danger">*</span>}
                      </label>
                      <small style={{ color: '#78716C' }}>Leave blank if using variations</small>
                    </div>
                    <div className="mb-3">
                      <input
                        type="number"
                        className={styles['input-item']}
                        placeholder="0.00"
                        name="price"
                        value={productForm.price}
                        onChange={handleProductFormChange}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-1 d-flex justify-content-between align-items-center">
                      <label className="form-label mb-0" style={{ fontSize: '15px' }}>
                        Base Stock {!hasVariations && <span className="text-danger">*</span>}
                      </label>
                      <small style={{ color: '#78716C' }}>Leave blank if using variations</small>
                    </div>
                    <div className="mb-3">
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

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        className={styles['input-item']}
                        placeholder="10"
                        name="low_stock_threshold"
                        value={productForm.low_stock_threshold}
                        onChange={handleProductFormChange}
                      />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label d-block" style={{ fontSize: '15px' }}>
                        Product Status
                      </label>
                      <div className="d-flex flex-wrap gap-4 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              name="is_active"
                              checked={!!productForm.is_active}
                              onChange={handleProductFormChange}
                            />
                            <span className={styles.slider}></span>
                          </label>
                          <small style={{ color: '#141B34' }}>Active</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              name="is_published"
                              checked={!!productForm.is_published}
                              onChange={handleProductFormChange}
                            />
                            <span className={styles.slider}></span>
                          </label>
                          <small style={{ color: '#141B34' }}>Published</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              name="is_featured"
                              checked={!!productForm.is_featured}
                              onChange={handleProductFormChange}
                            />
                            <span className={styles.slider}></span>
                          </label>
                          <small style={{ color: '#141B34' }}>Featured</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: '15px' }}>Product Image</label>
                      <div style={dropStyles.container}>
                        <button
                          type="button"
                          onClick={() => triggerInput(profileInputRef)}
                          style={dropStyles.imageWrapperButton}
                        >
                          <div style={dropStyles.imageCircle}>
                            {im.profile ? (
                              <img src={getImageSrc(im.profile)} alt="Preview" style={dropStyles.previewImage} />
                            ) : (
                              <div style={dropStyles.placeholderWrap}>
                                <FontAwesomeIcon icon={faPlus} style={{ fontSize: '24px', color: '#78716C' }} />
                              </div>
                            )}
                          </div>
                          <p className="mb-1" style={{ fontSize: '14px', color: '#141B34', fontWeight: 500 }}>
                            Click to upload or drag image here
                          </p>
                          <small style={{ color: '#78716C' }}>
                            Recommended: Square image, at least 300x300px
                          </small>
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={profileInputRef}
                          onChange={(e) => handleImageChange(e, 'profile')}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="p-3 mb-4"
                style={{ border: '1px solid #EEEEEE', borderRadius: '12px' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="mb-1">Variations</h6>
                    <small style={{ color: '#78716C' }}>
                      Optional, for example Color, Size, Material, or Weight.
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVariationSection}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0273F9',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    {showVariationSection ? 'Hide Variations' : '+ Add Variation'}
                  </button>
                </div>

                {showVariationSection && (
                  <div
                    className="p-3 mb-3"
                    style={{ border: '1px solid #EEEEEE', borderRadius: '12px', background: '#FAFAFA' }}
                  >
                    <div className="row">
                      <div className="col-md-5">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '13px' }}>Variation Name</label>
                          <input
                            type="text"
                            className={styles['input-item']}
                            placeholder="Color"
                            value={currentVariation.variation_name}
                            onChange={handleVariationNameChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '13px' }}>Variation Type</label>
                          <input
                            type="text"
                            className={styles['input-item']}
                            placeholder="color"
                            value={currentVariation.variation_type}
                            onChange={handleVariationTypeChange}
                          />
                        </div>
                      </div>

                      <div className="col-md-3 d-flex align-items-center">
                        <label className={styles['custom-checkbox-wrapper']} style={{ marginTop: '10px' }}>
                          <input
                            type="checkbox"
                            className={styles['custom-checkbox']}
                            checked={!!currentVariation.is_required}
                            onChange={handleVariationRequiredChange}
                          />
                          <span className={styles.checkmark}></span>
                          <small style={{ color: '#141B34' }}>Required</small>
                        </label>
                      </div>
                    </div>

                    <div className="mb-2">
                      <small style={{ color: '#78716C' }}>
                        Each option can optionally have an image.
                      </small>
                    </div>

                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '12px' }}>Option Value</label>
                          <input
                            type="text"
                            className={styles['input-item']}
                            placeholder="Black"
                            value={currentOption.value}
                            onChange={handleOptionValueChange}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '12px' }}>Price Adj.</label>
                          <input
                            type="number"
                            className={styles['input-item']}
                            placeholder="0.00"
                            value={currentOption.price}
                            onChange={handleOptionPriceChange}
                            step="0.01"
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '12px' }}>Stock</label>
                          <input
                            type="number"
                            className={styles['input-item']}
                            placeholder="0"
                            value={currentOption.stock}
                            onChange={handleOptionStockChange}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label" style={{ fontSize: '12px' }}>Option Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            ref={optionImageRef}
                            onChange={handleOptionImageChange}
                            style={{ fontSize: '12px' }}
                            className={styles['input-item']}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button type="button" onClick={addOption} className={`${styles['sk-btn']} me-2`}>
                        + Add
                      </button>
                      <small style={{ color: '#78716C' }}>
                        {currentVariation.options.length} option{currentVariation.options.length === 1 ? '' : 's'} added
                      </small>
                    </div>

                    {currentVariation.options.length > 0 && (
                      <div className="row">
                        {currentVariation.options.map((option, index) => (
                          <div className="col-md-6 mb-3" key={`${option.value}-${index}`}>
                            <div
                              className="p-3 h-100"
                              style={{ border: '1px solid #E5E7EB', borderRadius: '10px', background: '#fff' }}
                            >
                              <div className="d-flex justify-content-between align-items-start gap-3">
                                <div className="d-flex gap-3">
                                  <div
                                    style={{
                                      width: '48px',
                                      height: '48px',
                                      borderRadius: '8px',
                                      overflow: 'hidden',
                                      background: '#F3F4F6',
                                      flexShrink: 0
                                    }}
                                  >
                                    {option.image_url ? (
                                      <img src={getImageSrc(option.image_url)} alt={option.value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : null}
                                  </div>
                                  <div>
                                    <p className="mb-1" style={{ fontWeight: 600, color: '#141B34' }}>{option.value}</p>
                                    <small className="d-block" style={{ color: '#78716C' }}>
                                      Price adj.: ₦{formatMoneyValue(option.price)}
                                    </small>
                                    <small className="d-block" style={{ color: '#78716C' }}>
                                      Stock: {Number(option.stock) || 0}
                                    </small>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeOption(index)}
                                  style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button type="button" onClick={addVariation} className={styles['si-btn']}>
                      Add Variation
                    </button>
                  </div>
                )}

                {normalizedVariations.length > 0 && (
                  <div className="mb-3">
                    {normalizedVariations.map((variation, idx) => (
                      <div
                        key={`${variation.variation_name}-${idx}`}
                        className="p-3 mb-3"
                        style={{ border: '1px solid #EEEEEE', borderRadius: '12px', background: '#FAFAFA' }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <p className="mb-1" style={{ fontWeight: 600, color: '#141B34' }}>
                              {variation.variation_name}
                            </p>
                            <small style={{ color: '#78716C' }}>
                              {variation.variation_type} · {variation.is_required ? 'Required' : 'Optional'}
                            </small>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariation(idx)}
                            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '18px' }}
                          >
                            ×
                          </button>
                        </div>

                        {variation.options.map((option, optionIdx) => (
                          <div key={`${variation.variation_name}-${option.value}-${optionIdx}`} className="d-flex justify-content-between align-items-center py-2" style={{ borderTop: optionIdx === 0 ? 'none' : '1px solid #E5E7EB' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  background: '#fff',
                                  border: '1px solid #E5E7EB'
                                }}
                              >
                                {option.image_url ? (
                                  <img src={getImageSrc(option.image_url)} alt={option.value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : null}
                              </div>
                              <small style={{ color: '#141B34' }}>{option.value}</small>
                            </div>
                            <div className="text-end">
                              <small className="d-block" style={{ color: '#78716C' }}>
                                Price adj.: ₦{formatMoneyValue(option.price)}
                              </small>
                              <small className="d-block" style={{ color: '#78716C' }}>
                                Stock: {Number(option.stock) || 0}
                              </small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="p-3"
                  style={{ border: '1px solid #EEEEEE', borderRadius: '12px', background: '#FAFAFA' }}
                >
                  <h6 className="mb-1">Variants Preview</h6>
                  <small style={{ color: '#78716C' }}>
                    Variants are generated automatically when you have 2+ variations.
                  </small>

                  {variantPreviewRows.length > 0 ? (
                    <div className="table-responsive mt-3">
                      <table className="table table-sm align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Combination</th>
                            <th>SKU</th>
                            <th>Price</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variantPreviewRows.map((variant) => (
                            <tr key={variant.sku}>
                              <td>{variant.combination}</td>
                              <td>{variant.sku}</td>
                              <td>₦{formatMoneyValue(variant.price)}</td>
                              <td>{variant.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mb-0 mt-3" style={{ fontSize: '13px', color: '#78716C' }}>
                      Add at least two variations to preview generated combinations here.
                    </p>
                  )}
                </div>
              </div>

              <div className="text-end pb-3">
                <button className={`${styles['sk-btn']} me-2`} onClick={hideModal} type="button">
                  Cancel
                </button>
                <button className={`${styles['si-btn']} btn-lg px-5 py-3`} type="submit">
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm text-light" role="status">
                        <span className="sr-only"></span>
                      </div>
                      <span>{editMode ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

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
                      <img src={getImageSrc(product.image_url)} alt="" className='w-100' style={{height: '100%', objectFit: 'cover'}}/>
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

        {renderProductModal()}

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
  imageWrapperButton: {
    cursor: "pointer",
    display: "inline-block",
    border: "none",
    background: "transparent",
    padding: 0,
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
  placeholderWrap: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default Product;
