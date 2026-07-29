import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ImpersonateLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const logId = searchParams.get('logId');

    if (token && userStr) {
      try {
        const parsedToken = JSON.parse(token);
        localStorage.setItem('accessToken', JSON.stringify(parsedToken));
        localStorage.setItem('user', userStr);
        if (logId) {
          localStorage.setItem('impersonateLogId', logId);
        }
        
        // Load user context
        fetchUser().then(() => {
          navigate('/dashboard');
        });
      } catch (err) {
        console.error('Failed to log in as client:', err);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, fetchUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #00853b', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#4b5563', fontSize: '14px', fontWeight: 600 }}>Logging in as client...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImpersonateLogin;
