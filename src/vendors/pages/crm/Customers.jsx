import React, {useState} from 'react'
import styles from "../../../styles.module.css";
import stylesItem from '../../../Tabs.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faEye, faEdit, faTimes, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { Cb, Cp, Cin, Cv, Cbi, Eli2 } from '../../../assets';
// import { customerData } from '../data';


const Customers = () => {
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');
  const [pop, setPop] = useState(null);
  const [detail, setDetail] = useState(false);
  const [bul, setBul] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cus, setCus] = useState(true);
  const [tag, setTag] = useState("");
  const [edit, setEdit] = useState(true)

  const cardDetails = [
    {
      cardName: "Total Customer",
      cardImage: Cp,
      cvalue: 48
    },
    {
      cardName: "High Value",
      cardImage: Cv,
      cvalue: 15
    },
    {
      cardName: "Repeat Buyers",
      cardImage: Cb,
      cvalue: 10
    },
    {
      cardName: "Inactive",
      cardImage: Cin,
      cvalue: 23
    },
    {
      cardName: "Upcoming Birthdays",
      cardImage: Cbi,
      cvalue: 48
    },
  ]

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const getStatusClass = (status) => {
    if (status === "High-Value") return stylesItem["highValue"];
    if (status === "Inactive") return stylesItem["inactive"];
    if (status === "Repeat Buyer") return stylesItem["repeatBuyer"];
    return "";
  };

  const hideModal = () => {
    setPop(!pop);
    setDetail(false);
    setBul(false)
  }

  const cardItem = cardDetails.map((item) => 
    <div className="" key={item.id}>
      <div style={{border: '1px solid #eee'}} className='rounded-3 p-3 bg-white'>
        <div className="d-flex justify-content-between">
          <div className='mt-2'>
            <small className="d-block" style={{fontSize: '12px'}}>{item.cardName}</small>
          </div>
          <div className='text-end'>
            <img src={item.cardImage} alt="" className='w-50'/>
          </div>
        </div>

        <small className="d-block mx">{item.cvalue}</small>
      </div>
    </div>
  )
  return (
    <>
      {edit ? (
        <>
          {cus ? (
            <>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="bx">Available Products</h6>
                  <small className="d-block">Overview of your inventory</small>
                </div>
                <div className='d-flex gap-3'>
                  <button className={`px-4 py-3 mx ms-auto rounded-3 ${stylesItem.vBtn}`} onClick={() => setBul(true)}>Import Customer</button>
                  <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setCus(false)}>Add New Customer</button>
                </div>
              </div>

              <div className="d-flex gap-1 my-4">
                {cardItem}
              </div>

              <div className="card shadow-sm rounded-3" style={{border: '1px solid #eee'}}>
                <div className="card-body p-0">
                    <div className="d-flex justify-content-between">
                    <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Customer List</h6>
                    </div>
                    <hr className='m-0'/>
                    <div className="row mb-3 align-items-center p-3">
                      <div className="col-md-4">
                        <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                          <input
                            type="text"
                            className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                            placeholder="Search for customer"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{}}
                          />
                          <span className="input-group-text bg-white border-start-0">
                            <i className="fas fa-search text-muted"></i>
                            🔍
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4"></div>
                      <div className="col">
                        <div className="d-flex gap-2">
                          <select 
                            className={`form-select ${styles['input-item']} ${styles.chuk}`}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                          >
                            <option>All Statuses</option>
                            <option>In Stock</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>
                          </select>
                          <button className={`${styles.exBtn} px-3`}>Export</button>
                        </div>
                      </div>
                      
                    </div>
                    <div className="table-responsive mx-3">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr className={styles.tableHeader}>
                            <th scope="col" className="fw-semibold">#ID</th>
                            <th scope="col" className="fw-semibold">Customer Name</th>
                            <th scope="col" className="fw-semibold">Address</th>
                            <th scope="col" className="fw-semibold">Email</th>
                            <th scope="col" className="fw-semibold">Phone Number</th>
                            <th scope="col" className="fw-semibold">Date Registered</th>
                            <th scope="col" className="fw-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerData.map((item, index) => 
                            <tr key={index} className={styles.tableHeader} onClick={() => setDetail(true)}>
                              <td>{index + 1}</td>
                              <td><img src={Eli2} className='w-25 me-2'/>{item.cname}</td>
                              <td style={{lineHeight: '3.5'}}>{item.address}</td>
                              <td style={{lineHeight: '3.5'}}>{item.email}</td>
                              <td style={{lineHeight: '3.5'}}>{item.phone}</td>
                              <td style={{lineHeight: '3.5'}}>{item.date}</td>
                              <td>
                                <div className="d-flex gap-3 mt-2" onClick={(e) => e.stopPropagation()}>
                                  <button className={`w-100 rounded-4 ${stylesItem['status-btn']} ${getStatusClass(item.status)}`}>
                                    {item.status}
                                  </button>
          
                                  <FontAwesomeIcon
                                    className='mt-1'
                                    icon={faEllipsisV}
                                    style={{fontSize: '14px', cursor: 'pointer'}}
                                    onClick={() => {
                                      setPop(pop === index ? null : index)
                                    }}
                                  />
          
                                  {pop === index && (
                                    <div
                                      className="bg-white py-3 rounded shadow px-2"
                                      style={{
                                        position: 'absolute',
                                        top: '25px',
                                        right: '0',
                                        zIndex: 10,
                                        width: '120px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <div className='text-end'>
                                        <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                                      </div>
                                      <p className="mb-3 bx" style={{color: '#0EC049', cursor: 'pointer'}} onClick={() => setDetail(true)}><FontAwesomeIcon icon={faEye}/> View</p>
                                      <p className="mb-3 bx" style={{color: '#0EC049', cursor: 'pointer'}} onClick={() => setEdit(false)}><FontAwesomeIcon icon={faEdit} /> Edit</p>
                                      <p className="mb-0 text-danger bx" style={{color: '#0EC049', cursor: 'pointer'}}><FontAwesomeIcon icon={faTrash} /> Delete</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
          
                    {customerData.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-muted mb-0">No customer found matching your criteria.</p>
                      </div>
                    )}
                </div>
              </div>
            </>
          ):(
          <>
            <button className="btn nx mb-3" style={{fontSize: '15px'}} onClick={() => setCus(true)}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to My Customers</button>

            <h5 className='bx ms-2 mb-3'>Add New Customer</h5>

            <form className='ms-2'>
              <div className="card shadow-sm rounded-3" style={{border: '1px solid #eee'}}>
                <div className="card-body p-0">
                  <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Customer Information</h6>
                  <hr className='m-0'/>
                  
                  <div className="p-3">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">First Name <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter First name"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Last Name <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter Last name"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="email"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="example@email.com"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Birthdays <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="date"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Address <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter address"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Picture <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="file"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="Enter address"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Tag <span style={{color: '#DC2626'}}>*</span></label>
                            <div className="input-group">
                              <input
                                type="text"
                                className={`${stylesItem['input-item']}`}
                                placeholder="High-Value"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                style={{width: '85%'}}
                              />
                              <button className="btn btn-primary" type="submit" style={{width: '15%'}}>
                                Add
                              </button>
                            </div>
                        </div>
                      </div>
                    </div>
                    
                  <div>
                    <label className="form-label">Note</label>
                    <textarea name="" id="" rows={4} className={`w-100 p-2 ${stylesItem['input-item']}`} placeholder='Enter any additional notes'></textarea>
                  </div>
                  </div>
                </div>
                </div>

                <div className="text-end mt-3">
                  <button className={`rounded-3 mx-2 border ${stylesItem.pbtn}`} style={{color: '#0273F9'}}>
                    Cancel
                  </button>
                  <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`}>Add Customer</button>
                </div>
            </form>
          </>
          )}
        </>
      ):(
      <>
        <button className="btn nx mb-3" style={{fontSize: '15px'}} onClick={() => setEdit(true)}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to My Customers</button>

        <h5 className='bx ms-2 mb-3'>Edit Customer</h5>

        <form className='ms-2'>
          <div className="card shadow-sm rounded-3" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Customer Information</h6>
              <hr className='m-0'/>
              
              <div className="p-3">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">First Name <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="Cyril"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Last Name <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="Okeleke"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="email"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="cyril@email.com"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Phone <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="+2349138839366"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Birthdays <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="date"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="mm/dd/yyy"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Address <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="23, Adeniyi Jones Off Awolowo rd Ikeja Lagos"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Picture <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="file"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tag <span style={{color: '#DC2626'}}>*</span></label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`${stylesItem['input-item']}`}
                            placeholder="High-Value"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            style={{width: '85%'}}
                          />
                          <button className="btn btn-primary" type="submit" style={{width: '15%'}}>
                            Add
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
                
              <div>
                <label className="form-label">Note</label>
                <textarea name="" id="" rows={4} className={`w-100 p-2 ${stylesItem['input-item']}`} placeholder='Enter any additional notes'></textarea>
              </div>
              </div>
            </div>
            </div>

            <div className="text-end mt-3">
              <button className={`rounded-3 mx-2 border ${stylesItem.pbtn}`} style={{color: '#0273F9'}}>
                Cancel
              </button>
              <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`}>Save Changes</button>
            </div>
        </form>
      </>
    )}

      {detail && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                  <h6>Customer Details</h6>
                  <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <hr className='m-0'/>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#fff'}}>
                  <form>
                    <div className="d-flex justify-content-between rounded-3 p-3" style={{background: '#EEF8FF', border: '1px solid #eee'}}>
                      <div className='d-flex gap-3'>
                        <p className='px-4 m-0' style={{background: '#eee'}}></p>
                        <div>
                          <p className='pt-1 m-0 my text-dark'>Adebayo Samuel</p>
                          <small className='pt-1 m-0'>adebayo@gmail.com</small>
                        </div>
                      </div>
                      <div>
                        <button className={`mt-3 w-100 rounded-4 ${stylesItem.highValue} ${stylesItem['status-btn']}`}>
                          High-Value
                        </button>
                      </div>
                    </div>

                    <div className="info-section mt-3">
                      <div className="d-flex justify-content-between mb-3">
                        <small className="d-block" style={{color: '#78716C'}}>Phone Number:</small>
                        <small className="d-block">09023467213</small>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <small className="d-block" style={{color: '#78716C'}}>DOB:</small>
                        <small className="d-block">01-12-1988</small>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <small className="d-block" style={{color: '#78716C'}}>Address:</small>
                        <small className="d-block">23, Adeniyi Jones Off Awolowo rd Ikeja Lagos</small>
                      </div>
                      <div className="d-flex justify-content-between">
                        <small className="d-block" style={{color: '#78716C'}}>Date Registered:</small>
                        <small className="d-block">05-03-2025</small>
                      </div>
                    </div>

                    <div className="text-end mt-3">
                      <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={hideModal}>Close</button>
                    </div>
                  </form>
                </div>
            </div>
          </div>
        </>
      )}

      {bul && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                  <h6>Import Bulk Customers</h6>
                  <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <hr className='m-0'/>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#fff'}}>
                  <p>Upload Customer Information</p>

                  <div className="outer-box p-2" style={{background: '#fff', borderRadius: '12px', border: '2px dashed #EEEEEE'}}>
                    <div className="inner-box text-center p-5" style={{background: '#FAFAFA', borderRadius: '12px', cursor: 'pointer'}}>
                      <div
                        className={`upload-box ${dragActive ? "active" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input
                          type="file"
                          id="fileUploadInput"
                          hidden
                          onChange={handleFileChange}
                        />
                        <label htmlFor="fileUploadInput" className="upload-label">
                          {fileName ? (
                            <p className="file-name">{fileName}</p>
                          ) : (
                            <>
                              <p>Click to browse file or drag file here</p>
                              <span className="no-file">No file chosen yet</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Customers