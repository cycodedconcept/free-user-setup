
import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPen, faTrashCan, faThumbtack, faCaretDown, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, getAllProductForCollection, getProductDetails, updateProduct, deleteProductFromStore, publishProductToStore, unpublishProductToStore } from '../../../slice/onlineStoreSlice';
import { getImageSrc } from '../../../utils/getImageSrc';
import { logProductSubmissionPayload } from '../../../utils/logProductSubmissionPayload';
import ProductFormDesigner from '../../components/ProductFormDesigner';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';
import Pagination from '../../../components/Pagination'

const shouldRenderLegacyProductModal = false;

const VARIATION_TYPE_LABELS = {
  color: 'Color',
  colour: 'Color',
  size: 'Size',
  material: 'Material',
  style: 'Style',
  weight: 'Weight',
  other: 'Other',
  custom: 'Other',
};

const createEmptyVariation = () => ({
  variation_name: '',
  variation_type: '',
  is_required: false,
  options: [],
});

const createEmptyOption = () => ({
  value: '',
  display_name: '',
  price: '',
  stock: '',
  sku: null,
  image_url: '',
  is_default: false,
  imageFile: null,
});

const createEmptyVariant = () => ({
  sku: '',
  price: '',
  stock: '',
  image_url: '',
  imageFile: null,
  enabled: true,
  options: [],
  combination: '',
});

const isLocalPreviewImage = (value = '') =>
  typeof value === 'string' && /^(data:|blob:)/i.test(value.trim());

const normalizeVariationType = (value = '') => {
  const normalizedValue = String(value).trim().toLowerCase();
  if (normalizedValue === 'colour') return 'color';
  if (normalizedValue === 'custom') return 'other';
  return normalizedValue;
};

const inferVariationType = (value = '') => {
  const normalizedValue = normalizeVariationType(value);

  if (!normalizedValue) return '';
  if (VARIATION_TYPE_LABELS[normalizedValue]) return normalizedValue;
  if (normalizedValue.includes('color') || normalizedValue.includes('colour')) return 'color';
  if (normalizedValue.includes('size')) return 'size';
  if (normalizedValue.includes('material') || normalizedValue.includes('fabric')) return 'material';
  if (normalizedValue.includes('style')) return 'style';
  if (normalizedValue.includes('weight')) return 'weight';

  return '';
};

const resolveVariationType = (typeValue = '', nameValue = '') =>
  inferVariationType(typeValue) || inferVariationType(nameValue) || (typeValue || nameValue ? 'other' : '');

const getVariationTypeLabel = (value = '') =>
  VARIATION_TYPE_LABELS[normalizeVariationType(value)] || value;

const toSkuToken = (value = '') => {
  const normalizedValue = String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedValue || 'OPT';
};

const resolveVariantSku = (skuSegments = [], baseSku = '') => {
  const normalizedBaseSku = toSkuToken(baseSku || 'SKU');

  return skuSegments.reduce((currentSku, segment) => {
    const segmentValue = String(segment?.value || '').trim().toUpperCase();

    if (!segment?.isExplicit) {
      return currentSku ? `${currentSku}-${toSkuToken(segmentValue)}` : toSkuToken(segmentValue);
    }

    if (!segmentValue) {
      return currentSku || normalizedBaseSku;
    }

    if (!currentSku || segmentValue === currentSku || segmentValue.startsWith(`${currentSku}-`)) {
      return segmentValue;
    }

    const explicitSuffix = segmentValue.split('-').filter(Boolean).pop() || toSkuToken(segmentValue);
    return `${currentSku}-${explicitSuffix}`;
  }, normalizedBaseSku);
};

const normalizeOption = (option = {}) => ({
  value: option?.value ?? option?.option_value ?? '',
  display_name:
    option?.display_name ??
    option?.option_display_name ??
    option?.value ??
    option?.option_value ??
    '',
  price: option?.price ?? option?.price_adjustment ?? '',
  stock: option?.stock ?? '',
  sku: option?.sku ?? null,
  image_url: option?.image_url ?? '',
  is_default:
    option?.is_default === true ||
    option?.is_default === 1 ||
    option?.is_default === '1' ||
    option?.is_default === 'true',
  imageFile: option?.imageFile ?? null,
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
  variation_type: resolveVariationType(
    variation?.variation_type ?? variation?.type ?? '',
    variation?.variation_name ?? variation?.name ?? ''
  ),
  is_required:
    variation?.is_required === true ||
    variation?.is_required === 1 ||
    variation?.is_required === '1' ||
    variation?.is_required === 'true',
  options: Array.isArray(parseMaybeJson(variation?.options ?? variation?.variation_options ?? variation?.values))
    ? parseMaybeJson(variation?.options ?? variation?.variation_options ?? variation?.values).map(normalizeOption)
    : [],
});

const buildVariationsPayload = (
  variationList = [],
  { clearOptionPrices = false, clearOptionStocks = false } = {}
) =>
  variationList.map((variation) => {
    const normalizedVariation = normalizeVariation(variation);

    return {
      variation_name: normalizedVariation.variation_name,
      variation_type: normalizedVariation.variation_type,
      is_required: normalizedVariation.is_required,
      options: normalizedVariation.options.map((optionEntry) => {
        const option = { ...optionEntry };
        delete option.imageFile;
        const imageUrl = isLocalPreviewImage(option?.image_url ?? '')
          ? ''
          : String(option?.image_url ?? '').trim();

        const nextOption = {
          ...option,
          price: clearOptionPrices ? 0 : option?.price,
          stock: clearOptionStocks ? 0 : option?.stock,
          display_name: option?.display_name ?? option?.value ?? '',
          sku: option?.sku ?? null,
          is_default:
            option?.is_default === true ||
            option?.is_default === 1 ||
            option?.is_default === '1' ||
            option?.is_default === 'true',
        };

        if (imageUrl) {
          nextOption.image_url = imageUrl;
        } else {
          delete nextOption.image_url;
        }

        return nextOption;
      }),
    };
  });

const buildVariationGenerationSignature = (variationList = []) =>
  JSON.stringify(
    variationList.map((variation) => {
      const normalizedVariation = normalizeVariation(variation);

      return {
        variation_name: String(normalizedVariation?.variation_name || '').trim(),
        variation_type: normalizeVariationType(normalizedVariation?.variation_type || ''),
        is_required: normalizedVariation?.is_required === true,
        options: normalizedVariation.options.map((option) => ({
          value: String(option?.value || '').trim(),
          display_name: String(option?.display_name || '').trim(),
          price: Number(option?.price) || 0,
          stock: Number(option?.stock) || 0,
          sku: option?.sku ?? null,
        })),
      };
    })
  );

const countVariationsWithOptions = (variationList = []) =>
  variationList
    .map(normalizeVariation)
    .filter((variation) =>
      variation.options.some((option) => String(option?.value || '').trim())
    ).length;

const buildVariantCombinationKey = (variant = {}) =>
  String(
    variant?.combination ||
      (Array.isArray(variant?.options)
        ? variant.options.map((option) => option?.option_value || '').join(' / ')
        : '')
  ).trim();

const generateVariantsFromVariations = (
  variationList = [],
  baseSku = '',
  basePrice = '',
  existingVariants = [],
  preserveExisting = true
) => {
  const validVariations = buildVariationsPayload(variationList)
    .map((variation) => ({
      ...variation,
      options: variation.options.filter((option) => String(option?.value || '').trim()),
    }))
    .filter((variation) => variation.options.length > 0);

  if (!validVariations.length) {
    return [];
  }

  const existingVariantMap = new Map(
    (Array.isArray(existingVariants) ? existingVariants : []).map((variant) => [
      buildVariantCombinationKey(variant),
      variant,
    ])
  );
  const normalizedBasePrice = basePrice === '' ? 0 : Number(basePrice) || 0;

  return validVariations
    .reduce((rows, variation) => {
      if (rows.length === 0) {
        return variation.options.map((option) => ({
          labels: [option.display_name || option.value || 'Option'],
          skuSegments: [
            {
              value: option?.sku || option?.value || option?.display_name || 'OPT',
              isExplicit: Boolean(String(option?.sku || '').trim()),
            },
          ],
          priceAdjustment: Number(option?.price) || 0,
          stockValues: [Number(option?.stock) || 0],
          options: [
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || '',
              display_name: option?.display_name || option?.value || '',
            },
          ],
        }));
      }

      return rows.flatMap((row) =>
        variation.options.map((option) => ({
          labels: [...row.labels, option.display_name || option.value || 'Option'],
          skuSegments: [
            ...row.skuSegments,
            {
              value: option?.sku || option?.value || option?.display_name || 'OPT',
              isExplicit: Boolean(String(option?.sku || '').trim()),
            },
          ],
          priceAdjustment: row.priceAdjustment + (Number(option?.price) || 0),
          stockValues: [...row.stockValues, Number(option?.stock) || 0],
          options: [
            ...row.options,
            {
              variation_name: variation.variation_name || variation.variation_type,
              option_value: option?.value || option?.display_name || '',
              display_name: option?.display_name || option?.value || '',
            },
          ],
        }))
      );
    }, [])
    .map((row) => {
      const combination = row.labels.join(' / ');
      const existingVariant = preserveExisting ? existingVariantMap.get(combination) : null;

      if (existingVariant) {
        return {
          ...createEmptyVariant(),
          ...existingVariant,
          combination,
          options: row.options,
          enabled: existingVariant?.enabled !== false,
        };
      }

      return {
        ...createEmptyVariant(),
        sku: resolveVariantSku(row.skuSegments, baseSku),
        price: normalizedBasePrice + row.priceAdjustment,
        stock: row.stockValues.length > 0 ? Math.min(...row.stockValues) : 0,
        enabled: true,
        options: row.options,
        combination,
      };
    });
};

const buildVariantsPayload = (variantList = []) => {
  return (Array.isArray(variantList) ? variantList : []).map((variantEntry) => {
    const { imageFile, ...variant } = variantEntry || {};

    return {
      ...variant,
      sku: String(variant?.sku || '').trim(),
      price: variant?.price === '' ? 0 : Number(variant?.price) || 0,
      stock: variant?.stock === '' ? 0 : Number(variant?.stock) || 0,
      image_url: isLocalPreviewImage(variant?.image_url ?? '') ? '' : variant?.image_url ?? '',
      enabled: variant?.enabled !== false,
      options: Array.isArray(variant?.options)
        ? variant.options.map((option) => ({
            variation_name: option?.variation_name ?? '',
            option_value: option?.option_value ?? '',
            display_name: option?.display_name ?? option?.option_value ?? '',
          }))
        : [],
    };
  });
};

const normalizeFormVariantOption = (option = {}) => ({
  variation_name: option?.variation_name ?? option?.name ?? option?.type ?? '',
  option_value:
    option?.option_value ??
    option?.value ??
    option?.display_name ??
    option?.option_display_name ??
    option?.label ??
    '',
  display_name:
    option?.display_name ??
    option?.option_display_name ??
    option?.option_value ??
    option?.value ??
    option?.label ??
    '',
});

const normalizeFormVariant = (variant = {}) => {
  const parsedOptions = parseMaybeJson(
    variant?.options ??
      variant?.variant_options ??
      variant?.combination_options ??
      variant?.attributes ??
      []
  );
  const normalizedOptions = Array.isArray(parsedOptions)
    ? parsedOptions
        .map(normalizeFormVariantOption)
        .filter((option) => option.variation_name || option.option_value || option.display_name)
    : [];
  const combination = String(
    variant?.combination ||
      variant?.name ||
      normalizedOptions
        .map((option) => option?.display_name || option?.option_value || '')
        .filter(Boolean)
        .join(' / ')
  ).trim();

  return {
    ...createEmptyVariant(),
    sku: variant?.sku ?? '',
    price: variant?.price ?? variant?.unit_price ?? '',
    stock: variant?.stock ?? variant?.quantity ?? variant?.available_stock ?? '',
    image_url: variant?.image_url ?? variant?.image ?? '',
    enabled:
      variant?.enabled !== false &&
      variant?.enabled !== 0 &&
      variant?.enabled !== '0' &&
      variant?.is_active !== false &&
      variant?.is_active !== 0 &&
      variant?.is_active !== '0' &&
      variant?.active !== false &&
      variant?.is_available !== 0 &&
      variant?.is_available !== '0',
    options: normalizedOptions,
    combination,
  };
};

const resolveFormVariants = (product = {}) => {
  const parsedVariants = parseMaybeJson(
    product?.variants ??
      product?.product_variants ??
      product?.variant_combinations ??
      product?.combinations ??
      product?.generated_variants ??
      []
  );

  return Array.isArray(parsedVariants)
    ? parsedVariants
        .map(normalizeFormVariant)
        .filter((variant) => variant.combination || variant.options.length > 0 || variant.sku)
    : [];
};

const snapshotVariationPricing = (variationList = []) =>
  resolveProductVariations(variationList).map((variation) => ({
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option) => ({
      price: option?.price ?? '',
      stock: option?.stock ?? '',
    })),
  }));

const restoreVariationPricing = (variationList = [], snapshot = []) =>
  resolveProductVariations(variationList).map((variation, variationIndex) => ({
    ...variation,
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option, optionIndex) => ({
      ...option,
      price: snapshot?.[variationIndex]?.options?.[optionIndex]?.price ?? option?.price ?? '',
      stock: snapshot?.[variationIndex]?.options?.[optionIndex]?.stock ?? option?.stock ?? '',
    })),
  }));

const clearVariationPricing = (variationList = []) =>
  resolveProductVariations(variationList).map((variation) => ({
    ...variation,
    options: (Array.isArray(variation?.options) ? variation.options : []).map((option) => ({
      ...option,
      price: '',
      stock: '',
    })),
  }));

const getProductFormMode = (variationList = [], variantList = []) => {
  const hasVariations = resolveProductVariations(variationList).length > 0;
  const hasVariants = Array.isArray(variantList) && variantList.length > 0;

  if (hasVariants) {
    return 'variants';
  }

  if (hasVariations) {
    return 'variations';
  }

  return 'simple';
};

const isVariationReadyForSubmit = (variation = {}) => {
  const normalizedVariation = normalizeVariation(variation);

  return Boolean(
    normalizedVariation.variation_name &&
      normalizedVariation.variation_type &&
      normalizedVariation.options.length > 0
  );
};

const hasVariationDraft = (variation = {}, option = {}) => {
  const hasVariationFields = Boolean(
    variation?.variation_name ||
      variation?.variation_type ||
      (Array.isArray(variation?.options) && variation.options.length > 0)
  );

  const hasOptionFields = Boolean(
    option?.value ||
      option?.display_name ||
      option?.price !== '' ||
      option?.stock !== '' ||
      option?.sku ||
      option?.image_url
  );

  return hasVariationFields || hasOptionFields;
};

const buildSubmitVariations = (variationList = [], currentVariation = {}) =>
  isVariationReadyForSubmit(currentVariation)
    ? [...variationList, currentVariation]
    : variationList;

const extractDetailedProduct = (payload, fallbackProduct = {}) => {
  const candidates = [
    payload?.data?.product,
    payload?.product,
    payload?.data?.data?.product,
    payload?.data,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate === 'object' &&
        (candidate.id || candidate.name || candidate.sku)
    ) || fallbackProduct
  );
};

const buildVariationDraft = (variation = {}) => {
  const normalizedVariation = normalizeVariation(variation);

  return {
    ...normalizedVariation,
    variation_name:
      normalizedVariation.variation_name ||
      (normalizedVariation.variation_type === 'custom'
        ? ''
        : getVariationTypeLabel(normalizedVariation.variation_type)),
  };
};

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
  const validVariations = buildVariationsPayload(variationList)
    .filter((variation) => variation.options.length > 0);

  if (!validVariations.length) {
    return [];
  }

  return validVariations.reduce((rows, variation) => {
    if (rows.length === 0) {
      return variation.options.map((option) => ({
        labels: [option.value || option.display_name || 'Option'],
        skuSegments: [
          {
            value: option?.sku || option?.value || option?.display_name || 'OPT',
            isExplicit: Boolean(String(option?.sku || '').trim()),
          },
        ],
        price: Number(option.price) || 0,
        stock: Number(option.stock) || 0,
        image_url: option.image_url || '',
        options: [
          {
            variation_name: variation.variation_name || variation.variation_type,
            option_value: option?.value || option?.display_name || '',
          },
        ],
      }));
    }

    return rows.flatMap((row) =>
      variation.options.map((option) => ({
        labels: [...row.labels, option.value || option.display_name || 'Option'],
        skuSegments: [
          ...row.skuSegments,
          {
            value: option?.sku || option?.value || option?.display_name || 'OPT',
            isExplicit: Boolean(String(option?.sku || '').trim()),
          },
        ],
        price: row.price + (Number(option.price) || 0),
        stock: Math.min(row.stock, Number(option.stock) || 0),
        image_url: row.image_url || option.image_url || '',
        options: [
          ...row.options,
          {
            variation_name: variation.variation_name || variation.variation_type,
            option_value: option?.value || option?.display_name || '',
          },
        ],
      }))
    );
  }, []).map((row) => ({
    combination: row.labels.join(' / '),
    labels: row.labels,
    sku: resolveVariantSku(row.skuSegments, baseSku),
    price: row.price,
    stock: row.stock,
    image_url: row.image_url,
    options: row.options,
  }));
};

const summarizeVariantRows = (variantRows = [], fallbackPrice = '', fallbackStock = '') => {
  if (!variantRows.length) {
    return {
      price: Number(fallbackPrice) || 0,
      stock: Number(fallbackStock) || 0,
    };
  }

  return {
    price: Math.min(...variantRows.map((variant) => Number(variant.price) || 0)),
    stock: variantRows.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0),
  };
};

const applyProductDetailsToForm = ({
  product,
  setEditingProductId,
  setProductForm,
  setSelectedCategory,
  setCategoryInput,
  setIm,
  setVariations,
  setVariants,
  setFormErrors,
  setLastGeneratedVariantSignature,
  setShowVariationSection,
  setCurrentVariation,
  setCurrentOption,
  setEditingVariationIndex,
  setEditMode,
  setMode,
  setIsSkuManuallyEdited,
  basePricingCacheRef,
  variationPricingCacheRef
}) => {
  const productVariations = resolveProductVariations(product);
  const savedVariants = resolveFormVariants(product);
  const nextMode = getProductFormMode(productVariations, savedVariants);
  const resolvedImageUrl = product?.image_url || product?.product_image || '';
  const clearedVariationPricing =
    nextMode === 'variants' ? clearVariationPricing(productVariations) : productVariations;

  basePricingCacheRef.current = {
    price: product?.price ?? '',
    stock: product?.stock ?? '',
  };
  variationPricingCacheRef.current = snapshotVariationPricing(productVariations);

  setEditingProductId(product?.id || null);
  setProductForm({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: nextMode === 'simple' ? product?.price || '' : '',
    stock: nextMode === 'simple' ? product?.stock || '' : '',
    image_url: resolvedImageUrl,
    sort_order: String(product?.sort_order ?? 1),
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
  setVariations(clearedVariationPricing);
  setVariants(savedVariants);
  setLastGeneratedVariantSignature(
    savedVariants.length > 0 ? buildVariationGenerationSignature(clearedVariationPricing) : ''
  );
  setFormErrors({});
  setShowVariationSection(productVariations.length > 0);
  setCurrentVariation(createEmptyVariation());
  setCurrentOption(createEmptyOption());
  setEditingVariationIndex(null);
  setIsSkuManuallyEdited(true);
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
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);
  const [productItem, setProductItem] = useState([])
  const [serlist, setSerList] = useState('')
  const [im, setIm] = useState({
    profile: null,
    cover: null,
  });
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [lastGeneratedVariantSignature, setLastGeneratedVariantSignature] = useState('');
  const [currentVariation, setCurrentVariation] = useState({
    ...createEmptyVariation()
  });
  const [currentOption, setCurrentOption] = useState({
    ...createEmptyOption()
  });
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    sort_order: '1',
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
  const [editingVariationIndex, setEditingVariationIndex] = useState(null);

  const profileInputRef = useRef(null);
  const optionImageRef = useRef(null);
  const basePricingCacheRef = useRef({ price: '', stock: '' });
  const variationPricingCacheRef = useRef([]);
  const hasReadyCurrentVariation = React.useMemo(
    () => isVariationReadyForSubmit(currentVariation),
    [currentVariation]
  );
  const actionableVariations = React.useMemo(() => {
    const nextVariation = buildVariationDraft(currentVariation);

    if (!hasReadyCurrentVariation) {
      return variations;
    }

    if (editingVariationIndex === null) {
      return [...variations, nextVariation];
    }

    return variations.map((variation, index) =>
      index === editingVariationIndex ? nextVariation : variation
    );
  }, [currentVariation, editingVariationIndex, hasReadyCurrentVariation, variations]);
  const variationSignature = React.useMemo(
    () => buildVariationGenerationSignature(actionableVariations),
    [actionableVariations]
  );
  const formMode = React.useMemo(
    () => getProductFormMode(actionableVariations, variants),
    [actionableVariations, variants]
  );
  const variantsDirty =
    formMode === 'variants' && variationSignature !== lastGeneratedVariantSignature;
  const canGenerateVariants = React.useMemo(
    () => countVariationsWithOptions(actionableVariations) > 1,
    [actionableVariations]
  );

  useEffect(() => {
    if (formMode === 'simple') {
      basePricingCacheRef.current = {
        price: productForm.price ?? '',
        stock: productForm.stock ?? '',
      };
    }
  }, [formMode, productForm.price, productForm.stock]);

  useEffect(() => {
    if (formMode === 'variations') {
      variationPricingCacheRef.current = snapshotVariationPricing(variations);
    }
  }, [formMode, variations]);

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
        clearFormErrorPaths('product_image', 'image_url');
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

  const clearFormErrorPaths = (...paths) => {
    if (paths.length === 0) return;

    setFormErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      let hasChanges = false;

      Object.keys(nextErrors).forEach((key) => {
        if (
          paths.some(
            (path) => key === path || key.startsWith(`${path}.`) || key.startsWith(`${path}[`)
          )
        ) {
          delete nextErrors[key];
          hasChanges = true;
        }
      });

      return hasChanges ? nextErrors : previousErrors;
    });
  };

  const enterVariationPricingMode = () => {
    if (variations.length > 0) {
      return true;
    }

    const hasBasePricingValues =
      String(productForm.price ?? '').trim() !== '' || String(productForm.stock ?? '').trim() !== '';

    if (
      hasBasePricingValues &&
      !window.confirm(
        'Adding variations will clear the base product price and stock so pricing can be managed per variation option. Continue?'
      )
    ) {
      return false;
    }

    basePricingCacheRef.current = {
      price: productForm.price ?? '',
      stock: productForm.stock ?? '',
    };

    setProductForm((previousForm) => ({
      ...previousForm,
      price: '',
      stock: '',
    }));

    return true;
  };

  const restoreBasePricingMode = () => {
    setProductForm((previousForm) => ({
      ...previousForm,
      price: basePricingCacheRef.current?.price ?? '',
      stock: basePricingCacheRef.current?.stock ?? '',
    }));
  };

  const clearVariantsToVariationMode = (
    confirmationMessage = 'Removing this will clear all generated variants and reset pricing to variation options. Continue?'
  ) => {
    if (variants.length > 0 && !window.confirm(confirmationMessage)) {
      return false;
    }

    setVariants([]);
    setLastGeneratedVariantSignature('');
    setVariations((previousVariations) =>
      restoreVariationPricing(previousVariations, variationPricingCacheRef.current)
    );
    clearFormErrorPaths('variants');

    return true;
  };

  const hideModal = () => {
    basePricingCacheRef.current = { price: '', stock: '' };
    variationPricingCacheRef.current = [];
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
      sort_order: '1',
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
    setVariants([]);
    setFormErrors({});
    setLastGeneratedVariantSignature('');
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
    setShowVariationSection(false);
    setIsSkuManuallyEdited(false);
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

      const detailedProduct = extractDetailedProduct(response, product);

      applyProductDetailsToForm({
        product: detailedProduct,
        setEditingProductId,
        setProductForm,
        setSelectedCategory,
        setCategoryInput,
        setIm,
        setVariations,
        setVariants,
        setFormErrors,
        setLastGeneratedVariantSignature,
        setShowVariationSection,
        setCurrentVariation,
        setCurrentOption,
        setEditingVariationIndex,
        setEditMode,
        setMode,
        setIsSkuManuallyEdited,
        basePricingCacheRef,
        variationPricingCacheRef
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
    clearFormErrorPaths('category');
  };

  const handleCategoryInputChange = (e) => {
    const value = e.target.value;
    setCategoryInput(value);
    setSelectedCategory(value);
    clearFormErrorPaths('category');
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
      setCategoryInput(categoryInput.trim());
      setSelectedCategory(categoryInput.trim());
      clearFormErrorPaths('category');
    }
    setTimeout(() => setShowCategoryDropdown(false), 200);
  };

  const handleCategoryInputFocus = () => {
    setShowCategoryDropdown(true);
  };

  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const handleAddVariationBlock = () => {
    if (!enterVariationPricingMode()) {
      return;
    }

    setVariations((previousVariations) => [...previousVariations, createEmptyVariation()]);
    setShowVariationSection(true);
    clearFormErrorPaths('variations', 'variants');
  };

  const handleVariationFieldChange = (variationIndex, field, value) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        if (field === 'variation_type') {
          const normalizedType = normalizeVariationType(value);
          const previousLabel = getVariationTypeLabel(variation?.variation_type || '');
          const nextLabel = getVariationTypeLabel(normalizedType);

          return {
            ...variation,
            variation_type: normalizedType,
            variation_name:
              !String(variation?.variation_name || '').trim() ||
              String(variation?.variation_name || '').trim() === previousLabel
                ? nextLabel
                : variation.variation_name,
          };
        }

        return {
          ...variation,
          [field]: value,
        };
      })
    );
    clearFormErrorPaths(`variations.${variationIndex}.${field}`, `variations.${variationIndex}`);
  };

  const handleAddOptionRow = (variationIndex) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) =>
        index === variationIndex
          ? {
              ...variation,
              options: [...(Array.isArray(variation?.options) ? variation.options : []), createEmptyOption()],
            }
          : variation
      )
    );
    clearFormErrorPaths(`variations.${variationIndex}.options`, 'variants');
  };

  const handleQuickAddOption = (variationIndex, optionValue) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        const alreadyExists = (Array.isArray(variation?.options) ? variation.options : []).some(
          (option) => String(option?.value || '').trim().toLowerCase() === optionValue.toLowerCase()
        );

        if (alreadyExists) {
          return variation;
        }

        return {
          ...variation,
          options: [
            ...(Array.isArray(variation?.options) ? variation.options : []),
            {
              ...createEmptyOption(),
              value: optionValue,
              display_name: optionValue,
            },
          ],
        };
      })
    );
    clearFormErrorPaths(`variations.${variationIndex}.options`, 'variants');
  };

  const handleOptionFieldChange = (variationIndex, optionIndex, field, value) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        return {
          ...variation,
          options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) => {
            if (currentOptionIndex !== optionIndex) {
              return option;
            }

            if (field === 'value') {
              return {
                ...option,
                value,
                display_name:
                  !String(option?.display_name || '').trim() ||
                  String(option?.display_name || '').trim() === String(option?.value || '').trim()
                    ? value
                    : option.display_name,
              };
            }

            return {
              ...option,
              [field]: field === 'sku' ? value || null : value,
            };
          }),
        };
      })
    );
    clearFormErrorPaths(
      `variations.${variationIndex}.options.${optionIndex}.${field}`,
      `variations.${variationIndex}.options.${optionIndex}.value`,
      'variants'
    );
  };

  const handleOptionDefaultToggle = (variationIndex, optionIndex, checked) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) => {
        if (index !== variationIndex) {
          return variation;
        }

        return {
          ...variation,
          options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) => ({
            ...option,
            is_default: checked ? currentOptionIndex === optionIndex : false,
          })),
        };
      })
    );
  };

  const handleOptionImageUpload = (variationIndex, optionIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVariations((previousVariations) =>
        previousVariations.map((variation, index) => {
          if (index !== variationIndex) {
            return variation;
          }

          return {
            ...variation,
            options: (Array.isArray(variation?.options) ? variation.options : []).map((option, currentOptionIndex) =>
              currentOptionIndex === optionIndex
                ? {
                    ...option,
                    image_url: reader.result,
                    imageFile: file,
                  }
                : option
            ),
          };
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveOptionRow = (variationIndex, optionIndex) => {
    setVariations((previousVariations) =>
      previousVariations.map((variation, index) =>
        index === variationIndex
          ? {
              ...variation,
              options: (Array.isArray(variation?.options) ? variation.options : []).filter(
                (_, currentOptionIndex) => currentOptionIndex !== optionIndex
              ),
            }
          : variation
      )
    );
    clearFormErrorPaths(`variations.${variationIndex}.options.${optionIndex}`, 'variants');
  };

  const handleRemoveVariationBlock = (variationIndex) => {
    const nextVariations = variations.filter((_, index) => index !== variationIndex);
    const removingAllVariations = nextVariations.length === 0;

    if (removingAllVariations) {
      if (
        !window.confirm(
          'Removing all variations will also clear all variants and reset pricing to the base product. Continue?'
        )
      ) {
        return;
      }

      setVariations([]);
      setVariants([]);
      setLastGeneratedVariantSignature('');
      setShowVariationSection(false);
      restoreBasePricingMode();
      clearFormErrorPaths('variations', 'variants', 'price', 'stock');
      return;
    }

    if (
      variants.length > 0 &&
      !window.confirm(
        'Removing this will clear all generated variants and reset pricing to variation options. Continue?'
      )
    ) {
      return;
    }

    const restoredVariations =
      variants.length > 0
        ? restoreVariationPricing(nextVariations, variationPricingCacheRef.current)
        : nextVariations;

    setVariations(restoredVariations);
    if (variants.length > 0) {
      setVariants([]);
      setLastGeneratedVariantSignature('');
    }
    clearFormErrorPaths(`variations.${variationIndex}`, 'variants');
  };

  const handleGenerateVariants = () => {
    const sanitizedVariations = resolveProductVariations(actionableVariations);
    const variationsWithValues = sanitizedVariations.filter((variation) =>
      variation.options.some((option) => String(option?.value || '').trim())
    );

    if (variationsWithValues.length < 2) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        variants: 'Add at least two variation types with option values to generate variants.',
      }));
      return;
    }

    if (
      variants.length > 0 &&
      variantsDirty &&
      !window.confirm('This will replace existing variant data. Continue?')
    ) {
      return;
    }

    variationPricingCacheRef.current = snapshotVariationPricing(actionableVariations);

    const nextVariants = generateVariantsFromVariations(
      actionableVariations,
      productForm.sku,
      productForm.price,
      variants,
      true
    );
    const nextClearedVariations = clearVariationPricing(actionableVariations);

    setProductForm((previousForm) => ({
      ...previousForm,
      price: 0,
      stock: 0,
    }));
    setVariations(nextClearedVariations);
    if (hasReadyCurrentVariation) {
      setCurrentVariation(createEmptyVariation());
      setCurrentOption(createEmptyOption());
      setEditingVariationIndex(null);
    }
    setVariants(nextVariants);
    setLastGeneratedVariantSignature(buildVariationGenerationSignature(nextClearedVariations));
    clearFormErrorPaths('variants', 'price', 'stock');
  };

  const handleClearVariants = () => {
    clearVariantsToVariationMode();
  };

  const handleVariantFieldChange = (variantIndex, field, value) => {
    setVariants((previousVariants) =>
      previousVariants.map((variant, index) =>
        index === variantIndex
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
    clearFormErrorPaths(`variants.${variantIndex}.${field}`, 'variants');
  };

  const handleVariantImageUpload = (variantIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setVariants((previousVariants) =>
        previousVariants.map((variant, index) =>
          index === variantIndex
            ? {
                ...variant,
                image_url: reader.result,
                imageFile: file,
              }
            : variant
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleVariationNameChange = (e) => {
    setCurrentVariation({...currentVariation, variation_name: e.target.value});
  };

  const handleVariationTypeChange = (e) => {
    const variationType = normalizeVariationType(e.target.value);
    setCurrentVariation((previousVariation) => ({
      ...previousVariation,
      variation_type: variationType,
      variation_name:
        previousVariation.variation_name || (variationType === 'custom' ? '' : getVariationTypeLabel(variationType)),
    }));
  };

  const handleVariationRequiredChange = (e) => {
    setCurrentVariation({...currentVariation, is_required: e.target.checked});
  };

  const handleOptionValueChange = (e) => {
    const nextValue = e.target.value;
    setCurrentOption((previousOption) => ({
      ...previousOption,
      value: nextValue,
      display_name:
        !previousOption.display_name || previousOption.display_name === previousOption.value
          ? nextValue
          : previousOption.display_name
    }));
  };

  const handleOptionDisplayNameChange = (e) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      display_name: e.target.value
    }));
  };

  const handleOptionPriceChange = (e) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      price: parseFloat(e.target.value) || ''
    }));
  };

  const handleOptionStockChange = (e) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      stock: parseInt(e.target.value) || ''
    }));
  };

  const handleOptionSkuChange = (e) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      sku: e.target.value || null
    }));
  };

  const handleOptionDefaultChange = (e) => {
    setCurrentOption((previousOption) => ({
      ...previousOption,
      is_default: e.target.checked
    }));
  };

  const handleOptionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentOption((previousOption) => ({
          ...previousOption,
          image_url: reader.result,
          imageFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addOption = () => {
    const requiresOptionPricing = formMode !== 'variants';

    if (
      currentOption.value &&
      (!requiresOptionPricing || (currentOption.price !== '' && currentOption.stock !== ''))
    ) {
      const nextOption = {
        value: currentOption.value,
        display_name: currentOption.display_name || currentOption.value,
        price: requiresOptionPricing ? currentOption.price : '',
        stock: requiresOptionPricing ? currentOption.stock : '',
        sku: currentOption.sku ?? null,
        image_url: currentOption.image_url || '',
        is_default: currentOption.is_default === true,
        imageFile: currentOption.imageFile instanceof File ? currentOption.imageFile : null
      };

      setCurrentVariation((previousVariation) => ({
        ...previousVariation,
        options: [
          ...((Array.isArray(previousVariation.options) ? previousVariation.options : []).map((option) => ({
            ...option,
            is_default: nextOption.is_default ? false : option.is_default === true
          }))),
          nextOption
        ]
      }));
      setCurrentOption(createEmptyOption());
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Variation option',
        text: requiresOptionPricing
          ? 'Please fill in option value, price adjustment, and stock before adding the option.'
          : 'Please fill in the option value before adding the option.',
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
    const nextVariation = buildVariationDraft(currentVariation);

    if (nextVariation.variation_name && nextVariation.variation_type && nextVariation.options.length > 0) {
      setVariations((previousVariations) => {
        if (editingVariationIndex === null) {
          return [...previousVariations, nextVariation];
        }

        return previousVariations.map((variation, index) =>
          index === editingVariationIndex ? nextVariation : variation
        );
      });
      setCurrentVariation(createEmptyVariation());
      setCurrentOption(createEmptyOption());
      setEditingVariationIndex(null);
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
    const nextVariations = variations.filter((_, i) => i !== index);
    const removingAllVariations = nextVariations.length === 0;

    if (removingAllVariations) {
      if (
        !window.confirm(
          'Removing all variations will also clear all variants and reset pricing to the base product. Continue?'
        )
      ) {
        return;
      }

      setVariations([]);
      setVariants([]);
      setLastGeneratedVariantSignature('');
      setShowVariationSection(false);
      restoreBasePricingMode();
      clearFormErrorPaths('variations', 'variants', 'price', 'stock');
    } else if (variants.length > 0) {
      if (
        !window.confirm(
          'Removing this will clear all generated variants and reset pricing to variation options. Continue?'
        )
      ) {
        return;
      }

      setVariations(restoreVariationPricing(nextVariations, variationPricingCacheRef.current));
      setVariants([]);
      setLastGeneratedVariantSignature('');
      clearFormErrorPaths('variants');
    } else {
      setVariations(nextVariations);
    }

    if (editingVariationIndex === index) {
      setCurrentVariation(createEmptyVariation());
      setCurrentOption(createEmptyOption());
      setEditingVariationIndex(null);
    } else if (editingVariationIndex !== null && editingVariationIndex > index) {
      setEditingVariationIndex((previousIndex) => previousIndex - 1);
    }
  };

  const editVariation = (index) => {
    const variationToEdit = normalizeVariation(variations[index]);
    setCurrentVariation(buildVariationDraft(variationToEdit));
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(index);
    setShowVariationSection(true);
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
    setProductForm((previousForm) => ({
      ...previousForm,
      name,
      sku: editMode || isSkuManuallyEdited ? previousForm.sku : newSKU,
    }));
    clearFormErrorPaths('name', 'sku');
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'sku') {
      setIsSkuManuallyEdited(true);
    }

    setProductForm((previousForm) => ({
      ...previousForm,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearFormErrorPaths(name, name === 'image_url' ? 'product_image' : name);
  };

  const startNewVariation = () => {
    if (!enterVariationPricingMode()) {
      return;
    }

    setEditingVariationIndex(null);
    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setShowVariationSection(true);
  };

  const toggleVariationSection = () => {
    if (!showVariationSection) {
      startNewVariation();
      return;
    }

    if (variations.length === 0) {
      restoreBasePricingMode();
    }

    setCurrentVariation(createEmptyVariation());
    setCurrentOption(createEmptyOption());
    setEditingVariationIndex(null);
    setShowVariationSection(false);
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

    const submitVariations = resolveProductVariations(actionableVariations);
    const submitMode = getProductFormMode(submitVariations, variants);
    const hasVariationsForSubmit = submitVariations.length > 0;
    const hasVariantsForSubmit = Array.isArray(variants) && variants.length > 0;
    const trimmedCategory = selectedCategory.trim() || categoryInput.trim();
    const nextErrors = {};

    if (!productForm.name.trim()) {
      nextErrors.name = 'Product name is required.';
    }

    if (!productForm.sku.trim()) {
      nextErrors.sku = 'Base SKU is required.';
    }

    if (!productForm.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!trimmedCategory) {
      nextErrors.category = 'Select or enter a category.';
    }

    if (submitMode === 'simple') {
      if (productForm.price === '' || Number(productForm.price) <= 0) {
        nextErrors.price = 'Price must be greater than 0.';
      }

      if (productForm.stock === '' || Number(productForm.stock) < 0) {
        nextErrors.stock = 'Stock must be 0 or greater.';
      }
    } else {
      submitVariations.forEach((variation, variationIndex) => {
        if (!String(variation?.variation_name || '').trim()) {
          nextErrors[`variations.${variationIndex}.variation_name`] =
            'Variation name is required.';
        }

        if (!String(variation?.variation_type || '').trim()) {
          nextErrors[`variations.${variationIndex}.variation_type`] =
            'Variation type is required.';
        }

        if (!Array.isArray(variation?.options) || variation.options.length === 0) {
          nextErrors[`variations.${variationIndex}.options`] =
            'Add at least one option to this variation.';
        }

        variation.options.forEach((option, optionIndex) => {
          if (!String(option?.value || '').trim()) {
            nextErrors[`variations.${variationIndex}.options.${optionIndex}.value`] =
              'Option value is required.';
          }

          if (submitMode === 'variations') {
            if (option?.price === '' || option?.price === null || option?.price === undefined) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.price`] =
                'Price is required.';
            } else if (Number(option.price) <= 0) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.price`] =
                'Price must be greater than 0.';
            }

            if (option?.stock === '' || option?.stock === null || option?.stock === undefined) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.stock`] =
                'Stock is required.';
            } else if (Number(option.stock) < 0) {
              nextErrors[`variations.${variationIndex}.options.${optionIndex}.stock`] =
                'Stock must be 0 or greater.';
            }
          }
        });
      });

      if (hasVariantsForSubmit && hasVariationsForSubmit && variantsDirty) {
        nextErrors.variants =
          'Your variations have changed. Regenerate variants to update the table.';
      } else if (hasVariantsForSubmit) {
        variants.forEach((variant, variantIndex) => {
          if (variant?.enabled === false) {
            return;
          }

          if (!String(variant?.sku || '').trim()) {
            nextErrors[`variants.${variantIndex}.sku`] =
              'SKU is required for enabled variants.';
          }

          if (variant?.price === '' || variant?.price === null || variant?.price === undefined) {
            nextErrors[`variants.${variantIndex}.price`] = 'Price is required.';
          } else if (Number(variant.price) <= 0) {
            nextErrors[`variants.${variantIndex}.price`] = 'Price must be greater than 0.';
          }

          if (variant?.stock === '' || variant?.stock === null || variant?.stock === undefined) {
            nextErrors[`variants.${variantIndex}.stock`] = 'Stock is required.';
          } else if (Number(variant.stock) < 0) {
            nextErrors[`variants.${variantIndex}.stock`] = 'Stock must be 0 or greater.';
          }
        });
      }
    }

    if (!im.profile && !productForm.image_url.trim()) {
      nextErrors.product_image = 'Upload a product image or provide an image URL.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});

    const variationsForFormData = submitVariations;
    const shouldUseBasePricing = !hasVariationsForSubmit && !hasVariantsForSubmit;
    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('sku', productForm.sku);
    formData.append('description', productForm.description);
    formData.append('price', shouldUseBasePricing ? String(productForm.price ?? '') : '');
    formData.append('stock', shouldUseBasePricing ? String(productForm.stock ?? '') : '');
    formData.append('category', trimmedCategory);
    formData.append('sort_order', String(productForm.sort_order || 1));
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
    
    if (variationsForFormData.length > 0) {
      const variationsPayload = buildVariationsPayload(variationsForFormData);

      formData.append('variations', JSON.stringify(variationsPayload));

      variationsForFormData.forEach((variation, variationIndex) => {
        (Array.isArray(variation?.options) ? variation.options : []).forEach((option, optionIndex) => {
          if (option?.imageFile instanceof File) {
            formData.append(
              `variation_option_image_${variationIndex}_${optionIndex}`,
              option.imageFile
            );
          }
        });
      });
    }

    if (variants.length > 0) {
      const variantsPayload = buildVariantsPayload(variants)
        .filter((variant) => variant.enabled !== false)
        .map(({ enabled, ...variant }) => variant);

      formData.append('variants', JSON.stringify(variantsPayload));

      variants.forEach((variant, variantIndex) => {
        if (variant?.imageFile instanceof File) {
          formData.append(`variant_image_${variantIndex}`, variant.imageFile);
        }
      });
    }

    logProductSubmissionPayload(
      editMode ? 'Update product submission' : 'Create product submission',
      formData
    );

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
          sort_order: '1',
          expiry_date: '',
          low_stock_threshold: '10',
          is_active: true,
          is_published: false,
          is_featured: false
        })
        setCurrentOption(createEmptyOption())
        setCurrentVariation(createEmptyVariation())
        setVariations([]);
        setEditingVariationIndex(null);
        setIsSkuManuallyEdited(false);
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
          <div className={`${styles.vendorOnlinePage} outer-box p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
            <div className={`${styles.vendorOnlineSurfaceCardInner} inner-box text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
              <p style={{color: '#78716C'}}>No Product information available</p>
              <button className={`btn ${styles['add-btn']} px-4`} onClick={() => setMode(true)}>Add Product</button>
            </div>
          </div>

        </>
        ) : (
        <>
        <div className={`${styles.vendorOnlinePage} ${styles.vendorOnlineSurfaceCard}`} style={{background: '#fff', border: '1px solid #eee', borderRadius: '8px'}}>
          <div className={`${styles.vendorOnlineSectionIntro} px-3 pt-3 pt-md-2`}>
            <p className="mx mb-2 p-0">Add Products</p>
            <p className="mb-0 mb-3" style={{ fontSize: '13px', color: '#78716C' }}>
              Add products to your store. You can add more products later.
            </p>

          </div>

          <div className={`${styles.vendorOnlineActions} px-3 mt-4`}>
            <div>
              <p className='m-0'>{serlist} Products added</p>
              <small className="d-block" style={{color: '#78716C'}}>0 pinned to top</small>
            </div>
            <div>
              <button className={`${styles['si-btn']} px-2 px-lg-5 py-3 py-lg-3`} onClick={() => {setMode(true)}}>Add Product</button>
            </div>
          </div>

          <div className="row mt-4 px-3">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            ) : error ? (
              <p className="text-danger text-center">Something went wrong</p>
            ) : Array.isArray(productItem) && productItem.length > 0 ? (
              productItem.map((product) => (
                <div className="col-12 col-sm-6 col-md-6 col-lg-4 mb-4" key={product.id}>
                  <div className={`${styles.vendorOnlineCard} item-section`} style={{height: '280px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '8px'}}>
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

        {(mode || editMode) && (
          <ProductFormDesigner
            title={editMode ? 'Edit Product' : 'Add New Product'}
            isEditMode={editMode}
            isSubmitting={loading}
            loadingLabel={editMode ? 'Updating...' : 'Saving...'}
            submitLabel={editMode ? 'Update Product' : 'Publish Product'}
            productForm={productForm}
            onSubmit={addProductToStore}
            onClose={hideModal}
            onProductNameChange={handleProductNameChange}
            onProductFormChange={handleProductFormChange}
            selectedCategory={selectedCategory}
            categoryInput={categoryInput}
            categoryOptions={categories}
            showCategoryDropdown={showCategoryDropdown}
            onCategoryInputChange={handleCategoryInputChange}
            onCategorySelect={handleCategorySelect}
            onCategoryFocus={handleCategoryInputFocus}
            onCategoryBlur={handleCategoryInputBlur}
            imageInputRef={profileInputRef}
            optionImageRef={optionImageRef}
            productImageSrc={im.profile ? getImageSrc(im.profile) : ''}
            onProductImageClick={() => triggerInput(profileInputRef)}
            onProductImageChange={(event) => handleImageChange(event, 'profile')}
            variationsEnabled
            formErrors={formErrors}
            formMode={formMode}
            variants={variants}
            variantsDirty={variantsDirty}
            canGenerateVariants={canGenerateVariants}
            showVariationSection={showVariationSection}
            onToggleVariationSection={toggleVariationSection}
            onStartNewVariation={startNewVariation}
            variations={normalizedVariations}
            currentVariation={currentVariation}
            currentOption={currentOption}
            editingVariationIndex={editingVariationIndex}
            onVariationNameChange={handleVariationNameChange}
            onVariationTypeChange={handleVariationTypeChange}
            onVariationRequiredChange={handleVariationRequiredChange}
            onOptionValueChange={handleOptionValueChange}
            onOptionDisplayNameChange={handleOptionDisplayNameChange}
            onOptionPriceChange={handleOptionPriceChange}
            onOptionStockChange={handleOptionStockChange}
            onOptionSkuChange={handleOptionSkuChange}
            onOptionDefaultChange={handleOptionDefaultChange}
            onOptionImageChange={handleOptionImageChange}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onAddVariation={addVariation}
            onEditVariation={editVariation}
            onRemoveVariation={removeVariation}
            onSavedOptionFieldChange={handleOptionFieldChange}
            onGenerateVariants={handleGenerateVariants}
            onClearVariants={handleClearVariants}
            onVariantFieldChange={handleVariantFieldChange}
            onVariantImageChange={handleVariantImageUpload}
            canToggleVisibility
            canMarkFeatured
          />
        )}

        {shouldRenderLegacyProductModal && renderProductModal()}

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
