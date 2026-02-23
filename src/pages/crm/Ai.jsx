import React, { useState, useEffect, useRef } from 'react'
import { F, men } from '../../assets'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEnvelopeOpen, faWandMagicSparkles, faPlugCircleBolt, faUsers, faChartBar, faUserFriends, faUserPlus, faSliders, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faWeixin } from "@fortawesome/free-brands-svg-icons";
import stylesItem from '../../Tabs.module.css';
import styles from "../../styles.module.css";


const Ai = () => {
  const [more, setMore] = useState(false)
  const [aiOpen, setAiOpen] = useState(true);
  const [pop, setPop] = useState(false)

  const filterRef = useRef(null);
  const triggerRef = useRef(null);

  const channels = ["All Channels", "TikTok", "WhatsApp", "Instagram", "Facebook", "Telegram", "Others"];
  const status = ["All Statuses", "New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

  useEffect(() => {
    if (!pop) return;

    const handleClickOutside = (e) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPop(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pop]);

  




  return (
    <>
      <div className="row">
        <div className={`bg-white shadow-sm transition-all duration-300 ${
            aiOpen ? "col-md-3 p-3" : "col-md-1 p-2"
          }`}
          style={{ margin: "0 13px", height: "100vh" }}
        >
          <div
            className={`d-flex align-items-center ${
              aiOpen ? "justify-content-between" : "justify-content-center mt-2"
            }`}
          >
            {aiOpen && <h5 className="bx mb-0">AI Assistant</h5>}

            <img
              src={men}
              alt="toggle"
              style={{
                cursor: "pointer",
                transform: aiOpen ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 0.3s ease"
              }}
              onClick={() => setAiOpen(prev => !prev)}
            />
          </div>


          <small 
            className={`d-flex align-items-center my-4 bx ${
                !aiOpen ? "justify-content-center w-100" : ""
            }`} 
            style={{ color: "#78716C" }}>
            Inbox
          </small>

          <div className={`d-flex justify-content-between py-2 pe-2 rounded-3 ${stylesItem.un}`}>
            <div
              className={`d-flex align-items-center ${
                !aiOpen ? "justify-content-center w-100" : ""
              }`}
            >
              <div className="position-relative">
                <FontAwesomeIcon icon={faEnvelope} className={`${!aiOpen ? "m-0" : "ms-2"}`}/>

                {!aiOpen && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{
                      background: "#E7FFE4",
                      fontSize: "10px",
                      padding: "3px 6px",
                      color: "#000"
                    }}
                  >
                    0
                  </span>
                )}
              </div>

              {aiOpen && <p className="py-1 px-2 m-0">All</p>}
            </div>

            {aiOpen && (
              <p className="py-1 px-2 m-0" style={{ background: "#E7FFE4" }}>
                0
              </p>
            )}
          </div>

          <div className={`d-flex justify-content-between py-2 pe-2 rounded-3 ${stylesItem.un}`}>
            <div
              className={`d-flex align-items-center ${
                !aiOpen ? "justify-content-center w-100" : ""
              }`}
            >
              <div className="position-relative">
                <FontAwesomeIcon icon={faEnvelopeOpen} className={`${!aiOpen ? "m-0" : "ms-2"}`}/>

                {!aiOpen && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{
                      background: "#E4F0FF",
                      fontSize: "10px",
                      padding: "3px 6px",
                      color: "#000"
                    }}
                  >
                    0
                  </span>
                )}
              </div>

              {aiOpen && <p className="py-1 px-2 m-0">Read</p>}
            </div>

            {aiOpen && (
              <p className="py-1 px-2 m-0" style={{ background: "#E4F0FF" }}>
                0
              </p>
            )}
          </div>

          <div className={`d-flex justify-content-between py-2 pe-2 rounded-3 ${stylesItem.un}`}>
            <div
              className={`d-flex align-items-center ${
                !aiOpen ? "justify-content-center w-100" : ""
              }`}
            >
              <div className="position-relative">
                <FontAwesomeIcon icon={faEnvelope} className={`${!aiOpen ? "m-0" : "ms-2"}`}/>

                {!aiOpen && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                    style={{
                      background: "#EEEEEE",
                      fontSize: "10px",
                      padding: "3px 6px",
                      color: "#000"
                    }}
                  >
                    0
                  </span>
                )}
              </div>

              {aiOpen && <p className="py-1 px-2 m-0">Unread</p>}
            </div>

            {aiOpen && (
              <p className="py-1 px-2 m-0" style={{ background: "#EEEEEE" }}>
                0
              </p>
            )}
          </div>

          <small
            className={`d-flex align-items-center my-4 bx ${
                !aiOpen ? "justify-content-center w-100" : ""
            }`}
            style={{ color: "#78716C", cursor: "pointer" }}
            onClick={() => setMore(prev => !prev)}
          >
            {more ? "Less" : "More"}
          </small>


          {more && (
            <>
              <p className={`p-2 rounded-3 ${stylesItem.un} d-flex align-items-center`}>
                <FontAwesomeIcon icon={faWandMagicSparkles} className={`d-flex align-items-center ${
                !aiOpen ? "justify-content-center w-100 m-0" : ""
                }`}/>
                {aiOpen && <span className="ms-2">AI Business Agent</span>}
              </p>

              <p className={`p-2 rounded-3 ${stylesItem.un} align-items-center`}>
                <FontAwesomeIcon icon={faPlugCircleBolt} className={`${
                !aiOpen ? "justify-content-center w-100 ms-0" : ""
                }`}/>
                {aiOpen && <span className="ms-2">Channels</span>}
              </p>

              <div className={`d-flex justify-content-between py-2 pe-2 rounded-3 ${stylesItem.un}`}>
                <div
                  className={`d-flex align-items-center ${
                    !aiOpen ? "justify-content-center w-100" : ""
                  }`}
                >
                  <div className="position-relative">
                    <FontAwesomeIcon icon={faUsers} className={`${!aiOpen ? "m-0" : "ms-2"}`}/>

                    {!aiOpen && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                        style={{
                          background: "#EEEEEE",
                          fontSize: "10px",
                          padding: "3px 6px",
                          color: "#000"
                        }}
                      >
                        0
                      </span>
                    )}
                  </div>

                  {aiOpen && <p className="py-1 px-2 m-0">Leads</p>}
                </div>

                {aiOpen && (
                  <p className="py-1 px-2 m-0" style={{ background: "#EEEEEE" }}>
                    0
                  </p>
                )}
              </div>
              <p className={`p-2 rounded-3 mt-2 ${stylesItem.un} align-items-center`}>
                <FontAwesomeIcon icon={faChartBar} className={` ${
                !aiOpen ? "justify-content-center w-100 m-0" : ""
                }`}/>
                {aiOpen && <span className="ms-2">Analytics</span>}
              </p>
              <p className={`p-2 rounded-3 mt-2 ${stylesItem.un} align-items-center`}>
                <FontAwesomeIcon icon={faUserFriends} className={`${
                !aiOpen ? "justify-content-center w-100 m-0" : ""
                }`}/>
                {aiOpen && <span className="ms-2">Teams</span>}
              </p>
            </>
          )}

        </div>
        <div className="col-md-3 bg-white py-3 px-0 shadow-sm" style={{ margin: '0 -19px', height: '100vh'}}>
          <div className="d-flex justify-content-between px-3">
            <div className="d-flex gap-3">
              <p className="my">Chats</p>
              <p>Calls</p>
            </div>
            <div>
              <FontAwesomeIcon icon={faUserPlus} />
            </div>
          </div>
          <hr className='m-0' style={{border: '2px solid #eeeeeeff'}}/>
          <div className="d-flex gap-2 m-2 position-relative">
            <div>
              <div className={`input-group`} style={{outline: 'none', boxShadow: 'none'}}>
                <input
                  type="text"
                  className={`form-control border-end-0 ${styles['input-item']} ${styles.chuk}`}
                  placeholder="Search for customer"
                  // value={searchTerm}
                  // onChange={(e) => setSearchTerm(e.target.value)}
                  style={{}}
                />
                <span className="input-group-text bg-white border-start-0">
                  <i className="fas fa-search text-muted"></i>
                  🔍
                </span>
              </div>
            </div>
            <div>
              <FontAwesomeIcon icon={faSliders} style={{border: '1px solid #eee', padding: '10px 12px'}} className='rounded-3' 
              onClick={() => setPop((prev) => !prev)}
              />
            </div>
            {pop && (
            <>
            <div className={`${stylesItem['filter-box']} shadow-sm m-3`} 
            ref={filterRef}
            style={{
              position: "absolute",
              top: "35px",
              right: "0",
              width: "220px",
              background: "#fff",
              borderRadius: "8px",
              zIndex: 1000,
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <small className='p-2'>Filter</small>
                <FontAwesomeIcon icon={faTimes} className='p-2' style={{cursor: 'pointer'}} onClick={() => setPop(false)}/>
              </div>
              <hr className='m-0' style={{border: '2px solid #eeeeeeff'}}/>
              <div className="p-2">
                <div className="mb-3 mt-3">
                <select
                  className={`w-100 ${stylesItem['input-item']}`}
                  style={{fontSize: '12px'}}
                >
                  {channels.map((item, index) => 
                    <option key={index} value={item}>{item}</option>
                  )}
                </select>
              </div>

              <div className="mb-3 mt-3">
                <select
                  className={`w-100 ${stylesItem['input-item']}`}
                  style={{fontSize: '12px'}}
                >
                  {status.map((item, index) => 
                    <option key={index} value={item}>{item}</option>
                  )}
                </select>
              </div>
              <button className={`mx ms-auto rounded-3 w-100 ${stylesItem.jBtn}`}>Apply</button>
              </div>
            </div>
            </>
          )} 
          </div>
          
          <hr className='m-0' style={{border: '2px solid #eeeeeeff'}}/>

          <div className="text-center mx-4 my-5">
            <FontAwesomeIcon icon={faWeixin} size='3x' className='mb-3'/>
            <p className='mx m-0' style={{fontSize: '14px'}}>No conversations yet</p>
            <small className="d-block mt-2" style={{fontSize: '11px', color: '#78716C'}}>Start a new chat with your customers</small>
          </div>
        </div>
        <div className="col-md-6">
          <div className="text-center" style={{margin: '40% auto'}}>
            <FontAwesomeIcon icon={faWeixin} size='3x' className='mb-3 p-3 rounded-pill' style={{color: '#0273F9', background: '#EAF4FF'}}/>
            <h5 className='mx m-0'>AI Business Assistant</h5>
            <small className="d-block mt-2" style={{fontSize: '11px', color: '#78716C'}}>Your intelligent assistant for tracking chats<br/> across different social media platform all<br/> from one place</small>

            <button className={`mx ms-auto rounded-3 mt-3 ${stylesItem.jBtn}`}>Add New Contact</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Ai