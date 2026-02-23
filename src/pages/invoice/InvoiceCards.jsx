import React from 'react'
import { Tiv, Pb2, Tp, Tm, Upi } from '../../assets';


const InvoiceCards = () => {
  const cardDetails = [
    {
        id: 0,
        name: "Total Invoice",
        figure: 48,
        icon: Tiv
    },
    {
        id: 1,
        name: "Paid Invoice",
        figure: 15,
        icon: Pb2
    },
    {
        id: 3,
        name: "Unpaid Invoices",
        figure: 10,
        icon: Upi
    },
    {
        id: 2,
        name: "Overdue",
        figure: 23,
        icon: Tp
    },
    {
        id: 4,
        name: "Total Value",
        figure: "₦28,350",
        icon: Tm
    }
  ];

  const cardItem = cardDetails.map((item) => 
    <div key={item.id} style={{flex: 1}}>
      <div style={{border: '1px solid #eee', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}} className='rounded-3 py-3 px-2 bg-white'>
        <div className="d-flex justify-content-between">
          <div className='mt-2'>
            <small className="d-block" style={{fontSize: '12px'}}>{item.name}</small>
          </div>
          <div className='text-end'>
            <img src={item.icon} alt="" className='w-50'/>
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