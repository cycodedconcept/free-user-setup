import React, {useState, useEffect} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { createOnlineStore, resetStatus, getAllServices, getAllCollection, getServiceCollection, getCollectionForProduct, productImageForCollection, getMyOnlineStore } from '../../../slice/onlineStoreSlice';
import { faInfoCircle, faLink, faStore, faCube, faDatabase, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { Flash, Owi, Smc } from '../../../assets';
import Service from './Service';
import Appearance from './Appearance';
import Product from './Product';
import Collection from './Collection';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';
import { API_URL } from '../../../config/constant';



const SetupStore = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");
  const [add, setAdd] = useState(true);
  const { loading, error, success, allStore, collectionProduct, collections, myStore } = useSelector((state) => state.store);

  const [front, setFront] = useState(() => {
    const itemValue = JSON.parse(localStorage.getItem('services')) || [];
    return itemValue.length === 0;
  });
  const [vog, setVog] = useState(true);
  const [per, setPer] = useState(true);
  const [proCol, setProCol] = useState(true);
  const [itemData, setItemData] = useState(true);
  const [activeTab, setActiveTab] = useState('Services');  
  const [change, setChange] = useState('Services');
  const [productItem] = useState(() => {
    const itemValue = JSON.parse(localStorage.getItem('products')) || [];
    return itemValue.slice(0, 4);
  });
  const [serviceCollectionsPreview, setServiceCollectionsPreview] = useState({})
  const [collectionProducts, setCollectionProducts] = useState({})

  const [online, setOnline] = useState({
    username: '',
    store_name: '',
    store_description: ''
  })

  const handleChange = (e) => {
    const { name, value, dataset } = e.target;

    if (dataset.form === "setUpStore") {
        setOnline(prev => ({ ...prev, [name]: value}));
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
        const response = await dispatch(getServiceCollection({token, id: collectionId})).unwrap();
        setServiceCollectionsPreview(prev => ({
            ...prev,
            [collectionId]: response.data?.services || []
        }));
    } catch (error) {
        console.error('Error fetching collection services:', error);
    }
}

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
}, [collections])

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
                                    <small className="d-block" style={{color: '#CAC9C7'}}>{product.description.slice(0, 10)}...</small>
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

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hrs`;
  };

  const storeLogo = myStore?.onlineStore?.profile_logo_url || Owi;
  const storeDescription = myStore?.onlineStore?.store_description || 'Store Description Here...';

  const buildStoreUsername = (storeName) =>
    storeName
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const saveContent = (e) => {
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

    dispatch(createOnlineStore({
        token,
        ...online,
        username: online.username || buildStoreUsername(store_name)
    }))
    setFront(false)
  }

  useEffect(() => {
    if (success) {
        Swal.fire({
            icon: "success",
            title: "created successfull",
            text: success.message,
            confirmButtonColor: "#0273F9",
        }).then(() => {
            dispatch(resetStatus());
            setOnline({
                username: '',
                store_name: '',
                store_description: ''
            });
        });
    }

    if (error) {
        Swal.fire({
            icon: "error",
            title: "failed to setup",
            text: error.message,
            confirmButtonColor: "#0273F9",
        }).then(() => {
            dispatch(resetStatus());
        });
    }
  }, [success, error, dispatch])

  return (
    <>
          <div className={`${styles.vendorOnlinePage} d-flex justify-content-between`}>
            <div className={`${styles['set-btn']} d-flex align-items-center justify-content-center`} style={{background: "linear-gradient(to right, #0273F9BF, #014493BD)", borderRadius: '28px', width: '58%'}}>
                <p className='text-light mt-3 me-3'><b>Try Pro for free</b></p>
                <button className={styles['try-btn']}><img src={Flash} alt="" className='mx-2'/>Upgrade</button>
            </div>
          </div>
        <div className={`${styles.vendorOnlineGrid} row`}>
            <div className="col-sm-12 col-md-12 col-lg-7 mt-5">
                <h5 className="text-center mt-3 mb-5">StoreFront Setup</h5>
                {front ? (
                    <>
                      {add ? (
                            <>
                                <div className={`${styles['outer-box']} ${styles.vendorOnlineSurfaceCard} p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
                                    <div className={`${styles['inner-box']} ${styles.vendorOnlineSurfaceCardInner} text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
                                        <p style={{color: '#78716C'}}>No store information available</p>
                                        <button className={`btn ${styles['add-btn']} px-4`} onClick={() => {setAdd(false)}}>Setup Store</button>
                                    </div>
                                </div>

                                <div className={`${styles.vendorOnlineActions} text-end mt-4`}>
                                    <button className={styles['sk-btn']}>Skip</button>
                                </div>
                            </>
                            ) : (
                            <>
                                <form onSubmit={saveContent}>
                                    <div className={`${styles['store-info']} ${styles.vendorOnlineSurfaceCard} p-3`} style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        <h6 style={{color: '#1C1917'}} className={`${styles.vendorOnlineSectionTitle} mx`}>Store Information</h6>
                                        <p className={styles.vendorOnlineSectionText}>Let’s start with the basic information about your store</p>

                                        
                                        <label for="formGroupExampleInput" className="form-label">Store Name</label>
                                        <input 
                                            type="text"
                                            data-form="setUpStore"
                                            className={`${styles["input-item"]} ${styles["dr-item"]}`} 
                                            placeholder="E.g Mystorename"
                                            name='store_name'
                                            value={online.store_name}
                                            onChange={handleChange}
                                        />

                                        <div className="my-4">
                                            <label className="form-label" style={{color: '#1C1917'}}>
                                                Username <span style={{color: '#78716C'}}>(for your store link)</span>
                                            </label>

                                            <div className={`d-flex overflow-hidden ${styles['store-input-wrapper']} ${styles.vendorStoreUrlField}`} style={{border: '1px solid #EEEEEE'}}>
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

                                        <label for="formGroupExampleInput" className='mb-2'>Store Description</label>

                                        <textarea 
                                        className={`${styles["input-item"]} ${styles["dr-item"]}`} 
                                        placeholder="Enter store description" 
                                        style={{height: '100px'}}
                                        data-form="setUpStore"
                                        name='store_description'
                                        value={online.store_description}
                                        onChange={handleChange}
                                        ></textarea>

                                        <small className="d-block" style={{color: '#909396'}}>This will appear on your store page. Keep it short and engaging</small>
                                        <div style={{background: '#EEF8FF'}} className={`p-3 mt-4 rounded ${styles.vendorStoreLinkNotice}`}>
                                            <h6 style={{color: '#0273F9'}} className='mx mb-0'>
                                                <FontAwesomeIcon icon={faInfoCircle} style={{color: '#0273F9'}} className='me-2'/>
                                                <span className='nx'>Your store link will be </span>
                                                <span className='my'>
                                                    mycroshop.com/{online.username || 'yourstore'}
                                                </span>
                                            </h6>
                                        </div>
                                    </div>
                                    <div className={`${styles.vendorOnlineActions} text-end mt-3`}>
                                        <button type="submit" className={`${styles['btn-lg']} ${styles['si-btn']} px-4 py-3`}>
                                            {
                                                loading ?(
                                                    <>
                                                    <div className="spinner-border spinner-border-sm text-light" role="status">
                                                        <span className="sr-only"></span>
                                                    </div>
                                                    <span>Creating... </span>
                                                    </>
                                                ): (
                                                    'Save and Continue'
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
                    <div className={styles.vendorOnlineContent}>
                    <div className={`${styles.vendorOnlineTabsScroll} d-flex justify-content-between border-bottom`} style={{borderBottom: '1px solid #EEEEEE'}}>
                        {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            className={`${styles.vendorOnlineTabButton} flex-fill border-0 bg-transparent py-3 text-center ${
                            activeTab === tab.name ? 'text-primary border-bottom border-primary border-3' : 'text-muted'
                            }`}
                            onClick={() => {
                                setActiveTab(tab.name);
                                if (tab.name === 'Product') {
                                    setProCol(false);
                                    setItemData(true);
                                    setChange('Shop');
                                } else if (tab.name === 'Services') {
                                    setProCol(true);
                                    setChange('Services');
                                } else if (tab.name === 'Collection') {
                                    setProCol(false);
                                    setItemData(false);
                                    setChange('Shop');
                                }
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
                    </div>

                    <div className={`${styles.vendorOnlineContent} mt-4`}>
                        {activeTab === 'Services' && <Service setPer={setPer} setVog={setVog}/>}
                        {activeTab === 'Appearance' && <Appearance />}
                        {activeTab === 'Product' && <Product setProCol={setProCol}/>}
                        {activeTab === 'Collection' && <Collection setItemData={setItemData}/>}
                        {/* {activeTab === 'Share' && <ShareComponent />} */}
                    </div>

                  </div>
                </>)}
            </div>

            

            <div className={`${styles.vendorOnlinePreviewColumn} col-sm-12 col-md-12 col-lg-5 mt-5`} style={{position: 'sticky', top: 0}}>
                <h5 className="text-center mt-3 mb-4">Preview</h5>
                
                <>
                    <div className={`${styles.preview} ${styles.vendorOnlinePreviewFrame} d-flex flex-column text-center`}>
                        {proCol ? (
                            <>
                              {vog ? (
                                <>
                                {per ? (
                                    <>
                                    <div style={{margin: '40% auto'}}>
                                        <div className='mb-3'>
                                            <img src={storeLogo} alt="Store logo" className='rounded-pill w-25' />
                                        </div>
                                        <h5 className="my text-dark">Your Store</h5>
                                        <p>{storeDescription}</p>
                                    </div>
                                    </>
                                ) : (
                                <>
                                <div className="text-center mt-5 mx-3">
                                    <img src={storeLogo} alt="Store logo" className='rounded-pill w-25'/>

                                    <h5 className="my text-dark mt-3">Your Store</h5>
                                    <small style={{color: '#78716C'}} className='mb-4 d-block'>{storeDescription}</small>
                                    {renderServiceCollectionsPreview(false)}
                                    
                                </div>
                                </>
                            )}
                                </>
                            ) : (
                                <>
                                <div className="text-center mt-5 mx-3">
                                    <img src={storeLogo} alt="Store logo" className='rounded-pill w-25'/>
                                    <h5 className="my text-dark mt-3">Your Store</h5>
                                    <small style={{color: '#78716C'}} className='mb-4 d-block'>{storeDescription}</small>
                                    {renderServiceCollectionsPreview(true)}
                                
                                </div>
                                </>
                            )}
                            </>
                        ) : (
                        <>
                          <div style={{margin: '5% auto'}}>
                            <div className='mb-2'>
                                <img src={storeLogo} alt="Store logo" className='rounded-pill w-25'/>
                            </div>
                            <h5 className="my text-dark">Your Store</h5>
                            <p>{storeDescription}</p>
                          </div>
                          <div className="container" style={{ maxWidth: '400px' }}>
                            {/* Tab buttons */}
                            <div className="text-center" role="tablist">
                                {itemService.map((tab, index) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    onClick={() => setChange(tab.id)}
                                    className={`btn ${change === tab.id ? styles['btn-alt'] : styles['btn-pl']}`}
                                    style={{
                                    borderRadius: index === 0 ? '0.375rem 0 0 0.375rem' : 
                                                index === itemService.length - 1 ? '0 0.375rem 0.375rem 0' : '0',
                                    borderRight: index < itemService.length - 1 ? '1px solid #6c757d' : 'none',
                                    // backgroundColor: '#DEDEDF',
                                    color: change === tab.id ? '#fff' : '#dad5d5',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto'
                                    }}
                                >
                                    {tab.label}
                                </button>
                                ))}
                            </div>
                            
                                {/* Tab content */}
                                <div >
                                    {renderContent()}
                                </div>
                            </div>

                            
                        </>
                        )} 
                    </div>
                </>
            </div>
        </div>
    </>
  )
}

export default SetupStore
