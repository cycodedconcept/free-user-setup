import React, {useState} from 'react'
import styles from "../../../styles.module.css";
import stylesItem from '../../../Tabs.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTimes, faCalendar } from '@fortawesome/free-solid-svg-icons';
// import { birthData } from '../data';

const Birthdays = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [pop, setPop] = useState(null);

  const getStatusClass = (status) => {
    if (status === "High-Value") return stylesItem["highValue"];
    if (status === "Inactive") return stylesItem["inactive"];
    if (status === "Repeat Buyer") return stylesItem["repeatBuyer"];
    return "";
  };

  const birt = (days) => {
    if (days <= 3) return stylesItem["urgent"]; 
    if (days <= 6) return stylesItem["rep"];
    if (days <= 12) return stylesItem["ship"];
    return stylesItem["default"]; 
  };


  const hideModal = () => {
    setPop(!pop);
  }
  return (
    <>
      <div>
        <h6 className="bx">Upcoming Birthdays</h6>
        <small className="d-block">Customers with birthdays in the next 30 days</small>
      </div>
      <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
        <div className="card-body p-0">
          <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Birthday List</h6>
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
            <div className="col-md-5"></div>
            <div className="col">
              <div className="d-flex gap-2">
                <select 
                  className={`form-select ${styles['input-item']} ${styles.chuk}`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{fontSize: '13px'}}
                >
                  <option>All Status</option>
                  <option>Inactive</option>
                  <option>Repeat Buyer</option>
                  <option>High Value</option>
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
                  <th scope="col" className="fw-semibold">Emails</th>
                  <th scope="col" className="fw-semibold">Birthday</th>
                  <th scope="col" className="fw-semibold">Days Until</th>
                  <th scope="col" className="fw-semibold">Total Spent</th>
                  <th scope="col" className="fw-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
              {birthData.map((item, index) => {
                const number = parseInt(item.Du.match(/\d+/)[0]);
                return (
                  <tr key={index} onClick={() => setDel(false) }>
                    <td>{index + 1}</td>
                    <td style={{fontSize: '12px'}}>
                      <p className='m-0'>{item.cname}</p>
                    </td>
                    <td style={{fontSize: '12px'}}>{item.email}</td>
                    <td 
                    style={{fontSize: '12px'}}
                    >
                      {item.birthday}
                    </td>
                    <td 
                      
                    >
                      <p
                      style={{fontSize: '12px'}}
                      className={`${birt(number)}`}
                      >{item.Du}</p>
                    </td>

                    <td style={{fontSize: '12px'}}>
                      {item.total}
                    </td>
                    <td style={{fontSize: '12px', position: 'relative'}}>
                      <div 
                        className="d-flex justify-content-between"
                        onClick={(e) => e.stopPropagation()}>
                        <button 
                        className={`rounded-4 ${stylesItem['status-btn']} ${getStatusClass(item.status)}`}>
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
                            <div>
                              <small className="d-block mb-3"><FontAwesomeIcon icon={faCalendar} style={{color: '#0EC049'}}/> Send Greetings</small>
                              <small className="d-block"><FontAwesomeIcon icon={faCalendar} style={{color: '#0EC049'}}/> Set Reminder</small>
                            </div>
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

          {birthData.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No order found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Birthdays