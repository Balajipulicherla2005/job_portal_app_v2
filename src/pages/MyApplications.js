import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './MyApplications.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/applications/my-applications');
      console.log('Applications response:', response.data);
      
      if (response.data.success) {
        setApplications(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch applications');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.response?.data?.message || 'Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'reviewing':
        return 'status-reviewing';
      case 'shortlisted':
        return 'status-shortlisted';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getFilteredCount = (statusFilter) => {
    if (statusFilter === 'all') return applications.length;
    return applications.filter((app) => app.status?.toLowerCase() === statusFilter).length;
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status?.toLowerCase() === filter;
  });

  // Helper function to safely access nested properties
  const getJobTitle = (application) => {
    return application?.job?.title || application?.Job?.title || 'Unknown Job';
  };

  const getCompanyName = (application) => {
    return application?.job?.employer?.employerProfile?.companyName || 
           application?.Job?.employer?.employerProfile?.companyName ||
           'Unknown Company';
  };

  const getJobLocation = (application) => {
    return application?.job?.location || application?.Job?.location || 'Not specified';
  };

  const getJobType = (application) => {
    return application?.job?.jobType || application?.Job?.jobType || 'Not specified';
  };

  const getSalary = (application) => {
    const job = application?.job || application?.Job;
    if (job?.salaryMin && job?.salaryMax) {
      const period = job?.salaryPeriod || 'year';
      return `₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()} / ${period}`;
    }
    return 'Not specified';
  };

  const getAppliedDate = (application) => {
    const date = application?.createdAt || application?.created_at;
    return date ? new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'Unknown';
  };

  const getJobId = (application) => {
    return application?.jobId || application?.job?.id || application?.Job?.id;
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      await api.delete(`/applications/${applicationId}`);
      setApplications(applications.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert(error.response?.data?.message || 'Failed to withdraw application');
    }
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="applications-container">
          <h1 className="page-title">My Applications</h1>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="applications-container">
        <h1 className="page-title">My Applications</h1>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchApplications} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Filter */}
        <div className="filter-section">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({getFilteredCount('all')})
          </button>
          <button
            className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({getFilteredCount('pending')})
          </button>
          <button
            className={`filter-button ${filter === 'reviewing' ? 'active' : ''}`}
            onClick={() => setFilter('reviewing')}
          >
            Reviewing ({getFilteredCount('reviewing')})
          </button>
          <button
            className={`filter-button ${filter === 'shortlisted' ? 'active' : ''}`}
            onClick={() => setFilter('shortlisted')}
          >
            Shortlisted ({getFilteredCount('shortlisted')})
          </button>
          <button
            className={`filter-button ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({getFilteredCount('accepted')})
          </button>
          <button
            className={`filter-button ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({getFilteredCount('rejected')})
          </button>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <div className="application-info">
                    <h2 className="application-title">{getJobTitle(application)}</h2>
                    <p className="application-company">{getCompanyName(application)}</p>
                  </div>
                  <span className={`status-badge ${getStatusClass(application.status)}`}>
                    {formatStatus(application.status)}
                  </span>
                </div>

                <div className="application-details">
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{getJobLocation(application)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">💼</span>
                    <span>{getJobType(application)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">💰</span>
                    <span>{getSalary(application)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span>Applied: {getAppliedDate(application)}</span>
                  </div>
                </div>

                <div className="application-footer">
                  <Link to={`/jobs/${getJobId(application)}`} className="view-job-button">
                    View Job Details
                  </Link>
                  {application.status?.toLowerCase() === 'pending' && (
                    <button 
                      onClick={() => handleWithdraw(application.id)}
                      className="withdraw-button"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <p>
              {filter === 'all'
                ? "You haven't applied to any jobs yet."
                : `No ${filter} applications found.`}
            </p>
            {filter === 'all' && (
              <Link to="/jobs" className="browse-jobs-button">
                Browse Jobs
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
