import React, {useState} from 'react'
import styles from "../../styles.module.css";
// import { auditData } from '../data';
import { Re, Reb } from '../../assets'

const ReturnAudit = () => {
  const cardDetails = [
    {
      name: 'Total Returned Items',
      image: Reb,
      value: '23'
    },
    {
      name: 'Total Value Lost',
      image: Re,
      value: '₦1,535.00'
    },
  ]
  return (
    <>
      <div>
        <h6 className="bx">Return Audit</h6>
        <small className="d-block">Track all returned items for better record keeping</small>
      </div>
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0 mb-3">
              <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Return Overview</h6>
              <hr className='m-0'/>
              {cardDetails.map((item, index) =>
                <div className="rounded-3 p-3 m-3" key={index} style={{border: '1px solid #eee'}}>
                  <div className="d-flex justify-content-between">
                    <div>
                     <small className="d-block mb-4" style={{color: '#78716C'}}>{item.name}</small>
                     <small className="d-block mx" style={{color: `${item.name === 'Total Value Lost' ? '#DC2626': ''}`}}>{item.value}</small>
                    </div>
                    <div className='text-end'>
                      <img src={item.image} alt="" className='w-50'/>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
            <div className="card-body p-0">
              <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Most Returned Product</h6>
              <hr className='m-0'/>
              <div className="m-3">
                <table style={{width:"100%", borderCollapse: 'collapse', fontSize: '15px'}}>
                <thead style={{background: '#F9F9F9'}}>
                  <tr style={{borderBottom: '1px solid #ddd'}}>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#000'}} className='nx px-3'>Product</th>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#000'}} className='nx px-3'>Unit</th>
                    <th style={{textAlign: 'left', padding: '10px 0', color: '#000'}} className='nx px-3'>Total</th>
                  </tr>
                </thead>

                <tbody>
                  <tr style={{borderBottom: '2px solid #eee'}}>
                    <td style={{padding:'12px 0'}} className='nx px-3'>Binatone Blender</td>
                    <td className='nx px-3'>12</td>
                    <td className='nx px-3'>₦1589.98</td>
                  </tr>
                  <tr style={{borderBottom: '2px solid #eee'}}>
                    <td style={{padding:'12px 0'}} className='nx px-3'>LG Deep Freezer</td>
                    <td className='nx px-3'>3</td>
                    <td className='nx px-3'>₦1249.90</td>
                  </tr>
                  <tr style={{borderBottom: '2px solid #eee'}}>
                    <td style={{padding:'12px 0'}} className='nx px-3'>Binatone Blender</td>
                    <td className='nx px-3'>3</td>
                    <td className='nx px-3'>LG 2” TV</td>
                  </tr>
                  <tr>
                    <td style={{padding:'12px 0'}} className='nx px-3'>Samsung Wireless Sound System</td>
                    <td className='nx px-3'>2</td>
                    <td className='nx px-3'>₦651.58</td>
                  </tr>
                </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm rounded-3 mt-4" style={{border: '1px solid #eee'}}>
        <div className="card-body p-0">
          <h6 className="card-title mx p-3" style={{color: '#1C1917'}}>Return History</h6>
          <hr className='m-0'/>

          <div className="table-responsive m-3">
            <table className="table table-hover">
              <thead className="table-light">
                <tr className={styles.tableHeader}>
                  <th scope="col" className="fw-semibold">SKU </th>
                  <th scope="col" className="fw-semibold">Date</th>
                  <th scope="col" className="fw-semibold">Product</th>
                  <th scope="col" className="fw-semibold">Reason For Return</th>
                  <th scope="col" className="fw-semibold">Quantity</th>
                  <th scope="col" className="fw-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
              {auditData.map((item, index) => 
                <tr key={index}>
                  <td style={{fontSize: '12px'}}>{item.sku}</td>
                  <td style={{fontSize: '12px'}}>{item.date}</td>
                  <td style={{fontSize: '12px'}}>{item.product}</td>
                  <td style={{fontSize: '12px'}}>{item.rfr}</td>
                  <td style={{fontSize: '12px'}}>{item.quantity}</td>
                  <td style={{fontSize: '12px'}}>{item.total}</td>
                </tr>
              )}
              </tbody>

            </table>
          </div>

          {auditData.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No order found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ReturnAudit