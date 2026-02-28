import React, { useState } from 'react'
import styles from "../../../styles.module.css";
import stylesItem from '../../../Tabs.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTimes, faChevronLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
// import { orderData } from '../data';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [pop, setPop] = useState(null);
  const [returned, setReturned] = useState(false);
  const [del, setDel] = useState(true);
  const [sort, setSort] = useState(true)

  const getStatusClass = (payment) => {
    if (payment === "Paid") return stylesItem["paid"];
    if (payment === "Pending") return stylesItem["pending"];
    return "";
  };

  const getType = (type) => {
    if (type === 'Online') return stylesItem["online"];
    if (type === 'Physical') return stylesItem["physical"];
    return "";
  }

  const getStatus = (status) => {
    if (status === 'Delivered') return stylesItem['delivered'];
    if (status === 'Processing') return stylesItem['processing'];
    if (status === 'Shipped') return stylesItem['shipped'];
    if (status === 'Pending') return stylesItem['pending'];
    if (status === 'Cancelled') return stylesItem['cancelled'];
    return "";
  }

  const hideModal = () => {
    setPop(!pop);
    setReturned(false)
  }

  const content = [
    { title: "Order Placed", date: "June 10, 2025" },
    { title: "Processed", date: "June 10, 2025" },
    { title: "Shipped", date: "June 10, 2025" },
    { title: "Delivered", date: "June 10, 2025" },
  ];


  return (
    <>
    {sort ? (
      <>
        {del ? (
        <>
          <div className="d-flex justify-content-between">
            <div>
              <h6 className="bx">Orders</h6>
              <small className="d-block">Track and manage customer orders</small>
            </div>
            <div className='d-flex gap-3'>
              <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setSort(false)}>Sort Order</button>
            </div>
          </div>

          <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Order List</h6>
              <hr className='m-0'/>
              
              {/* Search and Filter Row */}
              <div className="row mb-3 align-items-center p-3">
                <div className="col-md-3">
                  <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                    <input
                      type="text"
                      className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                      placeholder="Search for orders"
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
                <div className="col-md-2"></div>
                <div className="col">
                  <div className="d-flex gap-2">
                    <select 
                      className={`form-select ${styles['input-item']} ${styles.chuk}`}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{fontSize: '13px'}}
                    >
                      <option>All Type</option>
                      <option>Online</option>
                      <option>Physical</option>
                    </select>
                    <select 
                      className={`form-select ${styles['input-item']} ${styles.chuk}`}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{fontSize: '13px'}}
                    >
                      <option>All Status</option>
                      <option>Pending</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                      <option>Returned</option>

                    </select>
                    <select 
                      className={`form-select ${styles['input-item']} ${styles.chuk}`}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{fontSize: '13px'}}
                    >
                      <option>Payment Type</option>
                      <option>All Payments</option>
                      <option>Paid</option>
                      <option>Pending</option>
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
                      <th scope="col" className="fw-semibold">Date</th>
                      <th scope="col" className="fw-semibold">Type</th>
                      <th scope="col" className="fw-semibold">Items</th>
                      <th scope="col" className="fw-semibold">Total</th>
                      <th scope="col" className="fw-semibold">Payment</th>
                      <th scope="col" className="fw-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                  {orderData.map((item, index) => {
                    return (
                      <tr key={index} onClick={() => setDel(false) }>
                        <td>{index + 1}</td>
                        <td style={{fontSize: '12px'}}>
                          <p className='m-0'>{item.cname}</p>
                          <p className='m-0'>{item.email}</p>
                        </td>
                        <td style={{fontSize: '12px'}}>{item.date}</td>
                        <td>
                          <button 
                            className={`rounded-3 ${stylesItem['status-btn']} ${getType(item.type)}`}
                            style={{fontSize: '12px'}}>
                            {item.type}
                          </button>
                        </td>
                        <td style={{fontSize: '12px'}}>{item.items}</td>
                        <td style={{fontSize: '12px'}}>
                          {item.total}
                        </td>
                        <td style={{fontSize: '12px'}}><button className={`rounded-4 ${stylesItem['status-btn']} ${getStatusClass(item.payment)}`}>{item.payment}</button></td>
                        <td style={{fontSize: '12px', position: 'relative'}}>
                          <div 
                            className="d-flex justify-content-between"
                            onClick={(e) => e.stopPropagation()}>
                            <button 
                            className={`rounded-4 ${stylesItem['status-btn']} ${getStatus(item.status)}`}>
                              {item.status}
                            </button>

                            <FontAwesomeIcon
                              className="mt-1"
                              icon={faEllipsisV}
                              style={{fontSize: '14px', cursor: 'pointer'}}
                              onClick={() => setPop(pop === index ? null : index)}
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
                                <select 
                                  className={`form-select ${styles['input-item']} ${styles.chuk}`}
                                  value={statusFilter}
                                  onChange={(e) => setStatusFilter(e.target.value)}
                                  style={{fontSize: '13px'}}
                                >
                                  <option>choose status</option> 
                                  <option>Pending</option>
                                  <option>Processing</option>
                                  <option>Shipped</option>
                                  <option>Delivered</option>
                                  <option>Cancelled</option>
                                  <option>Returned</option>
                                </select>
                                <button className={`${stylesItem.jBtn} my-3 p-2 w-100 rounded-3`}>Update Status</button>
                                <button className={`${stylesItem.jBtn} p-2 w-100 rounded-3`} onClick={() => setReturned(true)}>Return Order</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                </table>
              </div>

              {orderData.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No order found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
      <>
        <div className="d-flex justify-content-between">
          <div>
            <button className="btn nx" style={{fontSize: '15px'}} onClick={() => setDel(true)}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to My Orders</button>
          </div>
          <div>
            <select 
              className={`form-select ${styles['input-item']} ${styles.chuk}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{fontSize: '13px'}}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
              <option>Returned</option>

            </select>
          </div>
        </div>

        <h6 className='bx mx-3 my-3'>Order ORD-1001</h6>

        <div className="row">
          <div className="col-md-7">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <div className="d-flex justify-content-between">
                <div className='p-3'>
                  <small className="mx d-block" style={{color: '#1C1917'}}>Order Details</small>
                  <small className='d-block nx' style={{fontSize: '12px'}}>Created on May 5, 2025</small>
                </div>
                <div className='mt-2'>
                <button 
                className={`m-3 rounded-4 ${stylesItem['status-btn']} ${stylesItem['in-stock']}`}
                >Delivered</button>
                </div>
              </div>
              <hr className='m-0'/>
              <div className="d-flex" style={{gap: '120px'}}>
                <div className='p-3'>
                  <small className="d-block mb-2" style={{color: '#78716C'}}>Order Type</small>
                  <small className="d-block">Online Order</small>
                </div>
                <div className='p-3'>
                  <small className="d-block mb-2" style={{color: '#78716C'}}>Payment Status</small>
                  <button 
                className={`rounded-4 ${stylesItem['status-btn']} ${stylesItem['in-stock']}`}
                >Paid</button>
                </div>
              </div>
              <hr className='m-0'/>
              <small className="mx d-block p-3" style={{color: '#1C1917'}}>Order Item</small>
              <table style={{width:"100%", borderCollapse: 'collapse', fontSize: '15px'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid #ddd'}}>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#78716C'}} className='nx px-3'>Product</th>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#78716C'}} className='nx px-3'>Quantity</th>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#78716C'}} className='nx px-3'>Unit Price</th>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#78716C'}} className='nx px-3'>Total</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td style={{padding:'12px 0'}} className='nx px-3'>Samsung Smart TV (45”)</td>
                    <td className='nx px-3'>2</td>
                    <td className='nx px-3'>₦150.90</td>
                    <td className='nx px-3'>₦301.00</td>
                  </tr>
                  <tr>
                    <td style={{padding:'12px 0'}} className='nx px-3'>Wrist Watch</td>
                    <td className='nx px-3'>1</td>
                    <td className='nx px-3'>₦34.99</td>
                    <td className='nx px-3'>₦34.99</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-end p-2" style={{background: '#F6F6F6'}}>
                <small style={{color: '#78716C'}} className='mx-3 d-block'>Total Order: <span className='mx text-dark'>₦641.99</span></small>
              </div>
            </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <small className="mx d-block p-3" style={{color: '#1C1917'}}>Customer Information</small>
              <hr className='m-0'/>
              <div style={{background: '#FAFAFA'}} className='m-3 py-3 rounded-3'>
                <div className="px-3 py-2">
                  <small className="d-block" style={{color: '#78716C'}}>Customer Name:</small>
                  <small className="d-block">Adebayo Samuel</small>
                </div>
                <div className="px-3 py-2">
                  <small className="d-block" style={{color: '#78716C'}}>Email:</small>
                  <small className="d-block">adebayo@gmail.com</small>
                </div>
                <div className="px-3">
                  <small className="d-block" style={{color: '#78716C'}}>Phone:</small>
                  <small className="d-block">+234 06483656</small>
                </div>
              </div>
            </div>
            </div>
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <small className="mx d-block p-3" style={{color: '#1C1917'}}>Order Timeline</small>
              <hr className='m-0'/>
              <div className="d-flex flex-column p-3" style={{ gap: "40px" }}>

                {content.map((status, index) => {
                  const isLast = index === content.length - 1;

                  return (
                    <div key={index} className="d-flex align-items-start position-relative">

                      {/* Vertical Line — render only if NOT the last item */}
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            top: "16px",
                            left: "6px",
                            width: "3px",
                            height: "76px",
                            background: "#23A45540",
                            zIndex: 0,
                          }}
                        ></div>
                      )}
                      <FontAwesomeIcon icon={faCircleCheck} style={{color: '#23A455'}}/>

                      {/* Labels */}
                      <div className='px-3'>
                        <p className="mx mb-1" style={{ fontSize: "14px" }}>
                          {status.title}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: "12px" }}>
                          {status.date}
                        </p>
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>
            </div>
          </div>
        </div>

      </>)}
      </>
    ): (
    <>
      <div>
        <button className="btn nx" style={{fontSize: '15px'}} onClick={() => setSort(true)}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to My Orders</button>
      </div>

      <h6 className='bx mx-3 my-3'>Sort Orders</h6>
      <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
        <div className="card-body p-0">
          <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Order List</h6>
          <hr className='m-0'/>
          
          {/* Search and Filter Row */}
          <div className="row mb-3 align-items-center p-3">
            <div className="col-md-3">
              <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                <input
                  type="text"
                  className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                  placeholder="Search for orders"
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
            <div className="col-md-2"></div>
            <div className="col">
              <div className="d-flex gap-2">
                <select 
                  className={`form-select ${styles['input-item']} ${styles.chuk}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{fontSize: '13px'}}
                >
                  <option>All Type</option>
                  <option>Online</option>
                  <option>Physical</option>
                </select>
                <select 
                  className={`form-select ${styles['input-item']} ${styles.chuk}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{fontSize: '13px'}}
                >
                  <option>All Status</option>
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                  <option>Returned</option>

                </select>
                <select 
                  className={`form-select ${styles['input-item']} ${styles.chuk}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{fontSize: '13px'}}
                >
                  <option>Payment Type</option>
                  <option>All Payments</option>
                  <option>Paid</option>
                  <option>Pending</option>
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
                  <th scope="col" className="fw-semibold">Date</th>
                  <th scope="col" className="fw-semibold">Type</th>
                  <th scope="col" className="fw-semibold">Items</th>
                  <th scope="col" className="fw-semibold">Total</th>
                  <th scope="col" className="fw-semibold">Payment</th>
                  <th scope="col" className="fw-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
              {orderData.map((item, index) => {
                return (
                  <tr key={index} onClick={() => setDel(false) }>
                    <td>{index + 1}</td>
                    <td style={{fontSize: '12px'}}>
                      <p className='m-0'>{item.cname}</p>
                      <p className='m-0'>{item.email}</p>
                    </td>
                    <td style={{fontSize: '12px'}}>{item.date}</td>
                    <td>
                      <button 
                        className={`rounded-3 ${stylesItem['status-btn']} ${getType(item.type)}`}
                        style={{fontSize: '12px'}}>
                        {item.type}
                      </button>
                    </td>
                    <td style={{fontSize: '12px'}}>{item.items}</td>
                    <td style={{fontSize: '12px'}}>
                      {item.total}
                    </td>
                    <td style={{fontSize: '12px'}}><button className={`rounded-4 ${stylesItem['status-btn']} ${getStatusClass(item.payment)}`}>{item.payment}</button></td>
                    <td style={{fontSize: '12px', position: 'relative'}}>
                      <div 
                        className="d-flex justify-content-between"
                        onClick={(e) => e.stopPropagation()}>
                        <button 
                        className={`rounded-4 ${stylesItem['status-btn']} ${getStatus(item.status)}`}>
                          {item.status}
                        </button>

                        <FontAwesomeIcon
                          className="mt-1"
                          icon={faEllipsisV}
                          style={{fontSize: '14px', cursor: 'pointer'}}
                          onClick={() => setPop(pop === index ? null : index)}
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
                            <select 
                              className={`form-select ${styles['input-item']} ${styles.chuk}`}
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                              style={{fontSize: '13px'}}
                            >
                              <option>choose status</option> 
                              <option>Pending</option>
                              <option>Processing</option>
                              <option>Shipped</option>
                              <option>Delivered</option>
                              <option>Cancelled</option>
                              <option>Returned</option>
                            </select>
                            <button className={`${stylesItem.jBtn} my-3 p-2 w-100 rounded-3`}>Update Status</button>
                            <button className={`${stylesItem.jBtn} p-2 w-100 rounded-3`} onClick={() => setReturned(true)}>Return Order</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            </table>
          </div>

          {orderData.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No order found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
    )}
      

      {returned && (
        <>
          <div className={styles['modal-overlay']} onClick={hideModal}>
            <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between p-3">
                  <h6>Returned Details</h6>
                  <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
                </div>
                <hr className='m-0'/>
                <div className={`${styles['modal-body']} p-3`} style={{background: '#fff'}}>
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Product Name <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="Enter Product Name"
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Date Retured <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="date"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="mm/dd/yyy"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">SKU<span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="eg.,VAR-001"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Quantity Retured <span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Returned Value<span style={{color: '#DC2626'}}>*</span></label>
                          <input
                            type="text"
                            className={`w-100 ${stylesItem['input-item']}`}
                            placeholder="₦0.00"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Customer Name <span style={{color: '#DC2626'}}>*</span></label>
                      <input
                        type="text"
                        className={`w-100 ${stylesItem['input-item']}`}
                        placeholder="Enter Customer Name"
                      />
                    </div>

                    <label className="form-label">Reason for Return</label>
                    <textarea name="" id="" rows={4} className={`w-100 p-2 ${stylesItem['input-item']}`} placeholder='Provide a reason for return'></textarea>

                    <div className="text-end mt-3">
                      <button className={`rounded-3 mx-2 border ${stylesItem.pbtn}`} style={{color: '#0273F9'}}>
                        Cancel
                      </button>
                      <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`}>Record Return</button>
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

export default Orders