import React, {useState, useEffect} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faTimes, faCog, faClock, faImage, faTrashCan, faPen, faEllipsisV, faTableColumns, faThumbtack, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from 'react-redux';
import { createService, updateService, getAllServices, deleteService, getAllCollection, 
    createCollection, resetStatus, addServiceToCollection, getServiceCollection, addBulkServicesToCollection, 
    updateServiceInCollection, deleteServiceInCollection, updateCollection, deleteCollection } from '../../slice/onlineStoreSlice';
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';
import axios from 'axios';
import { API_URL } from '../../config/constant';



const Service = ({setPer, setVog}) => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");

  const { loading, error, success, allStore, collections } = useSelector((state) => state.store);
  
  const [activeTab2, setActiveTab2] = useState('Service List');
  const [smode, setSmode] = useState(false);
  const [cmode, setCmode] = useState(false);
  const [editItem, setEditItem] = useState(false);
  const [umode, setUmode] = useState(false);
  const [call, setCall] = useState(false);
  const [ser, setSer] = useState(true);
  const [rec, setRec] = useState(false);
  const [item, setItem] = useState(true);
  const [col, setCol] = useState(false);
  const tabs2 = ['Service List', 'Collection'];
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [draggedService, setDraggedService] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggedCollection, setDraggedCollection] = useState(null);
  const [dragOverCollectionIndex, setDragOverCollectionIndex] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [collectionList, setCollectionList] = useState([])
  const [totalcollection, setTotalCollection] = useState(0)
  const [astc, setAstc] = useState(false);
  const [visibleCollections, setVisibleCollections] = useState({});
  const [collectionServices, setCollectionServices] = useState({});
  const [bulkService, setBulkService] = useState(false);
  const [serlist, setSerList] = useState('')
  const [ditem, setDitem] = useState({});
  const [pinnedServices, setPinnedServices] = useState({});
  const [upSer, setUpSer] = useState(false);
  const [sid, setSid] = useState('');
  const [wid, setWid] = useState('');
  const [hidePin, setHidePin] = useState(false)
  const [editCollectionId, setEditCollectionId] = useState(null);
  const [chitem, setChitem] = useState({
    is_pinned: false,
    sort_order: ''
  })

  const [sdata, setSdata] = useState({
    service_title: '',
    description: '',
    price: '',
    service_image_url: '',
    duration_minutes: '',
    location_type: '',
    availability: {},
    sort_order: '',
    is_visible: false,
    service_image: ''

  })

  const [collectionData, setCollectionData] = useState({
    collection_name: '',
    collection_type: '',
    layout_type: '',
    is_pinned: false,
    is_visible: false
  })

  const [editCollectionData, setEditCollectionData] = useState({
    collection_name: '',
    collection_type: '',
    layout_type: '',
    is_pinned: false,
    is_visible: false
  })

  const [serCollection, setSerCollection] = useState({
    service_id: '',
    is_pinned: '',
    sort_order: ''
  })

//   const [updateCollection, setUpdateCollection] = useState({
//     collection_name: '',
//     collection_type: '',
//     layout_type: '',
//     is_pinned: false,
//     is_visible: false,
//     sort_order: ''
//   })

  useEffect(() => {
    if (token) {
        dispatch(getAllServices({ token, id: getId || '7'}))
        dispatch(getAllCollection({ token, id: getId || '7'}))
    }
  }, [token, dispatch])

  useEffect(() => {
    const itemValue = JSON.parse(localStorage.getItem('allcollections')) || [];
    setTotalCollection(itemValue.length);
  }, [])

  // Update servicesList when allStore changes
  useEffect(() => {
    if (Array.isArray(allStore?.data?.services)) {
      setServicesList([...allStore.data.services]);
    }

    if (Array.isArray(collections?.data?.collections)) {
        setCollectionList([...collections.data.collections])
        setItem(false)
    }
  }, [allStore, collections]);

  // Parse services from localStorage and update serlist count
  useEffect(() => {
    const services = JSON.parse(localStorage.getItem('services'));
    if (Array.isArray(services)) {
      setSerList(services.length);
    }
  }, []);

  const serviceForCollection = JSON.parse(localStorage.getItem('services')) || []



  // Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedService(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedService === null || draggedService === dropIndex) {
      setDraggedService(null);
      return;
    }

    // Reorder services
    const newList = [...servicesList];
    const draggedItem = newList[draggedService];
    newList.splice(draggedService, 1);
    newList.splice(dropIndex, 0, draggedItem);
    setServicesList(newList);
    setDraggedService(null);
  };

  const handleDragEnd = () => {
    setDraggedService(null);
    setDragOverIndex(null);
  };

  // Collection drag handlers
  const handleCollectionDragStart = (e, index) => {
    setDraggedCollection(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCollectionDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCollectionIndex(index);
  };

  const handleCollectionDragLeave = () => {
    setDragOverCollectionIndex(null);
  };

  const handleCollectionDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverCollectionIndex(null);

    if (draggedCollection === null || draggedCollection === dropIndex) {
      setDraggedCollection(null);
      return;
    }

    // Reorder collections
    const newList = [...collectionList];
    const draggedItem = newList[draggedCollection];
    newList.splice(draggedCollection, 1);
    newList.splice(dropIndex, 0, draggedItem);
    setCollectionList(newList);
    setDraggedCollection(null);
  };

  const handleCollectionDragEnd = () => {
    setDraggedCollection(null);
    setDragOverCollectionIndex(null);
  };

  // Save order to backend
  const saveServiceOrder = async () => {
    try {
      const updatePromises = servicesList.map((service, index) =>
        axios.put(
          `${API_URL}/stores/online/${getId || '7'}/services/${service.id}`,
          { sort_order: index },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      await Promise.all(updatePromises);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Service order updated successfully',
      });

      dispatch(getAllServices({ token, id: getId || '7' }));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update service order',
      });
    }
  };


  const handleChange = (e) => {
    const { name, value, type, checked, dataset } = e.target;

    if (dataset.form === "loadStore") {
        setSdata(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    if (dataset.form === "loadCollection") {
        setCollectionData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    if (dataset.form === "editCollection") {
        setEditCollectionData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    if (dataset.form === "addservice") {
        setSerCollection(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }

    if (dataset.form === "upservice") {
        setChitem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }
    
  };

  const handleFileChange = (e) => {
    setSdata((prev) => ({
        ...prev,
        service_image: [...e.target.files],
    }));
  };


  useEffect(() => {
    if (cmode || smode || editItem || umode) {
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
}, [cmode, smode, editItem, umode]);


//   const createService = () => {
    // setSer(false);
    // setCall(true);
    // setPer(false);
    // setRec(true);
//   }

useEffect(() => {
    const raw = localStorage.getItem('services');
    if (!raw) {
        setRec(false);
        return;
    }

    let itemValue;
    try {
        itemValue = JSON.parse(raw);
    } catch (e) {
        setRec(false);
        return;
    }

    const hasServices = Array.isArray(itemValue)
        ? itemValue.length > 0
        : itemValue && Object.keys(itemValue).length > 0;

    if (!hasServices) {
        setRec(false);
    } else {
        setRec(true);
        setCall(true);
        setPer(false);
        setSer(false);
    }
}, [])

//   const createCollection = () => {
//     setItem(false);
//     hideModal();
//     setCol(true);
//     setVog(false);
//   }

  const hideModal = () => {
    setSmode(false)
    setCmode(false)
    setEditItem(false)
    setUmode(false)
    setSdata({
      service_title: '',
      description: '',
      price: '',
      service_image_url: '',
      duration_minutes: '',
      location_type: '',
      availability: {},
      sort_order: '',
      is_visible: false,
      service_image: ''
    })
    setEditCollectionData({
      collection_name: '',
      collection_type: '',
      layout_type: '',
      is_pinned: false,
      is_visible: false
    })
    setEditCollectionId(null);
    setAvailabilitySlots({})
    setCurrentSelectedDay('Mon')
    setCurrentSelectedTime('')
    setAstc(false);
    setBulkService(false);
    setUpSer(false)
  }

    const [availabilitySlots, setAvailabilitySlots] = useState({});
    const [currentSelectedDay, setCurrentSelectedDay] = useState('Mon');
    const [currentSelectedTime, setCurrentSelectedTime] = useState('');

    const dayMapping = {
        'Mon': 'monday',
        'Tue': 'tuesday',
        'Wed': 'wednesday',
        'Thu': 'thursday',
        'Fri': 'friday',
        'Sat': 'saturday',
        'Sun': 'sunday'
    };

    // Add time slot for selected day
    const addTimeSlotForDay = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!currentSelectedTime) {
            alert('Please select a time');
            return;
        }

        setAvailabilitySlots(prev => {
            const dayKey = dayMapping[currentSelectedDay];
            const currentSlots = prev[dayKey]?.time_slots || [];
            
            // Check if time already exists for this day
            if (currentSlots.includes(currentSelectedTime)) {
                alert('This time slot already exists for ' + currentSelectedDay);
                return prev;
            }

            return {
                ...prev,
                [dayKey]: {
                    available: true,
                    time_slots: [...currentSlots, currentSelectedTime].sort()
                }
            };
        });
        
        setCurrentSelectedTime('');
    };

    // Remove time slot from a day
    const removeTimeSlotFromDay = (day, time) => {
        setAvailabilitySlots(prev => {
            const dayKey = dayMapping[day];
            const currentSlots = prev[dayKey]?.time_slots || [];
            const updatedSlots = currentSlots.filter(slot => slot !== time);
            
            if (updatedSlots.length === 0) {
                // Remove day if no time slots left
                const newState = { ...prev };
                delete newState[dayKey];
                return newState;
            }

            return {
                ...prev,
                [dayKey]: {
                    available: true,
                    time_slots: updatedSlots
                }
            };
        });
    };

    // Build final availability object with unavailable days
    const buildAvailability = () => {
        const result = {
            monday: { available: false },
            tuesday: { available: false },
            wednesday: { available: false },
            thursday: { available: false },
            friday: { available: false },
            saturday: { available: false },
            sunday: { available: false }
        };

        // Merge with user-selected availability
        Object.keys(availabilitySlots).forEach(day => {
            result[day] = availabilitySlots[day];
        });

        return result;
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
        }
        const hours = minutes / 60;
        const hoursValue = hours % 1 === 0 ? hours : hours.toFixed(1);
        return `${hoursValue} ${hoursValue == 1 ? 'hr' : 'hrs'}`;
    };


    // Save/Submit handler
    const handleSave = (e) => {
        e.preventDefault();
        const finalAvailability = buildAvailability();
        console.log('Final Availability:', JSON.stringify(finalAvailability, null, 2));
        return finalAvailability;
    };

    const openUpdateModal = async (serviceId) => {
        setSelectedServiceId(serviceId);
        
        try {
            // Find the service in the allStore data
            const service = allStore?.data?.services?.find(s => s.id === serviceId);
            
            if (service) {
                setSdata({
                    service_title: service.service_title || '',
                    description: service.description || '',
                    price: service.price || '',
                    service_image_url: service.service_image_url || '',
                    duration_minutes: service.duration_minutes || '',
                    location_type: service.location_type || '',
                    availability: service.availability || {},
                    sort_order: service.sort_order || '',
                    is_visible: service.is_visible || false,
                    service_image: ''
                });

                // Parse availability into availabilitySlots
                if (service.availability && typeof service.availability === 'object') {
                    const slots = {};
                    Object.entries(service.availability).forEach(([day, data]) => {
                        if (data.available && data.time_slots && data.time_slots.length > 0) {
                            slots[day] = data;
                        }
                    });
                    setAvailabilitySlots(slots);
                }

                setUmode(true);
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Service not found",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to load service details",
            });
        }
    };

    const addService = async (e) => {
        e.preventDefault();

        if (!sdata.service_title || !sdata.description || !sdata.price || !sdata.duration_minutes || !sdata.location_type) {
            Swal.fire({
                icon: "info",
                title: "creating service",
                text: 'All these fields are required!',
                confirmButtonColor: '#0273F9'
            })
            return;
        }

        const formData = new FormData();
        formData.append('service_title', sdata.service_title);
        formData.append('description', sdata.description);
        formData.append('price', sdata.price);
        formData.append('service_image_url', sdata.service_image_url);
        formData.append('duration_minutes', sdata.duration_minutes);
        formData.append('location_type', sdata.location_type);
        formData.append('availability', JSON.stringify(availabilitySlots));
        formData.append('sort_order', sdata.sort_order);
        formData.append('is_visible', sdata.is_visible)

        if (sdata.service_image && sdata.service_image.length > 0) {
            sdata.service_image.forEach((image) => {
                formData.append('service_image', image)
            })
        }

        Swal.fire({
            icon: "success",
            title: "Valid Input!",
            text: "Service is being created...",
            timer: 1500,
            showConfirmButton: false,
        });

        try {
            Swal.fire({
                title: "Creating Service...",
                text: "Please wait while we process your request.",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const response = await dispatch(createService({ formData, token, id: getId || '7'})).unwrap();

            if (response.success === true) {
                Swal.fire({
                    icon: "success",
                    title: "Service Created!",
                    text: `${response.message}`,
                });

                setSdata({
                    service_title: '',
                    description: '',
                    price: '',
                    service_image_url: '',
                    duration_minutes: '',
                    location_type: '',
                    availability: {},
                    sort_order: '',
                    is_visible: false,
                    service_image: ''
                });

                setSer(false);
                setCall(true);
                setPer(false);
                setRec(true);

                hideModal();
                dispatch(getAllServices({ token, id: getId || '7'}))
            }
            else {
                Swal.fire({
                    icon: "info",
                    title: "Service Creation",
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

    const updateServiceItem = async (e) => {
        e.preventDefault();

        if (!sdata.service_title || !sdata.description || !sdata.price || !sdata.duration_minutes || !sdata.location_type) {
            Swal.fire({
                icon: "info",
                title: "updating service",
                text: 'All these fields are required!',
                confirmButtonColor: '#0273F9'
            })
            return;
        }

        const formData = new FormData();
        formData.append('service_title', sdata.service_title);
        formData.append('description', sdata.description);
        formData.append('price', sdata.price);
        formData.append('service_image_url', sdata.service_image_url);
        formData.append('duration_minutes', sdata.duration_minutes);
        formData.append('location_type', sdata.location_type);
        formData.append('availability', JSON.stringify(availabilitySlots));
        formData.append('sort_order', sdata.sort_order);
        formData.append('is_visible', sdata.is_visible)

        if (sdata.service_image && sdata.service_image.length > 0) {
            sdata.service_image.forEach((image) => {
                formData.append('service_image', image)
            })
        }

        Swal.fire({
            icon: "success",
            title: "Valid Input!",
            text: "Service is being updated...",
            timer: 1500,
            showConfirmButton: false,
        });

        try {
            Swal.fire({
                title: "Updating Service...",
                text: "Please wait while we process your request.",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            // You'll need to add updateService to your onlineStoreSlice
            // For now, assuming it's available
            const response = await dispatch(updateService({ formData, token, serviceId: selectedServiceId })).unwrap();

            if (response.success === true) {
                Swal.fire({
                    icon: "success",
                    title: "Service Updated!",
                    text: `${response.message}`,
                });

                setSdata({
                    service_title: '',
                    description: '',
                    price: '',
                    service_image_url: '',
                    duration_minutes: '',
                    location_type: '',
                    availability: {},
                    sort_order: '',
                    is_visible: false,
                    service_image: ''
                });

                setAvailabilitySlots({});
                hideModal();
                dispatch(getAllServices({ token, id: getId || '7'}))
            }
            else {
                Swal.fire({
                    icon: "info",
                    title: "Service Update",
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

    // Delete service handler with confirmation
    const deleteServiceHandler = async (serviceId, serviceTitle) => {
        Swal.fire({
            title: 'Delete Service?',
            text: `Are you sure you want to delete "${serviceTitle}"? This action cannot be undone.`,
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
                        title: "Deleting Service...",
                        text: "Please wait while we process your request.",
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    const response = await dispatch(deleteService({ token, serviceId })).unwrap();

                    if (response.success === true) {
                        Swal.fire({
                            icon: "success",
                            title: "Service Deleted!",
                            text: `${response.message}`,
                        });

                        // Remove the service from local servicesList
                        setServicesList(prev => prev.filter(s => s.id !== serviceId));
                        
                        // Refresh services from backend
                        dispatch(getAllServices({ token, id: getId || '7'}))
                    } else {
                        Swal.fire({
                            icon: "info",
                            title: "Service Deletion",
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
        });
    };

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
                dispatch(getAllCollection({ token, id: getId || '7'}))
                setItem(false)
                hideModal();
                setCol(true);
                setVog(false);
                setCollectionData({
                    collection_name: '',
                    collection_type: '',
                    layout_type: '',
                    is_pinned: false,
                    is_visible: false
                })
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

    const showCollect = (id) => {
        console.log(id)
        localStorage.setItem("colId", id)
        setAstc(true)
    }

    const serviceAddedToCollection = async (e) => {
        e.preventDefault();
        let getColId = localStorage.getItem("colId")

        const { service_id, is_pinned, sort_order } = serCollection;

        if (!service_id) {
            Swal.fire({
                icon: "info",
                title: "Missing Fields",
                text: "Please fill in all fields",
                confirmButtonColor: '#0273F9'
            });
            return;
        }

        const dataSend = {
            service_id,
            is_pinned,
            sort_order
        };


        dispatch(addServiceToCollection({token, id: getColId, ...dataSend}))
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
                dispatch(getAllCollection({ token, id: getId || '7'}))
                
                // Refresh services for the current collection
                let getColId = localStorage.getItem("colId")
                if (getColId) {
                    try {
                        const response = await dispatch(getServiceCollection({ token, id: getColId })).unwrap();
                        setCollectionServices(prev => ({
                            ...prev,
                            [getColId]: response.data?.services || []
                        }));
                    } catch (error) {
                        console.error('Error refreshing collection services:', error);
                    }
                }
                
                hideModal();
                setSerCollection({
                    service_id: '',
                    is_pinned: '',
                    sort_order: ''
                })
            })
        }

        if (error) {
            Swal.fire({
                icon: "error",
                title: "failed to add service collection",
                text: error.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
            });
        }
    }, [success, error, dispatch])

    const handleCollectionCheckbox = async (e, id) => {
        const isChecked = e.target.checked;
        console.log('Collection ID:', id);
        setVisibleCollections(prev => ({
            ...prev,
            [id]: isChecked
        }));
        
        // Fetch services for this collection when toggling on
        if (isChecked && !collectionServices[id]) {
            try {
                const response = await dispatch(getServiceCollection({ token, id })).unwrap();
                setCollectionServices(prev => ({
                    ...prev,
                    [id]: response.data?.services || []
                }));
            } catch (error) {
                console.error('Error fetching collection services:', error);
            }
        }
    }

    const handleCheckService = (e, id) => {
        const isChecked = e.target.checked;
        setDitem(prev => ({
            ...prev,
            [id]: isChecked
        }))
    }

    const setBulk = (id) => {
        setBulkService(true);
        localStorage.setItem("colId", id)
    }

    const bulkItemService = async (e) => {
        e.preventDefault();
        let getColId = localStorage.getItem("colId")
        
        // Extract selected service IDs from ditem object
        const selectedServiceIds = Object.keys(ditem).filter(key => ditem[key] === true);
        
        if (selectedServiceIds.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No Services Selected",
                text: "Please select at least one service",
                confirmButtonColor: '#0273F9'
            });
            return;
        }

        Swal.fire({
            title: "Adding Services...",
            text: "Please wait while we process your request.",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        dispatch(addBulkServicesToCollection({token, id: getColId, service_ids: selectedServiceIds }))
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
                dispatch(getAllCollection({ token, id: getId || '7'}))
                hideModal();
            })
        }

        if (error) {
            Swal.fire({
                icon: "error",
                title: "failed to add bulk services",
                text: error.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
            });
        }
    }, [success, error, dispatch])

    const openEditCollection = (collection) => {
        // Prefill form with collection data from localStorage
        setEditCollectionData({
            collection_name: collection.collection_name || '',
            collection_type: collection.collection_type || '',
            layout_type: collection.layout_type || '',
            is_pinned: collection.is_pinned === 1 || collection.is_pinned === true ? true : false,
            is_visible: collection.is_visible === 1 || collection.is_visible === true ? true : false
        });
        setEditCollectionId(collection.id);
        setEditItem(true);
    }

    const showSerMode = (id, colid) => {
        setUpSer(true)
        setSid(id)
        setWid(colid)
    }

    const colService = (e) => {
        e.preventDefault();

        const {is_pinned, sort_order} = chitem;

        if (!is_pinned || !sort_order) {
            Swal.fire({
                icon: "info",
                title: "Missing Fields",
                text: "Please fill in all fields",
                confirmButtonColor: '#0273F9'
            });
            return;
        }

        const dataToSend = {
            sort_order,
            is_pinned: is_pinned ? 1 : 0,
        }
        
        // Track pinned service if is_pinned is true
        if (is_pinned) {
            setPinnedServices(prev => ({
                ...prev,
                [sid]: true
            }));
        }

        dispatch(updateServiceInCollection({token, coid: wid, serviceid: sid, ...dataToSend}))
    }

    useEffect(() => {
        if (success) {
            Swal.fire({
                icon: "success",
                title: "updated successfull",
                text: success.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
                dispatch(getAllCollection({ token, id: getId || '7'}));
                hideModal();
                setChitem({
                    is_pinned: false,
                    sort_order: ''
                })
            })
        }
        if (error) {
            Swal.fire({
                icon: "error",
                title: "failed to update service in collection",
                text: error.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
            });
        }
    }, [success, error, dispatch])
    

    const delColService = async (colid, serid, serviceTitle) => {
        Swal.fire({
            title: 'Delete Service?',
            text: `<p>Are you sure you want to delete <span className="danger">"${serviceTitle}"</span>? This action cannot be undone.</p>`,
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
                        title: "Deleting Service...",
                        html: "Please wait while we process your request.",
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    const response = await dispatch(deleteServiceInCollection({ token, colid: colid, serviceid: serid})).unwrap();

                    if (response.success === true) {
                        Swal.fire({
                            icon: "success",
                            title: "Service Deleted!",
                            text: `${response.message}`,
                        });

                        dispatch(getAllCollection({ token, id: getId || '7'}));
                    }
                    else {
                        Swal.fire({
                            icon: "info",
                            title: "Service Deletion",
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

    const editCollection = async (e) => {
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

        dispatch(updateCollection({token, id: editCollectionId, ...dataToSend}))
    }

    useEffect(() => {
        if (success) {
            Swal.fire({
                icon: "success",
                title: "updated successfull",
                text: success.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
                dispatch(getAllCollection({ token, id: getId || '7'}))
                setItem(false)
                hideModal();
                setCollectionData({
                    collection_name: '',
                    collection_type: '',
                    layout_type: '',
                    is_pinned: false,
                    is_visible: false
                })
            })
        }

        if (error) {
            Swal.fire({
                icon: "error",
                title: "failed to update collection",
                text: error.message,
                confirmButtonColor: "#0273F9",
            }).then(() => {
                dispatch(resetStatus());
            });
        }
    }, [success, error, dispatch])


    const removeCollection = async (colid, collectionName) => {
        Swal.fire({
            title: 'Delete Collection?',
            html: `Are you sure you want to delete <span style="color: #DC2626; font-weight: bold;">"${collectionName}"</span>? This action cannot be undone.`,
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
                        title: "Deleting Service...",
                        text: "Please wait while we process your request.",
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        },
                    });

                    const response = await dispatch(deleteCollection({token, id: colid})).unwrap();

                    if (response.success === true) {
                        Swal.fire({
                            icon: "success",
                            title: "Collection Deleted!",
                            text: `${response.message}`,
                        });

                        dispatch(getAllCollection({ token, id: getId || '7'}));
                    }
                    else {
                        Swal.fire({
                            icon: "info",
                            title: "Collection Deletion",
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

  return (
    <>
       <div className="min-vh-100 mt-5" style={{ backgroundColor: '#f8f9fa' }}>
            {/* Tab Navigation */}
            <div className="bg-white border-bottom p-0" >
                <div className="container-fluid">
                <div className="row">
                    <div className="col-12 p-0">
                    <div className="d-flex">
                        {tabs2.map((tab) => (
                        <button
                            key={tab}
                            className={`flex-fill border-0 py-3 text-center position-relative ${
                            activeTab2 === tab ? 'mx' : 'text-muted'
                            }`}
                            onClick={() => setActiveTab2(tab)}
                            style={{
                            fontSize: '18px',
                            transition: 'all 0.3s ease',
                            backgroundColor: activeTab2 === tab ? '#EAF4FF' : 'transparent',
                            }}
                        >
                            {tab}
                            {activeTab2 === tab && (
                            <div 
                                className="position-absolute bottom-0 start-0 w-100"
                                style={{
                                height: '3px',
                                backgroundColor: '#0273F9',
                                borderRadius: '2px 2px 0 0',
                                }}
                            />
                            )}
                        </button>
                        ))}
                    </div>
                    </div>
                </div>
                </div>
            </div>

            {activeTab2 === 'Service List' && (
                <>
                {/* Content Area */}
                    <div className="container-fluid py-4">
                        <div className="row">
                            <div className="col-12">
                                {/* Header Section */}
                                <div className="mb-4 d-flex justify-content-between">
                                    <div>
                                        <p className="mx mb-2">Add Your Services</p>
                                        <small className="mb-0" style={{ fontSize: '13px', color: '#78716C' }}>
                                          Add your services to your Mycroshop link
                                        </small>
                                    </div>

                                    {call && (
                                        <button className={styles['sk-btn']} onClick={() => {setSmode(true)}}>Add Services</button>
                                    )}
                                </div>

                                {rec && (
                                    <>

                                        {loading ? (
                                            <div className="d-flex justify-content-center py-5">
                                                <div className="spinner-border text-primary" />
                                            </div>
                                        ) : error ? (
                                        <p className="text-danger text-center">Something went wrong</p>
                                        ) : Array.isArray(servicesList) && servicesList.length > 0 ? (
                                              servicesList.map((store, index) => (
                                                <div 
                                                  className={styles['service-card']} 
                                                  key={store.id}
                                                  draggable
                                                  onDragStart={(e) => handleDragStart(e, index)}
                                                  onDragOver={(e) => handleDragOver(e, index)}
                                                  onDragLeave={handleDragLeave}
                                                  onDrop={(e) => handleDrop(e, index)}
                                                  onDragEnd={handleDragEnd}
                                                  style={{
                                                    opacity: draggedService === index ? 0.5 : 1,
                                                    backgroundColor: dragOverIndex === index ? '#E8F4FF' : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                    cursor: draggedService === index ? 'grabbing' : 'grab'
                                                  }}
                                                >
                                                <div className={`${styles.header} d-flex justify-content-between position-relative px-4`}>
                                                <div className='d-flex'>
                                                <p className='mx me-2'>{store.service_title} ({formatDuration(store.duration_minutes)})</p> 
                                                <FontAwesomeIcon icon={faPen} style={{color: '#78716C', cursor: 'pointer'}} onClick={() => openUpdateModal(store.id)}/>
                                                </div>
                                                <div>
                                                <FontAwesomeIcon icon={faExternalLinkAlt} className={styles.icon} style={{color: '#78716C', cursor: 'pointer'}} onClick={() => openUpdateModal(store.id)}/>
                                                <FontAwesomeIcon icon={faTrashCan} className={`${styles['icon']} ${styles['red']} me-3`} style={{color: '#DC2626', cursor: 'pointer'}} onClick={() => deleteServiceHandler(store.id, store.service_title)}/>
                                                <label className={styles.switch}>
                                                    <input type="checkbox" />
                                                    <span className={`${styles.slider} round`}></span>
                                                </label>
                                                </div>

                                            <div 
                                              className={`position-absolute ${styles.sid}`}
                                              style={{
                                                cursor: 'grab',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s ease'
                                              }}
                                            >
                                                <FontAwesomeIcon icon={faEllipsisV} className='me-1' style={{color: '#78716C', width: 'auto'}}/>
                                                <FontAwesomeIcon icon={faEllipsisV} style={{color: '#78716C', width: 'auto'}}/>
                                                </div>
                                            </div>

                                            <p className={`${styles.description} px-4`}>{store.description}
                                                <FontAwesomeIcon icon={faPen} style={{color: '#78716C'}} className='ms-2'/>
                                            </p>

                                            <div className={`${styles.footer} mt-3 px-3`}>
                                                <div className={styles['left-icons']}>
                                                <FontAwesomeIcon icon={faCog} className={styles.icon} style={{color: '#78716C'}}/>
                                                <FontAwesomeIcon icon={faClock} className={styles.icon} style={{color: '#78716C'}}/>
                                                <FontAwesomeIcon icon={faImage} className={styles.icon} style={{color: '#78716C'}}/>
                                                </div>
                                                <div className={styles.stats}>
                                                <span style={{color: '#78716C'}}>0 Clicks</span>
                                                <span style={{color: '#78716C'}}>0.0% CTR</span>
                                                </div>
                                            </div>
                                            </div>
                                        ))
                                        ) : (
                                            <p className="text-center text-muted">No services available</p>
                                        )}
                                        
                                        {/* Save Order Button - Show only if services are being dragged */}
                                        {rec && Array.isArray(servicesList) && servicesList.length > 0 && draggedService !== null && (
                                            <div className="mt-3 mb-3">
                                                <button 
                                                    className={`${styles['si-btn']} px-4`}
                                                    onClick={saveServiceOrder}
                                                    style={{ width: '100%' }}
                                                >
                                                    Save Service Order
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {ser ? (
                                    <>
                                    {/* Main Content Card */}
                                        <div className={`${styles['outer-box']} p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}}>
                                            <div className={`${styles['inner-box']} text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
                                                <p style={{color: '#78716C'}}>No service information available</p>
                                                <button className={`btn ${styles['add-btn']} px-4`} onClick={() => {setSmode(true)}}>Add Services</button>
                                            </div>
                                        </div>
                                    </>
                                ) : ('')}
                                

                                <div className="d-flex justify-content-between mt-4">
                                    <button className="btn mx" style={{color: '#78716C'}}>Previous</button>
                                    <div className="d-flex justify-content-between gap-3">
                                        <button className={`${styles['sk-btn']} mx`}>Skip</button>
                                        {call && (
                                        <button className={`${styles['si-btn']} px-3 mx`}>Save and Continue</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab2 === 'Collection' && (
                <>
                {item ? (
                    <>
                        <div className='mt-4'>
                            <p className="mx mb-2 p-0">Add Your Collections</p>
                            <p className="mb-0 mb-3" style={{ fontSize: '13px', color: '#78716C' }}>
                            Group your services into different collections
                            </p>

                            <p>
                            {totalcollection} {totalcollection === 1 ? "Collection" : "Collections"} created
                            </p>
                        </div>
                        <div className={`${styles['outer-box']} p-2`} style={{background: '#fff', borderRadius: '12px', border: '2px dotted #EEEEEE'}}>
                            <div className={`${styles['inner-box']} text-center p-5`} style={{background: '#FAFAFA', borderRadius: '12px'}}>
                                <p style={{color: '#78716C'}}>No collections created yet</p>
                                <button className={`btn ${styles['add-btn']} px-4`} onClick={() => setCmode(true)}><span style={{fontSize: '18px'}}>+</span> Create Your First Collection</button>
                            </div>
                        </div>
                    </>
                    ) : (
                        <>
                        <div className="d-flex justify-content-between mt-4">
                            <div>
                                <p className="mx mb-2 p-0">Add Your Collections</p>
                                <p className="mb-0 mb-3" style={{ fontSize: '13px', color: '#78716C' }}>
                                Group your services into different collections
                                </p>
                            </div>
                            <div>
                             <button className={styles['sk-btn']} onClick={() => {setCmode(true)}}>Add Collection</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="d-flex justify-content-center py-5">
                                <div className="spinner-border text-primary" />
                            </div>
                            ) : error ? (
                                <p className="text-danger text-center">Something went wrong</p>
                            ) : Array.isArray(collectionList) && collectionList.length > 0 ? (
                                collectionList.map((collect, index) => (
                                    <div 
                                        key={collect.id} 
                                        draggable
                                        onDragStart={(e) => handleCollectionDragStart(e, index)}
                                        onDragOver={(e) => handleCollectionDragOver(e, index)}
                                        onDragLeave={handleCollectionDragLeave}
                                        onDrop={(e) => handleCollectionDrop(e, index)}
                                        onDragEnd={handleCollectionDragEnd}
                                        style={{
                                            background: '#F4F4F4',
                                            border: '1px solid #EEEEEE',
                                            borderRadius: '10px',
                                            position: 'relative',
                                            marginTop: '8px',
                                            paddingTop: '12px',
                                            paddingBottom: '12px',
                                            paddingLeft: '12px',
                                            paddingRight: '12px',
                                            opacity: draggedCollection === index ? 0.5 : 1,
                                            backgroundColor: dragOverCollectionIndex === index ? '#E8F4FF' : '#F4F4F4',
                                            transition: 'all 0.2s ease',
                                            cursor: draggedCollection === index ? 'grabbing' : 'grab'
                                        }}>
                                        <div className={`d-flex justify-content-between ${styles.vala}`}>
                                            <div>
                                               <h6>
                                                   {collect.collection_name} 
                                                   <FontAwesomeIcon icon={faPen} style={{color: '#78716C', cursor: 'pointer'}} className='ms-2' onClick={() => openEditCollection(collect)}/>
                                                   <FontAwesomeIcon icon={faPlus} style={{color: '#0273F9', cursor: 'pointer'}} className='ms-2' title="Bulk add services" onClick={() => setBulk(collect.id)}/>
                                               </h6>
                                               <p style={{color: '#1C1917'}} className='nx mt-4 mb-0'>{collect.totalItems}  {collect.totalItems === 1 ? 'Service' : 'Services'} added</p>
                                               <small style={{color: '#1C1917'}} className='nx d-block'>{collect.is_pinned === true ? 1 : 0} Services pinned</small>
                                            </div>
                                            <div>
                                                <div className='d-flex gap-3'>
                                                <p style={{color: '#78716C'}}><FontAwesomeIcon icon={faTableColumns} style={{color: '#78716C'}}/> Layout</p>
                                                <FontAwesomeIcon icon={faThumbtack} style={{color: Object.values(pinnedServices).some(v => v) ? '#0273F9' : '#78716C'}} className='mt-1' title="Collection has pinned services"/>
                                                <FontAwesomeIcon icon={faTrashCan} className={`${styles.icon} ${styles.red} mt-1`} style={{color: '#DC2626'}} onClick={() => removeCollection(collect.id, collect.collection_name)}/>
                                                <label className={`${styles.switch} mt-1`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={visibleCollections[collect.id] || false}
                                                        onChange={(e) => handleCollectionCheckbox(e, collect.id)}
                                                    />
                                                    <span className={`${styles.slider} round`}></span>
                                                </label>
                                            </div>
                                            <div className="text-end mt-2">
                                              <button className={`${styles['si-btn']} px-4 mx rounded-2`} style={{fontSize: '12px'}} onClick={() => showCollect(collect.id)}>Add Services</button>
                                            </div>
                                            </div>
                                            
                                        </div>
                                        <div className={`position-absolute ${styles.sido}`}>
                                            <FontAwesomeIcon icon={faEllipsisV} className='me-1' style={{color: '#78716C', width: 'auto'}}/>
                                            <FontAwesomeIcon icon={faEllipsisV} style={{color: '#78716C', width: 'auto'}}/>
                                        </div>

                                        {visibleCollections[collect.id] && (
                                            <>
                                            {Array.isArray(collectionServices[collect.id]) && collectionServices[collect.id].length > 0 ? (
                                                [...collectionServices[collect.id]].sort((a, b) => {
                                                    // Sort pinned services to top
                                                    const aPinned = pinnedServices[a.id] ? 1 : 0;
                                                    const bPinned = pinnedServices[b.id] ? 1 : 0;
                                                    return bPinned - aPinned;
                                                }).map((item) =>
                                                    <div className={styles['service-card']} key={item.id}>
                                                        <div className={`${styles.header} d-flex justify-content-between position-relative px-4`}>
                                                            <div className='d-flex gap-3'>
                                                                <p className='mx'>{item.service_title}</p> 
                                                                <FontAwesomeIcon icon={faPen} style={{color: '#78716C'}} onClick={() => showSerMode(item.id, collect.id)}/>
                                                            </div>
                                                            <div>
                                                                {pinnedServices[item.id] && (
                                                                  <FontAwesomeIcon icon={faThumbtack} style={{color: '#0273F9', cursor: 'pointer'}} className='mt-1' title="Service is pinned"/>
                                                                )}
                                                                <FontAwesomeIcon icon={faExternalLinkAlt} className={styles.icon} style={{color: '#78716C'}}/>
                                                                <FontAwesomeIcon icon={faTrashCan} className={`${styles.icon} ${styles.red} me-3`} style={{color: '#DC2626'}} onClick={() => delColService(collect.id, item.id, item.service_title)}/>
                                                                <label className={styles.switch}>
                                                                    <input 
                                                                        type="checkbox" 
                                                                    />
                                                                    <span className={`${styles.slider} round`}></span>
                                                                </label>
                                                            </div>

                                                            <div className={`position-absolute ${styles.sid}`}>
                                                                <FontAwesomeIcon icon={faEllipsisV} className='me-1' style={{color: '#78716C'}}/>
                                                                <FontAwesomeIcon icon={faEllipsisV} style={{color: '#78716C'}}/>
                                                            </div>
                                                        </div>

                                                        <p className={`d${styles.description} px-4`}>{item.description} ({formatDuration(item.duration_minutes)})
                                                            <FontAwesomeIcon icon={faPen} style={{color: '#78716C'}} className='ms-2'/>
                                                        </p>

                                                        <div className={`${styles.footer} mt-3 px-3`}>
                                                            <div className={styles['left-icons']}>
                                                            <FontAwesomeIcon icon={faCog} className={styles.icon} style={{color: '#78716C'}}/>
                                                            <FontAwesomeIcon icon={faClock} className={styles.icon} style={{color: '#78716C'}}/>
                                                            <FontAwesomeIcon icon={faImage} className={styles.icon} style={{color: '#78716C'}}/>
                                                            </div>
                                                            <div className={styles.stats}>
                                                            <span style={{color: '#78716C'}}>0 Clicks</span>
                                                            <span style={{color: '#78716C'}}>0.0% CTR</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                <p className="text-center text-muted" style={{padding: '20px'}}>No services found in this collection</p>
                                            )}
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                            <p className="text-center text-muted">No collections available</p>
                        )}
                        </>
                    )}



                    <div className="d-flex justify-content-between mt-4">
                        <button className="btn mx" style={{color: '#78716C'}}>Previous</button>
                        <div className="d-flex gap-3">
                            <button className={styles['sk-btn']}>Skip</button>
                            {col && (
                                <>
                                <button className={`${styles['si-btn']} px-3 mx`}>Save and Continue</button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
            

            {/* Add some bottom padding to account for fixed footer */}
            <div style={{ paddingBottom: '80px' }}></div>
       </div>

       {smode ? (
        <>
            <div className={styles['modal-overlay']} onClick={hideModal}>
                <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex justify-content-between p-3">
                        <h6>Add New Service</h6>
                        <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                    </div>
                    <div className={`${styles['modal-body']} p-3`} style={{background: '#F9F9F9'}}>
                        <form onSubmit={addService}>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className="form-label">Service Title</label>
                                <input data-form="loadStore" type="text" className={styles['input-item']} placeholder="Service title" name='service_title' value={sdata.service_title} onChange={handleChange}/>
                            </div>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className='mb-2'>Description</label>
                                <textarea data-form="loadStore" className={styles['input-item']} placeholder="Provide Service description" id="floatingTextarea2" style={{height: '100px'}} name='description' value={sdata.description} onChange={handleChange}></textarea>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Price</label>
                                    <input type="text" data-form="loadStore" className={styles['input-item']} placeholder="Price" name='price' value={sdata.price} onChange={handleChange}/>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Service Image</label>
                                    <input type="file" data-form="loadStore" className={styles['input-item']} placeholder="Service Image" onChange={handleFileChange}/>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Duration</label>
                                    <select data-form="loadStore" className={styles['input-item']} name='duration_minutes' value={sdata.duration_minutes} onChange={handleChange}>
                                        <option value={30}>30 mins</option>
                                        <option value={45}>45 mins</option>
                                        <option value={60}>60 mins</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Location</label>
                                    <select data-form="loadStore" className={styles['input-item']} name='location_type' value={sdata.location_type} onChange={handleChange}>
                                        <option>In person</option>
                                        <option>online</option>
                                    </select>
                                </div>

                                <div className="col-md-12 mb-3">
                                    <label htmlFor="formGroupExampleInput" className="form-label">Availability</label>
                                    
                                    <div className="bg-white rounded border p-3">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="fw-normal text-dark">Add Available Time Slots</span>
                                        </div>

                                        {/* Day & Time Selector */}
                                        <div className="mb-4 p-3 bg-light rounded">
                                            <div className="row align-items-end gap-2">
                                                {/* Day Dropdown */}
                                                <div className="col-auto">
                                                    <label className="form-label mb-2">Day</label>
                                                    <select 
                                                        className="form-select form-select-sm"
                                                        data-form="loadStore"
                                                        value={currentSelectedDay}
                                                        onChange={(e) => setCurrentSelectedDay(e.target.value)}
                                                        style={{ minWidth: '100px', fontSize: '14px' }}
                                                    >
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                            <option key={day} value={day}>{day}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Time Input */}
                                                <div className="col-auto">
                                                    <label className="form-label mb-2">Time</label>
                                                    <input
                                                        type="time"
                                                        className="form-control form-control-sm border text-center"
                                                        data-form="loadStore"
                                                        value={currentSelectedTime}
                                                        onChange={(e) => setCurrentSelectedTime(e.target.value)}
                                                        style={{ fontSize: '14px', minWidth: '120px' }}
                                                    />
                                                </div>

                                                {/* Add Button */}
                                                <div className="col-auto">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={addTimeSlotForDay}
                                                        style={{ fontSize: '14px', padding: '6px 16px' }}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Added Time Slots by Day */}
                                        <div className="mb-3">
                                            {Object.keys(availabilitySlots).length === 0 ? (
                                                <p className="text-muted text-center mb-0">No time slots added yet</p>
                                            ) : (
                                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                    {Object.entries(availabilitySlots).map(([dayKey, dayData]) => {
                                                        const dayDisplay = Object.keys(dayMapping).find(key => dayMapping[key] === dayKey);
                                                        return (
                                                            <div key={dayKey} className="mb-3 p-2 border rounded">
                                                                <div className="fw-semibold text-dark mb-2">{dayDisplay || dayKey}</div>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {dayData.time_slots.map((time) => (
                                                                        <div key={time} className="badge bg-primary d-flex align-items-center gap-2" style={{ fontSize: '13px', padding: '6px 10px' }}>
                                                                            {time}
                                                                            <button
                                                                                type="button"
                                                                                className="btn-close btn-close-white"
                                                                                style={{ fontSize: '10px' }}
                                                                                onClick={() => removeTimeSlotFromDay(dayDisplay || dayKey, time)}
                                                                                title="Remove this time slot"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button */}
                                        <div className="mt-4 text-end">
                                            <button 
                                                type="button"
                                                className="btn btn-primary btn-sm p-2"
                                                onClick={handleSave}
                                            >
                                                Save Availability
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="col-sm-12 col-md-12 col-lg-1"></div> */}

                                <div className="col-sm-12 col-md-12 col-lg-6">
                                    <label for="formGroupExampleInput" className="form-label">Service Image Url (optional)</label>
                                    <input type="text" className={styles['input-item']} placeholder="Book Now" name='service_image_url' value={sdata.service_image_url} onChange={handleChange}/>
                                </div>
                                <div className="col-md-6 text-end">
                                    <label className="form-check-label mx-4" htmlFor="hideSocial" style={{color: '#78716C', fontSize: '13px'}}>
                                        {sdata.is_visible ? 'Visible' : 'Hidden'}
                                    </label>
                                    <div className='form-check form-switch text-end' style={{float: 'right'}}>
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="hideSocial"
                                            name='is_visible'
                                            data-form="loadStore"
                                            checked={sdata.is_visible}
                                            onChange={handleChange}
                                            style={{ transform: 'scale(1.5)' }}
                                        />
                                    </div>
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
                                            <span>Creating... </span>
                                            </>
                                            
                                        ): (
                                            'Add Services'
                                        )
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
       ) : ('')}

       {cmode && (
            <>
                <div className={styles['modal-overlay']} onClick={hideModal}>
                <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex justify-content-between p-3">
                        <h6>Add New Collections</h6>
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

        {editItem && (
            <>
                <div className={styles['modal-overlay']} onClick={hideModal}>
                <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex justify-content-between p-3">
                        <h6>Edit Collection</h6>
                        <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                    </div>
                    <div className={`${styles['modal-body']} p-3`} style={{background: '#FFF'}}>
                        <form onSubmit={editCollection}>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className="form-label">Collection Name</label>
                                <input type="text" className={styles['input-item']} placeholder="E.g., My Collection" name='collection_name' value={editCollectionData.collection_name} onChange={handleChange} data-form="editCollection"/>
                            </div>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className='mb-2'>Collection Type</label>
                                <select className={styles['input-item']} data-form="editCollection" name='collection_type' value={editCollectionData.collection_type} onChange={handleChange}>
                                    <option value="">-select service type-</option>
                                    <option value="service">Service</option>
                                    <option value="product">Product</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className='mb-2'>Layout</label>
                                <select className={styles['input-item']} data-form="editCollection" name='layout_type' value={editCollectionData.layout_type} onChange={handleChange}>
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
                                type="checkbox" 
                                checked={editCollectionData.is_visible}
                                onChange={handleChange}
                                onClick={(e) => e.stopPropagation()}
                              />
                                <span className={styles.checkmark}></span>
                                <span className="label-text nx">Pin this collection</span>
                                </label>
                            </div>

                            <div className={`px-3 py-3 mb-2`}>
                                <label className={`${styles['custom-checkbox-wrapper']}`}>
                                <input 
                                    className={`${styles['custom-checkbox']}`}
                                    data-form="editCollection"
                                    type="checkbox" 
                                    id="editIsPinned"
                                    name='is_pinned'
                                    checked={editCollectionData.is_pinned}
                                    onChange={handleChange}
                                    style={{ transform: 'scale(1.5)' }}
                                />
                                <span className={styles.checkmark}></span>
                                <span className="label-text nx">Make this collection visible</span>
                                </label>
                            </div>

                            <div className="text-end mt-4">
                                <button className={`${styles['sk-btn']} me-2`} type="button" onClick={hideModal}>Cancel</button>
                                <button className={`${styles['si-btn']} btn-lg px-5 py-3`}>
                                    {
                                        loading ?(
                                            <>
                                            <div className="spinner-border spinner-border-sm text-light" role="status">
                                                <span className="sr-only"></span>
                                            </div>
                                            <span>Updating... </span>
                                            </>
                                            
                                        ): (
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

       {/* Update Service Modal */}
       {umode ? (
        <>
            <div className={styles['modal-overlay']} onClick={hideModal}>
                <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex justify-content-between p-3">
                        <h6>Update Service</h6>
                        <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                    </div>
                    <div className={`${styles['modal-body']} p-3`} style={{background: '#F9F9F9'}}>
                        <form onSubmit={updateServiceItem}>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className="form-label">Service Title</label>
                                <input type="text" className={styles['input-item']} placeholder="Service title" name='service_title' value={sdata.service_title} onChange={handleChange}/>
                            </div>

                            <div className="mb-3">
                                <label for="formGroupExampleInput" className='mb-2'>Description</label>
                                <textarea className={styles['input-item']} placeholder="Provide Service description" id="floatingTextarea2" style={{height: '100px'}} name='description' value={sdata.description} onChange={handleChange}></textarea>
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Price</label>
                                    <input type="text" className={styles['input-item']} placeholder="Price" name='price' value={sdata.price} onChange={handleChange}/>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Service Image</label>
                                    <input type="file" className={styles['input-item']} placeholder="Service Image" onChange={handleFileChange}/>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Duration</label>
                                    <select className={styles['input-item']} name='duration_minutes' value={sdata.duration_minutes} onChange={handleChange}>
                                        <option value={30}>30 mins</option>
                                        <option value={45}>45 mins</option>
                                        <option value={60}>60 mins</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label for="formGroupExampleInput" className="form-label">Location</label>
                                    <select className={styles['input-item']} name='location_type' value={sdata.location_type} onChange={handleChange}>
                                        <option>In person</option>
                                        <option>online</option>
                                    </select>
                                </div>

                                <div className="col-md-12 mb-3">
                                    <label htmlFor="formGroupExampleInput" className="form-label">Availability</label>
                                    
                                    <div className="bg-white rounded border p-3">
                                        {/* Header */}
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <span className="fw-normal text-dark">Add Available Time Slots</span>
                                        </div>

                                        {/* Day & Time Selector */}
                                        <div className="mb-4 p-3 bg-light rounded">
                                            <div className="row align-items-end gap-2">
                                                {/* Day Dropdown */}
                                                <div className="col-auto">
                                                    <label className="form-label mb-2">Day</label>
                                                    <select 
                                                        className="form-select form-select-sm"
                                                        value={currentSelectedDay}
                                                        onChange={(e) => setCurrentSelectedDay(e.target.value)}
                                                        style={{ minWidth: '100px', fontSize: '14px' }}
                                                    >
                                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                                            <option key={day} value={day}>{day}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Time Input */}
                                                <div className="col-auto">
                                                    <label className="form-label mb-2">Time</label>
                                                    <input
                                                        type="time"
                                                        className="form-control form-control-sm border text-center"
                                                        value={currentSelectedTime}
                                                        onChange={(e) => setCurrentSelectedTime(e.target.value)}
                                                        style={{ fontSize: '14px', minWidth: '120px' }}
                                                    />
                                                </div>

                                                {/* Add Button */}
                                                <div className="col-auto">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={addTimeSlotForDay}
                                                        style={{ fontSize: '14px', padding: '6px 16px' }}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Added Time Slots by Day */}
                                        <div className="mb-3">
                                            {Object.keys(availabilitySlots).length === 0 ? (
                                                <p className="text-muted text-center mb-0">No time slots added yet</p>
                                            ) : (
                                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                                    {Object.entries(availabilitySlots).map(([dayKey, dayData]) => {
                                                        const dayDisplay = Object.keys(dayMapping).find(key => dayMapping[key] === dayKey);
                                                        return (
                                                            <div key={dayKey} className="mb-3 p-2 border rounded">
                                                                <div className="fw-semibold text-dark mb-2">{dayDisplay || dayKey}</div>
                                                                <div className="d-flex flex-wrap gap-2">
                                                                    {dayData.time_slots.map((time) => (
                                                                        <div key={time} className="badge bg-primary d-flex align-items-center gap-2" style={{ fontSize: '13px', padding: '6px 10px' }}>
                                                                            {time}
                                                                            <button
                                                                                type="button"
                                                                                className="btn-close btn-close-white"
                                                                                style={{ fontSize: '10px' }}
                                                                                onClick={() => removeTimeSlotFromDay(dayDisplay || dayKey, time)}
                                                                                title="Remove this time slot"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Save Button */}
                                        <div className="mt-4 text-end">
                                            <button 
                                                type="button"
                                                className="btn btn-primary btn-sm p-2"
                                                onClick={handleSave}
                                            >
                                                Save Availability
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="col-sm-12 col-md-12 col-lg-1"></div> */}

                                <div className="col-sm-12 col-md-12 col-lg-6">
                                    <label for="formGroupExampleInput" className="form-label">Service Image Url (optional)</label>
                                    <input type="text" className={styles['input-item']} placeholder="Service Image Url" name='service_image_url' value={sdata.service_image_url} onChange={handleChange}/>
                                </div>
                                <div className="col-md-6 text-end">
                                    <label className="form-check-label mx-4" htmlFor="updateVisibility" style={{color: '#78716C', fontSize: '13px'}}>
                                        {sdata.is_visible ? 'Visible' : 'Hidden'}
                                    </label>
                                    <div className='form-check form-switch text-end' style={{float: 'right'}}>
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id="updateVisibility"
                                            name='is_visible'
                                            checked={sdata.is_visible}
                                            onChange={handleChange}
                                            style={{ transform: 'scale(1.5)' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="text-end mt-4">
                                <button className={`${styles['sk-btn']} me-2`} type="button" onClick={hideModal}>Cancel</button>
                                <button className={`${styles['si-btn']} btn-lg px-5 py-3`} type="submit">
                                    {
                                        loading ?(
                                            <>
                                            <div className="spinner-border spinner-border-sm text-light" role="status">
                                                <span className="sr-only"></span>
                                            </div>
                                            <span>Updating... </span>
                                            </>
                                            
                                        ): (
                                            'Update Service'
                                        )
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
       ) : ('')}

       {astc && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
                <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                    <div className="d-flex justify-content-between p-3">
                        <h6>Add New Service To Collection</h6>
                        <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                    </div>
                    <div className={`${styles['modal-body']} p-3`} style={{background: '#F9F9F9'}}>
                        <form onSubmit={serviceAddedToCollection}>
                            <div className="mb-3">
                                <label for="formGroupExampleInput" className='mb-2'>Service Name</label>
                                <select name="service_id" className={styles['input-item']} data-form="addservice" value={serCollection.service_id} onChange={handleChange}>
                                    <option value="">-select service-</option>
                                    {serviceForCollection.map((item) =>
                                      <option key={item.id} value={item.id}>{item.service_title}</option> 
                                    )}
                                </select>
                            </div>

                            <div className={`px-3 py-3 mb-2`}>
                                <label className={`${styles['custom-checkbox-wrapper']}`}>
                                <input 
                                    className={`${styles['custom-checkbox']}`}
                                    data-form="addservice"
                                    type="checkbox" 
                                    id="pinnedToggle"
                                    name='is_pinned'
                                    checked={serCollection.is_pinned}
                                    onChange={handleChange}
                                    style={{ transform: 'scale(1.5)' }}
                                />
                                <span className={styles.checkmark}></span>
                                <span className="label-text nx">Pin this service</span>
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
                                        data-form="addservice" 
                                        name='sort_order' 
                                        value={serCollection.sort_order} 
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
                                            <span>Creating... </span>
                                            </>
                                            
                                        ): (
                                            'Add Service'
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

       {bulkService && (
        <>
            <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                    <h6>Add Bulk Service To Collections</h6>
                    <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#FFF'}}>
                    <form onSubmit={bulkItemService}>
                        <h6>Service List</h6>
                        <p style={{color: '#78716C'}}>Available services ({serlist})</p>

                        {serviceForCollection.map((item) => 
                            <div className={`${styles['service-option-container']} p-3 mb-3`} key={item.id}>
                                <label className={styles['custom-checkbox-wrapper']}>
                                <input
                                    type="checkbox"
                                    className={styles['custom-checkbox']}
                                    checked={ditem[item.id] || false}
                                    onChange={(e) => handleCheckService(e, item.id)}
                                />
                                <span className={styles.checkmark}></span>
                                <span className="label-text mx">{item.service_title}</span>
                                </label>
                            </div>
                        )}

                        <div className="text-end mt-4">
                            <button className={`${styles['sk-btn']} me-2`} type="button" onClick={hideModal}>Cancel</button>
                            <button className={`${styles['si-btn']} btn-lg px-5 py-3`} type="submit">
                                {
                                    loading ?(
                                        <>
                                        <div className="spinner-border spinner-border-sm text-light" role="status">
                                            <span className="sr-only"></span>
                                        </div>
                                        <span>Creating... </span>
                                        </>
                                        
                                    ): (
                                        'Add Services'
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

       {upSer && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                    <h6>Update Service In Collection</h6>
                    <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#FFF'}}>
                    <form onSubmit={colService}>
                        <div className={`pb-3`}>
                            <label className={`${styles['custom-checkbox-wrapper']}`}>
                            <input 
                                className={`${styles['custom-checkbox']}`}
                                data-form="upservice"
                                type="checkbox" 
                                id="hideSocial"
                                name='is_pinned'
                                checked={chitem.is_pinned}
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
                                    data-form="upservice" 
                                    name='sort_order' 
                                    value={chitem.sort_order} 
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
                            <button className={`${styles['sk-btn']} me-2`} type="button" onClick={hideModal}>Cancel</button>
                            <button className={`${styles['si-btn']} btn-lg px-5 py-3`} type="submit">
                                {
                                    loading ?(
                                        <>
                                        <div className="spinner-border spinner-border-sm text-light" role="status">
                                            <span className="sr-only"></span>
                                        </div>
                                        <span>Updating... </span>
                                        </>
                                        
                                    ): (
                                        'Update Service'
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

export default Service

