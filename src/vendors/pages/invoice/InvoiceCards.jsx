import React from 'react'

const InvoiceCards = ({ cardDetails = [] }) => {

  const cardItem = cardDetails.map((item) => 
    <div key={item.id} style={{flex: 1}}>
      <div style={{border: '1px solid #eee', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}} className='rounded-3 py-3 px-2 bg-white'>
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
        <div className="d-flex my-4" style={{gap: '6px'}}>
          {cardItem}
        </div>
    </>
  )
}

export default InvoiceCards
