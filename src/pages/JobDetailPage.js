import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './JobDetails.css';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isJobSeeker, user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isJobSeeker && id) {
      checkApplicationStatus();
    }
  }, [isAuthenticated, isJobSeeker, id]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      console.log('Job details response:', response.data);
      setJob(response.data.data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await api.get(`/applications/check/${id}`);
      console.log('Application check response:', response.data);
      setHasApplied(response.data.hasApplied);
      if (response.data.application) {
        setApplicationStatus(response.data.application.status);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
      // Don't show error toast for this, it's just a background check
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.info('Please login as a job seeker to apply');
      navigate('/login');
      return;
    }

    if (!isJobSeeker) {
      toast.error('Only job seekers can apply for jobs');
      return;
    }

    if (hasApplied) {
      toast.info('You have already applied to this job');
      return;
    }

    setApplying(true);
    try {
      const response = await api.post('/applications', { jobId: id });
      console.log('Application response:', response.data);
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setApplicationStatus('pending');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const getApplyButtonText = () => {
    if (applying) return 'Applying...';
    if (hasApplied) {
      if (applicationStatus) {
        return `Applied - ${applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}`;
      }
      return 'Already Applied';
    }
    return 'Apply Now';
  };

  const formatSalary = () => {
    if (job?.salaryMin && job?.salaryMax) {
      const period = job?.salaryPeriod || 'year';
      return `₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()} / ${period}`;
    }
    if (job?.salary_range) {
      return job.salary_range;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-page">
        <div className="error-container">
          <h2>Job not found</h2>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/jobs')} className="back-button">
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  const companyName = job.companyName || job.employer?.employerProfile?.companyName || 'Company';
  const companyDescription = job.company_description || job.employer?.employerProfile?.description;

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        {/* Job Header */}
        <div className="job-detail-header">
          <div className="job-header-content">
            <h1 className="job-detail-title">{job.title}</h1>
            <p className="job-detail-company">{companyName}</p>
            <div className="job-meta">
              <span className="job-meta-item">📍 {job.location || 'Not specified'}</span>
              <span className="job-meta-item">💼 {job.jobType || job.job_type || 'Full-time'}</span>
              {formatSalary() && (
                <span className="job-meta-item">💰 {formatSalary()}</span>
              )}
            </div>
          </div>
          
          {/* Apply Button - Only show for job seekers */}
          {isJobSeeker && (
            <button
              onClick={handleApply}
              className={`apply-button ${hasApplied ? 'applied' : ''}`}
              disabled={applying || hasApplied}
            >
              {getApplyButtonText()}
            </button>
          )}
        </div>

        {/* Application Status Banner */}
        {hasApplied && applicationStatus && (
          <div className={`application-status-banner status-${applicationStatus}`}>
            <span className="status-icon">✓</span>
            <span>You have applied to this job. Current status: <strong>{applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}</strong></span>
          </div>
        )}

        {/* Job Details */}
        <div className="job-detail-content">
          <section className="detail-section">
            <h2>Job Description</h2>
            <div className="detail-text">{job.description}</div>
          </section>

          {job.qualifications && (
            <section className="detail-section">
              <h2>Qualifications</h2>
              <div className="detail-text">{job.qualifications}</div>
            </section>
          )}

          {job.responsibilities && (
            <section className="detail-section">
              <h2>Responsibilities</h2>
              <div className="detail-text">{job.responsibilities}</div>
            </section>
          )}

          {companyDescription && (
            <section className="detail-section">
              <h2>About the Company</h2>
              <div className="detail-text">{companyDescription}</div>
            </section>
          )}

          <section className="detail-section">
            <h2>Additional Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Posted on:</strong>
                <span>{new Date(job.createdAt || job.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              {job.applicationDeadline && (
                <div className="info-item">
                  <strong>Application Deadline:</strong>
                  <span>{new Date(job.applicationDeadline).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
              {(job.contact_email || job.contactEmail) && (
                <div className="info-item">
                  <strong>Contact:</strong>
                  <span>{job.contact_email || job.contactEmail}</span>
                </div>
              )}
              {job.status && (
                <div className="info-item">
                  <strong>Status:</strong>
                  <span className={`job-status ${job.status}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Action Section */}
        {isJobSeeker && (
          <div className="job-action-section">
            {!hasApplied ? (
              <button
                onClick={handleApply}
                className="apply-button-large"
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Apply for this Job'}
              </button>
            ) : (
              <div className="already-applied-message">
                <span className="check-icon">✓</span>
                <span>You have already applied for this position</span>
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="login-prompt">
            <p>Want to apply for this job?</p>
            <button onClick={() => navigate('/login')} className="login-button">
              Login as Job Seeker
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
