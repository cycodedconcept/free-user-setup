import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faEdit,
  faLayerGroup,
  faMoneyBillWave,
  faPlus,
  faRotateRight,
  faTrash,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import {
  createShippingRate,
  deleteShippingRate,
  getShippingRates,
  updateShippingRate,
} from "../../../slice/order";
import { getMyOnlineStore } from "../../../slice/onlineStoreSlice";

const EMPTY_FORM = {
  zone_name: "",
  description: "",
  price: "1500",
  min_order_amount: "",
  estimated_days: "Same day",
  is_active: true,
  sort_order: "1",
};

const resolveStoreInfo = (myStore) =>
  myStore?.onlineStore || myStore?.data?.onlineStore || myStore?.store || {};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const getErrorMessage = (error, fallback) =>
  error?.message || error?.error || error?.data?.message || fallback;

const ShippingRates = () => {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const localStoreId = localStorage.getItem("itemId");
  const myStore = useSelector((state) => state.store?.myStore);
  const storeInfo = resolveStoreInfo(myStore);
  const resolvedStoreId =
    storeInfo?.id || storeInfo?.online_store_id || localStoreId || "";
  const {
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,
    shippingRateSaving,
    shippingRateSaveError,
    shippingRateDeleting,
    shippingRateDeleteError,
  } = useSelector((state) => state.order);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRateId, setEditingRateId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  const liveRates = useMemo(
    () => (Array.isArray(shippingRates) ? shippingRates : []),
    [shippingRates]
  );
  const isEmptyState = !shippingRatesLoading && liveRates.length === 0;

  useEffect(() => {
    if (!token || resolvedStoreId) {
      return;
    }

    dispatch(getMyOnlineStore({ token }));
  }, [dispatch, resolvedStoreId, token]);

  useEffect(() => {
    if (!token || !resolvedStoreId) {
      return;
    }

    dispatch(getShippingRates({ token, id: resolvedStoreId }));
  }, [dispatch, resolvedStoreId, token]);

  const summaryCards = useMemo(() => {
    const sourceRates = liveRates;
    const activeRates = sourceRates.filter((rate) => rate?.is_active).length;
    const zones = new Set(
      sourceRates.map((rate) => `${rate?.zone_name || ""}`.trim()).filter(Boolean)
    );
    const averagePrice =
      sourceRates.length > 0
        ? sourceRates.reduce((sum, rate) => sum + Number(rate?.price || 0), 0) /
          sourceRates.length
        : 0;

    return [
      {
        title: "Configured Rates",
        value: String(sourceRates.length),
        meta: "Live shipping rules",
        icon: faTruck,
        color: "#0d7cff",
        background: "#eaf3ff",
      },
      {
        title: "Active Rates",
        value: String(activeRates),
        meta: "Available to customers",
        icon: faCheckCircle,
        color: "#16a34a",
        background: "#e8f8e8",
      },
      {
        title: "Delivery Zones",
        value: String(zones.size),
        meta: "Unique shipping destinations",
        icon: faLayerGroup,
        color: "#7c3aed",
        background: "#f3e8ff",
      },
      {
        title: "Average Charge",
        value: formatCurrency(averagePrice),
        meta: "Across visible rows",
        icon: faMoneyBillWave,
        color: "#ea580c",
        background: "#ffedd5",
      },
    ];
  }, [liveRates]);

  const resetFormState = () => {
    setFormData({ ...EMPTY_FORM });
    setFormErrors({});
    setEditMode(false);
    setEditingRateId(null);
  };

  const openCreateForm = () => {
    resetFormState();
    setShowForm(true);
  };

  const openEditForm = (rate) => {
    setFormData({
      zone_name: rate?.zone_name || "",
      description: rate?.description || "",
      price: `${rate?.price ?? ""}`,
      min_order_amount:
        rate?.min_order_amount === null || rate?.min_order_amount === undefined
          ? ""
          : `${rate.min_order_amount}`,
      estimated_days: rate?.estimated_days || "",
      is_active: Boolean(rate?.is_active),
      sort_order: `${rate?.sort_order ?? 1}`,
    });
    setFormErrors({});
    setEditMode(true);
    setEditingRateId(rate?.id || null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetFormState();
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (formErrors[name]) {
      setFormErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.zone_name.trim()) {
      nextErrors.zone_name = "Zone name is required.";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    if (formData.price === "" || Number(formData.price) < 0) {
      nextErrors.price = "Enter a valid shipping price.";
    }

    if (!formData.estimated_days.trim()) {
      nextErrors.estimated_days = "Estimated delivery time is required.";
    }

    if (formData.sort_order === "" || Number(formData.sort_order) < 0) {
      nextErrors.sort_order = "Sort order must be zero or more.";
    }

    if (
      formData.min_order_amount !== "" &&
      Number(formData.min_order_amount) < 0
    ) {
      nextErrors.min_order_amount = "Minimum order amount cannot be negative.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = () => ({
    zone_name: formData.zone_name.trim(),
    description: formData.description.trim(),
    price: Number(formData.price || 0),
    min_order_amount:
      formData.min_order_amount === "" ? "" : Number(formData.min_order_amount),
    estimated_days: formData.estimated_days.trim(),
    is_active: Boolean(formData.is_active),
    sort_order: Number(formData.sort_order || 0),
  });

  const refreshRates = async ({ throwOnError = false } = {}) => {
    if (!token || !resolvedStoreId) {
      return null;
    }

    const action = await dispatch(getShippingRates({ token, id: resolvedStoreId }));

    if (throwOnError && getShippingRates.rejected.match(action)) {
      throw action.payload || action.error;
    }

    return action.payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Authentication required",
        text: "Please log in again before managing shipping rates.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    if (!resolvedStoreId) {
      Swal.fire({
        icon: "error",
        title: "Store not found",
        text: "We could not resolve your online store id yet.",
        confirmButtonColor: "#0273F9",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    Swal.fire({
      title: editMode ? "Updating shipping rate..." : "Creating shipping rate...",
      text: "Please wait while we save your shipping settings.",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const payload = buildPayload();

      if (editMode && editingRateId) {
        await dispatch(
          updateShippingRate({
            token,
            id: resolvedStoreId,
            rateId: editingRateId,
            ...payload,
          })
        ).unwrap();
      } else {
        await dispatch(
          createShippingRate({
            token,
            id: resolvedStoreId,
            ...payload,
          })
        ).unwrap();
      }

      await refreshRates({ throwOnError: true });
      closeForm();

      Swal.fire({
        icon: "success",
        title: editMode ? "Shipping rate updated" : "Shipping rate created",
        text: editMode
          ? "The shipping rate has been updated successfully."
          : "The new shipping rate has been added successfully.",
        confirmButtonColor: "#0273F9",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: editMode ? "Update failed" : "Creation failed",
        text: getErrorMessage(
          error,
          editMode
            ? "We could not update that shipping rate."
            : "We could not create that shipping rate."
        ),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  const handleDelete = async (rate) => {
    const confirmation = await Swal.fire({
      title: "Delete shipping rate?",
      html: `Are you sure you want to delete <strong style="color:#DC2626;">${rate?.zone_name || "this rate"}</strong>? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!confirmation.isConfirmed || !token || !resolvedStoreId || !rate?.id) {
      return;
    }

    Swal.fire({
      title: "Deleting shipping rate...",
      text: "Please wait while we remove the shipping rate.",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await dispatch(
        deleteShippingRate({
          token,
          id: resolvedStoreId,
          rateId: rate.id,
        })
      ).unwrap();

      await refreshRates({ throwOnError: true });

      Swal.fire({
        icon: "success",
        title: "Shipping rate deleted",
        text: "The shipping rate has been removed successfully.",
        confirmButtonColor: "#0273F9",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: getErrorMessage(error, "We could not delete that shipping rate."),
        confirmButtonColor: "#0273F9",
      });
    }
  };

  return (
    <div style={{ color: "var(--app-text)" }}>
      <div
        className="d-flex flex-wrap justify-content-between align-items-start"
        style={{ gap: "16px", marginBottom: "24px" }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "6px",
              color: "var(--app-text)",
            }}
          >
            Shipping Rates
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--app-text-muted)",
              fontSize: "15px",
            }}
          >
            Create, update, and remove delivery rules for each shipping zone.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center" style={{ gap: "12px" }}>
          <Button
            unstyled
            onClick={refreshRates}
            disabled={!token || !resolvedStoreId || shippingRatesLoading}
            style={{
              border: "1px solid var(--app-border)",
              borderRadius: "10px",
              background: "var(--app-surface)",
              color: "var(--app-text)",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              opacity: !token || !resolvedStoreId || shippingRatesLoading ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faRotateRight} style={{ marginRight: "10px" }} />
            Refresh
          </Button>

          <Button
            unstyled
            onClick={openCreateForm}
            disabled={!token || !resolvedStoreId}
            style={{
              border: "none",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
              color: "#ffffff",
              padding: "14px 18px",
              fontWeight: 600,
              fontSize: "15px",
              boxShadow: "0 12px 24px rgba(2, 115, 249, 0.18)",
              opacity: !token || !resolvedStoreId ? 0.6 : 1,
            }}
          >
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "10px" }} />
            Add Shipping Rate
          </Button>
        </div>
      </div>

      {!token && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          Shipping rate management requires an authenticated vendor session.
        </div>
      )}

      {token && !resolvedStoreId && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #fde68a",
            background: "#fffbeb",
            color: "#92400e",
          }}
        >
          We are still resolving your online store. Once the store id is available,
          live shipping rates can be loaded and edited.
        </div>
      )}

      {(shippingRatesError || shippingRateSaveError || shippingRateDeleteError) && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
          }}
        >
          {getErrorMessage(
            shippingRatesError || shippingRateSaveError || shippingRateDeleteError,
            "Something went wrong while managing shipping rates."
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        {summaryCards.map((card) => (
          <article
            key={card.title}
            style={{
              background: "var(--app-surface)",
              border: "1px solid var(--app-border)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "var(--app-shadow-soft)",
            }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--app-text-muted)",
                  }}
                >
                  {card.title}
                </p>
                <h3
                  style={{
                    margin: "10px 0 6px",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--app-text)",
                  }}
                >
                  {card.value}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "var(--app-text-muted)",
                  }}
                >
                  {card.meta}
                </p>
              </div>

              <span
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: card.background,
                  color: card.color,
                  fontSize: "18px",
                }}
              >
                <FontAwesomeIcon icon={card.icon} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <section
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          borderRadius: "18px",
          boxShadow: "var(--app-shadow-soft)",
          overflow: "hidden",
        }}
      >
        <div
          className="d-flex flex-wrap justify-content-between align-items-center"
          style={{
            gap: "12px",
            padding: "20px",
            borderBottom: "1px solid var(--app-border)",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--app-text)",
              }}
            >
              Shipping Rate Table
            </h3>
            <p
              style={{
                margin: "6px 0 0",
                color: "var(--app-text-muted)",
                fontSize: "14px",
              }}
            >
              Manage zone pricing, delivery timelines, and rate visibility.
            </p>
          </div>

          <span
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#ecfdf5",
              color: "#047857",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {`${liveRates.length} live rate(s)`}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table mb-0 align-middle">
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Zone</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Description</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Price</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Min Order</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>ETA</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Status</th>
                <th style={{ padding: "16px 20px", fontSize: "12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shippingRatesLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "28px 20px",
                      textAlign: "center",
                      color: "var(--app-text-muted)",
                    }}
                  >
                    Loading shipping rates...
                  </td>
                </tr>
              ) : isEmptyState ? (
                <tr>
                  <td colSpan="7" style={{ padding: "24px 20px" }}>
                    <div
                      style={{
                        minHeight: "240px",
                        border: "2px dashed #cbd5e1",
                        borderRadius: "18px",
                        background:
                          "linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(255,255,255,1) 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ maxWidth: "420px" }}>
                        <div
                          style={{
                            width: "62px",
                            height: "62px",
                            margin: "0 auto 16px",
                            borderRadius: "999px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "24px",
                          }}
                        >
                          <FontAwesomeIcon icon={faTruck} />
                        </div>
                        <h4
                          style={{
                            margin: "0 0 10px",
                            color: "var(--app-text)",
                            fontSize: "20px",
                            fontWeight: 700,
                          }}
                        >
                          No shipping rates yet
                        </h4>
                        <p
                          style={{
                            margin: "0 0 18px",
                            color: "var(--app-text-muted)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                          }}
                        >
                          Add your first shipping rate to start charging customers
                          based on delivery zone, order amount, and estimated time.
                        </p>
                        <Button
                          unstyled
                          onClick={openCreateForm}
                          disabled={!token || !resolvedStoreId}
                          style={{
                            border: "none",
                            borderRadius: "12px",
                            background:
                              "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
                            color: "#ffffff",
                            padding: "12px 18px",
                            fontWeight: 600,
                            fontSize: "14px",
                            boxShadow: "0 12px 24px rgba(2, 115, 249, 0.18)",
                            opacity: !token || !resolvedStoreId ? 0.6 : 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faPlus} style={{ marginRight: "10px" }} />
                          Add Shipping Rate
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                liveRates.map((rate) => (
                  <tr key={`live-${rate.id}`}>
                    <td style={{ padding: "18px 20px", minWidth: "180px" }}>
                      <div style={{ fontWeight: 600, color: "var(--app-text)" }}>{rate.zone_name}</div>
                    </td>
                    <td style={{ padding: "18px 20px", minWidth: "240px" }}>
                      <div style={{ color: "var(--app-text)" }}>{rate.description}</div>
                    </td>
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      {formatCurrency(rate.price)}
                    </td>
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      {rate.min_order_amount === "" || rate.min_order_amount === null
                        ? "-"
                        : formatCurrency(rate.min_order_amount)}
                    </td>
                    <td style={{ padding: "18px 20px", whiteSpace: "nowrap" }}>
                      {rate.estimated_days || "-"}
                    </td>
                    <td style={{ padding: "18px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: rate.is_active ? "#dcfce7" : "#fee2e2",
                          color: rate.is_active ? "#166534" : "#b91c1c",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {rate.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "18px 20px" }}>
                      <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => openEditForm(rate)}
                          disabled={shippingRateSaving || shippingRateDeleting}
                          title="Edit rate"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            border: "1px solid #dbeafe",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            cursor:
                              shippingRateSaving || shippingRateDeleting
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              shippingRateSaving || shippingRateDeleting
                                ? 0.65
                                : 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(rate)}
                          disabled={shippingRateSaving || shippingRateDeleting}
                          title="Delete rate"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            border: "1px solid #fecaca",
                            background: "#fff1f2",
                            color: "#dc2626",
                            cursor:
                              shippingRateSaving || shippingRateDeleting
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              shippingRateSaving || shippingRateDeleting
                                ? 0.65
                                : 1,
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "min(100%, 760px)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "22px",
              boxShadow: "0 30px 70px rgba(15, 23, 42, 0.24)",
            }}
          >
            <div
              className="d-flex justify-content-between align-items-start"
              style={{
                padding: "24px 24px 18px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {editMode ? "Update Shipping Rate" : "Add Shipping Rate"}
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  Configure zone pricing, minimum order value, and delivery time.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  color: "#111827",
                  width: "40px",
                  height: "40px",
                  borderRadius: "999px",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label
                    htmlFor="zone_name"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Zone Name
                  </label>
                  <input
                    id="zone_name"
                    name="zone_name"
                    value={formData.zone_name}
                    onChange={handleChange}
                    placeholder="Lagos Island"
                    className="form-control mt-2"
                    style={{ minHeight: "48px", borderRadius: "12px" }}
                  />
                  {formErrors.zone_name && (
                    <small style={{ color: "#dc2626" }}>{formErrors.zone_name}</small>
                  )}
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="estimated_days"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Estimated Delivery
                  </label>
                  <input
                    id="estimated_days"
                    name="estimated_days"
                    value={formData.estimated_days}
                    onChange={handleChange}
                    placeholder="Same day"
                    className="form-control mt-2"
                    style={{ minHeight: "48px", borderRadius: "12px" }}
                  />
                  {formErrors.estimated_days && (
                    <small style={{ color: "#dc2626" }}>
                      {formErrors.estimated_days}
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label
                    htmlFor="description"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Same day delivery within Lagos Island"
                    className="form-control mt-2"
                    rows="3"
                    style={{ borderRadius: "12px", resize: "vertical" }}
                  />
                  {formErrors.description && (
                    <small style={{ color: "#dc2626" }}>
                      {formErrors.description}
                    </small>
                  )}
                </div>

                <div className="col-md-4">
                  <label
                    htmlFor="price"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Price
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className="form-control mt-2"
                    style={{ minHeight: "48px", borderRadius: "12px" }}
                  />
                  {formErrors.price && (
                    <small style={{ color: "#dc2626" }}>{formErrors.price}</small>
                  )}
                </div>

                <div className="col-md-4">
                  <label
                    htmlFor="min_order_amount"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Minimum Order Amount
                  </label>
                  <input
                    id="min_order_amount"
                    name="min_order_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="form-control mt-2"
                    style={{ minHeight: "48px", borderRadius: "12px" }}
                  />
                  {formErrors.min_order_amount && (
                    <small style={{ color: "#dc2626" }}>
                      {formErrors.min_order_amount}
                    </small>
                  )}
                </div>

                <div className="col-md-4">
                  <label
                    htmlFor="sort_order"
                    style={{ display: "block", fontSize: "13px", fontWeight: 600 }}
                  >
                    Sort Order
                  </label>
                  <input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.sort_order}
                    onChange={handleChange}
                    className="form-control mt-2"
                    style={{ minHeight: "48px", borderRadius: "12px" }}
                  />
                  {formErrors.sort_order && (
                    <small style={{ color: "#dc2626" }}>
                      {formErrors.sort_order}
                    </small>
                  )}
                </div>

                <div className="col-12">
                  <label
                    className="d-inline-flex align-items-center"
                    style={{ gap: "10px", cursor: "pointer", fontWeight: 600 }}
                  >
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    Active shipping rate
                  </label>
                </div>
              </div>

              <div
                className="d-flex flex-wrap justify-content-end"
                style={{ gap: "12px", marginTop: "24px" }}
              >
                <Button
                  type="button"
                  unstyled
                  onClick={closeForm}
                  style={{
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#111827",
                    borderRadius: "12px",
                    padding: "12px 18px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  unstyled
                  disabled={shippingRateSaving || shippingRateDeleting}
                  style={{
                    border: "none",
                    background: "linear-gradient(135deg, #0d7cff 0%, #0273f9 100%)",
                    color: "#ffffff",
                    borderRadius: "12px",
                    padding: "12px 20px",
                    fontWeight: 600,
                    opacity: shippingRateSaving || shippingRateDeleting ? 0.7 : 1,
                  }}
                >
                  {shippingRateSaving
                    ? editMode
                      ? "Updating..."
                      : "Creating..."
                    : editMode
                      ? "Update Shipping Rate"
                      : "Create Shipping Rate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingRates;
