import React, {useState, useEffect, useMemo} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCountries } from '../../../slice/countriesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { createOnlineStore, resetStatus, updateStoreLinks, getAllServices, getAllCollection, getServiceCollection, getCollectionForProduct, productImageForCollection, getMyOnlineStore } from '../../../slice/onlineStoreSlice';
import { faInfoCircle, faLink, faStore, faCube, faDatabase, faExternalLinkAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
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
import { buildCustomerThemeStyle } from '../../../customers/customerTheme';

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

const StorefrontMobilePreview = ({
    themeStyle,
    storeLogo,
    storeName,
    storeDescription,
    storeBannerImage,
    previewTab,
    onPreviewTabChange,
    productCollections,
    serviceCollections
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeProductCollection, setActiveProductCollection] = useState('all');
    const [activeServiceCollection, setActiveServiceCollection] = useState('all');

    const hasBothTabs = productCollections.length > 0 && serviceCollections.length > 0;
    const sectionTitle = previewTab === 'Shop' ? 'Collections' : 'Service Collections';
    const heroActionLabel = previewTab === 'Shop' ? 'Shop collection' : 'View services';
    const activeCollections = previewTab === 'Shop' ? productCollections : serviceCollections;
    const activeCollectionId = previewTab === 'Shop' ? activeProductCollection : activeServiceCollection;
    const setActiveCollectionId =
        previewTab === 'Shop' ? setActiveProductCollection : setActiveServiceCollection;

    useEffect(() => {
        setSearchTerm('');
    }, [previewTab]);

    useEffect(() => {
        if (activeCollectionId === 'all') return;

        const collectionStillExists = activeCollections.some(
            (collection) => (collection.id || collection.title) === activeCollectionId
        );

        if (!collectionStillExists) {
            setActiveCollectionId('all');
        }
    }, [activeCollectionId, activeCollections, setActiveCollectionId]);

    const collectionFilters = useMemo(
        () => [
            { id: 'all', label: 'All' },
            ...activeCollections.map((collection) => ({
                id: collection.id || collection.title,
                label: collection.title
            }))
        ],
        [activeCollections]
    );

    const visibleCollections = useMemo(() => {
        const normalizedQuery = searchTerm.trim().toLowerCase();

        return activeCollections
            .filter((collection) =>
                activeCollectionId === 'all'
                    ? true
                    : (collection.id || collection.title) === activeCollectionId
            )
            .map((collection) => {
                const matchingItems = (collection.items || []).filter((item) => {
                    if (!normalizedQuery) return true;

                    const searchableText = [
                        item?.title,
                        item?.name,
                        item?.description,
                        item?.price,
                        item?.priceLabel,
                        item?.cta
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();

                    return searchableText.includes(normalizedQuery);
                });

                return {
                    ...collection,
                    previewItems: matchingItems.slice(0, 4),
                    countLabel: `${matchingItems.length} ${
                        matchingItems.length === 1
                            ? previewTab === 'Shop' ? 'Product' : 'Service'
                            : previewTab === 'Shop' ? 'Products' : 'Services'
                    }`
                };
            })
            .filter((collection) => collection.previewItems.length);
    }, [activeCollectionId, activeCollections, previewTab, searchTerm]);

    const heroDescription = previewText(
        storeDescription,
        previewTab === 'Shop'
            ? 'Discover curated products from this store.'
            : 'Book services and explore every collection from one place.'
    );

    const heroStyle = storeBannerImage
        ? { '--customer-home-banner-image': `url(${JSON.stringify(storeBannerImage)})` }
        : undefined;
    const previewHasBanner = Boolean(storeBannerImage);

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
                            overflowY: 'auto',
                            height: '454px'
                        }}
                    >
                        <div
                            className={styles.customerHomePage}
                            style={{
                                ...themeStyle,
                                minHeight: '100%',
                                background: 'var(--customer-home-background)',
                                justifyContent: 'stretch',
                                display: 'block'
                            }}
                        >
                            <div
                                className={styles.customerHomeContent}
                                style={{ maxWidth: '100%', width: '100%', padding: '12px 12px 20px' }}
                            >
                                <div
                                    className={styles.customerHomeTopbar}
                                    style={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        gap: '10px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <div
                                        className={`${styles.customerHomeShopBrand} ${styles.customerHomeTopBrand}`}
                                        style={{ margin: '0 0 14px', justifyContent: 'flex-start' }}
                                    >
                                        <img
                                            className={styles.customerHomeShopBrandLogo}
                                            src={storeLogo}
                                            alt={storeName}
                                        />
                                        <div className={styles.customerHomeShopBrandText}>
                                            <span className={styles.customerHomeShopBrandName}>{storeName}</span>
                                            <span className={styles.customerHomeShopBrandMeta}>{sectionTitle}</span>
                                        </div>
                                    </div>

                                    {hasBothTabs ? (
                                        <div
                                            className={styles.customerHomeSegment}
                                            role="tablist"
                                            aria-label="Store preview sections"
                                            style={{
                                                width: '100%',
                                                margin: 0,
                                                padding: '4px',
                                                borderRadius: '12px',
                                                background: 'var(--customer-home-primary-muted)'
                                            }}
                                        >
                                            <Button
                                                className={`${styles.customerHomeSegmentButton} ${
                                                    previewTab === 'Shop' ? styles.customerHomeSegmentActive : ''
                                                }`}
                                                type="button"
                                                onClick={() => onPreviewTabChange('Shop')}
                                                style={{ minWidth: 0, minHeight: '38px', borderRadius: '10px' }}
                                                unstyled
                                            >
                                                Shop
                                            </Button>
                                            <Button
                                                className={`${styles.customerHomeSegmentButton} ${
                                                    previewTab === 'Services' ? styles.customerHomeSegmentActive : ''
                                                }`}
                                                type="button"
                                                onClick={() => onPreviewTabChange('Services')}
                                                style={{ minWidth: 0, minHeight: '38px', borderRadius: '10px' }}
                                                unstyled
                                            >
                                                Services
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>

                                <section className={styles.customerHomeShopShell}>
                                    <section
                                        className={`${styles.customerHomeShopHero} ${
                                            storeBannerImage ? styles.customerHomeShopHeroWithBanner : ''
                                        }`}
                                        style={{
                                            ...heroStyle,
                                            gridTemplateColumns: 'minmax(0, 1fr)',
                                            alignItems: previewHasBanner ? 'end' : 'start',
                                            padding: '18px'
                                        }}
                                    >
                                        <div className={styles.customerHomeShopHeroCopy}>
                                            <span className={styles.customerHomeShopHeroEyebrow}>Store banner</span>
                                            <h2 className={styles.customerHomeShopHeroTitle}>{storeName}</h2>
                                            <p className={styles.customerHomeShopHeroText}>{heroDescription}</p>
                                            <Button
                                                className={styles.customerHomeShopHeroButton}
                                                type="button"
                                                unstyled
                                            >
                                                {heroActionLabel}
                                            </Button>
                                        </div>

                                        {!storeBannerImage ? (
                                            <div
                                                className={styles.customerHomeShopHeroMedia}
                                                style={{ display: 'none' }}
                                            >
                                                <img src={storeLogo} alt={storeName} />
                                            </div>
                                        ) : null}
                                    </section>

                                    <div
                                        className={styles.customerHomeShopLayout}
                                        style={{ gridTemplateColumns: 'minmax(0, 1fr)', gap: '18px' }}
                                    >
                                        <aside className={styles.customerHomeShopSidebar}>
                                            <div
                                                className={styles.customerHomeShopSidebarCard}
                                                style={{
                                                    position: 'static',
                                                    top: 'auto',
                                                    border: 'none',
                                                    borderRadius: 0,
                                                    background: 'transparent',
                                                    padding: 0
                                                }}
                                            >
                                                <p className={styles.customerHomeShopSidebarTitle}>Categories</p>
                                                <div
                                                    className={styles.customerHomeShopCategoryList}
                                                    style={{
                                                        flexDirection: 'row',
                                                        overflowX: 'auto',
                                                        paddingBottom: '4px'
                                                    }}
                                                >
                                                    {collectionFilters.map((item) => (
                                                        <Button
                                                            className={`${styles.customerHomeShopCategoryButton} ${
                                                                activeCollectionId === item.id
                                                                    ? styles.customerHomeShopCategoryButtonActive
                                                                    : ''
                                                            }`}
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setActiveCollectionId(item.id)}
                                                            style={{
                                                                width: 'auto',
                                                                justifyContent: 'center',
                                                                flex: '0 0 auto'
                                                            }}
                                                            unstyled
                                                        >
                                                            {item.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </aside>

                                        <div className={styles.customerHomeCollectionLanding}>
                                            <div className={styles.customerHomeCollectionLandingHeader}>
                                                <h2 className={styles.customerHomeSectionTitle}>{sectionTitle}</h2>
                                                {searchTerm ? (
                                                    <span className={styles.customerHomeCollectionLandingMeta}>
                                                        Search results for "{searchTerm}"
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className={styles.customerHomeCollectionList}>
                                                {visibleCollections.length ? (
                                                    visibleCollections.map((collection) => (
                                                        <section
                                                            className={styles.customerHomeCollectionPreviewSection}
                                                            key={collection.id || collection.title}
                                                        >
                                                            <div className={styles.customerHomeCollectionPreviewHeader}>
                                                                <div className={styles.customerHomeCollectionPreviewHeading}>
                                                                    <h3 className={styles.customerHomeCollectionPreviewTitle}>
                                                                        {collection.title}
                                                                    </h3>
                                                                    <span className={styles.customerHomeCollectionPreviewCount}>
                                                                        {collection.countLabel}
                                                                    </span>
                                                                </div>

                                                                <Button
                                                                    className={styles.customerHomeCollectionPreviewAction}
                                                                    type="button"
                                                                    unstyled
                                                                >
                                                                    See all
                                                                </Button>
                                                            </div>

                                                            <div
                                                                className={styles.customerHomeCollectionPreviewGrid}
                                                                style={{
                                                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                                    gap: '12px'
                                                                }}
                                                            >
                                                                {collection.previewItems.map((item, index) => (
                                                                    <Button
                                                                        className={`${styles.customerHomeCollectionPreviewCard} ${
                                                                            previewTab === 'Services'
                                                                                ? styles.customerHomeCollectionPreviewCardService
                                                                                : ''
                                                                        }`}
                                                                        key={item.id || `${collection.id}-${index}`}
                                                                        type="button"
                                                                        unstyled
                                                                    >
                                                                        <div className={styles.customerHomeCollectionPreviewImageWrap}>
                                                                            <img
                                                                                className={styles.customerHomeCollectionPreviewImage}
                                                                                src={item.image}
                                                                                alt={item.title || item.name}
                                                                            />
                                                                        </div>

                                                                        <div className={styles.customerHomeCollectionPreviewBody}>
                                                                            <h4 className={styles.customerHomeCollectionPreviewProductTitle}>
                                                                                {item.title || item.name}
                                                                            </h4>
                                                                            <p className={styles.customerHomeCollectionPreviewProductDesc}>
                                                                                {item.description}
                                                                            </p>
                                                                            {previewTab === 'Shop' ? (
                                                                                <span className={styles.customerHomeCollectionPreviewPrice}>
                                                                                    {item.price}
                                                                                </span>
                                                                            ) : (
                                                                                <span className={styles.customerHomeCollectionPreviewServiceCta}>
                                                                                    {item.cta}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </Button>
                                                                ))}
                                                            </div>
                                                        </section>
                                                    ))
                                                ) : (
                                                    <div className={styles.customerHomeEmptyState}>
                                                        <p className={styles.customerHomeEmptyTitle}>
                                                            {previewTab === 'Shop'
                                                                ? 'No matching products'
                                                                : 'No matching services'}
                                                        </p>
                                                        <p className={styles.customerHomeEmptyText}>
                                                            Try another collection or search term.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>
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
    setProductItem(itemValue.slice(0, 4));
    }, [])

    useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('services')) || [];
    setServiceItem(itemValue.slice(0, 4));
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

    const storeLogo = myStore?.onlineStore?.profile_logo_url || Owi;
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
    () => buildCustomerThemeStyle(myStore?.onlineStore?.selected_theme),
    [myStore?.onlineStore?.selected_theme]
    );
    const previewProductCollections = useMemo(() => {
    const mappedCollections = (collectionProduct?.data?.collections || [])
        .map((collection, collectionIndex) => {
            const items = (collectionProducts[collection.id] || []).map((entry, itemIndex) => {
                const product = entry?.Product || entry?.product || entry || {};

                return {
                    id: product?.id || entry?.id || `${collection.id}-${itemIndex}`,
                    title: previewText(product?.name || product?.product_name || product?.title, 'Product'),
                    description: previewText(product?.category || product?.description, 'New arrival'),
                    price: formatPreviewPrice(product?.price),
                    image: getImageUrl(product?.image_url || product?.image) || storeLogo
                };
            });

            return {
                id: collection?.id || `product-collection-${collectionIndex}`,
                title: previewText(collection?.collection_name, `Collection ${collectionIndex + 1}`),
                countValue: items.length,
                items
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
            id: 'all-products',
            title: 'All Products',
            countValue: productItem.length,
            items: productItem.map((product, index) => ({
                id: product?.id || `product-item-${index}`,
                title: previewText(product?.name || product?.product_name || product?.title, 'Product'),
                description: previewText(product?.category || product?.description, 'New arrival'),
                price: formatPreviewPrice(product?.price),
                image: getImageUrl(product?.image_url || product?.image) || storeLogo
            }))
        }
    ];
    }, [collectionProduct?.data?.collections, collectionProducts, productItem, storeLogo]);
    const previewServiceCollections = useMemo(() => {
    const mappedCollections = (collections?.data?.collections || [])
        .map((collection, collectionIndex) => {
            const items = (serviceCollectionsPreview[collection.id] || []).map((service, itemIndex) => {
                const serviceData = service?.StoreService || service || {};
                const serviceTitle = previewText(
                    serviceData?.service_title || serviceData?.title,
                    'Service'
                );
                const durationLabel = formatDuration(serviceData?.duration_minutes);

                return {
                    id: service?.id || serviceData?.id || `${collection.id}-${itemIndex}`,
                    title: serviceTitle,
                    name: serviceTitle,
                    description: previewText(
                        serviceData?.description,
                        durationLabel ? `Duration ${durationLabel}` : 'Book this service from the store.'
                    ),
                    cta: 'Book Now',
                    image: getServiceImage(serviceData)
                };
            });

            return {
                id: collection?.id || `service-collection-${collectionIndex}`,
                title: previewText(collection?.collection_name, `Collection ${collectionIndex + 1}`),
                countValue: items.length,
                items
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
            id: 'all-services',
            title: 'All Services',
            countValue: serviceItem.length,
            items: serviceItem.map((service, index) => {
                const serviceTitle = previewText(
                    service?.service_title || service?.title,
                    'Service'
                );
                const durationLabel = formatDuration(service?.duration_minutes);

                return {
                    id: service?.id || `service-item-${index}`,
                    title: serviceTitle,
                    name: serviceTitle,
                    description: previewText(
                        service?.description,
                        durationLabel ? `Duration ${durationLabel}` : 'Book this service from the store.'
                    ),
                    cta: 'Book Now',
                    image: getServiceImage(service)
                };
            })
        }
    ];
    }, [collections?.data?.collections, serviceCollectionsPreview, serviceItem]);

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
          <div className="d-flex justify-content-between">
            <div className="d-flex gap-4 border-bottom" style={{borderBottom: '1px solid #EEEEEE'}}>
                {topTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleActiveTabChange(tab.target)}
                        className="bg-transparent pb-2"
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
            <div className='d-flex gap-2 flex-nowrap'>
                <Button variant='greenButton' size='md' className='flex-grow-1 text-nowrap'>Publish Store</Button>
                <Button variant='blueButton' size='md' className='flex-grow-1 text-nowrap'>Save Changes</Button>
            </div>
          </div>
        <div className="row">
            <div className="col-sm-12 col-md-12 col-lg-7">
                {/* <h5 className="text-center mt-3 mb-5">StoreFront Setup</h5> */}
                {activeTab === 'SetupStore' ? (
                    <>
                      {add ? (
                            <>
                                <div className={`${styles['outer-box']} p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
                                    <div className={`${styles['inner-box']} text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
                                        <p style={{color: '#78716C'}}>No store information available</p>
                                        <button className={`btn ${styles['add-btn']} px-4`} onClick={() => {setAdd(false)}}>Setup Store</button>
                                    </div>
                                </div>

                                <div className="text-end mt-4">
                                    <button className={styles['sk-btn']}>Skip</button>
                                </div>
                            </>
                            ) : (
                            <>
                                <form onSubmit={setupStep === 'store' ? saveStoreInformation : saveSocialLinks}>
                                    <div className={`${styles['store-info']} p-3`} style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        {setupStep === 'store' ? (
                                            <>
                                                <h6 style={{color: '#1C1917'}} className='mx'>Store Information</h6>
                                                <p style={{color: '#78716C', fontSize: '13px'}}>Let’s start with the basic information about your store</p>

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

                                                    <div className={`d-flex overflow-hidden ${styles['store-input-wrapper']}`} style={{border: '1px solid #EEEEEE'}}>
                                                        <span className="px-3 d-flex align-items-center mx" style={{background: '#EAF4FF'}}>
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
                                                <div style={{background: '#EEF8FF'}} className='p-3 mt-4 rounded'>
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
                                                <div className="d-flex justify-content-between align-items-start gap-3">
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
                                    <div className="text-end mt-3">
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

                    <div className="mt-4">
                        {isTopTabActive('shop') && (
                            <div className="d-flex mb-4" style={{border: '1px solid #EEEEEE'}}>
                                {shopTabs.map((tab) => (
                                    <button
                                        key={tab.target}
                                        type="button"
                                        className="flex-fill bg-transparent py-3"
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

            

            <div className="col-sm-12 col-md-12 col-lg-5 mt-5" style={{position: 'sticky', top: 0}}>
                <h5 className="text-center mt-3 mb-4">Preview</h5>

                <StorefrontMobilePreview
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
        </>
       ) : (<ViewStore />)}
    </>
  )
}

export default SetupStoreMain
