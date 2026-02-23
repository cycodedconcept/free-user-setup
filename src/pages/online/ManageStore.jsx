import React, {useState} from 'react'
import { FaStore, FaMapMarkerAlt, FaBox  } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faAsterisk } from '@fortawesome/free-solid-svg-icons';
import '../sidebar/sidebar.css';
import styles from "../../styles.module.css";
import SetupStore from './SetupStore';

const ManageStore = ({ setActiveTab }) => {
    const [add, setAdd] = useState(false);
    const [shop, setShop] = useState(true);
    const [onstore, setOnstore] = useState(true);
    const [servicesData, setServicesData] = useState(null);

    const [stores, setStores] = useState([
        {
            id: 1,
            name: "Chuks Electronic Store",
            address: "67, Modupe Street - Ikeja, Lagos",
            items: 0,
            status: "Active",
        },
        {
            id: 2,
            name: "Lighting Wharehouse",
            address: "67, Modupe Street - Ikeja, Lagos",
            items: 3,
            status: "Active",
        },
    ]);


  const hideModal = () => {
    setAdd(false)
  }
  return (
    <>
      {onstore ? (
        <>
          <div className="p-4">
            <div className="d-flex justify-content-between">
                <div>
                    <h5 className="mb-1 my text-dark">Manage Your Store</h5>
                    <p className="text-muted">Setup your online store to get started</p>
                </div>
                {shop && stores.some(store => store.items > 0) && (
                    <div>
                    <button
                        className={`${styles['onl-btn']} px-3 rounded`}
                        onClick={() => setOnstore(false)}
                    >
                        Setup Online Store
                    </button>
                    </div>
                )}

            </div>
            

            <p className='text-bold'>Available Store<span className='ms-1'>({stores.length})</span></p>
            <hr style={{border: '3px solid #EEEEEE'}}/>

            {stores.length === 0 ? (
                <div style={{background: '#fff', borderRadius: '12px', border: '2px solid #EEEEEE'}} className='p-3'>
                    <div className="rounded p-5 text-center" style={{border: '3px dotted #EEEEEE', background: '#fafafa'}}>
                    <FaStore size={30} className="text-secondary mb-3" />
                    <p className="mb-1 font-weight-bold" style={{color: '#1C1917'}}>No store available to manage</p>
                    <small className="text-muted" style={{color: '#78716C'}}>Expand your business with another location</small>
                    <br />
                    <button className="btn add-btn mt-3 px-4" onClick={() => {setAdd(true)}}>Add Store</button>
                    </div>
                </div>
                ) : (
                <div className="row g-4">
                    {stores.map(store => (
                        <div className="col-md-4" key={store.id}>
                            <div className="card shadow-sm border-light pb-4">
                            <div className="card-body px-3 py-2 d-flex justify-content-between align-items-start">
                                <p className="mb-0">{store.name}</p>
                                <span className="badge rounded-pill text-primary bg-light">{store.status}</span>
                            </div>
                            <hr className="my-2"/>
                            <p className="mb-2 px-3 text-muted small">
                                <FaMapMarkerAlt className="me-2"/>
                                {store.address}
                            </p>
                            <p className="mb-3 px-3 text-muted small">
                                <FaBox className="me-2"/>
                                <strong>{store.items}</strong> Items
                            </p>
                            <div className="px-3">
                                <button className="btn btn-primary w-100">Manage Store</button>
                            </div>
                            </div>
                        </div>
                    ))}

                    <div className="col-md-4 p-3" style={{borderRadius: '12px', background: '#fff'}}>
                    <div
                        className="shadow-sm p-4 d-flex flex-column align-items-center justify-content-center text-center"
                        style={{ height: "100%", border: "1px dotted #EEEEEE", background: '#FAFAFA', borderRadius: '12px' }}
                    >
                        <h6 className="mb-2">Add New Store</h6>
                        <p style={{color: '#78716C', fontSize: '13px'}}>Add business with another location</p>
                        <button className={`btn ${styles['add-btn']} mt-3 px-4`} onClick={() => {setAdd(true)}}>Add Store</button>
                    </div>
                    </div>
                </div>
            )}

          </div>
        </>
       ) : (
        <SetupStore />
       )}
            
        {add && (
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
        )}
    </>
  )
}

export default ManageStore