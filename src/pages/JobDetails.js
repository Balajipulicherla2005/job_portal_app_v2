import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { jobAPI, applicationAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [checkingApplication, setCheckingApplication] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useEffect(() => {
    // Check if user has already applied when user and job are available
    if (user && user.role === 'jobseeker' && id) {
      checkIfAlreadyApplied();
    }
  }, [user, id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobAPI.getJobById(id);
      setJob(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to fetch job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyApplied = async () => {
    setCheckingApplication(true);
    try {
      const response = await applicationAPI.checkIfApplied(id);
      if (response.data.hasApplied) {
        setHasApplied(true);
        setApplicationStatus(response.data.application?.status || 'pending');
      }
    } catch (error) {
      // If 403 error (not job seeker), ignore silently
      if (error.response?.status !== 403) {
        console.error('Error checking application status:', error);
      }
    } finally {
      setCheckingApplication(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast.info('Please login to apply');
      navigate('/login');
      return;
    }

    if (user.role !== 'jobseeker' && user.role !== 'job_seeker') {
      toast.error('Only job seekers can apply');
      return;
    }

    setApplying(true);
    try {
      await applicationAPI.apply(id, { coverLetter });
      toast.success('Application submitted successfully!');
      setCoverLetter('');
      setHasApplied(true);
      setApplicationStatus('pending');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#f59e0b';
      case 'reviewing':
        return '#3b82f6';
      case 'shortlisted':
        return '#8b5cf6';
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) return <Loading />;
  if (!job) return <div>Job not found</div>;

  const isJobSeeker = user && (user.role === 'jobseeker' || user.role === 'job_seeker');

  return (
    <div className="page-container">
      <div className="job-details-container">
        <div className="job-details-main">
          <div className="card">
            <div className="job-details-header">
              <div>
                <h1 className="job-details-title">{job.title}</h1>
                <div className="job-details-meta">
                  <span className="company-name">
                    {job.employer?.employerProfile?.companyName || job.companyName || 'Company'}
                  </span>
                  <span className="job-type-badge">{job.jobType}</span>
                </div>
              </div>
            </div>

            <div className="job-details-info">
              <div className="info-item">
                <strong>📍 Location:</strong> {job.location}
              </div>
              <div className="info-item">
                <strong>💰 Salary:</strong> ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()} {job.salaryPeriod && `(${job.salaryPeriod})`}
              </div>
              <div className="info-item">
                <strong>📅 Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}
              </div>
              {job.applicationDeadline && (
                <div className="info-item">
                  <strong>⏰ Deadline:</strong> {new Date(job.applicationDeadline).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="divider"></div>

            <div className="job-section">
              <h2>Job Description</h2>
              <p className="section-content">{job.description}</p>
            </div>

            {job.qualifications && (
              <div className="job-section">
                <h2>Qualifications</h2>
                <p className="section-content">{job.qualifications}</p>
              </div>
            )}

            {job.responsibilities && (
              <div className="job-section">
                <h2>Responsibilities</h2>
                <p className="section-content">{job.responsibilities}</p>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="job-section">
                <h2>Required Skills</h2>
                <div className="skills-list">
                  {(Array.isArray(job.skills) ? job.skills : [job.skills]).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits && (
              <div className="job-section">
                <h2>Benefits</h2>
                <p className="section-content">{job.benefits}</p>
              </div>
            )}
          </div>

          {/* Application Section */}
          {isJobSeeker && (
            <div className="card">
              {checkingApplication ? (
                <div className="checking-application">
                  <p>Checking application status...</p>
                </div>
              ) : hasApplied ? (
                <div className="already-applied">
                  <div className="applied-header">
                    <span className="applied-icon">✓</span>
                    <h2>You've Already Applied</h2>
                  </div>
                  <p className="applied-message">
                    You submitted your application for this position.
                  </p>
                  <div className="application-status-display">
                    <span className="status-label">Application Status:</span>
                    <span 
                      className="status-value"
                      style={{ 
                        backgroundColor: getStatusColor(applicationStatus),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      {formatStatus(applicationStatus)}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate('/job-seeker/applications')}
                    className="btn btn-secondary"
                    style={{ marginTop: '16px' }}
                  >
                    View My Applications
                  </button>
                </div>
              ) : (
                <>
                  <h2>Apply for this Position</h2>
                  <div className="form-group">
                    <label htmlFor="coverLetter">Cover Letter (Optional)</label>
                    <textarea
                      id="coverLetter"
                      className="form-control"
                      rows="6"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell us why you're a great fit for this role..."
                    />
                  </div>
                  <button 
                    onClick={handleApply} 
                    className="btn btn-primary btn-block"
                    disabled={applying}
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Prompt to login for non-logged in users */}
          {!user && (
            <div className="card">
              <h2>Interested in this position?</h2>
              <p>Please login or register to apply for this job.</p>
              <div className="auth-buttons">
                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="btn btn-secondary"
                >
                  Register
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
