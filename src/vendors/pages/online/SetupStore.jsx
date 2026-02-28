import React, {useState, useEffect} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCountries } from '../../../slice/countriesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { createOnlineStore, resetStatus, updateStoreLinks, getAllServices, getCollectionForProduct, productImageForCollection } from '../../../slice/onlineStoreSlice';
import { faInfoCircle, faLink, faStore, faCube, faDatabase, faExternalLinkAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { Flash, F, X, In, In2, Owi, Smc, Gl } from '../../../assets';
import Service from './Service';
import Appearance from './Appearance';
import Product from './Product';
import Collection from './Collection';
import ViewStore from './ViewStore';
import styles from "../../../styles.module.css";
import Swal from 'sweetalert2';



const SetupStore = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");
  const [add, setAdd] = useState(true);
  const [isAllowed, setIsAllowed] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('Nigeria');
  const [selectedStates, setSelectedStates] = useState(['Lagos']);
  const [ms, setMs] = useState(true)
  const [hasCollections, setHasCollections] = useState(false);
  const primaryColor = "#0273F9";
  const { loading, error, success, allStore, collectionProduct, collections } = useSelector((state) => state.store);

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
  const [activeTab, setActiveTab] = useState('Services');  
  const [change, setChange] = useState('Services');
  const [productItem, setProductItem] = useState([]);
  const [collectionProducts, setCollectionProducts] = useState({})

  const [online, setOnline] = useState({
    username: '',
    store_name: '',
    store_description: ''
  })

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
        dispatch(getCollectionForProduct({ token, id: getId || '7'}));
    }
}, [token, dispatch])

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

  const renderContent = () => {
    switch(change) {
      case 'Services':
        return <div className="p-3">
          {allStore.data?.services && allStore.data.services.length > 0 ? (
            <div>
              {allStore.data.services.map((service) => (
                <div key={service.id} className="d-flex justify-content-between px-3 py-2 rounded-pill mb-2" style={{background: '#78716C', color: '#fff'}}>
                  <div className="mt-1">
                    <img src={Smc} alt="" style={{width: '20px'}} />
                  </div>
                  <div style={{width: '70%'}}>
                    <small className="d-block" style={{fontSize: '12px'}}>{service.service_title} ({formatDuration(service.duration_minutes)}) - ₦{Number(service.price).toLocaleString()}</small>
                  </div>
                  <div className="mt-1">
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted">No Services available</p>
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


  useEffect(() => {
    dispatch(getCountries());
  }, [dispatch]);

  const countries = countryItem.data || [];

  const nigerianStates = [
    'All States',
    'Abia',
    'Abuja',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara'
  ];

  const handleStateToggle = (state) => {
    if (state === 'All States') {
      if (selectedStates.includes('All States')) {
        setSelectedStates([]);
      } else {
        setSelectedStates(['All States']);
      }
    } else {
      if (selectedStates.includes(state)) {
        setSelectedStates(selectedStates.filter(s => s !== state && s !== 'All States'));
      } else {
        const newStates = selectedStates.filter(s => s !== 'All States');
        setSelectedStates([...newStates, state]);
      }
    }
  };

  const getCurrentCountryFlag = () => {
    const country = countries.find((c) => c.name === selectedCountry);
    return country ? country.flag : '🏳️';
  };


  const [isHidden, setIsHidden] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    website: 'example.com',
    instagram: '',
    facebook: '',
    linkedin: '',
    x: '',
    tiktok: ''
  });

  // Sync socialLinks with links.social_links
  useEffect(() => {
    setLinks(prev => ({ 
      ...prev, 
      social_links: [{
        facebook: socialLinks.facebook || '',
        linkedin: socialLinks.linkedin || '',
        x: socialLinks.x || socialLinks.twitter || '',
        instagram: socialLinks.instagram || '',
        tiktok: socialLinks.tiktok || ''
      }]
    }));
  }, [socialLinks]);

  // Debug log for links state
//   useEffect(() => {
//     console.log('Links state updated:', links);
//   }, [links]);

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


  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = minutes / 60;
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hrs`;
  };

  const saveContent = (e) => {
    e.preventDefault();

    const { username, store_name, store_description } = online;

    if (!username || !store_name || !store_description) {
        Swal.fire({
            icon: "info",
            title: "Missing Fields",
            text: "Please fill in all fields",
            confirmButtonColor: '#0273F9'
        });
        return;
    }

    dispatch(createOnlineStore({token, ...online}))
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


  const addLinks = (e) => {
    e.preventDefault();

    const { show_location, country, state, is_location_based, allow_delivery_datetime, social_links } = links;
    
    if (!show_location || !country || !state || !is_location_based || !allow_delivery_datetime || !social_links) {
        Swal.fire({
            icon: "info",
            title: "Missing Fields",
            text: "Please fill in all fields",
            confirmButtonColor: '#0273F9'
        });
        return;
    }

    dispatch(updateStoreLinks({token, id: getId || '7', ...links}))
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
            setFront(false)
            setLinks({
                show_location: 0,
                country: '',
                state: '',
                is_location_based: 1,
                allow_delivery_datetime: 1,
                social_links: []
            });
        });
    }

    if (error) {
        Swal.fire({
            icon: "error",
            title: "failed to add links",
            text: error.message,
            confirmButtonColor: "#0273F9",
        }).then(() => {
            dispatch(resetStatus());
        });
    }
  }, [success, error, dispatch])


  return (
    <>
      {ms ? (
        <>
          <div className="d-flex justify-content-between">
            <div className={`${styles['set-btn']} d-flex align-items-center justify-content-center`} style={{background: "linear-gradient(to right, #0273F9BF, #014493BD)", borderRadius: '28px', width: '58%'}}>
                <p className='text-light mt-3 me-3'><b>Try Pro for free</b></p>
                <button className={styles['try-btn']}><img src={Flash} alt="" className='mx-2'/>Upgrade</button>
            </div>
            <div className='text-end'>
                <button
                  className={`${styles['si-btn']} px-5 py-3`}
                  onClick={() => setMs(false)}
                  disabled={!hasCollections}
                  style={
                    !hasCollections
                      ? {
                          background: 'transparent',
                          border: `1px solid ${primaryColor}`,
                          color: primaryColor,
                          cursor: 'not-allowed'
                        }
                      : undefined
                  }
                >
                  Create My Store Link
                </button>
            </div>
          </div>
        <div className="row">
            <div className="col-sm-12 col-md-12 col-lg-7 mt-5">
                <h5 className="text-center mt-3 mb-5">StoreFront Setup</h5>
                {front ? (
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
                                <form onSubmit={saveContent}>
                                    <div className={`${styles['store-info']} p-3`} style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        <h6 style={{color: '#1C1917'}} className='mx'>Store Information</h6>
                                        <p style={{color: '#78716C', fontSize: '13px'}}>Let’s start with the basic information about your store</p>

                                        
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
                                        <div style={{background: '#EEF8FF'}} className='p-3 mt-3 rounded'>
                                        <h6 style={{color: '#0273F9'}} className='mx'><FontAwesomeIcon icon={faInfoCircle} style={{color: '#0273F9'}} className='me-2'/><span className='nx'>Your store link will be</span> <span className='my'>mychroshp.com/yourstore</span></h6>
                                        </div>
                                    </div>
                                    <div className="text-end mt-3">
                                        <button className={`${styles['btn-lg']} ${styles['si-btn']} px-4 py-3`}>
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
                                <form onSubmit={addLinks}>
                                    <div className="container-fluid p-4 mt-4" style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        <div className="row">
                                            <div className="col-12">
                                            {/* Header Section */}
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <div>
                                                <h5 className="text-dark mb-1" style={{fontSize: '17px'}}>My Social</h5>
                                                <p className="mb-0" style={{color: '#78716C', fontSize: '13px'}}>Add social media link to your store</p>
                                                </div>
                                                
                                                {/* Toggle Switch */}
                                                <div className='form-check form-switch'>
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    id="hideSocial"
                                                    name='show_location'
                                                    data-form="setUpLink"
                                                    checked={links.show_location === 1}
                                                    onChange={handleChange}
                                                    style={{ transform: 'scale(1.5)' }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="hideSocial" style={{color: '#78716C', fontSize: '13px'}}>
                                                    {links.show_location === 1 ? 'Hide' : 'Show'}
                                                </label>
                                                </div>
                                            </div>

                                            {links.show_location === 1 && (
                                                <>
                                                {/* Social Media Icons Row */}
                                                <div className="row mb-4">
                                                    <div className="col-12">
                                                    <div className="d-flex gap-3 mb-4">
                                                        {socialPlatforms.map((platform, index) => (
                                                        <div 
                                                            key={platform.name}
                                                            className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                                            style={{ 
                                                            width: '60px', 
                                                            height: '60px',
                                                            cursor: 'pointer',
                                                            border: '1px solid #e9ecef',
                                                            background: '#EEEEEE'
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '16px' }} className=' text-center'>
                                                                {/* {platform.icon} */}
                                                                <img src={platform.icon} alt="" className='w-50'/>
                                                            </span>
                                                        </div>
                                                        ))}
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Website Link */}
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}>🌐</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.website}
                                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                                            placeholder="example.com"
                                                            style={{ fontSize: '16px', color: '#6c757d' }}
                                                        />
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Instagram Link */}
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}><img src={In2} alt='' style={{width: '60%'}} className='mx-2'/></span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.instagram}
                                                            onChange={(e) => handleInputChange('instagram', e.target.value)}
                                                            placeholder="Instagram URL or username"
                                                            style={{ fontSize: '16px' }}
                                                        />
                                                        {socialLinks.instagram && (
                                                            <button 
                                                            className="btn btn-primary btn-sm rounded-circle ms-2"
                                                            onClick={() => removeSocialLink('instagram')}
                                                            style={{ width: '30px', height: '30px' }}
                                                            >
                                                            ×
                                                            </button>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Facebook Link */}
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}><img src={F} alt='' style={{width: '50%'}} className='mx-2'/></span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.facebook}
                                                            onChange={(e) => handleInputChange('facebook', e.target.value)}
                                                            placeholder="Facebook URL or username"
                                                            style={{ fontSize: '16px' }}
                                                        />
                                                        {socialLinks.facebook && (
                                                            <button 
                                                            className="btn btn-primary btn-sm rounded-circle ms-2"
                                                            onClick={() => removeSocialLink('facebook')}
                                                            style={{ width: '30px', height: '30px' }}
                                                            >
                                                            ×
                                                            </button>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* LinkedIn Link */}
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}><img src={In} alt='' style={{width: '50%'}} className='mx-2'/></span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.linkedin}
                                                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                                                            placeholder="LinkedIn URL or username"
                                                            style={{ fontSize: '16px' }}
                                                        />
                                                        {socialLinks.linkedin && (
                                                            <button 
                                                            className="btn btn-primary btn-sm rounded-circle ms-2"
                                                            onClick={() => removeSocialLink('linkedin')}
                                                            style={{ width: '30px', height: '30px' }}
                                                            >
                                                            ×
                                                            </button>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* X/Twitter Link */}
                                                <div className="row mb-3">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}><img src={X} alt='' style={{width: '50%'}} className='mx-2'/></span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.x}
                                                            onChange={(e) => handleInputChange('x', e.target.value)}
                                                            placeholder="X (Twitter) URL or username"
                                                            style={{ fontSize: '16px' }}
                                                        />
                                                        {socialLinks.x && (
                                                            <button 
                                                            className="btn btn-primary btn-sm rounded-circle ms-2"
                                                            onClick={() => removeSocialLink('x')}
                                                            style={{ width: '30px', height: '30px' }}
                                                            >
                                                            ×
                                                            </button>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* TikTok Link */}
                                                <div className="row mb-4">
                                                    <div className="col-12">
                                                    <div className={`p-2 border ${styles['input-item']}`}>
                                                        <div className="d-flex align-items-center">
                                                        <div 
                                                            className="d-flex align-items-center justify-content-center me-3"
                                                            style={{ width: '40px', height: '10px' }}
                                                        >
                                                            <span style={{ fontSize: '16px' }}>🎵</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${styles['input-item']} ${styles['dr-item']} border-0`}
                                                            value={socialLinks.tiktok}
                                                            onChange={(e) => handleInputChange('tiktok', e.target.value)}
                                                            placeholder="TikTok URL or username"
                                                            style={{ fontSize: '16px' }}
                                                        />
                                                        {socialLinks.tiktok && (
                                                            <button 
                                                            className="btn btn-primary btn-sm rounded-circle ms-2"
                                                            onClick={() => removeSocialLink('tiktok')}
                                                            style={{ width: '30px', height: '30px' }}
                                                            >
                                                            ×
                                                            </button>
                                                        )}
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Add More Text */}
                                                <div className="row">
                                                    <div className="col-12">
                                                    <p className="mb-0" style={{ fontSize: '14px', color: '#78716C' }}>
                                                        You can always add more later
                                                    </p>
                                                    </div>
                                                </div>
                                                </>
                                            )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="container-fluid p-4 mt-4" style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                        <div className="row">
                                            <div className="col-12">
                                            {/* Header Section */}
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <div>
                                                <h5 className="text-dark mb-1" style={{fontSize: '17px'}}>Location</h5>
                                                <p className="text-muted mb-0" style={{fontSize: '13px'}}>Add location to your storefront</p>
                                                </div>
                                                
                                                {/* Toggle Switch */}
                                                <div className="form-check form-switch">
                                                <input 
                                                    className="form-check-input"
                                                    type="checkbox" 
                                                    id="allowLocation"
                                                    name="is_location_based"
                                                    data-form="setUpLink"
                                                    checked={links.is_location_based === 1}
                                                    onChange={handleChange}
                                                    style={{ 
                                                    transform: 'scale(1.5)',
                                                    backgroundColor: links.is_location_based === 1 ? '#000' : '#6c757d'
                                                    }}
                                                />
                                                <label className="form-check-label ms-2" htmlFor="allowLocation" style={{fontSize: '14px', color: '#78716C'}}>
                                                    Allow
                                                </label>
                                                </div>
                                            </div>

                                            {links.is_location_based === 1 && (
                                                <>
                                                {/* Country Selection */}
                                                <div className="row mb-4">
                                                    <div className="col-12">
                                                        <h6 className="mb-3">Country</h6>
                                                        <div className="dropdown" style={{background: '#FBFDFF'}}>
                                                            <button 
                                                            className="btn btn-white border rounded-4 w-100 d-flex justify-content-between align-items-center p-2"
                                                            type="button" 
                                                            data-bs-toggle="dropdown"
                                                            style={{ 
                                                                backgroundColor: '#FBFDFF',
                                                                border: '1px solid #dee2e6',
                                                                textAlign: 'left'
                                                            }}
                                                            >
                                                            <div className="d-flex align-items-center">
                                                                <span className="me-3">
                                                                    <img
                                                                        src={getCurrentCountryFlag()}
                                                                        alt={`${selectedCountry} flag`}
                                                                        className="img-fluid"
                                                                        style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                                                                    />
                                                                    </span>
                                                                <span className="text-dark fw-normal">{selectedCountry}</span>
                                                            </div>
                                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                                <path d="M6 8L2 4H10L6 8Z" fill="#6c757d"/>
                                                            </svg>
                                                            </button>
                                                            <ul className="dropdown-menu w-100"
                                                            style={{
                                                                maxHeight: '250px',
                                                                overflowY: 'auto'
                                                            }}
                                                            >
                                                            {countryItem.data?.map((country, index) => (
                                                                <li key={index}>
                                                                    <button
                                                                    className="dropdown-item d-flex align-items-center py-2"
                                                                    type="button"
                                                                    onClick={() => setSelectedCountry(country.name)}
                                                                    >
                                                                    <span className="me-3">
                                                                        <img
                                                                        src={country.flag}
                                                                        alt={`${country.name} flag`}
                                                                        className="img-fluid"
                                                                        style={{ width: '24px', height: '16px', objectFit: 'cover' }}
                                                                        />
                                                                    </span>
                                                                    {country.name}
                                                                    </button>
                                                                </li>
                                                            ))}

                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* State Selection */}
                                                <div className="row">
                                                    <div className="col-12">
                                                    <h6 className="mb-3">State</h6>
                                                    
                                                    {/* State Dropdown */}
                                                    <div className="position-relative" style={{background: '#FBFDFF'}}>
                                                        <button 
                                                        className="btn btn-white border rounded-4 w-100 d-flex justify-content-between align-items-center p-3 mb-3"
                                                        type="button"
                                                        onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                                                        style={{ 
                                                            backgroundColor: '#FBFDFF',
                                                            border: '1px solid #dee2e6',
                                                            textAlign: 'left'
                                                        }}
                                                        >
                                                        <span className="text-muted">
                                                            {selectedStates.length === 0 ? 'Select State' : 
                                                            selectedStates.length === 1 ? selectedStates[0] :
                                                            `${selectedStates.length} states selected`}
                                                        </span>
                                                        <svg 
                                                            width="12" 
                                                            height="12" 
                                                            viewBox="0 0 12 12" 
                                                            fill="none"
                                                            style={{ 
                                                            transform: isStateDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease'
                                                            }}
                                                        >
                                                            <path d="M6 8L2 4H10L6 8Z" fill="#6c757d"/>
                                                        </svg>
                                                        </button>

                                                        {/* State Options */}
                                                        {isStateDropdownOpen && (
                                                        <div 
                                                            className="bg-white border rounded-3 shadow-sm p-3"
                                                            style={{ 
                                                            maxHeight: '300px',
                                                            overflowY: 'auto',
                                                            border: '1px solid #dee2e6'
                                                            }}
                                                        >
                                                            {nigerianStates.map((state, index) => (
                                                            <div key={state} className="form-check mb-3">
                                                                <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                id={`state-${index}`}
                                                                checked={selectedStates.includes(state)}
                                                                onChange={() => handleStateToggle(state)}
                                                                style={{ 
                                                                    transform: 'scale(1.2)',
                                                                    marginTop: '2px'
                                                                }}
                                                                />
                                                                <label 
                                                                className="form-check-label ms-3 text-dark" 
                                                                htmlFor={`state-${index}`}
                                                                style={{ 
                                                                    fontSize: '16px',
                                                                    fontWeight: selectedStates.includes(state) ? '600' : '400'
                                                                }}
                                                                >
                                                                {state}
                                                                </label>
                                                            </div>
                                                            ))}
                                                        </div>
                                                        )}
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Selected States Preview */}
                                                {selectedStates.length > 0 && (
                                                    <div className="row mt-3">
                                                    <div className="col-12">
                                                        <div className="bg-white p-3 rounded-3 border">
                                                        <h6 className="text-muted mb-2">Selected States:</h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {selectedStates.map((state) => (
                                                            <span 
                                                                key={state}
                                                                className="badge bg-primary rounded-pill px-3 py-2"
                                                                style={{ fontSize: '12px' }}
                                                            >
                                                                {state}
                                                                <button 
                                                                className="btn-close btn-close-white ms-2"
                                                                style={{ fontSize: '10px' }}
                                                                onClick={() => handleStateToggle(state)}
                                                                ></button>
                                                            </span>
                                                            ))}
                                                        </div>
                                                        </div>
                                                    </div>
                                                    </div>
                                                )}
                                                </>
                                            )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-3" style={{background: "#fff", border: '2px solid #EEEEEE', borderRadius: '12px'}}>
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <h5 className="mx mb-1" style={{fontSize: '17px'}}>
                                                Allow Delivery Date & Time on checkout
                                            </h5>
                                            <p className="mb-0" style={{ fontSize: '12px', color: '#78716C' }}>
                                                Enable users to select delivery date and time during checkout
                                            </p>
                                        </div>
                                        
                                        {/* Toggle Switch */}
                                        <div className="form-check form-switch">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="allowDeliveryDateTime"
                                            name="allow_delivery_datetime"
                                            data-form="setUpLink"
                                            checked={links.allow_delivery_datetime === 1}
                                            onChange={handleChange}
                                            style={{ 
                                            transform: 'scale(1.5)',
                                            backgroundColor: links.allow_delivery_datetime === 1 ? '#000' : '#6c757d'
                                            }}
                                        />
                                        <label className="form-check-label ms-2" htmlFor="allowDeliveryDateTime" style={{ color: '#78716C' }}>
                                            Allow
                                        </label>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="text-end mt-3">
                                        <button className={`${styles['btn-lg']} ${styles['si-btn']} px-4 py-3`}>
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
                  <div>
                    <div className={`d-flex justify-content-between p-3 m-0`} style={{background: '#EAF4FF', borderRadius: '10px', border: '1px solid #0273F9'}}>
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

                    <div className="mt-4">
                        {activeTab === 'Services' && <Service setPer={setPer} setVog={setVog}/>}
                        {activeTab === 'Appearance' && <Appearance />}
                        {activeTab === 'Product' && <Product setProCol={setProCol}/>}
                        {activeTab === 'Collection' && <Collection setItemData={setItemData}/>}
                        {/* {activeTab === 'Share' && <ShareComponent />} */}
                    </div>

                  </div>
                </>)}
            </div>

            

            <div className="col-sm-12 col-md-12 col-lg-5 mt-5" style={{position: 'sticky', top: 0}}>
                <h5 className="text-center mt-3 mb-4">Preview</h5>
                
                <>
                    <div className={`${styles.preview} d-flex flex-column text-center`}>
                        {proCol ? (
                            <>
                              {vog ? (
                                <>
                                {per ? (
                                    <>
                                    <div style={{margin: '40% auto'}}>
                                        <div className='mb-3'>
                                            <img src={Owi} alt="" />
                                        </div>
                                        <h5 className="my text-dark">Your Store</h5>
                                        <p>Store Description Here...</p>
                                    </div>
                                    </>
                                ) : (
                                <>
                                <div className="text-center mt-5 mx-3">
                                    <img src={Owi} alt="" />

                                    <h5 className="my text-dark mt-3">Your Store</h5>
                                    <small style={{color: '#78716C'}} className='mb-4 d-block'>Store Description Here...</small>
                                    
                                    {allStore.data?.services?.map((store) => 
                                      <div key={store.id} className="d-flex justify-content-between px-3 py-2 rounded-pill mt-2" style={{background: '#78716C', color: '#fff'}}>
                                        <div className='mt-1'>
                                        <img src={Smc} alt="" />
                                        </div>
                                        <div style={{width: '70%'}}>
                                        <small className="d-block" style={{fontSize: '12px'}}>{store.service_title} ({formatDuration(store.duration_minutes)}) - ₦{Number(store.price).toLocaleString()} <span className='bx'>Book Now</span></small>
                                        </div>
                                        <div className='mt-1'>
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                        </div>
                                      </div>
                                    )}
                                    
                                </div>
                                </>
                            )}
                                </>
                            ) : (
                                <>
                                <div className="text-center mt-5 mx-3">
                                    <img src={Owi} alt="" />

                                    <h5 className="my text-dark mt-3">Your Store</h5>
                                    <small style={{color: '#78716C'}} className='mb-4 d-block'>Store Description Here...</small>

                                    <h6 className='bx mt-4 mb-3'>My Service Collections</h6>
                                    {allStore.data?.services?.map((store) => 
                                      <div key={store.id} className="d-flex justify-content-between px-3 py-2 rounded-pill mt-2" style={{background: '#78716C', color: '#fff'}}>
                                        <div className='mt-1'>
                                        <img src={Smc} alt="" />
                                        </div>
                                        <div style={{width: '70%'}}>
                                        <small className="d-block" style={{fontSize: '12px'}}>{store.service_title} ({formatDuration(store.duration_minutes)}) - ₦{Number(store.price).toLocaleString()} <span className='bx'>Book Now</span></small>
                                        </div>
                                        <div className='mt-1'>
                                        <FontAwesomeIcon icon={faEllipsisV} />
                                        </div>
                                      </div>
                                    )}
                                
                                </div>
                                </>
                            )}
                            </>
                        ) : (
                        <>
                          <div style={{margin: '5% auto'}}>
                            <div className='mb-2'>
                                <img src={Gl} alt="" />
                            </div>
                            <h5 className="my text-dark">Your Store</h5>
                            <p>Store Description Here...</p>
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
       ) : (<ViewStore />)}
    </>
  )
}

export default SetupStore
