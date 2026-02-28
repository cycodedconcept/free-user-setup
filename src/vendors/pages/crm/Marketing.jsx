import React, {useState} from 'react'
import styles from "../../../styles.module.css";
import stylesItem from '../../../Tabs.module.css';
import { Wu, Wui, Tm } from '../../../assets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faEllipsisV, faTimes, faTrash, faEye, faEdit, faChevronLeft, faBold, 
  faItalic, 
  faRotateLeft, 
  faRotateRight 
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";



const Marketing = () => {
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');
  const [pop, setPop] = useState(null);
  const [details, setDetails] = useState(false);
  const [page, setPage] = useState('first');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  
  const cardDetails = [
    {
      name: 'Total Campaigns',
      image: Wu,
      value: '15'
    },
    {
      name: 'Total Reach',
      image: Wui,
      value: '200'
    },
    {
      name: 'Revenue Generated',
      image: Tm,
      value: '₦18,450'
    }
  ]

  const editor = useEditor({
    extensions: [StarterKit],
    content: `<small style={{color: '#78716C'}}>Enter your subject content...</small>`,
  });

  const getStatusClass = (status) => {
    if (status === "Sent") return stylesItem["highValue"];
    if (status === "Scheduled") return stylesItem["schedule"];
    if (status === "Repeat Buyer") return stylesItem["repeatBuyer"];
    return "";
  };

  const hideModal = () => {
    setPop(!pop);
    setDetails(false)
  }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === mkData.length) {
      setSelected([]);
    } else {
      setSelected(mkData.map((c) => c.id));
    }
  };

  const filtered = mkData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <>
    {page === 'first' && (
      <>
        <div className="d-flex justify-content-between">
          <div>
            <h6 className="bx">Marketing</h6>
            <small className="d-block">Create, manage, and analyze your marketing campaigns</small>
          </div>
          <div className='d-flex gap-3'>
            <div>
              <select 
                className={`form-select ${styles['input-item']} ${styles.chuk}`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{fontSize: '13px', padding: '12px'}}
              >
                <option>Last 7 days</option>
                <option>Last 14 days</option>
                <option>Last 21 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
            
            <div>
              <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setPage('second')}>New Campaign</button>
            </div>
          </div>
        </div>

        <div className="d-flex gap-3">
          {cardDetails.map((item, index) =>
            <div className="rounded-3 p-3 mt-5 w-100 bg-white" key={index} style={{border: '1px solid #eee'}}>
              <div className="d-flex justify-content-between">
                <div>
                  <small className="d-block mb-4">{item.name}</small>
                  <small className="d-block mx" style={{color: `${item.name === 'Total Value Lost' ? '#DC2626': ''}`}}>{item.value}</small>
                </div>
                <div className='text-end'>
                  <img src={item.image} alt="" className='w-50'/>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
          <div className="card-body p-0">
            <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Campaign List</h6>
            <hr className='m-0'/>
            
            {/* Search and Filter Row */}
            <div className="row mb-3 align-items-center p-3">
              <div className="col-md-3">
                <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                  <input
                    type="text"
                    className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                    placeholder="Search for campaigns"
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
                    <option>Sent</option>
                    <option>Scheduled</option>
                    <option>Active</option>
                  </select>
                  <button className={`${styles.exBtn} px-3`}>Export</button>
                </div>
              </div>
              
            </div>

            <div className="table-responsive mx-3">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr className={styles.tableHeader}>
                    <th scope="col" className="fw-semibold">Campaign</th>
                    <th scope="col" className="fw-semibold">Type</th>
                    <th scope="col" className="fw-semibold">Recipients</th>
                    <th scope="col" className="fw-semibold">Revenue</th>
                    <th scope="col" className="fw-semibold">Status</th>
                    <th scope="col" className="fw-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                {marketData.map((item, index) => 
                  <tr key={index} onClick={() => setDetails(true)}>
                    <td>
                      <small className="d-block">{item.cname}</small>
                      <small className="d-block" style={{color: '#78716C'}}>{item.date}</small>
                    </td>
                    <td>
                      <small className="d-block">
                        {item.type === 'email' ? (
                          <FontAwesomeIcon icon={faEnvelope} />
                        ) : item.type === 'WhatsApp' ? (
                          <FontAwesomeIcon icon={faWhatsapp} />
                        ) : item.type === 'SMS' ? (
                          <FontAwesomeIcon icon={faPhone} />
                        ) : (
                          ''
                        )}{" "}
                        {item.type}
                      </small>
                    </td>
                    <td><small className="d-block">{item.recipients}</small></td>
                    <td><small className="d-block text-success">{item.revenue}</small></td>
                    <td><button className={`rounded-4 ${stylesItem['status-btn']} ${getStatusClass(item.status)}`}>{item.status}</button></td>
                    <td>
                      <div className="d-flex gap-3" onClick={(e) => e.stopPropagation()}>

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
                            <small className="mb-3 bx d-block" style={{color: '#0EC049', cursor: 'pointer', fontSize: '11px'}}><FontAwesomeIcon icon={faEye}/> View</small>
                            <small className="mb-3 bx d-block" style={{color: '#0EC049', cursor: 'pointer', fontSize: '11px'}} onClick={() => setPage('third') }><FontAwesomeIcon icon={faEdit} /> Edit</small>
                            <small className="mb-0 text-danger bx d-block" style={{color: '#0EC049', cursor: 'pointer', fontSize: '11px'}}><FontAwesomeIcon icon={faTrash} /> Delete</small>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            {marketData.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted mb-0">No order found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {page === 'second' && (
      <>
        <div className="d-flex justify-content-between">
          <div>
            <button className="btn nx" style={{fontSize: '15px'}} onClick={() => setPage('first')}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to Marketing</button>
            <h6 className="bx" style={{margin: '8px 15px'}}>Create New Campaign</h6>
          </div>
          <div className='d-flex gap-3'>
            <div>
              <button className={`mx ms-auto rounded-3 text-dark ${stylesItem.vBtn}`} onClick={() => setSort(false)}>Save as Draft</button>
            </div>
            <div>
              <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setSort(false)}>Launch Campaign</button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-7">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Campaign Details</p>
                  <small className="d-block" style={{color: '#78716C'}}>Set up your campaign basics</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Campaign Name <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Campaign Type <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Email Campaign"
                    />
                  </div>
                  <div className={`mb-3`}>
                    <label className={`${styles['custom-checkbox-wrapper']}`}>
                    <input
                      type="checkbox"
                      className={`${styles['custom-checkbox']}`}
                    />
                    <span className={styles.checkmark}></span>
                    <span className="label-text mx mt-1" style={{fontSize: '13px'}}>Use Predefined Template</span>
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Subject Line <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Enter subject line"
                    />
                  </div>
                  <div>
                    <small className='d-block mb-2'>Message Content</small>
                    <div>
                      {editor && (
                        <div style={{ 
                          background: '#F3F3F3',
                          borderTopLeftRadius: "6px",
                          borderTopRightRadius: "6px",
                          }} className='p-2'>
                          <button onClick={() => editor.chain().focus().toggleBold().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faBold} />
                          </button>

                          <button onClick={() => editor.chain().focus().toggleItalic().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faItalic} />
                          </button>

                          <button onClick={() => editor.chain().focus().undo().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faRotateLeft} />
                          </button>

                          <button onClick={() => editor.chain().focus().redo().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faRotateRight} />
                          </button>

                        </div>
                      )}

                      {/* Editor Box */}
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderBottomLeftRadius: "6px",
                          borderBottomRightRadius: "6px",
                          padding: "10px",
                          minHeight: "150px",
                        }}
                      >
                        <EditorContent editor={editor} />
                      </div>
                    </div>
                    <small className="d-block mt-2" style={{color: '#909396'}}>Use [NAME], [Email], [Phone] for personalization</small>

                    <div className="mb-3 mt-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Subject Line <span style={{color: '#DC2626'}}>*</span></label>
                    <select
                      className={`w-100 ${stylesItem['input-item']}`}
                    >
                      <option value="email">Send via email</option>
                      <option value="sms">Send via sms</option>
                    </select>
                  </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Schedule Campaign</p>
                  <small className="d-block" style={{color: '#78716C'}}>Choose when to send your campaign</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div>
                    <div className="mb-3 mt-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Send Option <span style={{color: '#DC2626'}}>*</span></label>
                    <select
                      className={`w-100 ${stylesItem['input-item']}`}
                    >
                      <option value="email">Send immediately</option>
                      <option value="sms">Send later</option>
                    </select>
                  </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Target Audience</p>
                  <small className="d-block" style={{color: '#78716C'}}>Select customers to receive this campaign</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div className="row mb-3 align-items-center">
                    <div className="col-md-7">
                      <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                        <input
                          type="text"
                          className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                          placeholder="Search for customers"
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
                    <div className="col-md-5">
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
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selected.length === mkData.length}
                      onChange={toggleSelectAll}
                    />
                    <label className="form-check-label ms-2 fw-semibold">
                      Select All ({mkData.length})
                    </label>
                  </div>

                  <span className="text-muted">{selected.length} selected</span>
                </div>

                  <div className="d-flex flex-column gap-3">
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        className="d-flex justify-content-between align-items-center border rounded-3 p-3"
                      >
                        {/* Checkbox + Info */}
                        <div className="d-flex gap-3 align-items-center">
                          <div className={`mb-3`}>
                            <label className={`${styles['custom-checkbox-wrapper']}`}>
                            <input
                              type="checkbox"
                              className={`${styles['custom-checkbox']}`}
                              checked={selected.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                            <span className={styles.checkmark}></span>
                            </label>
                          </div>

                          <div>
                            <div className="fw-bold">{c.name}</div>
                            <small className="text-muted">{c.email}</small>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`badge rounded-pill px-3 py-2 ${c.badge}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className='text-center mt-3'>
          <button className={`mx rounded-3 me-2 ${stylesItem.pbtn}`}>Save as Draft</button>
          <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`}>Launch Campaign</button>
        </div>
      </>
    )}

    {page === 'third' && (
      <>
        <div className="d-flex justify-content-between">
          <div>
            <button className="btn nx" style={{fontSize: '15px'}} onClick={() => setPage('first')}><FontAwesomeIcon icon={faChevronLeft} className='nx me-2'/>Back to Marketing</button>
            <h6 className="bx" style={{margin: '8px 15px'}}>Edit Campaign</h6>
          </div>
          <div className='d-flex gap-3'>
            <div>
              <button className={`mx ms-auto rounded-3 text-dark ${stylesItem.vBtn}`} onClick={() => setSort(false)}>Save as Draft</button>
            </div>
            <div>
              <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`} onClick={() => setSort(false)}>Launch Campaign</button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-7">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Campaign Details</p>
                  <small className="d-block" style={{color: '#78716C'}}>Set up your campaign basics</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Campaign Name <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Campaign Type <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Email Campaign"
                    />
                  </div>
                  <div className={`mb-3`}>
                    <label className={`${styles['custom-checkbox-wrapper']}`}>
                    <input
                      type="checkbox"
                      className={`${styles['custom-checkbox']}`}
                    />
                    <span className={styles.checkmark}></span>
                    <span className="label-text mx mt-1" style={{fontSize: '13px'}}>Use Predefined Template</span>
                    </label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Subject Line <span style={{color: '#DC2626'}}>*</span></label>
                    <input
                      type="text"
                      className={`w-100 ${stylesItem['input-item']}`}
                      placeholder="Enter subject line"
                    />
                  </div>
                  <div>
                    <small className='d-block mb-2'>Message Content</small>
                    <div>
                      {editor && (
                        <div style={{ 
                          background: '#F3F3F3',
                          borderTopLeftRadius: "6px",
                          borderTopRightRadius: "6px",
                          }} className='p-2'>
                          <button onClick={() => editor.chain().focus().toggleBold().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faBold} />
                          </button>

                          <button onClick={() => editor.chain().focus().toggleItalic().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faItalic} />
                          </button>

                          <button onClick={() => editor.chain().focus().undo().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faRotateLeft} />
                          </button>

                          <button onClick={() => editor.chain().focus().redo().run()} type='button' className='btn'>
                            <FontAwesomeIcon icon={faRotateRight} />
                          </button>

                        </div>
                      )}

                      {/* Editor Box */}
                      <div
                        style={{
                          border: "1px solid #eee",
                          borderBottomLeftRadius: "6px",
                          borderBottomRightRadius: "6px",
                          padding: "10px",
                          minHeight: "150px",
                        }}
                      >
                        <EditorContent editor={editor} />
                      </div>
                    </div>
                    <small className="d-block mt-2" style={{color: '#909396'}}>Use [NAME], [Email], [Phone] for personalization</small>

                    <div className="mb-3 mt-3">
                      <label className="form-label" style={{fontSize: '13px'}}>Subject Line <span style={{color: '#DC2626'}}>*</span></label>
                      <select
                        className={`w-100 ${stylesItem['input-item']}`}
                      >
                        <option value="email">Send via email</option>
                        <option value="sms">Send via sms</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Schedule Campaign</p>
                  <small className="d-block" style={{color: '#78716C'}}>Choose when to send your campaign</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div>
                    <div className="mb-3 mt-3">
                    <label className="form-label" style={{fontSize: '13px'}}>Send Option <span style={{color: '#DC2626'}}>*</span></label>
                    <select
                      className={`w-100 ${stylesItem['input-item']}`}
                    >
                      <option value="email">Send immediately</option>
                      <option value="sms">Send later</option>
                    </select>
                  </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
              <div className="card-body p-0">
                <div className="p-3">
                  <p className="card-title mx" style={{color: '#1C1917'}}>Target Audience</p>
                  <small className="d-block" style={{color: '#78716C'}}>Select customers to receive this campaign</small>
                </div>
                <hr className='m-0'/>
                
                <form className='p-3'>
                  <div className="row mb-3 align-items-center">
                    <div className="col-md-7">
                      <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                        <input
                          type="text"
                          className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                          placeholder="Search for customers"
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
                    <div className="col-md-5">
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
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selected.length === mkData.length}
                      onChange={toggleSelectAll}
                    />
                    <label className="form-check-label ms-2 fw-semibold">
                      Select All ({mkData.length})
                    </label>
                  </div>

                  <span className="text-muted">{selected.length} selected</span>
                </div>

                  <div className="d-flex flex-column gap-3">
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        className="d-flex justify-content-between align-items-center border rounded-3 p-3"
                      >
                        {/* Checkbox + Info */}
                        <div className="d-flex gap-3 align-items-center">
                          <div className={`mb-3`}>
                            <label className={`${styles['custom-checkbox-wrapper']}`}>
                            <input
                              type="checkbox"
                              className={`${styles['custom-checkbox']}`}
                              checked={selected.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                            <span className={styles.checkmark}></span>
                            </label>
                          </div>

                          <div>
                            <div className="fw-bold">{c.name}</div>
                            <small className="text-muted">{c.email}</small>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`badge rounded-pill px-3 py-2 ${c.badge}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className='text-center mt-3'>
          <button className={`mx rounded-3 me-2 ${stylesItem.pbtn}`}>Save as Draft</button>
          <button className={`mx ms-auto rounded-3 ${stylesItem.jBtn}`}>Launch Campaign</button>
        </div>
      </>
    )}

    {details && (
      <>
        <div className={styles['modal-overlay']} onClick={hideModal}>
          <div className={styles['modal-content2']} style={{background: '#fff'}} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between p-3">
                <h6>Campaign Details</h6>
                <FontAwesomeIcon icon={faTimes} onClick={hideModal}/>
              </div>
              <hr className='m-0'/>
              <div className={`${styles['modal-body']} px-3 py-2`} style={{background: '#fff'}}>
                <p className='my m-0'>Summer Sale 2025 <button className={`rounded-4 ${stylesItem['status-btn']} ${stylesItem['in-stock']}`}>Sent</button></p>
              </div>
              <hr className='m-0'/>
              <div className="d-flex justify-content-between m-3">
                <div>
                  <small className='d-block mb-2' style={{color: '#78716C'}}>Campaign Type</small>
                  <small className='d-block'><FontAwesomeIcon icon={faEnvelope} />Email</small>
                </div>
                <div>
                  <small className='d-block mb-2' style={{color: '#78716C'}}>Recipient</small>
                  <small className='d-block'>1,247</small>
                </div>
                <div>
                  <small className='d-block mb-2' style={{color: '#78716C'}}>Revenue Generated</small>
                  <small className='d-block text-success'>₦4,500</small>
                </div>
              </div>

              <div className="p-3">
                <p style={{color: '#78716C'}}>Subject Line</p>

                <p style={{background: '#FAFAFA', border: '1px solid #eee'}} className='p-2'>Summer Sale - Up to 50% Off Everything!</p>
              </div>

              <div className="p-3">
                <p style={{color: '#78716C'}}>Message Content</p>

                <p style={{background: '#FAFAFA', border: '1px solid #eee'}} className='p-3'>Don't miss our biggest sale of the year! Get up to 50% off on all products...
                  Shop now and save big on:<br/><br/><br/>

                  Electronics - Up to 40% off<br/>
                  Fashion - Up to 50% off<br/>
                  Home & Garden - Up to 35% off<br/><br/>

                  <span className='my text-dark'>Limited time offer! Sunday.</span> Sale ends midnight<br/><br/>

                  <button className={`my ${stylesItem.shopBtn}`}>Shop Now →</button>
                </p>
              </div>

              <div className="text-end p-2">
                <button className={`${stylesItem.jBtn} px-5 py-3 rounded-3`}>Close</button>
              </div>
          </div>
        </div>
      </>
    )}
    </>
  )
}

export default Marketing