import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AccountDetails.css';

// Account details page — shows profile info, allows editing, password change,
// and displays admin-only audit log. Accessible via clicking the username in the navbar.
function AccountDetails() {
  const { user, refreshUser } = useAuth();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', username: '', email: '' });
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', checks: {} });

  // Audit log (admin only)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/account/me');
        setProfile(res.data);
        setEditForm({
          firstName: res.data.first_name,
          lastName: res.data.last_name,
          username: res.data.username,
          email: res.data.email,
        });
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch audit log (admin only)
  const fetchAuditLog = useCallback(async (page = 1, action = '') => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (action) params.append('action', action);
      const res = await api.get(`/account/audit-log?${params}`);
      setAuditLogs(res.data.logs);
      setAuditTotalPages(res.data.totalPages);
      setAuditPage(res.data.page);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAuditLog(1, auditFilter);
    }
  }, [user, fetchAuditLog, auditFilter]);

  // Handle profile edit save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');
    setSavingProfile(true);
    try {
      const res = await api.put('/account/me', editForm);
      setProfile(res.data);
      setEditing(false);
      setEditSuccess('Profile updated successfully.');

      // Update sessionStorage so navbar reflects changes
      const savedUser = JSON.parse(sessionStorage.getItem('user'));
      if (savedUser) {
        savedUser.first_name = res.data.first_name;
        savedUser.last_name = res.data.last_name;
        savedUser.username = res.data.username;
        savedUser.email = res.data.email;
        sessionStorage.setItem('user', JSON.stringify(savedUser));
        refreshUser();
      }
    } catch (err) {
      setEditError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Check password strength as user types
  const handleNewPasswordChange = async (value) => {
    setPasswordForm(prev => ({ ...prev, newPassword: value }));
    if (!value) {
      setPasswordStrength({ strength: 0, label: '', checks: {} });
      return;
    }
    try {
      const res = await api.post('/auth/check-password-strength', { password: value });
      setPasswordStrength(res.data);
    } catch {
      // Fail silently
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/account/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(res.data.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength({ strength: 0, label: '', checks: {} });
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Password strength bar colour
  const getStrengthColour = (level) => {
    const colours = { 1: '#d32f2f', 2: '#f57c00', 3: '#fbc02d', 4: '#388e3c', 5: '#1b5e20' };
    return colours[level] || '#e0e0e0';
  };

  // Format timestamp for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1>Account Details</h1>
      </div>

      {loadingProfile ? (
        <div className="account-content">
          <section className="account-section skeleton-section" aria-busy="true" aria-label="Loading profile">
            <div className="skeleton-line skeleton-heading" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-short" />
          </section>
        </div>
      ) : (

      <div className="account-content">
        {/* Profile Card */}
        <section className="account-section" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Profile Information</h2>

          {editSuccess && <div className="success-message" role="status">{editSuccess}</div>}
          {editError && <div className="error-message" role="alert">{editError}</div>}

          {!editing ? (
            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">First Name</span>
                <span className="detail-value">{profile?.first_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Name</span>
                <span className="detail-value">{profile?.last_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Username</span>
                <span className="detail-value">{profile?.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{profile?.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Role</span>
                <span className="detail-value role-badge">{profile?.role}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Created</span>
                <span className="detail-value">{formatDate(profile?.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(profile?.updated_at)}</span>
              </div>

              <div className="profile-actions">
                <button className="btn-primary" onClick={() => { setEditing(true); setEditSuccess(''); }}>
                  Edit Profile
                </button>
                <button className="btn-secondary" onClick={() => { setShowPasswordForm(!showPasswordForm); setPasswordSuccess(''); setPasswordError(''); }}>
                  {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-firstName">First Name</label>
                  <input
                    id="edit-firstName"
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-lastName">Last Name</label>
                  <input
                    id="edit-lastName"
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="edit-username">Username</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => {
                  setEditing(false);
                  setEditError('');
                  setEditForm({
                    firstName: profile.first_name,
                    lastName: profile.last_name,
                    username: profile.username,
                    email: profile.email,
                  });
                }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Password Change Form */}
        {showPasswordForm && (
          <section className="account-section" aria-labelledby="password-heading">
            <h2 id="password-heading">Change Password</h2>

            {passwordError && <div className="error-message" role="alert">{passwordError}</div>}
            {passwordSuccess && <div className="success-message" role="status">{passwordSuccess}</div>}

            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {passwordForm.newPassword && (
                  <div className="password-strength-meter" aria-live="polite">
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: getStrengthColour(passwordStrength.strength),
                        }}
                      />
                    </div>
                    <span className="strength-label" style={{ color: getStrengthColour(passwordStrength.strength) }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        )}

        {/* Admin Audit Log */}
        {user?.role === 'admin' && (
          <section className="account-section audit-section" aria-labelledby="audit-heading">
            <h2 id="audit-heading">Activity Log</h2>
            <p className="audit-description">Security and activity events across all users.</p>

            <div className="audit-controls">
              <label htmlFor="audit-filter">Filter by action:</label>
              <select
                id="audit-filter"
                value={auditFilter}
                onChange={(e) => { setAuditFilter(e.target.value); setAuditPage(1); }}
              >
                <option value="">All Actions</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_FAILED">Login Failed</option>
                <option value="REGISTER">Registration</option>
                <option value="EMAIL_VERIFIED">Email Verified</option>
                <option value="PASSWORD_CHANGE">Password Change</option>
                <option value="PASSWORD_CHANGE_FAILED">Password Change Failed</option>
                <option value="PASSWORD_RESET_REQUEST">Password Reset Request</option>
                <option value="PASSWORD_RESET">Password Reset</option>
                <option value="PROFILE_UPDATE">Profile Update</option>
                <option value="PRODUCT_CREATE">Product Created</option>
                <option value="PRODUCT_UPDATE">Product Updated</option>
                <option value="PRODUCT_DELETE">Product Deleted</option>
                <option value="SUPPLIER_CREATE">Supplier Created</option>
                <option value="SUPPLIER_UPDATE">Supplier Updated</option>
                <option value="SUPPLIER_DELETE">Supplier Deleted</option>
                <option value="ORDER_CREATE">Order Created</option>
                <option value="ORDER_STATUS">Order Status Change</option>
                <option value="ORDER_DELETE">Order Deleted</option>
              </select>
            </div>

            {auditLoading ? (
              <div className="audit-loading" role="status">Loading activity log...</div>
            ) : auditLogs.length === 0 ? (
              <p className="audit-empty">No activity logs found.</p>
            ) : (
              <>
                <div className="audit-table-wrapper" role="region" aria-label="Activity log table" tabIndex="0">
                  <table className="audit-table" aria-describedby="audit-heading">
                    <thead>
                      <tr>
                        <th scope="col">Date &amp; Time</th>
                        <th scope="col">User</th>
                        <th scope="col">Action</th>
                        <th scope="col">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.log_id}>
                          <td data-label="Date & Time">{formatDate(log.created_at)}</td>
                          <td data-label="User">{log.username || log.email || 'System'}</td>
                          <td data-label="Action">
                            <span className={`action-badge action-${log.action.toLowerCase().replace(/_/g, '-')}`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td data-label="Details">{log.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {auditTotalPages > 1 && (
                  <div className="audit-pagination" role="navigation" aria-label="Audit log pagination">
                    <button
                      disabled={auditPage <= 1}
                      onClick={() => fetchAuditLog(auditPage - 1, auditFilter)}
                      aria-label="Previous page"
                    >
                      Previous
                    </button>
                    <span className="page-info">Page {auditPage} of {auditTotalPages}</span>
                    <button
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => fetchAuditLog(auditPage + 1, auditFilter)}
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
      )}
    </div>
  );
}

export default AccountDetails;
