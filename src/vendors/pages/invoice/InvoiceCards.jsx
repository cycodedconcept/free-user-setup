import React from 'react'
import styles from "../../../styles.module.css";

const InvoiceCards = ({ cardDetails = [] }) => {

  const cardItem = cardDetails.map((item) => 
    <div key={item.id} className={styles.vendorInvoiceStatCard}>
      <div className="rounded-3 py-3 px-2 h-100 d-flex flex-column justify-content-between">
        <div className="d-flex justify-content-between">
          <div className='mt-2'>
            <small className="d-block" style={{fontSize: '12px'}}>{item.name}</small>
          </div>
          <div className='text-end'>
            <img src={item.icon} alt={item.name} className='w-50'/>
          </div>
        </div>

        <small className="d-block mx mt-2">{item.figure}</small>
      </div>
    </div>
  )
  return (
    <>
        <div className={styles.vendorInvoiceCardsGrid}>
          {cardItem}
        </div>
    </>
  )
}

export default InvoiceCards
