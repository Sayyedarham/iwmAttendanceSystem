import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const QRCode = ({ value, size = 256 }) => {
  const [qrSvg, setQrSvg] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const QRCodeLib = (await import('https://esm.sh/qrcode@1.5.3')).default;
        const url = await QRCodeLib.toDataURL(value, {
          width: size,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setQrSvg(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    if (value) generateQR();
  }, [value, size]);

  return qrSvg ? (
    <img src={qrSvg} alt="QR Code" style={{ width: '256px', height: '256px' }} />
  ) : (
    <div style={{ width: '256px', height: '256px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
  );
};

export default function EmployeeApp() {
  const [view, setView] = useState('auth');
  const [form, setForm] = useState({ id: '', name: '', department: '' });
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async () => {
    if (!form.id.trim() || !form.name.trim() || !form.department.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('employees')
        .select('*')
        .eq('id', form.id)
        .eq('name', form.name)
        .eq('department', form.department)
        .maybeSingle();

      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

      if (existing) {
        setEmployee(existing);
        await fetchAttendance(existing.id);
        setView('dashboard');
      } else {
        const newEmp = {
          id: form.id,
          name: form.name,
          department: form.department,
          qr_code_url: form.id
        };

        const { data: created, error: insertErr } = await supabase
          .from('employees')
          .insert(newEmp)
          .select()
          .single();

        if (insertErr) throw insertErr;

        setEmployee(created);
        setAttendance([]);
        setView('dashboard');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (empId) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .order('date', { ascending: false });

    if (!error && data) setAttendance(data);
  };

  const logout = () => {
    setView('auth');
    setEmployee(null);
    setAttendance([]);
    setForm({ id: '', name: '', department: '' });
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      padding: '32px',
      width: '100%',
      maxWidth: '448px'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#2563EB',
      marginBottom: '8px',
      textAlign: 'center'
    },
    subtitle: {
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: '32px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    },
    inputGroup: {
      marginBottom: '16px'
    },
    button: {
      width: '100%',
      backgroundColor: '#2563EB',
      color: 'white',
      fontWeight: 'bold',
      padding: '12px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'background-color 0.2s'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    error: {
      backgroundColor: '#FEF2F2',
      borderLeft: '4px solid #EF4444',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '16px'
    },
    errorText: {
      color: '#DC2626',
      fontSize: '14px',
      fontWeight: '500'
    },
    dashContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      padding: '16px'
    },
    dashContent: {
      maxWidth: '768px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#2563EB'
    },
    headerSubtitle: {
      color: '#6B7280',
      marginTop: '4px'
    },
    logoutBtn: {
      padding: '8px 24px',
      backgroundColor: '#F3F4F6',
      color: '#1F2937',
      fontWeight: '600',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    qrSection: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '32px',
      marginBottom: '24px'
    },
    qrTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: '24px',
      textAlign: 'center'
    },
    qrContainer: {
      display: 'flex',
      justifyContent: 'center'
    },
    qrBox: {
      padding: '24px',
      backgroundColor: 'white',
      border: '4px solid #2563EB',
      borderRadius: '16px'
    },
    qrNote: {
      textAlign: 'center',
      color: '#6B7280',
      marginTop: '24px',
      fontSize: '14px'
    },
    historySection: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '24px'
    },
    historyTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: '16px'
    },
    noHistory: {
      textAlign: 'center',
      padding: '48px',
      color: '#9CA3AF'
    },
    historyItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      background: 'linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)',
      borderRadius: '12px',
      marginBottom: '12px',
      transition: 'box-shadow 0.2s'
    },
    historyDate: {
      color: '#374151',
      fontWeight: '600'
    },
    statusBadge: {
      padding: '8px 16px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    statusPresent: {
      backgroundColor: '#D1FAE5',
      color: '#065F46'
    },
    statusAbsent: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B'
    }
  };

  if (view === 'auth') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Attendance App</h1>
          <p style={styles.subtitle}>Employee Portal</p>

          <div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Employee ID</label>
              <input
                type="text"
                name="id"
                value={form.id}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your ID"
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your name"
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Department</label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter your department"
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {error && (
              <div style={styles.error}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              style={{...styles.button, ...(loading ? styles.buttonDisabled : {})}}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1D4ED8')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#2563EB')}
            >
              {loading ? 'Processing...' : 'Login / Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashContainer}>
      <div style={styles.dashContent}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>Attendance App</h1>
            <p style={styles.headerSubtitle}>
              {employee?.name} • {employee?.department}
            </p>
          </div>
          <button
            style={styles.logoutBtn}
            onClick={logout}
            onMouseOver={(e) => e.target.style.backgroundColor = '#E5E7EB'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#F3F4F6'}
          >
            Logout
          </button>
        </div>

        <div style={styles.qrSection}>
          <h2 style={styles.qrTitle}>Your QR Code</h2>
          <div style={styles.qrContainer}>
            <div style={styles.qrBox}>
              <QRCode value={employee?.qr_code_url || employee?.id} size={256} />
            </div>
          </div>
          <p style={styles.qrNote}>Show this QR code to mark your attendance</p>
        </div>

        <div style={styles.historySection}>
          <h2 style={styles.historyTitle}>Attendance History</h2>
          {attendance.length === 0 ? (
            <div style={styles.noHistory}>
              <p style={{ fontSize: '18px', fontWeight: '500' }}>No attendance history</p>
            </div>
          ) : (
            <div>
              {attendance.map((rec) => (
                <div
                  key={rec.id}
                  style={styles.historyItem}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <span style={styles.historyDate}>{formatDate(rec.date)}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(rec.status === 'present' ? styles.statusPresent : styles.statusAbsent)
                    }}
                  >
                    {rec.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}