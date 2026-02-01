import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import './JobApplications.css';

const JobApplications = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchJobAndApplications();
  }, [id]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      const [jobResponse, applicationsResponse] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/applications/job/${id}`),  // Fixed API endpoint
      ]);

      setJob(jobResponse.data.data || jobResponse.data);
      setApplications(applicationsResponse.data.data || applicationsResponse.data.applications || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(applicationId);
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      toast.success(`Application status updated to ${newStatus}`);
      fetchJobAndApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
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
      case 'approved':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const getApplicantName = (application) => {
    return application.applicant_name || 
           application.applicantName ||
           application.jobSeeker?.jobSeekerProfile?.fullName ||
           application.jobSeeker?.fullName ||
           application.jobSeeker?.email ||
           'Unknown Applicant';
  };

  const getApplicantEmail = (application) => {
    return application.applicant_email || 
           application.applicantEmail ||
           application.jobSeeker?.email ||
           'N/A';
  };

  const filteredApplications = (applications || []).filter((app) => {
    if (!app) return false;
    if (filter === 'all') return true;
    return app.status?.toLowerCase() === filter;
  });

  const getStatusCount = (status) => {
    return (applications || []).filter(a => a?.status?.toLowerCase() === status).length;
  };

  if (loading) {
    return <div className="loading-container">Loading applications...</div>;
  }

  return (
    <div className="job-applications-page">
      <div className="job-applications-container">
        {/* Job Info */}
        {job && (
          <div className="job-info-section">
            <h1 className="page-title">{job.title}</h1>
            <div className="job-meta">
              <span>📍 {job.location}</span>
              <span>💼 {job.jobType || job.job_type}</span>
              <span>📝 {(applications || []).length} Applications</span>
            </div>
            <Link to="/employer/dashboard" className="back-link">
              ← Back to Dashboard
            </Link>
          </div>
        )}

        {/* Filter */}
        <div className="filter-section">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({(applications || []).length})
          </button>
          <button
            className={`filter-button ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({getStatusCount('pending')})
          </button>
          <button
            className={`filter-button ${filter === 'reviewing' ? 'active' : ''}`}
            onClick={() => setFilter('reviewing')}
          >
            Reviewing ({getStatusCount('reviewing')})
          </button>
          <button
            className={`filter-button ${filter === 'shortlisted' ? 'active' : ''}`}
            onClick={() => setFilter('shortlisted')}
          >
            Shortlisted ({getStatusCount('shortlisted')})
          </button>
          <button
            className={`filter-button ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted ({getStatusCount('accepted')})
          </button>
          <button
            className={`filter-button ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({getStatusCount('rejected')})
          </button>
        </div>

        {/* Applications List */}
        {filteredApplications.length > 0 ? (
          <div className="applications-grid">
            {filteredApplications.map((application) => (
              <div key={application.id} className="applicant-card">
                <div className="applicant-header">
                  <div>
                    <h3 className="applicant-name">{getApplicantName(application)}</h3>
                    <p className="applicant-email">{getApplicantEmail(application)}</p>
                    {(application.applicant_phone || application.applicantPhone) && (
                      <p className="applicant-phone">📱 {application.applicant_phone || application.applicantPhone}</p>
                    )}
                  </div>
                  <span className={`status-badge ${getStatusClass(application.status)}`}>
                    {application.status || 'Pending'}
                  </span>
                </div>

                <div className="applicant-details">
                  {(application.applicant_location || application.applicantLocation) && (
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span>{application.applicant_location || application.applicantLocation}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Applied on:</span>
                    <span>{new Date(application.createdAt || application.created_at).toLocaleDateString()}</span>
                  </div>
                  {(application.applicant_skills || application.applicantSkills) && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Skills:</span>
                      <span>{application.applicant_skills || application.applicantSkills}</span>
                    </div>
                  )}
                  {application.coverLetter && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Cover Letter:</span>
                      <p className="cover-letter-text">{application.coverLetter}</p>
                    </div>
                  )}
                </div>

                {(application.resume_url || application.resumeUrl) && (
                  <a
                    href={application.resume_url || application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-link"
                  >
                    📄 View Resume
                  </a>
                )}

                {/* Status Update Dropdown */}
                <div className="status-update-section">
                  <label className="status-label">Update Status:</label>
                  <select
                    className="status-select"
                    value={application.status || 'pending'}
                    onChange={(e) => handleStatusChange(application.id, e.target.value)}
                    disabled={updatingStatus === application.id}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Quick Action Buttons */}
                <div className="action-buttons">
                  {application.status?.toLowerCase() !== 'reviewing' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'reviewing')}
                      className="review-button"
                      disabled={updatingStatus === application.id}
                    >
                      👀 Review
                    </button>
                  )}
                  {application.status?.toLowerCase() !== 'shortlisted' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'shortlisted')}
                      className="shortlist-button"
                      disabled={updatingStatus === application.id}
                    >
                      ⭐ Shortlist
                    </button>
                  )}
                  {application.status?.toLowerCase() !== 'accepted' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'accepted')}
                      className="accept-button"
                      disabled={updatingStatus === application.id}
                    >
                      ✅ Accept
                    </button>
                  )}
                  {application.status?.toLowerCase() !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(application.id, 'rejected')}
                      className="reject-button"
                      disabled={updatingStatus === application.id}
                    >
                      ❌ Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {filter === 'all'
                ? 'No applications received yet.'
                : `No ${filter} applications found.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
