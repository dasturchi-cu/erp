import axios from 'axios';

const API_BASE_URL = 'https://erp-backend-r067.onrender.com/api/v1';

export const saasClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

saasClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

saasClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('saas_refresh_token');
        if (!refresh) throw new Error();

        const { data } = await axios.post(`${API_BASE_URL}/saas-admin/auth/refresh`, {
          refreshToken: refresh,
        });

        localStorage.setItem('saas_access_token', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return saasClient(originalRequest);
      } catch {
        localStorage.removeItem('saas_access_token');
        localStorage.removeItem('saas_refresh_token');
        window.dispatchEvent(new Event('saas-logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const saasApi = {
  login: async (email: string, password: string, rememberMe?: boolean) => {
    const { data } = await saasClient.post('/saas-admin/auth/login', {
      email,
      password,
      rememberMe,
    });
    return data;
  },

  getDashboardStats: async () => {
    const { data } = await saasClient.get('/saas-admin/dashboard');
    return data;
  },

  getCompanies: async (params: { page: number; limit: number; q?: string; status?: string }) => {
    const { data } = await saasClient.get('/saas-admin/companies', { params });
    return data;
  },

  createCompany: async (companyData: any) => {
    const { data } = await saasClient.post('/saas-admin/companies', companyData);
    return data;
  },

  getCompanyProfile: async (id: string) => {
    const { data } = await saasClient.get(`/saas-admin/company/${id}`);
    return data;
  },

  updateCompany: async (id: string, companyData: any) => {
    const { data } = await saasClient.patch(`/saas-admin/company/${id}`, companyData);
    return data;
  },

  deleteCompany: async (id: string) => {
    const { data } = await saasClient.delete(`/saas-admin/company/${id}`);
    return data;
  },

  getCompanyBranches: async (id: string) => {
    const { data } = await saasClient.get(`/saas-admin/company/${id}/branches`);
    return data;
  },

  createCompanyBranch: async (id: string, branchData: { name: string; address?: string }) => {
    const { data } = await saasClient.post(`/saas-admin/company/${id}/branches`, branchData);
    return data;
  },

  getCompanyUsers: async (id: string) => {
    const { data } = await saasClient.get(`/saas-admin/company/${id}/users`);
    return data;
  },

  createCompanyUser: async (id: string, userData: { email: string; password?: string; firstName: string; lastName: string; roleName: string }) => {
    const { data } = await saasClient.post(`/saas-admin/company/${id}/users`, userData);
    return data;
  },

  updateUserBranch: async (id: string, userId: string, branchId: string | null) => {
    const { data } = await saasClient.patch(`/saas-admin/company/${id}/users/${userId}/branch`, { branchId });
    return data;
  },

  changeUserPassword: async (companyId: string, userId: string, password: string) => {
    const { data } = await saasClient.patch(`/saas-admin/company/${companyId}/users/${userId}/password`, { password });
    return data;
  },

  updateLicense: async (companyId: string, licenseData: { status: string; endDate: string }) => {
    const { data } = await saasClient.patch(`/saas-admin/company/${companyId}/license`, licenseData);
    return data;
  },

  getAdmins: async () => {
    const { data } = await saasClient.get('/saas-admin/admins');
    return data;
  },

  createAdmin: async (adminData: any) => {
    const { data } = await saasClient.post('/saas-admin/admins', adminData);
    return data;
  },

  updateAdmin: async (id: string, adminData: any) => {
    const { data } = await saasClient.patch(`/saas-admin/admins/${id}`, adminData);
    return data;
  },

  deleteAdmin: async (id: string) => {
    const { data } = await saasClient.delete(`/saas-admin/admins/${id}`);
    return data;
  },

  getReleases: async () => {
    const { data } = await saasClient.get('/saas-admin/releases');
    return data;
  },

  uploadRelease: async (formData: FormData) => {
    const { data } = await saasClient.post('/saas-admin/releases/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  updateReleaseStatus: async (id: string, status: string) => {
    const { data } = await saasClient.patch(`/saas-admin/releases/${id}/status`, { status });
    return data;
  },

  emergencyStop: async (id: string) => {
    const { data } = await saasClient.post(`/saas-admin/releases/${id}/emergency-stop`);
    return data;
  },

  deleteRelease: async (id: string) => {
    const { data } = await saasClient.delete(`/saas-admin/releases/${id}`);
    return data;
  },

  getReleaseProgress: async (id: string) => {
    const { data } = await saasClient.get(`/saas-admin/releases/${id}/progress`);
    return data;
  },

  getReleaseHistory: async (id: string) => {
    const { data } = await saasClient.get(`/saas-admin/releases/${id}/history`);
    return data;
  },

  getHealthScores: async () => {
    const { data } = await saasClient.get('/saas-admin/health-scores');
    return data;
  },
};
