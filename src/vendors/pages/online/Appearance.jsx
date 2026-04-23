import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deleteBannerImage, updateStoreImages, resetStatus, getMyOnlineStore, storeUpdateColors } from '../../../slice/onlineStoreSlice';
import { getOnlineStoreThemes } from '../../../slice/customerFacingSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Ac } from '../../../assets';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import styles from "../../../styles.module.css";


const appearanceSteps = [
  {
    id: 'logo',
    title: 'Profile Logo',
    previewKey: 'profile',
    recommendation: 'Recommended: Square image, at least 300x300px',
    shape: 'circle'
  },
  {
    id: 'banner',
    title: 'Banner Image',
    previewKey: 'cover',
    recommendation: 'Recommended: Wide image, at least 1200x400px',
    shape: 'banner'
  }
];

const Appearance = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem('token');
  const getId = localStorage.getItem('itemId');
  const { loading, myStore } = useSelector((state) => state.store);
  const { storeThemes, storeThemesLoading, storeThemesError } = useSelector((state) => state.customer);

  const [activeStep, setActiveStep] = useState(0);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [uploadedSteps, setUploadedSteps] = useState({
    logo: false,
    banner: false
  });
  const [suggestedThemes, setSuggestedThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [applyingThemeId, setApplyingThemeId] = useState(null);
  const [themeProgress, setThemeProgress] = useState(0);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [im, setIm] = useState({
    profile: null,
    cover: null
  });

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const inputRefs = {
    logo: profileInputRef,
    banner: coverInputRef
  };

  const currentStep = appearanceSteps[activeStep];
  const isLastStep = activeStep === appearanceSteps.length - 1;

  const storeInfo =
    myStore?.onlineStore ||
    myStore?.data?.onlineStore ||
    myStore?.store ||
    {};
  const resolvedStoreId =
    getId ||
    storeInfo?.id ||
    storeInfo?.store_id ||
    storeInfo?.online_store_id ||
    null;
  const storeIdForWrite = resolvedStoreId || getId || null;
  const hasResolvedStoreId = Boolean(resolvedStoreId || getId);

  const triggerInput = (ref) => ref?.current?.click();

  useEffect(() => {
    if (token) {
      dispatch(getMyOnlineStore({ token, id: getId }));
    }
  }, [dispatch, token, getId]);

  useEffect(() => {
    if (token && resolvedStoreId) {
      dispatch(getOnlineStoreThemes({ token, id: resolvedStoreId }));
    }
  }, [dispatch, token, resolvedStoreId]);

  useEffect(() => {
    const profileImage = storeInfo?.profile_logo_url;
    const coverImage =
      storeInfo?.banner_image_url ||
      storeInfo?.banner_url ||
      storeInfo?.cover_image_url;

    setIm((prev) => ({
      profile: profileImage || prev.profile,
      cover: coverImage || prev.cover
    }));

    setUploadedSteps((prev) => ({
      ...prev,
      logo: Boolean(profileImage) || prev.logo,
      banner: Boolean(coverImage) || prev.banner
    }));
  }, [
    storeInfo?.profile_logo_url,
    storeInfo?.banner_image_url,
    storeInfo?.banner_url,
    storeInfo?.cover_image_url
  ]);

  useEffect(() => {
    const selectedTheme = storeInfo?.selected_theme;
    if (selectedTheme?.id) {
      setSelectedThemeId(selectedTheme.id);
    }
  }, [storeInfo?.selected_theme]);

  const availableThemes = useMemo(() => {
    const themeMap = new Map();

    [...suggestedThemes, ...storeThemes].forEach((theme) => {
      if (!theme || typeof theme !== 'object') {
        return;
      }

      const themeKey = theme.id || theme.name;
      if (!themeKey || themeMap.has(themeKey)) {
        return;
      }

      themeMap.set(themeKey, theme);
    });

    return Array.from(themeMap.values());
  }, [suggestedThemes, storeThemes]);

  const themeErrorMessage =
    storeThemesError?.message ||
    storeThemesError?.error ||
    (typeof storeThemesError === 'string' ? storeThemesError : 'Unable to load store themes.');

  const uploadImageForStore = async (file, step) => {
    if (!token || !hasResolvedStoreId || !storeIdForWrite) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to Upload Image',
        text: 'Store details are still loading. Please try again in a moment.',
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    const formData = new FormData();
    formData.append(step.id, file);

    setUploadingKey(step.id);

    try {
      const response = await dispatch(
        updateStoreImages({
          token,
          formData,
          id: storeIdForWrite
        })
      ).unwrap();

      setUploadedSteps((prev) => ({
        ...prev,
        [step.id]: true
      }));

      const uploadedImages = response?.data?.uploaded_images || {};
      const updatedStore = response?.data?.onlineStore || {};
      const themes = response?.data?.suggested_themes || [];

      if (step.id === 'logo' && Array.isArray(themes)) {
        setSuggestedThemes(themes);
      }

      setIm((prev) => ({
        profile:
          uploadedImages?.logo ||
          updatedStore?.profile_logo_url ||
          prev.profile,
        cover:
          uploadedImages?.banner ||
          updatedStore?.banner_image_url ||
          updatedStore?.banner_url ||
          updatedStore?.cover_image_url ||
          prev.cover
      }));

      dispatch(getMyOnlineStore({ token, id: storeIdForWrite }));

      await Swal.fire({
        icon: 'success',
        title: `${step.title} Uploaded`,
        text: response?.message || `${step.title} uploaded successfully.`,
        confirmButtonColor: '#0273F9'
      });
    } catch (uploadError) {
      let errorMessage = 'Failed to upload image';

      if (uploadError && typeof uploadError === 'object') {
        if (uploadError.message) {
          errorMessage = uploadError.message;
        } else if (uploadError.error) {
          errorMessage = uploadError.error;
        }
      } else if (typeof uploadError === 'string') {
        errorMessage = uploadError;
      }

      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: errorMessage,
        confirmButtonColor: '#0273F9'
      });
    } finally {
      setUploadingKey(null);
      dispatch(resetStatus());
    }
  };

  const handleImageChange = async (e, step) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!token || !hasResolvedStoreId || !storeIdForWrite) {
      e.target.value = '';
      Swal.fire({
        icon: 'error',
        title: 'Unable to Upload Image',
        text: 'Store details are still loading. Please try again in a moment.',
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setIm((prev) => ({
      ...prev,
      [step.previewKey]: localPreviewUrl
    }));

    await uploadImageForStore(file, step);
    e.target.value = '';
  };

  const handleStepSelect = (index) => {
    setActiveStep(index);
  };

  const getActionErrorMessage = (actionError, fallbackMessage) => {
    if (actionError && typeof actionError === 'object') {
      if (actionError.message) {
        return actionError.message;
      }

      if (actionError.error) {
        return actionError.error;
      }
    }

    if (typeof actionError === 'string') {
      return actionError;
    }

    return fallbackMessage;
  };

  const handleDeleteBannerImage = async () => {
    if (deletingBanner || !im.cover) {
      return;
    }

    if (!token || !hasResolvedStoreId) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to Delete Banner',
        text: 'Store details are still loading. Please try again in a moment.',
        confirmButtonColor: '#0273F9'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Banner Image?',
      text: 'This will remove the banner from your online store appearance.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#78716C'
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeletingBanner(true);

    Swal.fire({
      title: 'Deleting Banner...',
      text: 'Please wait while we remove the image.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await dispatch(
        deleteBannerImage({
          token,
          storeId: storeIdForWrite,
          image_type: 'banner'
        })
      ).unwrap();

      setIm((prev) => ({
        ...prev,
        cover: null
      }));
      setUploadedSteps((prev) => ({
        ...prev,
        banner: false
      }));

      dispatch(getMyOnlineStore({ token, id: storeIdForWrite }));

      await Swal.fire({
        icon: 'success',
        title: 'Banner Deleted',
        text: response?.message || 'Banner image deleted successfully.',
        confirmButtonColor: '#0273F9'
      });
    } catch (deleteError) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: getActionErrorMessage(deleteError, 'Failed to delete banner image.'),
        confirmButtonColor: '#0273F9'
      });
    } finally {
      setDeletingBanner(false);
      dispatch(resetStatus());
    }
  };

  const renderPreview = (step) => {
    const previewSrc = im[step.previewKey];

    if (step.shape === 'circle') {
      return (
        <div style={dropdownStyles.circlePreview}>
          {previewSrc ? (
            <img src={previewSrc} alt={step.title} style={dropdownStyles.previewImage} />
          ) : (
            <div style={dropdownStyles.placeholderCircle} />
          )}
        </div>
      );
    }

    if (step.shape === 'banner') {
      return (
        <div style={dropdownStyles.bannerPreview}>
          {previewSrc ? (
            <>
              <img src={previewSrc} alt={step.title} style={dropdownStyles.previewImage} />
              <button
                type="button"
                aria-label="Delete banner image"
                title="Delete banner image"
                style={dropdownStyles.deleteBannerBtn}
                disabled={deletingBanner}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleDeleteBannerImage();
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </>
          ) : (
            <div style={dropdownStyles.placeholderBanner} />
          )}
        </div>
      );
    }

    return null;
  };

  const getThemeProgressBackground = (progress) =>
    `conic-gradient(#3B82F6 ${progress}%, rgba(59, 130, 246, 0.14) ${progress}% 100%)`;

  const handleThemeSelection = async (theme) => {
    if (!theme?.id || applyingThemeId) {
      return;
    }

    setApplyingThemeId(theme.id);
    setThemeProgress(0);

    const progressInterval = window.setInterval(() => {
      setThemeProgress((prev) => {
        if (prev >= 92) {
          return prev;
        }
        return prev + 8;
      });
    }, 120);

    try {
      const response = await dispatch(
        storeUpdateColors({
          token,
          id: storeIdForWrite,
          selected_theme: theme
        })
      ).unwrap();

      window.clearInterval(progressInterval);
      setThemeProgress(100);
      setSelectedThemeId(theme.id);

      await Swal.fire({
        icon: 'success',
        title: 'Theme Applied',
        text: response?.message || `${theme.name} theme selected successfully.`,
        confirmButtonColor: '#0273F9'
      });
    } catch (themeError) {
      window.clearInterval(progressInterval);
      setThemeProgress(0);

      let errorMessage = 'Failed to apply theme';

      if (themeError && typeof themeError === 'object') {
        if (themeError.message) {
          errorMessage = themeError.message;
        } else if (themeError.error) {
          errorMessage = themeError.error;
        }
      } else if (typeof themeError === 'string') {
        errorMessage = themeError;
      }

      Swal.fire({
        icon: 'error',
        title: 'Theme Update Failed',
        text: errorMessage,
        confirmButtonColor: '#0273F9'
      });
    } finally {
      window.clearInterval(progressInterval);
      window.setTimeout(() => {
        setApplyingThemeId(null);
        setThemeProgress(0);
      }, 300);
      dispatch(resetStatus());
    }
  };

  return (
    <div className={`${styles.vendorOnlinePage} imgbox p-3`} style={{ background: '#fff', border: '1px solid #EEEEEE', borderRadius: '12px' }}>
      <h6 className={styles.vendorOnlineSectionTitle} style={{ color: '#1C1917' }}>Store Appearance</h6>
      <small className={styles.vendorOnlineSectionText} style={{ color: '#78716C' }}>
        Upload your profile logo and banner image one step at a time.
      </small>

      <div className={`d-flex flex-wrap gap-2 mt-4 mb-4 ${styles.vendorOnlineTabsScroll}`}>
        {appearanceSteps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = uploadedSteps[step.id];

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepSelect(index)}
              style={{
                padding: '8px 14px',
                borderRadius: '999px',
                border: `1px solid ${isActive ? '#0273F9' : '#E7E5E4'}`,
                background: isActive ? '#EAF4FF' : isDone ? '#F0FDF4' : '#fff',
                color: isActive ? '#0273F9' : '#57534E',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {index + 1}. {step.title}
            </button>
          );
        })}
      </div>

      <div className={`${styles.vendorOnlineSurfaceCard} ${styles.vendorOnlineSurfaceCardInner}`} style={dropdownStyles.container}>
        <small className="d-block mb-2" style={{ color: '#1C1917', fontWeight: 600 }}>
          {currentStep.title}
        </small>

        <label style={dropdownStyles.imageWrapper}>
          <div onClick={() => triggerInput(inputRefs[currentStep.id])}>
            {renderPreview(currentStep)}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={inputRefs[currentStep.id]}
            onChange={(e) => handleImageChange(e, currentStep)}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            style={dropdownStyles.uploadBtn}
            onClick={() => triggerInput(inputRefs[currentStep.id])}
            disabled={loading && uploadingKey === currentStep.id}
          >
            <img src={Ac} alt="" style={{ width: '15%' }} className="me-2" />
            {loading && uploadingKey === currentStep.id ? 'Uploading...' : `Upload ${currentStep.title}`}
          </button>
        </label>

        <p style={dropdownStyles.note}>{currentStep.recommendation}</p>

        {(uploadedSteps[currentStep.id] || im[currentStep.previewKey]) && !isLastStep && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => prev + 1)}
              style={dropdownStyles.nextBtn}
            >
              Next
            </button>
          </div>
        )}

        {uploadedSteps.banner && (
          <div className="mt-4">
            <small style={{ color: '#15803D', fontWeight: 600 }}>
              Appearance images uploaded successfully.
            </small>
          </div>
        )}
      </div>

      <div className="mt-4">
          <div className={`${styles.vendorOnlineHeader} flex-wrap gap-2 mb-3`}>
            <div>
              <h6 style={{ color: '#1C1917', marginBottom: '4px' }}>Available Themes</h6>
              <small style={{ color: '#78716C' }}>
                {suggestedThemes.length > 0
                  ? 'Theme recommendations generated from your uploaded logo click to select any theme for your store front.'
                  : 'Select any theme to update your store front anytime.'}
              </small>
            </div>
          </div>

          {storeThemesLoading && availableThemes.length === 0 ? (
            <div className="d-flex align-items-center gap-2 py-3" style={{ color: '#78716C' }}>
              <div className="spinner-border spinner-border-sm text-primary" role="status" />
              <small>Loading themes...</small>
            </div>
          ) : storeThemesError && availableThemes.length === 0 ? (
            <small className="d-block text-danger py-3">{themeErrorMessage}</small>
          ) : availableThemes.length > 0 ? (
          <>
            {storeThemesError && (
              <small className="d-block text-danger mb-3">{themeErrorMessage}</small>
            )}
            <div
              className={styles.vendorOnlineCardGrid}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px'
              }}
            >
              {availableThemes.map((theme) => (
                (() => {
                  const isApplying = applyingThemeId === theme.id;
                  const isSelected = selectedThemeId === theme.id;
                  const showActiveBorder = isApplying || isSelected;

                  return (
                    <button
                      key={theme.id || theme.name}
                      type="button"
                      onClick={() => handleThemeSelection(theme)}
                      disabled={Boolean(applyingThemeId)}
                      style={{
                        border: 'none',
                        padding: 0,
                        background: showActiveBorder ? getThemeProgressBackground(isApplying ? themeProgress : 100) : 'transparent',
                        borderRadius: '22px',
                        cursor: applyingThemeId ? 'not-allowed' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div
                        style={{
                          margin: '2px',
                          borderRadius: '20px',
                          border: `1px solid ${showActiveBorder ? 'transparent' : theme.border_default || '#E7E5E4'}`,
                          background: theme.card || '#FFFFFF',
                          overflow: 'hidden',
                          boxShadow: showActiveBorder
                            ? '0 14px 28px rgba(59, 130, 246, 0.14)'
                            : '0 10px 24px rgba(15, 23, 42, 0.08)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                <div
                  style={{
                    background: theme.surface || theme.background_color || '#F8FAFC',
                    padding: '18px',
                    minHeight: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  {(isApplying || isSelected) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#1E3A5F',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isApplying ? '10px' : '12px',
                        fontWeight: 700
                      }}
                    >
                      {isApplying ? `${Math.max(8, themeProgress)}%` : <FontAwesomeIcon icon={faCheck} />}
                    </div>
                  )}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: theme.primary_light || theme.primary || '#94A3B8',
                      color: theme.button_font_color || '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '18px'
                    }}
                  >
                    L
                  </div>

                  <div>
                    <div
                      style={{
                        width: '100%',
                        height: '10px',
                        borderRadius: '999px',
                        background: theme.primary || '#0F172A',
                        marginBottom: '10px'
                      }}
                    />
                    <div
                      style={{
                        width: '65%',
                        height: '8px',
                        borderRadius: '999px',
                        background: theme.primary_light || theme.primary || '#CBD5E1',
                        marginBottom: '14px'
                      }}
                    />
                    <div
                      style={{
                        borderRadius: '10px',
                        padding: '8px 18px',
                        background: theme.button_color || theme.primary || '#0F172A',
                        color: theme.button_font_color || '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      SHOP
                    </div>
                  </div>
                </div>

                <div style={{ padding: '18px' }}>
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <h6 style={{ color: theme.text_primary || '#111111', marginBottom: 0 }}>
                      {theme.name}
                    </h6>
                    <div className="d-flex align-items-center gap-1">
                      {(theme.preview_colors || []).slice(0, 3).map((colorItem) => (
                        <span
                          key={`${theme.id || theme.name}-${colorItem}`}
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: colorItem,
                            border: '1px solid rgba(0,0,0,0.08)',
                            display: 'inline-block'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <p
                    style={{
                      color: theme.text_secondary || '#57534E',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      marginBottom: '12px'
                    }}
                  >
                    {theme.description}
                  </p>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderRadius: '999px',
                      padding: '6px 12px',
                      background: theme.primary_muted || 'rgba(15, 23, 42, 0.08)',
                      color: theme.primary || '#0F172A',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    {theme.id || theme.name}
                  </div>
                </div>
                      </div>
                    </button>
                  );
                })()
              ))}
            </div>
          </>
          ) : (
            <small className="d-block py-3" style={{ color: '#78716C' }}>
              No themes available for this store yet.
            </small>
          )}
        </div>
    </div>
  );
};

const dropdownStyles = {
  container: {
    width: '100%',
    margin: 'auto',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px dashed #ddd',
    textAlign: 'center',
    backgroundColor: '#fff'
  },
  imageWrapper: {
    cursor: 'pointer',
    display: 'inline-block'
  },
  circlePreview: {
    width: '96px',
    height: '96px',
    margin: 'auto',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#ddd',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerPreview: {
    width: '280px',
    height: '220px',
    margin: 'auto',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#ddd',
    marginBottom: '1rem',
    position: 'relative'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  placeholderCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9'
  },
  placeholderBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9'
  },
  uploadBtn: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #EEEEEE',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#0273F9',
    width: '229px',
  },
  deleteBannerBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '34px',
    height: '34px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(220, 38, 38, 0.28)'
  },
  nextBtn: {
    padding: '10px 24px',
    backgroundColor: '#0273F9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#fff'
  },
  note: {
    fontSize: '12px',
    color: '#78716C',
    marginTop: '1rem'
  }
};

export default Appearance;
