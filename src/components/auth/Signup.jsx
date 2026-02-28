import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerForm, resetStatus } from '../../slice/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { Logo, Bg, Gs, G12 } from '../../assets';
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [regData, setRegData] = useState({
    name: '',
    subdomain: '',
    adminEmail: '',
    adminPassword: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target;

    setRegData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const { loading, error, success } = useSelector((state) => state.user);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, subdomain, adminEmail, adminPassword} = regData;

    if (!name || !subdomain || !adminEmail || !adminPassword) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please fill in all fields",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    dispatch(registerForm(regData));
  }

  useEffect(() => {
  if (success) {
    Swal.fire({
      icon: "success",
      title: "Registration Successful",
      text: success.message || "Redirecting to login...",
      confirmButtonColor: "#0273F9",
    }).then(() => {
      dispatch(resetStatus());
      navigate("/vendor/welcome");
    });
  }

  if (error) {
    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: error,
      confirmButtonColor: "#0273F9",
    }).then(() => {
      dispatch(resetStatus());
    });
  }
}, [success, error, dispatch, navigate]);


  return (
    <>
      <div
        style={{
          backgroundImage: `url(${Bg})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          height: '100vh'
        }}
      >
        <div className="text-center pb-5" style={{ paddingTop: '60px' }}>
          <img src={Logo} alt="" style={{ width: '11%' }} />
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className={`${styles.vLog} text-center bg-white p-4`} style={{ maxWidth: '600px', width: '100%', borderRadius: '25px' }}>
            <h4 style={{ color: '#1C1917' }}>Sign up to Mycroshop</h4>
            <small style={{ color: '#78716C' }}>Welcome! Please fill in the details to get started.</small>
            <small className="d-block">
              Already have an account?
              <Link to="/vendor/login" style={{ color: '#0273F9', textDecoration: 'none' }} className="mx-2">
                Sign in
              </Link>
            </small>

            <form className="mt-4 px-5" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className={`${styles['gro-input']} w-100 my-3`}
                  placeholder="Name"
                  value={regData.name}
                  onChange={handleChange}
                  name="name"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className={`${styles['gro-input']} w-100`}
                  placeholder="Subdomain"
                  value={regData.subdomain}
                  onChange={handleChange}
                  name="subdomain"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className={`${styles['gro-input']} my-3 w-100`}
                  placeholder="Email address"
                  value={regData.adminEmail}
                  onChange={handleChange}
                  name='adminEmail'
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  className={`${styles['gro-input']} w-100`}
                  placeholder="Password"
                  value={regData.adminPassword}
                  onChange={handleChange}
                  name='adminPassword'
                />
              </div>
              <button className={`${styles['si-btn']} w-100 mt-3 mt-2`}>
                {
                  loading ?(
                      <>
                      <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="sr-only"></span>
                      </div>
                      <span>Creating... </span>
                      </>
                      
                  ): (
                    'Sign Up'
                  )
                }
              </button>
            </form>

            <p style={{ color: '#78716C' }} className="mt-2">Or sign up with</p>

            <button className={`${styles['g-btn']} mx-3`}>
              <img src={Gs} alt="" className={`mx-3 ${styles.im}`} />
              Google
            </button>
            <button className={`${styles['g-btn']}`}>
              <img src={G12} alt="" className={`mx-3 ${styles.im}`} />
              Facebook
            </button>

            <small className="d-block mt-3" style={{ color: '#78716C' }}>
              By signing up you agree to Mycroshop Terms & Policies
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
