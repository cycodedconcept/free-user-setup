import React, {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyOnlineStore, getStorePreview } from '../../slice/onlineStoreSlice';
import { FaMapMarkerAlt, FaBox  } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faExternalLinkAlt, faDotCircle } from '@fortawesome/free-solid-svg-icons';
import styles from "../../styles.module.css";
import Button from "../../components/ui/Button"

const ViewStore = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");
  const [seeStore, setSeeStore] = useState(true);
  const { loading, error, success, myStore, previewDetails } = useSelector((state) => state.store);

  useEffect(() => {
    if (token) {
      dispatch(getMyOnlineStore({ token, id: getId || '7'}));
    }
  }, [token, dispatch])


  return (
    <>
      {seeStore ? (
        <>
          <div className="p-4">
            <div className="d-flex justify-content-between">
                <div>
                    <h5 className="mb-1 my text-dark">Manage Your Store</h5>
                    <p className="text-muted">Choose which store you’d like to manage today</p>
                </div>
                <div>
                    <button
                        className={`${styles['onl-btn']} px-3 rounded`}
                        onClick={() => setSeeStore(false)}
                    >
                        View Online Store
                    </button>
                </div>
            </div>

            <p className='text-bold mt-4'>Available Online Store ({myStore ? 1 : 0})</p>
            <hr style={{border: '1px solid #bbb8b8'}}/>
            <div className="row">
                {myStore && (
                <>
                <div className="col-md-4">
                    <div className="card shadow-sm border-light pb-4">
                        <div className="card-body px-3 py-2 d-flex justify-content-between align-items-start">
                            <p className="mb-0">{myStore.onlineStore.store_name}</p>
                            <span className="badge rounded-pill text-primary bg-light">{myStore.onlineStore.is_published === false ? 'In Active' : 'Active'}</span>
                        </div>
                        <hr className="my-2"/>
                        <p className="mb-2 px-3 text-muted small">
                            <FaMapMarkerAlt className="me-2"/> Online
                        </p>
                        <p className="mb-3 px-3 text-muted small">
                            <FaBox className="me-2"/>
                            <strong>{}</strong> Items
                        </p>
                        <div className="px-3">
                            <button className="btn btn-primary w-100" style={{fontSize: '13px'}}>Manage Online Store</button>
                        </div>
                    </div>
                </div>
                </>
                )}
            </div>
            </div>
        </>
        ) : (
        <>
            <div className="d-flex justify-content-between">
                <div>
                    <h5 className="mb-1 my text-dark">Online Store View</h5>
                    <p className="text-muted">Preview of how your online store looks like</p>
                </div>
                <div className='d-flex gap-2'>
                    <div>
                      <Button variant='noBackground' size='xsm' className='w-100'><FontAwesomeIcon icon={faPen} style={{color: '#1C1917', cursor: 'pointer'}} className='mx-1'/>Edit</Button>
                    </div>
                    <div>
                      <Button variant='primary' size='xsm' className='w-100'>Back</Button>
                    </div>
                </div>
            </div>
            <hr style={{border: '1px solid #bbb8b8'}}/>
            
            <small className="d-block text-end" style={{color: '#1C1917'}}>Status <FontAwesomeIcon icon={faDotCircle} style={{color: '#0EC049', fontSize: '12px'}}/></small>

            {myStore && (
                <>
                    <div className="d-flex justify-content-center align-items-center">
                        <div className={`d-flex justify-content-between p-3 m-0 w-50`} style={{background: '#EAF4FF', borderRadius: '10px', border: '1px solid #0273F9'}}>
                            <p className='m-0'><span style={{color: '#78716C'}}>mycroshop</span>/{myStore.onlineStore.username}</p>
                            <p style={{color: '#0273F9'}} className='m-0'>Share Link <FontAwesomeIcon icon={faExternalLinkAlt} /></p>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center align-items-center mt-4">
                <div className={`${styles.preview} d-flex flex-column text-center w-50`} style={{border: '2px solid #1C1917'}}>
                <div style={{margin: '5% auto'}}>
                    <div className='mb-2'>
                        <img src={myStore.onlineStore.profile_logo_url} alt="" className='rounded-pill w-50'/>
                    </div>
                    <h5 className="my text-dark">Your Store</h5>
                    <p>Store Description Here...</p>
                </div>
                {/* <div className="container" style={{ maxWidth: '400px' }}>
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
                        
                        <div>
                            {renderContent()}
                        </div>
                    </div> */}
            </div>
            </div>
                </>
            )}
        </>
        )}
      
    </>
  )
}

export default ViewStore
