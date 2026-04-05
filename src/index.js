import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './pages/MainLayout';

// MUI THEME
const theme = createTheme({
  palette: {
    primary:   { main: '#007B83', light: '#E0F4F5', dark: '#005F66' },
    secondary: { main: '#E8332A', light: '#FDE8E7', dark: '#C5281F' },
    background: { default: '#F5F7FA' },
    text: { primary: '#1A2B4A', secondary: '#64748B' },
  },
  typography: {
    fontFamily: 'DM Sans, system-ui, sans-serif',
    h1: { fontFamily: 'DM Serif Display, Georgia, serif' },
    h2: { fontFamily: 'DM Serif Display, Georgia, serif' },
    h3: { fontFamily: 'DM Serif Display, Georgia, serif' },
    h4: { fontFamily: 'DM Serif Display, Georgia, serif' },
    h5: { fontFamily: 'DM Serif Display, Georgia, serif' },
    h6: { fontFamily: 'DM Serif Display, Georgia, serif' },
  },
  components: {
    MuiButton:    { styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontFamily: 'DM Sans, sans-serif' } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 8, fontFamily: 'DM Sans, sans-serif' } } } },
    MuiCard:      { styleOverrides: { root: { borderRadius: 12 } } },
    MuiChip:      { styleOverrides: { root: { fontFamily: 'DM Sans, sans-serif' } } },
    MuiPaper:     { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
  shape: { borderRadius: 8 },
});

// REACT QUERY
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 2 * 60 * 1000,
    },
  },
});

// PROTECTED ROUTE
function ProtectedRoute({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
    </Routes>
  );
}

// ROOT
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
