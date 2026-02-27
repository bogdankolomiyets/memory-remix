import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminApiError,
  getSubmissionById,
  listSubmissions,
  updateSubmissionStatus,
} from "./apiClient";

const STATUS_LABELS = {
  all: "All",
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

const FILTER_OPTIONS = ["all", "pending", "approved", "rejected"];
const PAGE_SIZE_OPTIONS = [25, 50, 100];

function toUserError(error) {
  if (!(error instanceof AdminApiError)) {
    return "Unexpected error. Please try again.";
  }

  if (error.code === "unauthorized") {
    return "Session expired. Please sign in again.";
  }

  if (error.code === "forbidden") {
    return "Your account does not have admin access.";
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Admin API request failed.";
}

function AdminApp({ onLogout }) {
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [paginationCount, setPaginationCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSelectedItem, setLoadingSelectedItem] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  const canPrevPage = offset > 0;
  const canNextPage = offset + rows.length < paginationCount;

  const selectedStatusLabel = useMemo(() => {
    return selectedItem?.status ? STATUS_LABELS[selectedItem.status] || selectedItem.status : "";
  }, [selectedItem]);

  const getStatusClassName = (status) => {
    if (status === "approved") return "admin-badge admin-badge-approved";
    if (status === "rejected") return "admin-badge admin-badge-rejected";
    return "admin-badge admin-badge-pending";
  };

  const loadRows = useCallback(async () => {
    setLoadingList(true);
    setError("");

    try {
      const payload = await listSubmissions({ status: statusFilter, limit, offset });
      const nextRows = Array.isArray(payload?.data) ? payload.data : [];

      setRows(nextRows);
      setPaginationCount(typeof payload?.pagination?.count === "number" ? payload.pagination.count : 0);

      setSelectedItem((prev) => {
        if (!prev) return null;
        return nextRows.find((row) => row.id === prev.id) || prev;
      });
    } catch (apiError) {
      if (apiError instanceof AdminApiError && apiError.code === "unauthorized") {
        await onLogout();
        return;
      }

      setRows([]);
      setPaginationCount(0);
      setError(toUserError(apiError));
    } finally {
      setLoadingList(false);
    }
  }, [limit, offset, onLogout, statusFilter]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedItem(null);
      return;
    }

    let cancelled = false;

    const loadSelectedItem = async () => {
      setLoadingSelectedItem(true);

      try {
        const payload = await getSubmissionById(selectedId);
        if (cancelled) return;

        const latest = payload?.data || null;
        setSelectedItem(latest);

        if (latest) {
          setRows((prev) => prev.map((row) => (row.id === latest.id ? { ...row, ...latest } : row)));
        }
      } catch (apiError) {
        if (cancelled) return;

        if (apiError instanceof AdminApiError && apiError.code === "unauthorized") {
          await onLogout();
          return;
        }

        if (apiError instanceof AdminApiError && apiError.code === "not_found") {
          setSelectedId(null);
          setSelectedItem(null);
          return;
        }

        setError(toUserError(apiError));
      } finally {
        if (!cancelled) {
          setLoadingSelectedItem(false);
        }
      }
    };

    loadSelectedItem();

    return () => {
      cancelled = true;
    };
  }, [onLogout, selectedId]);

  const handleOpenDetails = (row) => {
    setSelectedId(row.id);
    setSelectedItem(row);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedItem) return;

    const targetId = selectedItem.id;
    const previousRows = rows;
    const previousSelectedItem = selectedItem;

    setUpdatingStatus(true);
    setError("");

    setRows((prev) =>
      prev.map((row) => (row.id === targetId ? { ...row, status: newStatus } : row))
    );
    setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : prev));

    try {
      const payload = await updateSubmissionStatus(targetId, newStatus);
      const updated = payload?.data || { id: targetId, status: newStatus };

      setRows((prev) => prev.map((row) => (row.id === targetId ? { ...row, ...updated } : row)));
      setSelectedItem((prev) => (prev ? { ...prev, ...updated } : prev));

      await loadRows();

      if (statusFilter !== "all" && updated.status !== statusFilter) {
        setSelectedId(null);
        setSelectedItem(null);
      }
    } catch (apiError) {
      if (apiError instanceof AdminApiError && apiError.code === "unauthorized") {
        await onLogout();
        return;
      }

      setRows(previousRows);
      setSelectedItem(previousSelectedItem);
      setError(toUserError(apiError));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderTableBody = () => {
    if (loadingList) {
      return (
        <tr>
          <td className="admin-empty-row" colSpan={4}>
            Loading submissions...
          </td>
        </tr>
      );
    }

    if (!rows.length) {
      return (
        <tr>
          <td className="admin-empty-row" colSpan={4}>
            No submissions found.
          </td>
        </tr>
      );
    }

    return rows.map((row) => {
      const formattedDate = new Date(row.created_at).toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <tr key={row.id} className="admin-row" onClick={() => handleOpenDetails(row)}>
          <td>{row.id}</td>
          <td>{row.name || "-"}</td>
          <td>{formattedDate}</td>
          <td className="admin-table-status">
            <span className={getStatusClassName(row.status)}>
              {STATUS_LABELS[row.status] || row.status}
            </span>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1 className="admin-title">Memory Remix: Applications</h1>
        <button type="button" className="admin-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </header>

      <div className="admin-toolbar">
        <div className="admin-filter-group">
          {FILTER_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              className={`admin-filter-btn ${statusFilter === status ? "is-active" : ""}`}
              onClick={() => {
                setStatusFilter(status);
                setOffset(0);
              }}
              disabled={loadingList || updatingStatus}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="admin-toolbar-right">
          <label className="admin-limit-label" htmlFor="admin-limit-select">
            Per page
          </label>
          <select
            id="admin-limit-select"
            className="admin-limit-select"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setOffset(0);
            }}
            disabled={loadingList || updatingStatus}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!!error && <p className="admin-error-banner">{error}</p>}

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th className="admin-table-status">Status</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span className="admin-meta-note">
          Showing {rows.length} of {paginationCount}
        </span>
        <div className="admin-pagination-controls">
          <button
            type="button"
            className="admin-pagination-btn"
            onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
            disabled={!canPrevPage || loadingList || updatingStatus}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-pagination-btn"
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={!canNextPage || loadingList || updatingStatus}
          >
            Next
          </button>
        </div>
      </div>

      {selectedItem && (
        <div
          className="admin-modal-backdrop"
          onClick={() => {
            setSelectedId(null);
            setSelectedItem(null);
          }}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Application ${selectedItem.id}`}
          >
            <div className="admin-modal-header">
              <h2>Application Details: {selectedItem.id}</h2>
              <button
                type="button"
                className="admin-close-btn"
                onClick={() => {
                  setSelectedId(null);
                  setSelectedItem(null);
                }}
              >
                x
              </button>
            </div>

            {loadingSelectedItem && <p className="admin-meta-note">Refreshing details...</p>}

            <div className="admin-modal-grid">
              <div>
                <div className="admin-field-label">Name</div>
                <div>{selectedItem.name || "-"}</div>
              </div>
              <div>
                <div className="admin-field-label">Email</div>
                <div>{selectedItem.email || "-"}</div>
              </div>
            </div>

            <div className="admin-modal-grid">
              <div>
                <div className="admin-field-label">Title</div>
                <div>{selectedItem.title || "-"}</div>
              </div>
              <div>
                <div className="admin-field-label">Audio URL</div>
                <div className="admin-content-box">{selectedItem.audio_url || "-"}</div>
              </div>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Status</div>
              <span className={getStatusClassName(selectedItem.status)}>{selectedStatusLabel}</span>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Question</div>
              <div className="admin-content-box">{selectedItem.new_question_1 || "-"}</div>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Prompt</div>
              <div className="admin-content-box">{selectedItem.new_prompt_text || "-"}</div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-reject"
                onClick={() => handleUpdateStatus("rejected")}
                disabled={updatingStatus}
              >
                Reject
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-approve"
                onClick={() => handleUpdateStatus("approved")}
                disabled={updatingStatus}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminApp;

