import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff, Cloud as CloudIcon } from '@mui/icons-material';
import { useSaaSStore } from '@/stores/saasStore';

export function SaaSLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, error } = useSaaSStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/super-admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password, rememberMe);
      navigate('/super-admin/dashboard');
    } catch {
      // Handled by store state
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => t.palette.mode === 'light' ? '#F1F5F9' : '#0F172A',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: '#FFFFFF', mb: 1.5 }}>
              <CloudIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Super Admin Kirish
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SaaS Tizim Boshqaruv Platformasi
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoFocus
              />

              <TextField
                fullWidth
                label="Parol"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Meni eslab qol"
                />
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.2, borderRadius: 2, fontWeight: 600 }}
              >
                {loading ? 'Kirilmoqda...' : 'Kirish'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
export default SaaSLoginPage;
