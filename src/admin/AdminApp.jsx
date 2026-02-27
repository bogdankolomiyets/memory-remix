import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STATUS_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

const FILTER_OPTIONS = ["pending", "approved", "rejected"];

async function getAccessTokenFromSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const accessToken = data?.session?.access_token;
  if (!accessToken) {
    throw new Error("No active Supabase session.");
  }

  return accessToken;
}

function AdminApp({ onLogout }) {
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [meta, setMeta] = useState({
    pagination: null,
    filter: null,
  });

  const selectedApp = useMemo(
    () => applications.find((app) => app.id === selectedAppId) || null,
    [applications, selectedAppId]
  );

  const fetchSubmissions = useCallback(
    async (statusFilter) => {
      setIsLoading(true);
      setErrorText("");

      try {
        const token = await getAccessTokenFromSession();
        const response = await fetch(
          `/api/admin/submissions?status=${encodeURIComponent(statusFilter)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        setApplications(Array.isArray(payload?.data) ? payload.data : []);
        setMeta({
          pagination: payload?.pagination || null,
          filter: payload?.filter || null,
        });
      } catch (error) {
        console.error("[Admin] Failed to load submissions:", error);
        setApplications([]);
        setMeta({ pagination: null, filter: null });
        setErrorText("Failed to load submissions.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSubmissions(activeStatusFilter);
  }, [activeStatusFilter, fetchSubmissions]);

  const handleUpdateStatus = async (id, newStatus) => {
    const previousApplications = applications;
    const previousSelected = selectedApp;

    setIsUpdatingStatus(true);
    setErrorText("");

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );

    try {
      const token = await getAccessTokenFromSession();
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Keep list fully in sync with active filter after status change.
      await fetchSubmissions(activeStatusFilter);
      setSelectedAppId((currentId) => (currentId === id ? null : currentId));
    } catch (error) {
      console.error("[Admin] Failed to update submission status:", error);
      setApplications(previousApplications);
      setSelectedAppId(previousSelected?.id || null);
      setErrorText("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusClassName = (status) => {
    if (status === "approved") return "admin-badge admin-badge-approved";
    if (status === "rejected") return "admin-badge admin-badge-rejected";
    return "admin-badge admin-badge-pending";
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <tr>
          <td className="admin-empty-row" colSpan={4}>
            Loading...
          </td>
        </tr>
      );
    }

    if (!applications.length) {
      return (
        <tr>
          <td className="admin-empty-row" colSpan={4}>
            No submissions found.
          </td>
        </tr>
      );
    }

    return applications.map((app) => {
      const formattedDate = new Date(app.created_at).toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return (
        <tr
          key={app.id}
          className="admin-row"
          onClick={() => setSelectedAppId(app.id)}
        >
          <td>{app.id}</td>
          <td>{app.name}</td>
          <td>{formattedDate}</td>
          <td className="admin-table-status">
            <span className={getStatusClassName(app.status)}>
              {STATUS_LABELS[app.status] || app.status}
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
              className={`admin-filter-btn ${
                activeStatusFilter === status ? "is-active" : ""
              }`}
              onClick={() => setActiveStatusFilter(status)}
              disabled={isLoading || isUpdatingStatus}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {!!errorText && <p className="admin-error-banner">{errorText}</p>}

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

      {meta?.pagination && (
        <p className="admin-meta-note">
          Total: {meta.pagination.total || applications.length}
        </p>
      )}

      {selectedApp && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setSelectedAppId(null)}
          role="presentation"
        >
          <div
            className="admin-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Application ${selectedApp.id}`}
          >
            <div className="admin-modal-header">
              <h2>Application Details: {selectedApp.id}</h2>
              <button
                type="button"
                className="admin-close-btn"
                onClick={() => setSelectedAppId(null)}
              >
                x
              </button>
            </div>

            <div className="admin-modal-grid">
              <div>
                <div className="admin-field-label">Name</div>
                <div>{selectedApp.name}</div>
              </div>
              <div>
                <div className="admin-field-label">Email</div>
                <div>{selectedApp.email}</div>
              </div>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Status</div>
              <span className={getStatusClassName(selectedApp.status)}>
                {STATUS_LABELS[selectedApp.status] || selectedApp.status}
              </span>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Question</div>
              <div className="admin-content-box">
                {selectedApp.new_question_1 || "-"}
              </div>
            </div>

            <div className="admin-modal-section">
              <div className="admin-field-label">Prompt</div>
              <div className="admin-content-box">
                {selectedApp.new_prompt_text || "-"}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-reject"
                onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                disabled={isUpdatingStatus}
              >
                Reject
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-approve"
                onClick={() => handleUpdateStatus(selectedApp.id, "approved")}
                disabled={isUpdatingStatus}
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

