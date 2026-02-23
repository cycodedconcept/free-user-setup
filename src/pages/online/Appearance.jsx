import React, { useState, useRef, useEffect } from 'react'
import { storeUpdateColors, updateStoreImages, resetStatus } from '../../slice/onlineStoreSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Ac } from '../../assets'
import styles from "../../styles.module.css";
import Swal from 'sweetalert2';

const Appearance = () => {
  const dispatch = useDispatch();
  let token = localStorage.getItem("token");
  let getId = localStorage.getItem("itemId");
  const { loading, error, success } = useSelector((state) => state.store);
  const [selectedStyle, setSelectedStyle] = useState('rounded');
  const [buttonColor, setButtonColor] = useState('#78716C');
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [color, setColor] = useState('#F2EFEF')
  const [im, setIm] = useState({
    profile: null,
    cover: null,
    background: null,
  });
  const [imageFiles, setImageFiles] = useState({
    logo: null,
    banner: null,
    background: null,
  });

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const backInputRef = useRef(null);

  const handleImageChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      // Store actual file for FormData
      const fileKey = key === 'profile' ? 'logo' : key === 'cover' ? 'banner' : 'background';
      setImageFiles((prev) => ({
        ...prev,
        [fileKey]: file,
      }));

      // Store base64 for preview
      const reader = new FileReader();
      reader.onloadend = () =>
        setIm((prev) => ({
          ...prev,
          [key]: reader.result,
        }));
      reader.readAsDataURL(file);
    }
  };

  const triggerInput = (ref) => ref.current.click();

  const handleColorChange = (type, color) => {
    if (type === 'button') {
      setButtonColor(color);
    } else if (type === 'font') {
      setFontColor(color);
    }
  };

  const updateColors = (e) => {
    e.preventDefault();
    dispatch(storeUpdateColors({
      token,
      background_color: color,
      button_style: selectedStyle,
      button_color: buttonColor,
      button_font_color: fontColor,
      id: getId || '7'
    }));
  };

  const updateImagesForStore = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    if (imageFiles.logo) formData.append('logo', imageFiles.logo);
    if (imageFiles.banner) formData.append('banner', imageFiles.banner);
    if (imageFiles.background) formData.append('background', imageFiles.background);

    dispatch(updateStoreImages({
      token,
      formData,
      id: getId || '7'
    }));
  };

  useEffect(() => {
    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Store updated successfully',
      });
      // Reset color inputs
      setSelectedStyle('rounded');
      setButtonColor('#78716C');
      setFontColor('#FFFFFF');
      setColor('#F2EFEF');
      // Reset image inputs
      setIm({
        profile: null,
        cover: null,
        background: null,
      });
      setImageFiles({
        logo: null,
        banner: null,
        background: null,
      });
    }
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Failed to update store',
      });
    }
    // Reset Redux state to prevent unwanted side effects
    if (success || error) {
      dispatch(resetStatus());
    }
  }, [success, error, dispatch]);

  return (
    <>
     <div className="imgbox p-3" style={{background: '#fff', border: '1px solid #EEEEEE', borderRadius: '12px'}}>
      <h6 style={{color: '#1C1917'}}>Store Appearance</h6>
      <small className='d-block' style={{color: '#78716C'}}>Customize how your store looks to match your brand</small>

      <form onSubmit={updateImagesForStore}>
        <small className="d-block mt-3 mb-2">Profile Logo</small>
        <div style={dropdownStyles.container}>
          <label htmlFor="imageUpload" style={dropdownStyles.imageWrapper}>
              <div style={dropdownStyles.imageCircle} onClick={() => triggerInput(profileInputRef)}>
              {im.profile ? (
                <img src={im.profile} alt="Preview" style={dropdownStyles.previewImage} />
              ) : (
                <div style={dropdownStyles.placeholderCircle} />
              )}

              </div>

              <input
                type="file"
                accept="image/*"
                ref={profileInputRef}
                onChange={(e) => handleImageChange(e, "profile")}
                style={{ display: "none" }}
              />
              <button type="button" style={dropdownStyles.uploadBtn} onClick={() => triggerInput(profileInputRef)}>
                <img src={Ac} alt="" style={{width: '15%'}} className='me-2'/>
                Upload Image
              </button>
          </label>
          <p style={dropdownStyles.note}>Recommended: Square image, at least 300×300px</p>
        </div>

        <small className="d-block mt-3 mb-2">Banner Image</small>
        <div style={dropdownStyles.container}>
          <label htmlFor="imageUpload" style={dropdownStyles.imageWrapper}>
              <div style={dropdownStyles.imageCircle} onClick={() => triggerInput(coverInputRef)}>
              {im.cover ? (
                <img src={im.cover} alt="Preview" style={dropdownStyles.previewImage} />
              ) : (
                <div style={dropdownStyles.placeholderBanner} />
              )}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={coverInputRef}
                onChange={(e) => handleImageChange(e, "cover")}
                style={{ display: "none" }}
              />
              <button type="button" style={dropdownStyles.uploadBtn} onClick={() => triggerInput(coverInputRef)}>
                <img src={Ac} alt="" style={{width: '15%'}} className='me-2'/>
                Upload Image
              </button>
          </label>
          <p style={dropdownStyles.note}>Recommended: Wide image, at least 1200×400px</p>
        </div>

        <div style={{background: '#fff', border: '1px solid #EEEEEE', borderRadius: '12px'}} className='p-3 mt-4'>
          <h6 className="mx">Background</h6>

          <small className="d-block mt-3 mb-2">Background Image</small>
          <div style={dropdownStyles.container}>
            <label htmlFor="imageUpload" style={dropdownStyles.imageWrapper}>
                <div style={dropdownStyles.imageCircle} onClick={() => triggerInput(backInputRef)}>
                {im.background ? (
                  <img src={im.background} alt="Preview" style={dropdownStyles.previewImage} />
                ) : (
                  <div style={dropdownStyles.placeholderBackground} />
                )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={backInputRef}
                  onChange={(e) => handleImageChange(e, "background")}
                  style={{ display: "none" }}
                />
                <button type="button" style={dropdownStyles.uploadBtn} onClick={() => triggerInput(backInputRef)}>
                  <img src={Ac} alt="" style={{width: '15%'}} className='me-2'/>
                  Upload Image
                </button>
            </label>
            <p style={dropdownStyles.note}>Recommended: Large image, at least 1920×1080px</p>
          </div>
        </div>
        <div className="text-end m-2">
          <button className={`${styles['sk-btn']} mx px-3 mx`}>
            {
              loading ?(
                <>
                  <div className="spinner-border spinner-border-sm text-secondary mx-3" role="status">
                    <span className="sr-only"></span>
                  </div>
                  <span>Updating Store Images... </span>
                </>
                  
              ): (
                  'Update Store Images'
              )
            }
          </button>
        </div>
      </form>

      <hr style={{border: '1px dashed #222'}} className='my-4'/>

      <form onSubmit={updateColors}>
        <div className={styles['color-container']}>
          <small className="d-block mt-3 mb-2">Background Color</small>
          <div className={styles['color-input-wrapper2']}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles['color-picker']}
              placeholder='#F2EFEF'
            />
            <span className={styles['color-code']}>{color}</span>
          </div>
        </div>

        <div style={{background: '#fff', border: '1px solid #EEEEEE', borderRadius: '12px'}} className='mt-4'>
          <div className="p-4">
          <h6 className="mx">Buttons</h6>
            
            {/* Style Selection */}
            <div className="mb-5">
              <small style={{color: '#1C1917'}} className='mb-3 d-block'>Style</small>
              <select
                className={styles['input-item']}
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
              >
                <option>select style</option>
                <option>Rounded</option>
                <option>Square</option>
                <option>Pill</option>
              </select>
            </div>

            {/* Color Selection */}
            <div className="row">
              {/* Button Color */}
              <div className="col-md-6 mb-4">
                <div className={styles['color-container']}>
                <small className="d-block mt-3 mb-2">Button Color</small>
                <div className={styles['color-input-wrapper']}>
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => {setButtonColor(e.target.value)
                      handleColorChange('button', e.target.value)
                    }}
                    className={styles['color-picker']}
                    placeholder='#F2EFEF'
                  />
                  <span className={styles['color-code']}>{color}</span>
                </div>
              </div>
              </div>

              {/* Font Color */}
              <div className="col-md-6 mb-4">
                <div className={`${styles['color-container']} w-100`}>
                  <small className="d-block mt-3 mb-2">Button Font color</small>
                  <div className={styles['color-input-wrapper']}>
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => {setFontColor(e.target.value)
                        handleColorChange('font', e.target.value)
                      }}
                      className={styles['color-picker']}
                      placeholder='#F2EFEF'
                    />
                    <span className={styles['color-code']}>{color}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-end m-2">
          <button className={`${styles['sk-btn']} mx`} type='submit'>
            {
              loading ?(
                <>
                  <div className="spinner-border spinner-border-sm text-secondary" role="status">
                    <span className="sr-only"></span>
                  </div>
                  <span>Updating Store Colors... </span>
                </>
                  
              ): (
                  'Update Store Color'
              )
            }
          </button>
        </div>
      </form>
     </div>
    </>
  )
}
const dropdownStyles = {
  container: {
    width: "100%",
    margin: "auto",
    padding: "2rem",
    borderRadius: "12px",
    border: "1px dashed #ddd",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  imageWrapper: {
    cursor: "pointer",
    display: "inline-block",
  },
  imageCircle: {
    width: "70px",
    height: "70px",
    margin: "auto",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginBottom: "1rem",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  placeholderCircle: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D9D9D9",
  },
  bannerPreview: {
    width: "100%",
    height: "120px",
    margin: "auto",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginBottom: "1rem",
  },
  placeholderBanner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D9D9D9",
  },
  backgroundPreview: {
    width: "100%",
    height: "150px",
    margin: "auto",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#ddd",
    marginBottom: "1rem",
  },
  placeholderBackground: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D9D9D9",
  },
  uploadBtn: {
    padding: "8px 16px",
    backgroundColor: "#fff",
    border: "1px solid #EEEEEE",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    color: '#0273F9'
  },
  note: {
    fontSize: "12px",
    color: "#78716C",
    marginTop: "1rem",
  },
};

export default Appearance