import React from 'react'
import { Logo, Su, Bg } from '../../assets';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const AuthWelcome = () => {
  const navigate = useNavigate();

  const gotoLogin = (e) => {
    e.preventDefault()
    navigate('/login')
  }
  return (
    <>
      <div className="container p-3">
        <div className="d-flex justify-content-between">
            <div className="img-tag">
                <img src={Logo} alt="" className='w-50'/>
            </div>
            <div>
                <Button variant='primary' size='sm'>Sign in</Button>
            </div>
        </div>
      </div>
      <div style={{
          backgroundImage: `url(${Bg})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          height: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
            <div>
                <div className='bg-white p-3 rounded-3' style={{border: '1px solid #EEEDED'}}>
                    <div className="img-cd text-center mt-3">
                        <img src={Su} alt="" style={{width: '17%'}}/>
                    </div>
                    <div className="body-text my-3">
                        <h5 className='bx px-5'>Free Account Created Successfully</h5>
                        <p className='d-block px-4' style={{color: '#78716C'}}>You now have access to Mycroshop free features</p>

                        <div className="mt-4">
                            <small className="d-block mb-3" style={{color: '#78716C'}}>Next Steps:</small>
                            <small className="d-block" style={{color: '#78716C'}}>1. Set up your online store
                            </small>
                            <small className="d-block" style={{color: '#78716C'}}>
                                2. Add your first product
                            </small>
                            <small className="d-block" style={{color: '#78716C'}}>
                                3. Customize your storefront
                            </small>
                        </div>

                        <div className="mt-5">
                          <Button variant='primary' size='lg' className='w-100 mb-3' onClick={gotoLogin}>Get Started</Button>
                          <Button variant='secondary' size='lg' className='w-100'>Skip Tour</Button>
                        </div>
                    </div>
                </div>
            </div>
      </div>
    </>
  )
}

export default AuthWelcome