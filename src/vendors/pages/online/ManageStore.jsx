import React, {useState, useEffect} from 'react'
import { FaStore, FaMapMarkerAlt, FaBox  } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { getMyOnlineStore, getStorePreview } from '../../../slice/onlineStoreSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faAsterisk } from '@fortawesome/free-solid-svg-icons';
import '../sidebar/sidebar.css';
import styles from "../../../styles.module.css";
import SetupStore from './SetupStore';
import ViewStore from './ViewStore';

const ManageStore = ({ setActiveTab }) => {
    const dispatch = useDispatch();
    let token = localStorage.getItem("token");
    let getId = localStorage.getItem("itemId");
    const { myStore } = useSelector((state) => state.store);
    // const [add, setAdd] = useState(false);
    const [shop, setShop] = useState(true);
    const [onstore, setOnstore] = useState(true);
    const [servicesData, setServicesData] = useState(null);
    const [vstore, setVstore] = useState(true);
    const hasStore = Boolean(myStore?.onlineStore);
    const storeCount = hasStore ? 1 : 0;
    const itemCount =
      myStore?.onlineStore?.items_count ??
      myStore?.onlineStore?.total_items ??
      0;

    useEffect(() => {
        if (token) {
          dispatch(getMyOnlineStore({ token, id: getId || '7'}));
        //   dispatch(getStorePreview({ token }));
        }
    }, [token, dispatch])


  const hideModal = () => {
    setAdd(false)
  }
  return (
    <>
      {vstore ? (
        <>
          {onstore ? (
        <>
          <div className="p-4">
            <div className="d-flex justify-content-between">
                <div>
                    <h5 className="mb-1 my text-dark">Manage Your Store</h5>
                    <p className="text-muted">Setup your online store to get started</p>
                </div>
                {shop && hasStore && (
                    <div>
                    <button
                        className={`${styles['onl-btn']} px-3 rounded mx-3`}
                        onClick={() => setVstore(false)}
                    >
                        Preview Store
                    </button>
                    <button
                        className={`${styles['onl-btn']} px-3 rounded`}
                        onClick={() => setOnstore(false)}
                    >
                        Setup Online Store
                    </button>
                    
                    </div>
                )}

            </div>
            

            <p className='text-bold'>Available Store<span className='ms-1'>({storeCount})</span></p>
            <hr style={{border: '3px solid #EEEEEE'}}/>

            {!hasStore ? (
                <div style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}} className='p-3'>
                    <div className="rounded p-5 text-center" style={{border: '3px dotted #EEEEEE', background: '#fafafa'}}>
                    <FaStore size={30} className="text-secondary mb-3" />
                    <p className="mb-1 font-weight-bold" style={{color: '#1C1917'}}>No online store available to manage</p>
                    <small className="text-muted" style={{color: '#78716C'}}>Expand your business with another location</small>
                    <br />
                    <button className={`${styles['onl-btn']} px-3 rounded mt-3`} onClick={() => {setOnstore(false)}}>Setup Online Store</button>
                    </div>
                </div>
                ) : (
                <div className="row">
                    {myStore && (
                    <>
                    <div className="col-md-4">
                        <div className="card shadow-sm border-light pb-4">
                            <div className="card-body px-3 py-2 d-flex justify-content-between align-items-start">
                                <p className="mb-0">{myStore?.onlineStore?.store_name}</p>
                                <span className="badge rounded-pill text-primary bg-light">{myStore?.onlineStore?.is_published === false ? 'In Active' : 'Active'}</span>
                            </div>
                            <hr className="my-2"/>
                            <p className="mb-2 px-3 small">
                                <FaMapMarkerAlt className="me-2"/> <span className='text-success'>Online</span>
                            </p>
                            <p className="mb-3 px-3 text-muted small">
                                <FaBox className="me-2"/>
                                <strong>{itemCount}</strong> Items
                            </p>
                            <div className="px-3">
                                <button className="btn btn-primary w-100" style={{fontSize: '13px'}} onClick={() => setVstore(false)}>View Online Store</button>
                            </div>
                        </div>
                    </div>
                    </>
                    )}
                </div>
            )}

          </div>
        </>
       ) : (
        <SetupStore />
       )}
        </>
      ) : (<ViewStore initialSeeStore={false} />)}
            
        {/* {add && (
            <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                <h6 className="mb-0">Add New Store</h6>
                <button className={styles['modal-close']} onClick={hideModal}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                </div>
                <hr />
                <div className="p-3">
                <small className="d-block text-muted">Enter the details of your store location</small>
                <form className="mt-3">
                    <div className="mb-3">
                    <label className="form-label">
                        Store Name <sup><FontAwesomeIcon icon={faAsterisk} className="text-danger small"/></sup>
                    </label>
                    <input type="text" className={`form-control ${styles['input-item']}`} placeholder="Enter store name"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">Store Type</label>
                    <select className={`form-select ${styles['input-item']}`}>
                        <option>Select store type</option>
                        <option>Retail Store</option>
                        <option>Wharehouse</option>
                        <option>Pop-up store</option>
                        <option>Online Only</option>
                    </select>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">Store Address</label>
                    <input type="text" className={`form-control ${styles['input-item']}`} placeholder="Enter store address"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">City <sup><FontAwesomeIcon icon={faAsterisk} className="text-danger small"/></sup></label>
                    <input type="text" className={`form-control ${styles['input-item']}`} placeholder="Enter city"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">State <sup><FontAwesomeIcon icon={faAsterisk} className="text-danger small"/></sup></label>
                    <input type="text" className={`form-control ${styles['input-item']}`} placeholder="Enter state"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className={`form-control ${styles['input-item']}`} placeholder="+234"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className={`form-control ${styles['input-item']}`} placeholder="example@email.com"/>
                    </div>
                    <div className="mb-3">
                    <label className="form-label">Store Description</label>
                    <textarea className={`form-control ${styles['input-item']}`} placeholder="Brief description of your store..." style={{height: '100px'}}></textarea>
                    </div>

                    <div className="text-end mt-4">
                    <button type="button" className={`btn btn-outline-secondary me-2 ${styles['mod-btn']}`} onClick={hideModal}>Cancel</button>
                    <button type="submit" className={`btn btn-primary ${styles['m-btn']}`}>Create Store</button>
                    </div>
                </form>
                </div>
            </div>
            </div>
        )} */}
    </>
  )
}

export default ManageStore
