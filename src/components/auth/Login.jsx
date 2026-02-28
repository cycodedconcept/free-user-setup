import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginForm, resetStatus } from '../../slice/authSlice'
import { Link, useNavigate } from 'react-router-dom';
import { Logo, Bg, Gs, G12 } from '../../assets';
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [logData, setLogData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLogData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const { loading, error, success } = useSelector((state) => state.user);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { email, password } = logData;

    if (!email || !password) {
      Swal.fire({
        icon: "info",
        title: "Missing Fields",
        text: "Please fill in all fields",
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    dispatch(loginForm(logData))
  }

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: success.message || "Redirecting to Dashboard...",
        confirmButtonColor: "#0273F9",
      }).then(() => {
        dispatch(resetStatus());
        navigate("/vendor/store-set-up");
      });
    }

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error,
        confirmButtonColor: "#0273F9",
      }).then(() => {
        dispatch(resetStatus());
      });
    }
  }, [success, error, dispatch, navigate])


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
            <h4 style={{ color: '#1C1917' }}>Sign in to Mycroshop</h4>
            <small style={{ color: '#78716C' }}>Welcome back! Please log in to continue</small>
            <small className="d-block">
              Don’t have an account?
              <Link to="/vendor" style={{ color: '#0273F9', textDecoration: 'none' }} className="mx-2">
                Sign up
              </Link>
            </small>

            <form className="mt-4 px-5" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className={`${styles['gro-input']} my-3 w-100`}
                  placeholder="Email address"
                  name='email'
                  value={logData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  className={`${styles['gro-input']} my-3 w-100`}
                  placeholder="Password"
                  name='password'
                  value={logData.password}
                  onChange={handleChange}
                />
              </div>
              <button className={`${styles['si-btn']} w-100 mt-2`}>
                {
                  loading ?(
                      <>
                      <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="sr-only"></span>
                      </div>
                      <span>Logging... </span>
                      </>
                      
                  ): (
                    'Sign In'
                  )
                }
              </button>
            </form>

            <p style={{ color: '#78716C' }} className="my-4">Or sign in with</p>

            <button className={`${styles['g-btn']} mx-3`}>
              <img src={Gs} alt="" className={`mx-3 ${styles.im}`} />
              Google
            </button>
            <button className={styles['g-btn']}>
              <img src={G12} alt="" className={`mx-3 ${styles.im}`} />
              Facebook
            </button>

            <small className="d-block mt-3" style={{ color: '#78716C' }}>
              By signing in you agree to Mycroshop Terms & Policies
            </small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
