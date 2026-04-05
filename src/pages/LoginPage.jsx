import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, InputAdornment, IconButton, CircularProgress, Divider, Link
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';
import { fetchMe } from '../api/dhis2';

const BASE_URL_KEY = 'dhis2_base_url';

// PATH SVG
function PathLogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#E8332A"/>
      <path d="M14 28V12" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>

      {/* Top loop of P */}
      <path d="M14 12H22C25 12 27 14 27 17C27 20 25 22 22 22H14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem(BASE_URL_KEY) || 'http://localhost:8080');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const cleanUrl = baseUrl.replace(/\/$/, '');
      localStorage.setItem(BASE_URL_KEY, cleanUrl);
      const token = btoa(`${username}:${password}`);
      const me = await fetchMe(token);
      login(cleanUrl, token, me);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      bgcolor: '#F7F8FA',
    }}>
      {/* Left panel — PATH brand panel */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 420,
        flexShrink: 0,
        bgcolor: '#1A2B4A',
        p: 5,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative PATH slash shapes */}
        <Box sx={{ position: 'absolute', top: -40, right: -30, opacity: .07 }}>
          <svg width="280" height="400" viewBox="0 0 280 400" fill="none">
            <path d="M80 0L160 400" stroke="#E8332A" strokeWidth="60"/>
            <path d="M140 0L220 400" stroke="#E8332A" strokeWidth="60"/>
          </svg>
        </Box>
        <Box sx={{ position: 'absolute', bottom: -60, left: -20, opacity: .05 }}>
          <svg width="220" height="300" viewBox="0 0 220 300" fill="none">
            <circle cx="110" cy="150" r="150" fill="#007B83"/>
          </svg>
        </Box>

        {/* Logo top */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <PathLogoMark size={44} />
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: -.3, fontFamily: 'DM Sans, sans-serif' }}>
                PATH
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: .8 }}>
                path.org
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ color: '#fff', fontSize: 28, fontWeight: 300, lineHeight: 1.35, mb: 2, fontFamily: 'DM Sans, sans-serif' }}>
            DHIS2 Program<br />
            <Box component="span" sx={{ fontWeight: 700, color: '#E8332A' }}>Tracker App</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.6)', fontSize: 14, lineHeight: 1.7 }}>
            Capture data, manage tracked entities, and submit program events - Powered by DHIS2.
          </Typography>
        </Box>

        {/* Feature list */}
        <Box>
          {[
            'Event & Tracker program capture',
            'Role-based access control',
            'Org unit hierarchy navigation',
            'CORS proxy architecture',
          ].map(f => (
            <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#E8332A', flexShrink: 0 }} />
              <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>{f}</Typography>
            </Box>
          ))}
        </Box>

        <Typography sx={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>
          © {new Date().getFullYear()} PATH. All rights reserved.
        </Typography>
      </Box>

      {/* Right panel — login form */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', p: 3,
      }}>
        {/* Mobile header */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
          <PathLogoMark size={36} />
          <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#1A2B4A', fontFamily: 'DM Sans, sans-serif' }}>
            PATH DHIS2 Tracker
          </Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A2B4A', mb: .5, fontFamily: 'DM Sans, sans-serif' }}>
            Sign in
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: 14, mb: 3 }}>
            Use your DHIS2 credentials. Access is governed by your assigned roles.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: 13 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="DHIS2 Instance URL"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              size="small" fullWidth required
              placeholder="http://localhost:8080"
              helperText="Requests are proxied — no CORS errors"
              sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#007B83' } } }}
              InputLabelProps={{ sx: { '&.Mui-focused': { color: '#007B83' } } }}
            />
            <TextField
              label="Username" value={username}
              onChange={e => setUsername(e.target.value)}
              size="small" fullWidth required autoComplete="username"
              sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#007B83' } } }}
              InputLabelProps={{ sx: { '&.Mui-focused': { color: '#007B83' } } }}
            />
            <TextField
              label="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPass ? 'text' : 'password'}
              size="small" fullWidth required autoComplete="current-password"
              sx={{ '& .MuiOutlinedInput-root': { '&.Mui-focused fieldset': { borderColor: '#007B83' } } }}
              InputLabelProps={{ sx: { '&.Mui-focused': { color: '#007B83' } } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(s => !s)} edge="end">
                      {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit" variant="contained" fullWidth disabled={loading}
              sx={{
                bgcolor: '#E8332A', '&:hover': { bgcolor: '#C5281F' },
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                borderRadius: 2, textTransform: 'none', fontSize: 15, py: 1.2, mt: .5,
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : 'Sign in to DHIS2'
              }
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <LockOutlinedIcon sx={{ fontSize: 14, color: '#94A3B8', mt: .3, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
              Your credentials are sent directly to your DHIS2 instance and are never stored by this application.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
