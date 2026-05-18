import React, {useState, useEffect, useMemo, useRef} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCountries } from '../../../slice/countriesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { createOnlineStore, resetStatus, updateStoreLinks, getAllServices, getAllCollection, getServiceCollection, getCollectionForProduct, productImageForCollection, getMyOnlineStore } from '../../../slice/onlineStoreSlice';
import { faInfoCircle, faLink, faStore, faCube, faDatabase, faEllipsisV, faArrowLeft, faCartShopping, faMagnifyingGlass, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Flash, F, X, In, In2, Owi, Smc } from '../../../assets';
import Service from './Service';
import Appearance from './Appearance';
import Product from './Product';
import Collection from './Collection';
import ViewStore from './ViewStore';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';
import Button from '../../../components/ui/Button';
import { API_URL } from '../../../config/constant';
import { buildStorefrontThemeStyle } from '../../../utils/storefrontTheme';

const formatPreviewPrice = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return 'Contact for price';
    }

    return `₦${numericValue.toLocaleString()}`;
};

const previewText = (value, fallback) => {
    if (typeof value !== 'string') return fallback;
    const trimmedValue = value.trim();
    return trimmedValue || fallback;
};

const getActionErrorMessage = (actionError, fallback) => {
    if (typeof actionError === 'string' && actionError.trim()) return actionError;
    if (actionError?.message) return actionError.message;
    if (actionError?.error) return actionError.error;
    return fallback;
};

const parsePreviewMaybeJson = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const formatPreviewPriceLabel = (value, fallback = 'Contact for price') => {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
        return formatPreviewPrice(numericValue);
    }

    if (typeof value === 'string' && value.trim()) {
        return value;
    }

    return fallback;
};

const PREVIEW_COLOR_FALLBACKS = {
    black: '#111827',
    blue: '#3B82F6',
    brown: '#8B5E3C',
    cream: '#F5F5DC',
    gold: '#D4A017',
    gray: '#9CA3AF',
    green: '#22C55E',
    grey: '#9CA3AF',
    navy: '#1D4ED8',
    orange: '#FB923C',
    pink: '#EC4899',
    purple: '#8B5CF6',
    red: '#EF4444',
    silver: '#B8C0CC',
    tan: '#C19A6B',
    white: '#F8FAFC',
    yellow: '#FACC15'
};

const normalizePreviewVariationType = (value = '') => {
    const normalizedValue = String(value).trim().toLowerCase();

    if (normalizedValue === 'colour') return 'color';
    if (normalizedValue.includes('color') || normalizedValue.includes('colour')) return 'color';
    if (normalizedValue.includes('size')) return 'size';

    return normalizedValue || 'other';
};

const normalizePreviewOption = (option = {}) => ({
    displayName:
        option?.display_name ??
        option?.option_display_name ??
        option?.value ??
        option?.option_value ??
        '',
    image:
        option?.image_url ??
        option?.image ??
        option?.preview_image ??
        option?.option_image ??
        '',
    isDefault:
        option?.is_default === true ||
        option?.is_default === 1 ||
        option?.is_default === '1' ||
        option?.is_default === 'true',
    price: option?.price ?? option?.price_adjustment ?? '',
    raw: option,
    value: option?.value ?? option?.option_value ?? option?.display_name ?? ''
});

const normalizePreviewVariation = (variation = {}) => {
    const optionSource = parsePreviewMaybeJson(
        variation?.options ??
            variation?.variation_options ??
            variation?.values ??
            variation?.items ??
            []
    );

    return {
        name: variation?.variation_name ?? variation?.name ?? variation?.title ?? '',
        options: Array.isArray(optionSource)
            ? optionSource
                  .map(normalizePreviewOption)
                  .filter((option) => String(option?.displayName || option?.value || '').trim())
            : [],
        type: normalizePreviewVariationType(
            variation?.variation_type ?? variation?.type ?? variation?.variation_name ?? variation?.name ?? ''
        )
    };
};

const getPreviewVariations = (product = {}) => {
    const variationSourceCandidates = [
        product?.variations,
        product?.variation,
        product?.variation_options,
        product?.values,
        product?.options,
        product?.raw?.variations,
        product?.raw?.variation,
        product?.raw?.variation_options,
        product?.raw?.values
    ];

    for (const source of variationSourceCandidates) {
        const parsedSource = parsePreviewMaybeJson(source);

        if (Array.isArray(parsedSource) && parsedSource.length) {
            return parsedSource
                .map(normalizePreviewVariation)
                .filter((variation) => variation.options.length > 0);
        }
    }

    return [];
};

const resolvePreviewOptionColor = (option = {}) => {
    const rawOption = option?.raw || {};
    const colorCandidate =
        rawOption?.hex ??
        rawOption?.color_hex ??
        rawOption?.hex_code ??
        rawOption?.color ??
        rawOption?.value ??
        option?.displayName ??
        option?.value;

    if (typeof colorCandidate !== 'string') {
        return '#D4D4D8';
    }

    const trimmedColor = colorCandidate.trim();

    if (/^(#|rgb|hsl)/i.test(trimmedColor)) {
        return trimmedColor;
    }

    return PREVIEW_COLOR_FALLBACKS[trimmedColor.toLowerCase()] || '#D4D4D8';
};

const dedupePreviewItems = (items = []) => {
    const previewMap = new Map();

    items.forEach((item, index) => {
        if (!item) return;

        const itemKey =
            item?.id ??
            item?.slug ??
            `${item?.title || item?.name || 'preview-item'}-${index}`;

        if (!previewMap.has(itemKey)) {
            previewMap.set(itemKey, item);
        }
    });

    return [...previewMap.values()];
};

const buildInitialPreviewVariationSelections = (product = {}) => {
    const nextSelections = {};

    getPreviewVariations(product).forEach((variation, index) => {
        const variationKey = variation?.name || variation?.type || `variation-${index}`;
        const defaultOption =
            variation?.options?.find((option) => option?.isDefault) || variation?.options?.[0];

        if (defaultOption) {
            nextSelections[variationKey] = defaultOption;
        }
    });

    return nextSelections;
};

const StorefrontMobilePreview = ({
    themeStyle,
    storeLogo,
    storeName,
    storeDescription,
    storeBannerImage,
    previewTab,
    productCollections,
    serviceCollections
}) => {
    const [previewView, setPreviewView] = useState('home');
    const [activeNav, setActiveNav] = useState(previewTab === 'Services' ? 'services' : 'home');
    const [activeCategory, setActiveCategory] = useState('all');
    const [viewMode, setViewMode] = useState(previewTab === 'Services' ? 'services' : 'products');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [productQuantity, setProductQuantity] = useState(1);
    const [selectedVariationOptions, setSelectedVariationOptions] = useState({});
    const [justAddedProductId, setJustAddedProductId] = useState(null);
    const [pendingScrollRequest, setPendingScrollRequest] = useState(null);
    const frameRef = useRef(null);
    const productSectionRef = useRef(null);
    const addFeedbackTimerRef = useRef(null);

    const requestPreviewScroll = (type) => {
        setPendingScrollRequest((previous) => ({
            type,
            sequence: (previous?.sequence || 0) + 1
        }));
    };

    const goTo = (view, data = null) => {
        const nextSelectedProduct = view === 'product-detail' ? data : null;

        setSelectedProduct(nextSelectedProduct);
        setSelectedService(view === 'service-detail' ? data : null);
        setSelectedCollection(view === 'collection-detail' ? data : null);
        setSelectedVariationOptions(
            nextSelectedProduct ? buildInitialPreviewVariationSelections(nextSelectedProduct) : {}
        );
        setProductQuantity(1);
        setPreviewView(view);
        requestPreviewScroll('top');
    };

    const goBack = () => {
        setSelectedProduct(null);
        setSelectedService(null);
        setSelectedCollection(null);
        setSelectedVariationOptions({});
        setPreviewView('home');
        requestPreviewScroll('top');
    };

    useEffect(() => {
        if (!pendingScrollRequest) return;

        if (pendingScrollRequest.type === 'top') {
            frameRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (pendingScrollRequest.type === 'products') {
            productSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [pendingScrollRequest]);

    useEffect(() => {
        return () => {
            if (addFeedbackTimerRef.current) {
                window.clearTimeout(addFeedbackTimerRef.current);
            }
        };
    }, []);

    const previewCollections = useMemo(
        () =>
            (productCollections || []).map((collection, index) => ({
                ...collection,
                countValue: collection?.countValue ?? collection?.items?.length ?? 0,
                id: collection?.id ?? `collection-${index}`,
                image: collection?.image || collection?.items?.[0]?.image || storeLogo
            })),
        [productCollections, storeLogo]
    );

    const allProducts = useMemo(
        () =>
            dedupePreviewItems(
                previewCollections.flatMap((collection) => collection?.items || [])
            ),
        [previewCollections]
    );

    const allServices = useMemo(
        () =>
            dedupePreviewItems(
                (serviceCollections || []).flatMap((collection) => collection?.items || [])
            ),
        [serviceCollections]
    );

    const categories = useMemo(() => {
        const categoryMap = new Map();

        allProducts.forEach((product) => {
            const categoryLabel = previewText(product?.category, '').trim();

            if (!categoryLabel) return;

            const normalizedKey = categoryLabel.toLowerCase();

            if (!categoryMap.has(normalizedKey)) {
                categoryMap.set(normalizedKey, categoryLabel);
            }
        });

        return [
            { key: 'all', label: 'All' },
            ...[...categoryMap.entries()].map(([key, label]) => ({
                key,
                label
            }))
        ];
    }, [allProducts]);

    const resolvedActiveCategory = categories.some((category) => category.key === activeCategory)
        ? activeCategory
        : 'all';

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredProducts = useMemo(
        () =>
            allProducts.filter((product) => {
                const matchesCategory =
                    resolvedActiveCategory === 'all'
                        ? true
                        : product?.categoryKey === resolvedActiveCategory;
                const searchableText = [
                    product?.title,
                    product?.name,
                    product?.description,
                    product?.category
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                const matchesSearch = !normalizedSearchQuery || searchableText.includes(normalizedSearchQuery);

                return matchesCategory && matchesSearch;
            }),
        [allProducts, normalizedSearchQuery, resolvedActiveCategory]
    );

    const filteredServices = useMemo(
        () =>
            allServices.filter((service) => {
                const searchableText = [service?.title, service?.description, service?.duration]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return !normalizedSearchQuery || searchableText.includes(normalizedSearchQuery);
            }),
        [allServices, normalizedSearchQuery]
    );

    const heroDescription = previewText(
        storeDescription,
        'Discover curated products and services from this store.'
    );
    const truncatedDescription =
        heroDescription.length > 180 ? `${heroDescription.slice(0, 180).trim()}...` : heroDescription;
    const showDescriptionToggle = heroDescription.length > 180;
    const displayedHeroDescription = descriptionExpanded ? heroDescription : truncatedDescription;
    const bannerStyle = storeBannerImage
        ? {
              backgroundImage: `linear-gradient(135deg, rgba(77, 81, 91, 0.94) 0%, rgba(194, 197, 203, 0.78) 100%), url("${storeBannerImage}")`
          }
        : undefined;

    const cartCount = useMemo(
        () => cartItems.reduce((total, item) => total + (Number(item?.qty) || 0), 0),
        [cartItems]
    );

    const selectedProductVariations = useMemo(
        () => (selectedProduct ? getPreviewVariations(selectedProduct) : []),
        [selectedProduct]
    );

    const selectedOptionList = useMemo(
        () => Object.values(selectedVariationOptions).filter(Boolean),
        [selectedVariationOptions]
    );

    const selectedProductPriceValue = useMemo(() => {
        if (!selectedProduct) {
            return null;
        }

        const basePriceValue = Number(selectedProduct?.priceValue);
        const normalizedBasePrice = Number.isFinite(basePriceValue) ? basePriceValue : null;
        const optionAdjustments = selectedOptionList.reduce((total, option) => {
            const optionPrice = Number(option?.price);
            return total + (Number.isFinite(optionPrice) ? optionPrice : 0);
        }, 0);

        if (normalizedBasePrice === null) {
            return optionAdjustments || null;
        }

        return normalizedBasePrice + optionAdjustments;
    }, [selectedOptionList, selectedProduct]);

    const selectedProductDisplayPrice = formatPreviewPriceLabel(
        selectedProductPriceValue ?? selectedProduct?.priceValue ?? selectedProduct?.price
    );

    const selectedProductImage = useMemo(() => {
        const optionImage = [...selectedOptionList]
            .reverse()
            .map((option) => option?.image)
            .find(Boolean);

        return optionImage || selectedProduct?.image || storeLogo;
    }, [selectedOptionList, selectedProduct, storeLogo]);

    const cartSubtotal = useMemo(
        () =>
            cartItems.reduce((total, item) => {
                const itemPrice = Number(item?.unitPrice ?? item?.priceValue);
                const itemQuantity = Number(item?.qty) || 0;

                if (!Number.isFinite(itemPrice)) {
                    return total;
                }

                return total + itemPrice * itemQuantity;
            }, 0),
        [cartItems]
    );

    const updateCartQuantity = (itemId, delta) => {
        setCartItems((previousItems) =>
            previousItems
                .map((item) => {
                    if (item?.id !== itemId) return item;

                    return {
                        ...item,
                        qty: Math.max(0, (Number(item?.qty) || 0) + delta)
                    };
                })
                .filter((item) => (Number(item?.qty) || 0) > 0)
        );
    };

    const removeCartItem = (itemId) => {
        setCartItems((previousItems) => previousItems.filter((item) => item?.id !== itemId));
    };

    const handleAddToCart = (product, qty = 1) => {
        const unitPriceValue = Number(selectedProductPriceValue ?? product?.priceValue);
        const selectedOptionsSummary = selectedProductVariations
            .map((variation, index) => {
                const variationKey = variation?.name || variation?.type || `variation-${index}`;
                const selectedOption = selectedVariationOptions[variationKey];

                if (!selectedOption) return null;

                return {
                    label: variation?.name || variation?.type || 'Option',
                    value: selectedOption?.displayName || selectedOption?.value
                };
            })
            .filter(Boolean);

        setCartItems((previousItems) => {
            const existingItem = previousItems.find((item) => item?.id === product?.id);

            if (existingItem) {
                return previousItems.map((item) =>
                    item?.id === product?.id
                        ? { ...item, qty: (Number(item?.qty) || 0) + qty }
                        : item
                );
            }

            return [
                ...previousItems,
                {
                    ...product,
                    qty,
                    selectedOptions: selectedOptionsSummary,
                    unitPrice: Number.isFinite(unitPriceValue) ? unitPriceValue : product?.priceValue ?? null
                }
            ];
        });

        setJustAddedProductId(product?.id);

        if (addFeedbackTimerRef.current) {
            window.clearTimeout(addFeedbackTimerRef.current);
        }

        addFeedbackTimerRef.current = window.setTimeout(() => {
            setJustAddedProductId(null);
        }, 1400);
    };

    const openHome = () => {
        setActiveNav('home');
        setPreviewView('home');
        setSelectedProduct(null);
        setSelectedService(null);
        setSelectedCollection(null);
        requestPreviewScroll('top');
    };

    const openShop = () => {
        setActiveNav('shop');
        setViewMode('products');
        setPreviewView('home');
        setSelectedProduct(null);
        setSelectedService(null);
        setSelectedCollection(null);
        setSelectedVariationOptions({});
        requestPreviewScroll('products');
    };

    const openCollections = () => {
        setActiveNav('collections');
        goTo('collection-list');
    };

    const openServices = () => {
        setActiveNav('services');
        setViewMode('services');
        setPreviewView('home');
        setSelectedProduct(null);
        setSelectedService(null);
        setSelectedCollection(null);
        setSelectedVariationOptions({});
        requestPreviewScroll('products');
    };

    const handleViewModeChange = (nextViewMode) => {
        setViewMode(nextViewMode);

        if (nextViewMode === 'services' && previewView !== 'home') {
            setPreviewView('home');
        }

        if (nextViewMode === 'products' && activeNav === 'services') {
            setActiveNav('shop');
        }
    };

    const renderViewHeader = (title, onBack) => (
        <div className={styles.previewViewHeader}>
            <button className={styles.previewBackButton} type="button" onClick={onBack}>
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <h3 className={styles.previewViewTitle}>{title}</h3>
            <span className={styles.previewViewSpacer} />
        </div>
    );

    const renderProductGrid = (items) => {
        if (!items.length) {
            return (
                <div className={styles.previewEmptyState}>
                    <p className={styles.previewEmptyTitle}>No products found</p>
                    <p className={styles.previewEmptyText}>Try another category or search term.</p>
                </div>
            );
        }

        return (
            <div className={styles.previewProductGrid}>
                {items.map((product, index) => (
                    <button
                        className={styles.previewProductCard}
                        key={product?.id || `${product?.title || 'product'}-${index}`}
                        type="button"
                        onClick={() => goTo('product-detail', product)}
                    >
                        <div className={styles.previewProductImageWrap}>
                            <img
                                className={styles.previewProductImage}
                                src={product?.image || storeLogo}
                                alt={product?.title || product?.name || 'Product'}
                            />
                        </div>
                        <div className={styles.previewProductBody}>
                            <span className={styles.previewProductName}>
                                {product?.title || product?.name || 'Product'}
                            </span>
                            <span className={styles.previewProductPrice}>
                                {formatPreviewPriceLabel(product?.priceValue ?? product?.price)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderServiceGrid = (items) => {
        if (!items.length) {
            return (
                <div className={styles.previewEmptyState}>
                    <p className={styles.previewEmptyTitle}>No services found</p>
                    <p className={styles.previewEmptyText}>Services added to this store will appear here.</p>
                </div>
            );
        }

        return (
            <div className={styles.previewServiceGrid}>
                {items.map((service, index) => (
                    <button
                        className={styles.previewServiceCard}
                        key={service?.id || `${service?.title || 'service'}-${index}`}
                        type="button"
                        onClick={() => goTo('service-detail', service)}
                    >
                        <img
                            className={styles.previewServiceImage}
                            src={service?.image || storeLogo}
                            alt={service?.title || 'Service'}
                        />
                        <div className={styles.previewServiceBody}>
                            <span className={styles.previewServiceName}>{service?.title || 'Service'}</span>
                            <span className={styles.previewServiceMeta}>
                                {formatPreviewPriceLabel(service?.priceValue ?? service?.price)}
                            </span>
                            <span className={styles.previewServiceMeta}>{service?.duration || 'Duration not set'}</span>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const renderHomeView = () => (
        <div className={styles.previewHome}>
            <div className={styles.previewHeader}>
                <div className={styles.previewBrand}>
                    <img className={styles.previewBrandLogo} src={storeLogo} alt={storeName} />
                    <h2 className={styles.previewBrandName}>{storeName}</h2>
                </div>

                <button
                    className={styles.previewCartButton}
                    type="button"
                    onClick={() => goTo('cart')}
                    aria-label="Open cart preview"
                >
                    <FontAwesomeIcon icon={faCartShopping} />
                    <span className={styles.previewCartBadge}>{cartCount}</span>
                </button>
            </div>

            <div className={styles.previewNav}>
                <button
                    className={`${styles.previewNavButton} ${
                        activeNav === 'home' ? styles.previewNavButtonActive : ''
                    }`}
                    type="button"
                    onClick={openHome}
                >
                    Home
                </button>
                <button
                    className={`${styles.previewNavButton} ${
                        activeNav === 'shop' ? styles.previewNavButtonActive : ''
                    }`}
                    type="button"
                    onClick={openShop}
                >
                    Shop
                </button>
                <button
                    className={`${styles.previewNavButton} ${
                        activeNav === 'collections' ? styles.previewNavButtonActive : ''
                    }`}
                    type="button"
                    onClick={openCollections}
                >
                    Collections
                </button>
                <button
                    className={`${styles.previewNavButton} ${
                        activeNav === 'services' ? styles.previewNavButtonActive : ''
                    }`}
                    type="button"
                    onClick={openServices}
                >
                    Services
                </button>
            </div>

            <label className={styles.previewSearchBar}>
                <FontAwesomeIcon className={styles.previewSearchIcon} icon={faMagnifyingGlass} />
                <input
                    className={styles.previewSearchInput}
                    type="text"
                    placeholder="Search products"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                />
            </label>

            <section className={styles.previewBanner} style={bannerStyle}>
                <h3 className={styles.previewBannerTitle}>{storeName}</h3>
                <p className={styles.previewBannerText}>
                    {displayedHeroDescription}{' '}
                    {showDescriptionToggle ? (
                        <button
                            className={styles.previewBannerLink}
                            type="button"
                            onClick={() => setDescriptionExpanded((previous) => !previous)}
                        >
                            {descriptionExpanded ? 'Read less' : 'Read more'}
                        </button>
                    ) : null}
                </p>
                <button className={styles.previewBannerAction} type="button" onClick={openShop}>
                    Shop collection
                </button>
            </section>

            <section className={styles.previewSectionBlock}>
                <p className={styles.previewSectionLabel}>CATEGORIES</p>
                <div className={styles.previewPillScroller}>
                    {categories.map((category) => (
                        <button
                            className={`${styles.previewPillButton} ${
                                resolvedActiveCategory === category.key ? styles.previewPillButtonActive : ''
                            }`}
                            key={category.key}
                            type="button"
                            onClick={() => setActiveCategory(category.key)}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.previewSectionBlock} ref={productSectionRef}>
                <p className={styles.previewSectionLabel}>VIEW</p>
                <div className={styles.previewToggleRow}>
                    <button
                        className={`${styles.previewToggleButton} ${
                            viewMode === 'products' ? styles.previewToggleButtonActive : ''
                        }`}
                        type="button"
                        onClick={() => handleViewModeChange('products')}
                    >
                        Products
                    </button>
                    <button
                        className={`${styles.previewToggleButton} ${
                            viewMode === 'services' ? styles.previewToggleButtonActive : ''
                        }`}
                        type="button"
                        onClick={() => handleViewModeChange('services')}
                    >
                        Services
                    </button>
                </div>
            </section>

            {viewMode === 'services' ? renderServiceGrid(filteredServices) : renderProductGrid(filteredProducts)}
        </div>
    );

    const renderCollectionListView = () => (
        <div className={styles.previewView}>
            {renderViewHeader('Collections', goBack)}
            {previewCollections.length ? (
                <div className={styles.previewCollectionGrid}>
                    {previewCollections.map((collection, index) => (
                        <button
                            className={styles.previewCollectionCard}
                            key={collection?.id || `${collection?.title || 'collection'}-${index}`}
                            type="button"
                            onClick={() => goTo('collection-detail', collection)}
                        >
                            <img
                                className={styles.previewCollectionImage}
                                src={collection?.image || storeLogo}
                                alt={collection?.title || 'Collection'}
                            />
                            <div className={styles.previewCollectionBody}>
                                <span className={styles.previewCollectionTitle}>
                                    {collection?.title || 'Collection'}
                                </span>
                                <span className={styles.previewCollectionCount}>
                                    {(collection?.countValue ?? collection?.items?.length ?? 0).toLocaleString()} item
                                    {(collection?.countValue ?? collection?.items?.length ?? 0) === 1 ? '' : 's'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.previewEmptyState}>
                    <p className={styles.previewEmptyTitle}>No collections available</p>
                    <p className={styles.previewEmptyText}>Add product collections to preview them here.</p>
                </div>
            )}
        </div>
    );

    const renderCollectionDetailView = () => (
        <div className={styles.previewView}>
            {renderViewHeader(selectedCollection?.title || 'Collection', () => {
                setSelectedCollection(null);
                setPreviewView('collection-list');
                requestPreviewScroll('top');
            })}
            {renderProductGrid(selectedCollection?.items || [])}
        </div>
    );

    const renderProductDetailView = () => (
        <div className={styles.previewView}>
            {renderViewHeader('Product details', goBack)}

            <div className={styles.previewDetailCard}>
                <img
                    className={styles.previewDetailImage}
                    src={selectedProductImage || storeLogo}
                    alt={selectedProduct?.title || selectedProduct?.name || 'Product'}
                />

                <div className={styles.previewDetailBody}>
                    <h3 className={styles.previewDetailTitle}>
                        {selectedProduct?.title || selectedProduct?.name || 'Product'}
                    </h3>
                    <p className={styles.previewDetailPrice}>{selectedProductDisplayPrice}</p>
                    <p className={styles.previewDetailText}>
                        {previewText(selectedProduct?.description, 'No product description available.')}
                    </p>

                    {selectedProductVariations.length ? (
                        <div className={styles.previewVariationList}>
                            {selectedProductVariations.map((variation, index) => {
                                const variationKey = variation?.name || variation?.type || `variation-${index}`;
                                const activeOption = selectedVariationOptions[variationKey];
                                const isColorVariation = variation?.type === 'color';

                                return (
                                    <div className={styles.previewVariationGroup} key={variationKey}>
                                        <span className={styles.previewVariationLabel}>
                                            {(variation?.name || variation?.type || 'Option')
                                                .toString()
                                                .replace(/^\w/, (value) => value.toUpperCase())}
                                            {activeOption?.displayName || activeOption?.value
                                                ? `: ${activeOption?.displayName || activeOption?.value}`
                                                : ''}
                                        </span>

                                        <div className={styles.previewVariationOptions}>
                                            {variation?.options?.map((option, optionIndex) => {
                                                const optionLabel = option?.displayName || option?.value || 'Option';
                                                const isActive =
                                                    (activeOption?.displayName || activeOption?.value) === optionLabel;

                                                if (isColorVariation) {
                                                    return (
                                                        <button
                                                            aria-label={optionLabel}
                                                            className={`${styles.previewColorSwatch} ${
                                                                isActive ? styles.previewColorSwatchActive : ''
                                                            }`}
                                                            key={`${variationKey}-${optionLabel}-${optionIndex}`}
                                                            style={{
                                                                '--preview-swatch-color': resolvePreviewOptionColor(option)
                                                            }}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedVariationOptions((previous) => ({
                                                                    ...previous,
                                                                    [variationKey]: option
                                                                }))
                                                            }
                                                        >
                                                            <span className={styles.previewColorSwatchDot} />
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        className={`${styles.previewChoicePill} ${
                                                            isActive ? styles.previewChoicePillActive : ''
                                                        }`}
                                                        key={`${variationKey}-${optionLabel}-${optionIndex}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedVariationOptions((previous) => ({
                                                                ...previous,
                                                                [variationKey]: option
                                                            }))
                                                        }
                                                    >
                                                        {optionLabel}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}

                    <div className={styles.previewQuantityRow}>
                        <span className={styles.previewVariationLabel}>Quantity</span>
                        <div className={styles.previewQuantityControl}>
                            <button
                                className={styles.previewQuantityButton}
                                type="button"
                                onClick={() => setProductQuantity((previous) => Math.max(1, previous - 1))}
                            >
                                <FontAwesomeIcon icon={faMinus} />
                            </button>
                            <span className={styles.previewQuantityValue}>{productQuantity}</span>
                            <button
                                className={styles.previewQuantityButton}
                                type="button"
                                onClick={() => setProductQuantity((previous) => previous + 1)}
                            >
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.previewActionRow}>
                        <button
                            className={styles.previewPrimaryButton}
                            type="button"
                            onClick={() => handleAddToCart(selectedProduct, productQuantity)}
                        >
                            {justAddedProductId === selectedProduct?.id ? 'Added ✓' : 'Add to Cart'}
                        </button>
                        <button className={styles.previewDisabledButton} type="button" disabled>
                            Not available in preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderServiceDetailView = () => (
        <div className={styles.previewView}>
            {renderViewHeader('Service details', goBack)}
            <div className={styles.previewDetailCard}>
                <img
                    className={styles.previewDetailImage}
                    src={selectedService?.image || storeLogo}
                    alt={selectedService?.title || 'Service'}
                />

                <div className={styles.previewDetailBody}>
                    <h3 className={styles.previewDetailTitle}>{selectedService?.title || 'Service'}</h3>
                    <p className={styles.previewDetailPrice}>
                        {formatPreviewPriceLabel(selectedService?.priceValue ?? selectedService?.price)}
                    </p>
                    <p className={styles.previewDetailText}>
                        {previewText(selectedService?.description, 'No service description available.')}
                    </p>
                    <div className={styles.previewMetaStack}>
                        <span className={styles.previewMetaText}>{selectedService?.duration || 'Duration not set'}</span>
                    </div>

                    <div className={styles.previewActionRow}>
                        <button
                            className={styles.previewDisabledButton}
                            type="button"
                            disabled
                            style={{ gridColumn: '1 / -1' }}
                        >
                            Not available in preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCartView = () => (
        <div className={styles.previewView}>
            {renderViewHeader('Cart', goBack)}
            {cartItems.length ? (
                <>
                    <div className={styles.previewCartList}>
                        {cartItems.map((item, index) => {
                            const unitPrice = Number(item?.unitPrice ?? item?.priceValue);
                            const linePrice =
                                Number.isFinite(unitPrice) && Number.isFinite(Number(item?.qty))
                                    ? unitPrice * Number(item?.qty)
                                    : item?.price;

                            return (
                                <div
                                    className={styles.previewCartRow}
                                    key={item?.id || `${item?.title || item?.name || 'cart-item'}-${index}`}
                                >
                                    <img
                                        className={styles.previewCartImage}
                                        src={item?.image || storeLogo}
                                        alt={item?.title || item?.name || 'Cart item'}
                                    />

                                    <div className={styles.previewCartBody}>
                                        <div>
                                            <p className={styles.previewCartTitle}>
                                                {item?.title || item?.name || 'Product'}
                                            </p>
                                            {item?.selectedOptions?.length ? (
                                                <p className={styles.previewCartMeta}>
                                                    {item.selectedOptions
                                                        .map((option) => `${option.label}: ${option.value}`)
                                                        .join(' · ')}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className={styles.previewCartFooter}>
                                            <div className={styles.previewQuantityControl}>
                                                <button
                                                    className={styles.previewQuantityButton}
                                                    type="button"
                                                    onClick={() => updateCartQuantity(item?.id, -1)}
                                                >
                                                    <FontAwesomeIcon icon={faMinus} />
                                                </button>
                                                <span className={styles.previewQuantityValue}>{item?.qty || 1}</span>
                                                <button
                                                    className={styles.previewQuantityButton}
                                                    type="button"
                                                    onClick={() => updateCartQuantity(item?.id, 1)}
                                                >
                                                    <FontAwesomeIcon icon={faPlus} />
                                                </button>
                                            </div>

                                            <span className={styles.previewCartLinePrice}>
                                                {formatPreviewPriceLabel(linePrice)}
                                            </span>
                                        </div>

                                        <button
                                            className={styles.previewRemoveButton}
                                            type="button"
                                            onClick={() => removeCartItem(item?.id)}
                                        >
                                            Remove item
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.previewCartSummary}>
                        <div className={styles.previewSummaryRow}>
                            <span>Subtotal</span>
                            <strong>{formatPreviewPriceLabel(cartSubtotal)}</strong>
                        </div>
                        <button className={styles.previewDisabledButton} type="button" disabled>
                            Checkout not available in preview
                        </button>
                        <button className={styles.previewSecondaryButton} type="button" onClick={openHome}>
                            Continue Shopping
                        </button>
                    </div>
                </>
            ) : (
                <div className={styles.previewEmptyState}>
                    <p className={styles.previewEmptyTitle}>Your cart is empty</p>
                    <button className={styles.previewSecondaryButton} type="button" onClick={openHome}>
                        Continue Shopping
                    </button>
                </div>
            )}
        </div>
    );

    let frameContent = renderHomeView();

    if (previewView === 'collection-list') {
        frameContent = renderCollectionListView();
    } else if (previewView === 'collection-detail') {
        frameContent = renderCollectionDetailView();
    } else if (previewView === 'product-detail') {
        frameContent = renderProductDetailView();
    } else if (previewView === 'service-detail') {
        frameContent = renderServiceDetailView();
    } else if (previewView === 'cart') {
        frameContent = renderCartView();
    }

    return (
        <div
            className={styles.preview}
            style={{ background: '#FFFFFF', overflow: 'hidden', padding: '10px 8px' }}
        >
            <div style={{ maxWidth: '380px', margin: '0 auto' }}>
                <div
                    style={{
                        background: '#111827',
                        borderRadius: '28px',
                        padding: '10px',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)'
                    }}
                >
                    <div
                        style={{
                            ...themeStyle,
                            background: 'var(--customer-home-background)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            height: '454px',
                            position: 'relative'
                        }}
                    >
                        <div
                            className={styles.previewStoreInner}
                            style={{
                                ...themeStyle,
                                background: 'var(--customer-home-background)'
                            }}
                        >
                            <div className={styles.previewModeBanner}>
                                👁 Preview Mode — purchases and bookings are disabled
                            </div>

                            <div className={styles.previewFrameScrollShell}>
                                <div
                                    ref={frameRef}
                                    className={styles.previewFrameBody}
                                    style={{
                                        overflowY: 'auto',
                                        overflowX: 'hidden',
                                        height: '100%',
                                        WebkitOverflowScrolling: 'touch'
                                    }}
                                >
                                    {frameContent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SetupStoreMain = () => {
    const dispatch = useDispatch();
    let token = localStorage.getItem("token");
    let getId = localStorage.getItem("itemId");
    const [add, setAdd] = useState(false);
    const [isAllowed, setIsAllowed] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState('Nigeria');
    const [selectedStates, setSelectedStates] = useState(['Lagos']);
    const [ms, setMs] = useState(true)
    const [hasCollections, setHasCollections] = useState(false);
    const primaryColor = "#0273F9";
    const { loading, error, success, allStore, collectionProduct, collections, myStore } = useSelector((state) => state.store);

    // Sync country with links state
    useEffect(() => {
    setLinks(prev => ({ ...prev, country: selectedCountry }));
    }, [selectedCountry]);

    // Sync states with links state
    useEffect(() => {
    setLinks(prev => ({ ...prev, state: selectedStates.join(', ') }));
    }, [selectedStates]);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const { countryItem } = useSelector((state) => state.country);
    const [avail, setAvail] = useState(true);
    const [front, setFront] = useState(true);
    const [vog, setVog] = useState(true);
    const [per, setPer] = useState(true);
    const [proCol, setProCol] = useState(true);
    const [itemData, setItemData] = useState(true);
    const [activeTab, setActiveTab] = useState('SetupStore');  
    const [setupStep, setSetupStep] = useState('store');
    const [createdStoreId, setCreatedStoreId] = useState(null);
    const [change, setChange] = useState('Services');
    const [productItem, setProductItem] = useState([]);
    const [serviceItem, setServiceItem] = useState([]);
    const [serviceCollectionsPreview, setServiceCollectionsPreview] = useState({})
    const [collectionProducts, setCollectionProducts] = useState({})

    const [online, setOnline] = useState({
    username: '',
    store_name: '',
    store_description: ''
    })
    const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: ''
    });

    const [links, setLinks] = useState({
    show_location: 0,
    country: '',
    state: '',
    is_location_based: 1,
    allow_delivery_datetime: 1,
    social_links: []
    })

    useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('products')) || [];
    setProductItem(Array.isArray(itemValue) ? itemValue : []);
    }, [])

    useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('services')) || [];
    setServiceItem(Array.isArray(itemValue) ? itemValue : []);
    }, [])

    const readHasCollections = () => {
    const raw = localStorage.getItem('allcollections');
    return raw !== null && raw !== 'null' && raw !== 'undefined';
    };

    useEffect(() => {
    setHasCollections(readHasCollections());
    }, [collections]);

    const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;

    if (dataset.form === "setUpStore") {
        setOnline(prev => ({ ...prev, [name]: value}));
    }

    if (dataset.form === "setUpLink") {
        const newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;
        console.log(`Updating ${name}:`, newValue);
        setLinks(prev => ({ ...prev, [name]: newValue}))
    }
    };

    useEffect(() => {
    if (token) {
        dispatch(getAllServices({ token, id: getId || '7'}))
        dispatch(getAllCollection({ token, id: getId || '7'}));
        dispatch(getCollectionForProduct({ token, id: getId || '7'}));
        dispatch(getMyOnlineStore({ token, id: getId || '7'}))
    }
    }, [token, dispatch])

    const fetchCollectionServices = async (collectionId) => {
    try {
        const response = await dispatch(getServiceCollection({ token, id: collectionId })).unwrap();
        setServiceCollectionsPreview(prev => ({
            ...prev,
            [collectionId]: response.data?.services || []
        }));
    } catch (error) {
        console.error('Error fetching collection services:', error);
    }
    }

    const handleServiceCollectionChange = (collectionId, services = []) => {
    if (!collectionId) {
        return;
    }

    setServiceCollectionsPreview(prev => ({
        ...prev,
        [collectionId]: Array.isArray(services) ? services : []
    }));
    };

    const fetchCollectionProducts = async (collectionId) => {
    try {
        const response = await dispatch(productImageForCollection({token, id: collectionId})).unwrap();
        setCollectionProducts(prev => ({
            ...prev,
            [collectionId]: response.data?.collection?.StoreCollectionProducts || []
        }));
    } catch (error) {
        console.error('Error fetching collection products:', error);
    }
    }

    useEffect(() => {
    if (collections?.data?.collections && collections.data.collections.length > 0) {
        collections.data.collections.forEach(collection => {
            if (!serviceCollectionsPreview[collection.id]) {
                fetchCollectionServices(collection.id);
            }
        });
    }
    }, [collections]);

    useEffect(() => {
    if (collectionProduct?.data?.collections && collectionProduct.data.collections.length > 0) {
        collectionProduct.data.collections.forEach(collection => {
            if (!collectionProducts[collection.id]) {
                fetchCollectionProducts(collection.id);
            }
        });
    }
    }, [collectionProduct])

    const itemService = [
    { id: 'Services', label: 'Services' },
    { id: 'Shop', label: 'Shop' }
    ];

    const getImageUrl = (value) => {
    if (Array.isArray(value)) return getImageUrl(value[0]);
    if (value && typeof value === 'object') {
        return getImageUrl(value.url || value.secure_url || value.image_url || value.path || value.location);
    }
    if (typeof value !== 'string' || !value.trim()) return '';

    const image = value.trim();
    if (/^(https?:|data:|blob:|\/\/)/i.test(image)) return image;

    const apiOrigin = API_URL.replace(/\/api\/v\d+\/?$/i, '');
    return image.startsWith('/') ? `${apiOrigin}${image}` : image;
    };

    const getServiceImage = (service) => {
    const serviceDetails = service?.StoreService || service || {};
    return (
        getImageUrl(serviceDetails.service_image_url) ||
        getImageUrl(serviceDetails.service_image) ||
        getImageUrl(serviceDetails.image_url) ||
        getImageUrl(serviceDetails.image) ||
        Smc
    );
    };

    const handleServiceImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = Smc;
    };

    const handleActiveTabChange = (tabName) => {
    setActiveTab(tabName);

    if (tabName === 'SetupStore') {
        setAdd(false);
        setSetupStep('store');
        return;
    }

    if (tabName === 'Product') {
        setProCol(false);
        setItemData(true);
        setChange('Shop');
    } else if (tabName === 'Services') {
        setProCol(true);
        setChange('Services');
    } else if (tabName === 'Collection') {
        setProCol(false);
        setItemData(false);
        setChange('Shop');
    }
    };

    useEffect(() => {
    if (activeTab === 'Services') {
        setChange('Services');
    }

    if (activeTab === 'Product' || activeTab === 'Collection') {
        setChange('Shop');
    }
    }, [activeTab]);

    const topTabs = [
    { id: 'setup-store', label: 'Store Information', target: 'SetupStore' },
    { id: 'services', label: 'My Services', target: 'Services' },
    { id: 'shop', label: 'My Shop', target: 'Collection' },
    { id: 'customize', label: 'Store Appearance', target: 'Appearance' }
    ];

    const shopTabs = [
    { label: 'Product List', target: 'Product' },
    { label: 'Collection', target: 'Collection' }
    ];

    const isTopTabActive = (tabId) => {
    if (tabId === 'setup-store') return activeTab === 'SetupStore';
    if (tabId === 'services') return activeTab === 'Services';
    if (tabId === 'shop') return activeTab === 'Product' || activeTab === 'Collection';
    return activeTab === 'Appearance';
    };

    const renderServiceCollectionsPreview = (showHeading = false) => {
    if (!collections?.data?.collections?.length) {
        return <p className="text-center text-muted">No Service collections available</p>;
    }

    return (
        <>
        {showHeading && <h6 className='bx mt-4 mb-3'>My Service Collections</h6>}
        {collections.data.collections.map((collection) => (
            <div key={collection.id} className="mb-4 text-start">
                <p className="mb-3 text-center" style={{ color: '#1C1917', fontSize: '13px', fontWeight: 600 }}>
                    {collection.collection_name}
                </p>
                <div style={{background: '#78716C'}} className='p-3 rounded-3'>
                    {(serviceCollectionsPreview[collection.id] || []).length > 0 ? (
                        serviceCollectionsPreview[collection.id].map((service) => {
                            const serviceData = service.StoreService || service;

                            return (
                                <div key={service.id} className="d-flex justify-content-between px-3 py-2 rounded-pill mb-2" style={{background: '#6B625C', color: '#fff'}}>
                                    <div className='mt-1'>
                                        <img src={getServiceImage(serviceData)} alt="" className='rounded-circle' style={{width: '24px', height: '24px', objectFit: 'cover'}} onError={handleServiceImageError} />
                                    </div>
                                    <div style={{width: '70%'}}>
                                        <small className="d-block" style={{fontSize: '12px'}}>{serviceData.service_title} ({formatDuration(serviceData.duration_minutes)}) - ₦{Number(serviceData.price).toLocaleString()} <span className='bx'>Book Now</span></small>
                                    </div>
                                    <div className='mt-1'>
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-muted mb-0" style={{ fontSize: '12px' }}>No services in this collection</p>
                    )}
                </div>
            </div>
        ))}
        </>
    );
    };

    const renderContent = () => {
    switch(change) {
        case 'Services':
        return <div className="p-3">
            {collections?.data?.collections && collections.data.collections.length > 0 ? (
            <div>
                {collections.data.collections.map((collection) => (
                <div key={collection.id} className="mb-4">
                    <p className="mb-3 text-center">{collection.collection_name}</p>
                    <div style={{background: '#78716C'}} className='p-3 rounded-3'>
                    {serviceCollectionsPreview[collection.id] && serviceCollectionsPreview[collection.id].length > 0 ? (
                        serviceCollectionsPreview[collection.id].map((service) => {
                        const serviceData = service.StoreService || service;
                        return (
                            <div key={service.id} className="d-flex justify-content-between px-3 py-2 rounded-pill mb-2" style={{background: '#6B625C', color: '#fff'}}>
                                <div className="mt-1">
                                <img src={getServiceImage(serviceData)} alt="" className='rounded-circle' style={{width: '24px', height: '24px', objectFit: 'cover'}} onError={handleServiceImageError} />
                                </div>
                                <div style={{width: '70%'}}>
                                <small className="d-block" style={{fontSize: '12px'}}>{serviceData.service_title} ({formatDuration(serviceData.duration_minutes)}) - ₦{Number(serviceData.price).toLocaleString()}</small>
                                </div>
                                <div className="mt-1">
                                <FontAwesomeIcon icon={faEllipsisV} />
                                </div>
                            </div>
                        );
                        })
                    ) : (
                        <p className="text-muted mb-0">No services in this collection</p>
                    )}
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <p className="text-center text-muted">No Service collections available</p>
            )}
        </div>;
        case 'Shop':
        return <>
                {itemData ? (
                <>
                    <div className="p-3 row">
                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                        <div className="spinner-border text-primary" />
                    </div>
                    ) : error ? (
                    <p className="text-danger text-center">Something went wrong</p>
                    ) : Array.isArray(productItem) && productItem.length > 0 ? (
                        productItem.map((product) => (
                            <div className="product-item col-md-6 mb-2" key={product.id}>
                                <div className="pro-img">
                                    <img src={product.image_url} alt="" className='w-100 rounded-top-3'/>
                                </div>
                                <div className="prod-body text-start p-3 rounded-bottom-3" style={{background: '#78716C'}}>
                                    <small className="d-block" style={{color: '#f6f1f1'}}>{product.name}</small>
                                    <small className="d-block" style={{color: '#CAC9C7'}}>{product.description?.slice(0, 10)}...</small>
                                    <small className='d-block mt-3' style={{color: '#fff'}}>₦{Number(product.price).toLocaleString()}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                    <p className="text-center text-muted">No Product available</p>
                    )}
                </div>
                </>
                ) : (
                <>
                    {collectionProduct?.data?.collections && collectionProduct.data.collections.length > 0 ? (
                    <div className="p-3">
                        {collectionProduct.data.collections.map((collection) => (
                        <div key={collection.id} className="mb-5">
                            <p className="mb-3 mx">{collection.collection_name}</p>
                            <div style={{background: '#78716C'}} className='p-3 rounded-3'>
                            <div className="row g-3">
                            {collectionProducts[collection.id] && collectionProducts[collection.id].length > 0 ? (
                                collectionProducts[collection.id].slice(0, 3).map((item) => (
                                <div className="col-md-4 col-sm-6 mb-3" key={item.id}>
                                    <div className="product-item">
                                    <div className="pro-img" style={{overflow: 'hidden'}}>
                                        <img src={item.Product?.image_url} alt="" className='w-100 rounded-3' style={{height: '100%', objectFit: 'cover'}}/>
                                    </div>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <p className="text-muted">Loading products...</p>
                            )}
                            </div>
                            <p className="mt-3" style={{fontSize: '12px', color: '#d0c8c8'}}>
                            {collectionProducts[collection.id]?.length || 0} products
                            </p>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-center text-muted">No Collections available</p>
                    )}
                </>
            )}
        </>
        
        default:
        return null;
    }
    };

    const tabs = [
    { name: 'Services', icon: faLink },
    { name: 'Appearance', icon: faStore },
    { name: 'Product', icon: faCube },
    { name: 'Collection', icon: faDatabase },
    ];


    useEffect(() => {
    dispatch(getCountries());
    }, [dispatch]);

    // const countries = countryItem.data || [];

    // const nigerianStates = [
    // 'All States',
    // 'Abia',
    // 'Abuja',
    // 'Adamawa',
    // 'Akwa Ibom',
    // 'Anambra',
    // 'Bauchi',
    // 'Bayelsa',
    // 'Benue',
    // 'Borno',
    // 'Cross River',
    // 'Delta',
    // 'Ebonyi',
    // 'Edo',
    // 'Ekiti',
    // 'Enugu',
    // 'Gombe',
    // 'Imo',
    // 'Jigawa',
    // 'Kaduna',
    // 'Kano',
    // 'Katsina',
    // 'Kebbi',
    // 'Kogi',
    // 'Kwara',
    // 'Lagos',
    // 'Nasarawa',
    // 'Niger',
    // 'Ogun',
    // 'Ondo',
    // 'Osun',
    // 'Oyo',
    // 'Plateau',
    // 'Rivers',
    // 'Sokoto',
    // 'Taraba',
    // 'Yobe',
    // 'Zamfara'
    // ];

    // const handleStateToggle = (state) => {
    // if (state === 'All States') {
    //     if (selectedStates.includes('All States')) {
    //     setSelectedStates([]);
    //     } else {
    //     setSelectedStates(['All States']);
    //     }
    // } else {
    //     if (selectedStates.includes(state)) {
    //     setSelectedStates(selectedStates.filter(s => s !== state && s !== 'All States'));
    //     } else {
    //     const newStates = selectedStates.filter(s => s !== 'All States');
    //     setSelectedStates([...newStates, state]);
    //     }
    // }
    // };

    // const getCurrentCountryFlag = () => {
    // const country = countries.find((c) => c.name === selectedCountry);
    // return country ? country.flag : '🏳️';
    // };


    useEffect(() => {
    const normalizedSocialLinks = {
        facebook: socialLinks.facebook || '',
        linkedin: socialLinks.linkedin || '',
        x: socialLinks.twitter || '',
        instagram: socialLinks.instagram || ''
    };

    const hasAnySocialLink = Object.values(normalizedSocialLinks).some(Boolean);

    setLinks(prev => ({
        ...prev,
        social_links: hasAnySocialLink ? [normalizedSocialLinks] : []
    }));
    }, [socialLinks]);

    const handleInputChange = (platform, value) => {
    setSocialLinks(prev => ({
        ...prev,
        [platform]: value
    }));
    };

    const removeSocialLink = (platform) => {
    setSocialLinks(prev => ({
        ...prev,
        [platform]: ''
    }));
    };

    // Social media platform configurations
    const socialPlatforms = [
    { 
        name: 'facebook', 
        icon: F, 
        placeholder: 'Facebook URL or username',
        color: '#1877f2'
    },
    { 
        name: 'twitter', 
        icon: X, 
        placeholder: 'Twitter URL or username',
        color: '#1da1f2'
    },
    { 
        name: 'linkedin', 
        icon: In, 
        placeholder: 'LinkedIn URL or username',
        color: '#0077b5'
    },
    { 
        name: 'instagram', 
        icon: In2, 
        placeholder: 'Instagram URL or username',
        color: '#e4405f'
    }
    ];

    useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('services')) || [];
    setFront(itemValue.length === 0);
    }, []);

    useEffect(() => {
    const storeInfo = myStore?.onlineStore;
    if (!storeInfo) return;
    const existingSocialLinks = Array.isArray(storeInfo.social_links)
        ? storeInfo.social_links[0] || {}
        : storeInfo.social_links || {};

    setOnline((prev) => ({
        username: prev.username || storeInfo.username || '',
        store_name: prev.store_name || storeInfo.store_name || '',
        store_description: prev.store_description || storeInfo.store_description || ''
    }));
    setSocialLinks((prev) => ({
        facebook: prev.facebook || existingSocialLinks.facebook || '',
        twitter: prev.twitter || existingSocialLinks.twitter || existingSocialLinks.x || '',
        linkedin: prev.linkedin || existingSocialLinks.linkedin || '',
        instagram: prev.instagram || existingSocialLinks.instagram || ''
    }));
    setCreatedStoreId((prev) => prev || storeInfo.id || null);
    }, [myStore?.onlineStore]);


    const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hrs`;
    };

    const storeLogo =
    getImageUrl(myStore?.onlineStore?.profile_logo_url) ||
    getImageUrl(myStore?.onlineStore?.profile_logo) ||
    Owi;
    const storeBannerImage =
    getImageUrl(myStore?.onlineStore?.banner_image_url) ||
    getImageUrl(myStore?.onlineStore?.banner_url) ||
    getImageUrl(myStore?.onlineStore?.cover_image_url) ||
    '';
    const previewStoreName = previewText(
    online.store_name || myStore?.onlineStore?.store_name,
    'Your Store'
    );
    const storeDescription = previewText(
    online.store_description || myStore?.onlineStore?.store_description,
    'Store Description Here...'
    );
    const previewThemeStyle = useMemo(
    () => buildStorefrontThemeStyle(myStore?.onlineStore?.selected_theme),
    [myStore?.onlineStore?.selected_theme]
    );
    const previewProductCollections = useMemo(() => {
    const createPreviewProductItem = (sourceProduct, fallbackId) => {
        const product = sourceProduct?.Product || sourceProduct?.product || sourceProduct || {};
        const resolvedCategory = previewText(
            product?.category_name || product?.category?.name || product?.category,
            ''
        );
        const resolvedPriceValue = Number(product?.price);

        return {
            category: resolvedCategory,
            categoryKey: resolvedCategory.trim().toLowerCase(),
            description: previewText(
                product?.description,
                resolvedCategory || 'Discover this product in the store preview.'
            ),
            id: product?.id || sourceProduct?.id || fallbackId,
            image:
                getImageUrl(
                    product?.image_url ||
                        product?.image ||
                        product?.product_image ||
                        product?.images ||
                        product?.gallery
                ) || storeLogo,
            name: previewText(product?.name || product?.product_name || product?.title, 'Product'),
            price: formatPreviewPriceLabel(product?.price),
            priceValue: Number.isFinite(resolvedPriceValue) ? resolvedPriceValue : null,
            raw: product,
            title: previewText(product?.name || product?.product_name || product?.title, 'Product'),
            variations:
                product?.variations ||
                product?.variation ||
                product?.variation_options ||
                product?.values ||
                []
        };
    };

    const mappedCollections = (collectionProduct?.data?.collections || [])
        .map((collection, collectionIndex) => {
            const items = (collectionProducts[collection.id] || []).map((entry, itemIndex) =>
                createPreviewProductItem(entry, `${collection.id}-${itemIndex}`)
            );

            return {
                countValue: items.length,
                id: collection?.id || `product-collection-${collectionIndex}`,
                image: items[0]?.image || storeLogo,
                items,
                title: previewText(collection?.collection_name, `Collection ${collectionIndex + 1}`),
            };
        })
        .filter((collection) => collection.items.length > 0);

    if (mappedCollections.length > 0) {
        return mappedCollections;
    }

    if (!productItem.length) {
        return [];
    }

        return [
        {
            countValue: productItem.length,
            id: 'all-products',
            image: productItem[0] ? createPreviewProductItem(productItem[0], 'all-products-cover').image : storeLogo,
            items: productItem.map((product, index) =>
                createPreviewProductItem(product, `product-item-${index}`)
            ),
            title: 'All Products',
        }
    ];
    }, [collectionProduct?.data?.collections, collectionProducts, productItem, storeLogo]);
    const previewServiceCollections = useMemo(() => {
    const createPreviewServiceItem = (sourceService, fallbackId) => {
        const serviceData = sourceService?.StoreService || sourceService || {};
        const durationLabel = formatDuration(serviceData?.duration_minutes);
        const resolvedPriceValue = Number(serviceData?.price);
        const serviceTitle = previewText(
            serviceData?.service_title || serviceData?.title,
            'Service'
        );

        return {
            cta: 'Book Now',
            description: previewText(
                serviceData?.description,
                durationLabel ? `Duration ${durationLabel}` : 'Book this service from the store.'
            ),
            duration: durationLabel,
            id: sourceService?.id || serviceData?.id || fallbackId,
            image: getServiceImage(serviceData),
            name: serviceTitle,
            price: formatPreviewPriceLabel(serviceData?.price),
            priceValue: Number.isFinite(resolvedPriceValue) ? resolvedPriceValue : null,
            raw: serviceData,
            title: serviceTitle
        };
    };

    const mappedCollections = (collections?.data?.collections || [])
        .map((collection, collectionIndex) => {
            const items = (serviceCollectionsPreview[collection.id] || []).map((service, itemIndex) =>
                createPreviewServiceItem(service, `${collection.id}-${itemIndex}`)
            );

            return {
                countValue: items.length,
                id: collection?.id || `service-collection-${collectionIndex}`,
                image: items[0]?.image || storeLogo,
                items,
                title: previewText(collection?.collection_name, `Collection ${collectionIndex + 1}`),
            };
        })
        .filter((collection) => collection.items.length > 0);

    if (mappedCollections.length > 0) {
        return mappedCollections;
    }

    if (!serviceItem.length) {
        return [];
    }

        return [
        {
            countValue: serviceItem.length,
            id: 'all-services',
            image: serviceItem[0] ? createPreviewServiceItem(serviceItem[0], 'all-services-cover').image : storeLogo,
            items: serviceItem.map((service, index) =>
                createPreviewServiceItem(service, `service-item-${index}`)
            ),
            title: 'All Services',
        }
    ];
    }, [collections?.data?.collections, formatDuration, getServiceImage, serviceCollectionsPreview, serviceItem, storeLogo]);

    const buildStoreUsername = (storeName) =>
    storeName
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const resolveOnlineStoreId = (payload) =>
    payload?.data?.onlineStore?.id ||
    payload?.data?.store?.id ||
    payload?.onlineStore?.id ||
    payload?.store?.id ||
    payload?.id ||
    myStore?.onlineStore?.id ||
    localStorage.getItem('itemId') ||
    getId;
    const saveStoreInformation = async (e) => {
    e.preventDefault();

    const { store_name, store_description } = online;

    if (!store_name || !store_description) {
        Swal.fire({
            icon: "info",
            title: "Missing Fields",
            text: "Please fill in all fields",
            confirmButtonColor: '#0273F9'
        });
        return;
    }

    try {
        if (myStore?.onlineStore?.id) {
            setSetupStep('social');
            return;
        }

        const storePayload = {
            token,
            ...online,
            username: online.username || buildStoreUsername(store_name)
        };
        const storeResponse = await dispatch(createOnlineStore(storePayload)).unwrap();
        const onlineStoreId = resolveOnlineStoreId(storeResponse);

        if (onlineStoreId) {
            setCreatedStoreId(onlineStoreId);
            await dispatch(getMyOnlineStore({ token, id: onlineStoreId })).unwrap();
        }

        await Swal.fire({
            icon: "success",
            title: "Store created",
            text: storeResponse?.message || "Your store information has been saved.",
            confirmButtonColor: '#0273F9'
        });

        setFront(false);
        setSetupStep('social');
    } catch (actionError) {
        await Swal.fire({
            icon: "error",
            title: "Failed to create store",
            text: getActionErrorMessage(actionError, 'Unable to save your store information right now.'),
            confirmButtonColor: '#0273F9'
        });
        dispatch(resetStatus());
    }
    };

    const saveSocialLinks = async (e) => {
    e.preventDefault();

    const onlineStoreId = createdStoreId || resolveOnlineStoreId(myStore?.onlineStore);

    if (!onlineStoreId) {
        await Swal.fire({
            icon: "info",
            title: "Create your store first",
            text: "Save your store information before adding social links.",
            confirmButtonColor: '#0273F9'
        });
        setSetupStep('store');
        return;
    }

    try {
        const response = await dispatch(updateStoreLinks({
            token,
            id: onlineStoreId,
            show_location: links.show_location,
            country: links.country,
            state: links.state,
            is_location_based: links.is_location_based,
            allow_delievry_datetime: links.allow_delivery_datetime,
            social_links: links.social_links
        })).unwrap();

        await dispatch(getMyOnlineStore({ token, id: onlineStoreId })).unwrap();
        await Swal.fire({
            icon: "success",
            title: "Social links saved",
            text: response?.message || "Your storefront social links have been updated.",
            confirmButtonColor: '#0273F9'
        });
        setFront(false);
    } catch (actionError) {
        await Swal.fire({
            icon: "error",
            title: "Failed to save social links",
            text: getActionErrorMessage(actionError, 'Unable to save your social links right now.'),
            confirmButtonColor: '#0273F9'
        });
        dispatch(resetStatus());
    }
    };

  return (
    <>
      {ms ? (
        <>
          <div className={styles.vendorStoreSetupPage}>
          <div className={styles.vendorStoreSetupToolbar}>
            <div className={`${styles.vendorStoreSetupTabs} d-flex gap-4 border-bottom`} style={{borderBottom: '1px solid #EEEEEE'}}>
                {topTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleActiveTabChange(tab.target)}
                        className={`${styles.vendorStoreSetupTab} bg-transparent pb-2`}
                        style={{
                            border: "none",
                            color: isTopTabActive(tab.id) ? '#1C1917' : '#78716C',
                            fontWeight: isTopTabActive(tab.id) ? 600 : 400,
                            borderBottom: isTopTabActive(tab.id) ? `2px solid ${primaryColor}` : '2px solid transparent'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className={`${styles.vendorStoreSetupActions} d-flex gap-2 flex-nowrap`}>
                <Button variant='greenButton' size='md' className='flex-grow-1 text-nowrap'>Publish Store</Button>
                <Button variant='blueButton' size='md' className='flex-grow-1 text-nowrap'>Save Changes</Button>
            </div>
          </div>
        <div className={`${styles.vendorStoreSetupGrid} row`}>
            <div className={`${styles.vendorStoreSetupEditor} col-sm-12 col-md-12 col-lg-7`}>
                {/* <h5 className="text-center mt-3 mb-5">StoreFront Setup</h5> */}
                {activeTab === 'SetupStore' ? (
                    <>
                      {add ? (
                            <>
                                <div className={`${styles['outer-box']} ${styles.vendorStoreEmptyCard} p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
                                    <div className={`${styles['inner-box']} ${styles.vendorStoreEmptyInner} text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
                                        <p style={{color: '#78716C'}}>No store information available</p>
                                        <button className={`btn ${styles['add-btn']} px-4`} onClick={() => {setAdd(false)}}>Setup Store</button>
                                    </div>
                                </div>

                                <div className={`${styles.vendorStoreSetupFooterAction} text-end mt-4`}>
                                    <button className={styles['sk-btn']}>Skip</button>
                                </div>
                            </>
                            ) : (
                            <>
                                <form onSubmit={setupStep === 'store' ? saveStoreInformation : saveSocialLinks}>
                                    <div className={`${styles['store-info']} ${styles.vendorStoreSetupCard} p-3`} style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        {setupStep === 'store' ? (
                                            <>
                                                <h6 style={{color: '#1C1917'}} className={`${styles.vendorStoreSetupCardTitle} mx`}>Store Information</h6>
                                                <p className={styles.vendorStoreSetupCardText} style={{color: '#78716C', fontSize: '13px'}}>Let’s start with the basic information about your store</p>

                                                <label htmlFor="setup-store-name" className="form-label">Store Name</label>
                                                <input 
                                                    id="setup-store-name"
                                                    type="text"
                                                    data-form="setUpStore"
                                                    className={`${styles["input-item"]} ${styles["dr-item"]}`} 
                                                    placeholder="E.g. Mystorename"
                                                    name='store_name'
                                                    value={online.store_name}
                                                    onChange={handleChange}
                                                />

                                                <div className="my-4">
                                                    <label className="form-label" style={{color: '#1C1917'}}>
                                                        Username <span style={{color: '#78716C'}}>(for your store link)</span>
                                                    </label>

                                                    <div className={`d-flex overflow-hidden ${styles['store-input-wrapper']} ${styles.vendorStoreUrlField}`} style={{border: '1px solid #EEEEEE'}}>
                                                        <span className={`${styles.vendorStoreUrlPrefix} px-3 d-flex align-items-center mx`} style={{background: '#EAF4FF'}}>
                                                            mycroshop.com/
                                                        </span>
                                                        <input
                                                            type="text"
                                                            data-form="setUpStore"
                                                            className={`border-0 ${styles['input-item']} ${styles['dr-item']}`}
                                                            placeholder="yourstore"
                                                            name='username'
                                                            value={online.username}
                                                            onChange={handleChange}
                                                        />
                                                    </div>

                                                    <small className="mt-2 d-block" style={{color: '#78716C', fontSize: '13px'}}>
                                                        PNG, JPEG or GIF. Max 5MB.
                                                    </small>
                                                </div>

                                                <label htmlFor="setup-store-description" className='mb-2'>Store Description</label>

                                                <textarea 
                                                id="setup-store-description"
                                                className={`${styles["input-item"]} ${styles["dr-item"]}`} 
                                                placeholder="Enter store description" 
                                                style={{height: '100px'}}
                                                data-form="setUpStore"
                                                name='store_description'
                                                value={online.store_description}
                                                onChange={handleChange}
                                                ></textarea>

                                                <small className="d-block" style={{color: '#909396'}}>This will appear on your store page. Keep it short and engaging</small>
                                                <div style={{background: '#EEF8FF'}} className={`${styles.vendorStoreLinkNotice} p-3 mt-4 rounded`}>
                                                    <h6 style={{color: '#0273F9'}} className='mx mb-0'>
                                                        <FontAwesomeIcon icon={faInfoCircle} style={{color: '#0273F9'}} className='me-2'/>
                                                        <span className='nx'>Your store link will be </span>
                                                        <span className='my'>
                                                            mycroshop.com/{online.username || 'yourstore'}
                                                        </span>
                                                    </h6>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`${styles.vendorStoreSetupCardHeader} d-flex justify-content-between align-items-start gap-3`}>
                                                    <div>
                                                        <h6 style={{color: '#1C1917'}} className='mx mb-1'>Social Links</h6>
                                                        <p style={{color: '#78716C', fontSize: '13px'}} className='mb-0'>
                                                            Add the social profiles you want customers to find from your storefront.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="bg-transparent border-0 p-0"
                                                        onClick={() => setSetupStep('store')}
                                                        style={{color: primaryColor, fontSize: '13px', fontWeight: 600}}
                                                    >
                                                        Back
                                                    </button>
                                                </div>

                                                <div className="row g-3 mt-1">
                                                    {socialPlatforms.map((platform) => (
                                                        <div className="col-12" key={platform.name}>
                                                            <label className="form-label" style={{color: '#1C1917'}}>
                                                                {platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
                                                            </label>
                                                            <div
                                                                className={`d-flex align-items-center overflow-hidden ${styles['store-input-wrapper']}`}
                                                                style={{border: '1px solid #EEEEEE', background: '#fff', borderRadius: '12px'}}
                                                            >
                                                                <span
                                                                    className="px-3 d-flex align-items-center justify-content-center"
                                                                    style={{background: '#FAFAFA', minWidth: '52px', height: '52px'}}
                                                                >
                                                                    <img
                                                                        src={platform.icon}
                                                                        alt={platform.name}
                                                                        style={{width: '18px', height: '18px', objectFit: 'contain'}}
                                                                    />
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    className={`border-0 ${styles['input-item']} ${styles['dr-item']}`}
                                                                    placeholder={platform.placeholder}
                                                                    value={socialLinks[platform.name] || ''}
                                                                    onChange={(event) => handleInputChange(platform.name, event.target.value)}
                                                                />
                                                                {socialLinks[platform.name] ? (
                                                                    <button
                                                                        type="button"
                                                                        className="bg-transparent border-0 px-3"
                                                                        onClick={() => removeSocialLink(platform.name)}
                                                                        style={{color: '#78716C'}}
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className={`${styles.vendorStoreSetupFooterAction} text-end mt-3`}>
                                        <button type="submit" className={`${styles['btn-lg']} ${styles['si-btn']} px-4 py-3`}>
                                            {
                                                loading ?(
                                                    <>
                                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                                        <span className="sr-only"></span>
                                                    </div>
                                                    <span>{setupStep === 'store' ? 'Creating... ' : 'Saving... '}</span>
                                                    </>
                                                ): (
                                                    setupStep === 'store' ? 'Save and Continue' : 'Save Social Links'
                                                )
                                            }
                                        </button>
                                    </div>
                                </form>
                                
                            </>
                       )}
                    </>
                ) : (
                <>
                  <div>
                    {/* <div className={`d-flex justify-content-between p-3 m-0`} style={{background: '#EAF4FF', borderRadius: '10px', border: '1px solid #0273F9'}}>
                        <p className='m-0'><span style={{color: '#78716C'}}>mycroshop</span>/username</p>
                        <p style={{color: '#0273F9'}} className='m-0'>Share Link <FontAwesomeIcon icon={faExternalLinkAlt} /></p>
                    </div>
                    <div className="d-flex justify-content-between border-bottom" style={{borderBottom: '1px solid #EEEEEE'}}>
                        {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            className={`flex-fill border-0 bg-transparent py-3 text-center ${
                            activeTab === tab.name ? 'text-primary border-bottom border-primary border-3' : 'text-muted'
                            }`}
                            onClick={() => {
                                handleActiveTabChange(tab.name);
                            }}
                        >
                            <div className="d-flex flex-column align-items-center">
                            <FontAwesomeIcon 
                                icon={tab.icon} 
                                className="mb-1" 
                                style={{ fontSize: '18px', color: '#78716C' }}
                            />
                            <span style={{ fontSize: '12px', color: '#78716C' }}>{tab.name}</span>
                            </div>
                        </button>
                        ))}
                    </div> */}

                    <div className={`${styles.vendorStoreSetupPanel} mt-4`}>
                        {isTopTabActive('shop') && (
                            <div className={`${styles.vendorStoreShopTabs} d-flex mb-4`} style={{border: '1px solid #EEEEEE'}}>
                                {shopTabs.map((tab) => (
                                    <button
                                        key={tab.target}
                                        type="button"
                                        className={`${styles.vendorStoreShopTab} flex-fill bg-transparent py-3`}
                                        onClick={() => handleActiveTabChange(tab.target)}
                                        style={{
                                            border: 'none',
                                            borderBottom: activeTab === tab.target ? `2px solid ${primaryColor}` : '2px solid transparent',
                                            background: activeTab === tab.target ? '#EAF4FF' : '#fff',
                                            color: activeTab === tab.target ? '#1C1917' : '#78716C',
                                            fontWeight: activeTab === tab.target ? 600 : 500
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {activeTab === 'Services' && (
                            <Service
                                setPer={setPer}
                                setVog={setVog}
                                onServiceCollectionChange={handleServiceCollectionChange}
                            />
                        )}
                        {activeTab === 'Appearance' && <Appearance />}
                        {activeTab === 'Product' && <Product setProCol={setProCol}/>}
                        {activeTab === 'Collection' && <Collection setItemData={setItemData} autoExpandProducts />}
                    </div>

                  </div>
                </>)}
            </div>

            

            <div className={`${styles.vendorStoreSetupPreviewColumn} col-sm-12 col-md-12 col-lg-5 mt-5`} style={{position: 'sticky', top: 0}}>
                <h5 className={`${styles.vendorStoreSetupPreviewTitle} text-center mt-3 mb-4`}>Preview</h5>

                <StorefrontMobilePreview
                    key={`storefront-preview-${change}`}
                    themeStyle={previewThemeStyle}
                    storeLogo={storeLogo}
                    storeName={previewStoreName}
                    storeDescription={storeDescription}
                    storeBannerImage={storeBannerImage}
                    previewTab={change}
                    onPreviewTabChange={setChange}
                    productCollections={previewProductCollections}
                    serviceCollections={previewServiceCollections}
                />
            </div>
        </div>
        </div>
        </>
       ) : (<ViewStore />)}
    </>
  )
}

export default SetupStoreMain
