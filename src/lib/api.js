const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'freelancer_az_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    throw new Error('Serverə qoşulmaq mümkün olmadı. Backend işə salındığından əmin olun (npm run server).');
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Xəta baş verdi (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
  getSpecialties: () => request('/profile/specialties'),
  addSpecialty: (payload) => request('/profile/specialties', { method: 'POST', body: payload }),
  deleteSpecialty: (id) => request(`/profile/specialties/${id}`, { method: 'DELETE' }),

  getTasks: (params = {}) => request(`/tasks?${new URLSearchParams(params).toString()}`, { auth: false }),
  getMyTasks: () => request('/tasks/mine'),
  getTask: (id) => request(`/tasks/${id}`, { auth: false }),
  createTask: (payload) => request('/tasks', { method: 'POST', body: payload }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  applyToTask: (id, message, price, priceType, deliveryDays) => request(`/tasks/${id}/apply`, { method: 'POST', body: { message, price, priceType, deliveryDays } }),
  getMyApplications: () => request('/tasks/applications/mine'),
  getDashboardTasks: () => request('/tasks/dashboard/mine'),
  acceptApplication: (taskId, appId) => request(`/tasks/${taskId}/applications/${appId}/accept`, { method: 'POST' }),
  deleteApplication: (taskId, appId) => request(`/tasks/${taskId}/applications/${appId}`, { method: 'DELETE' }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'POST', body: { status } }),
  reviewTask: (id, payload) => request(`/tasks/${id}/reviews`, { method: 'POST', body: payload }),

  getFreelancers: () => request('/users/freelancers', { auth: false }),
  getUser: (id) => request(`/users/${id}`, { auth: false }),

  getConversations: () => request('/messages/conversations'),
  getThread: (userId) => request(`/messages/${userId}`),
  sendMessage: (toUserId, text) => request('/messages', { method: 'POST', body: { toUserId, text } }),

  getProjects: (params = {}) => request(`/projects?${new URLSearchParams(params).toString()}`, { auth: false }),
  getProject: (id) => request(`/projects/${id}`, { auth: false }),
  createProject: (payload) => request('/projects', { method: 'POST', body: payload }),
  likeProject: (id) => request(`/projects/${id}/like`, { method: 'POST' }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  getClubPosts: (search = '') => request(`/club?search=${encodeURIComponent(search)}`, { auth: false }),
  getClubPost: (id) => request(`/club/${id}`, { auth: false }),
  createClubPost: (payload) => request('/club', { method: 'POST', body: payload }),
  deleteClubPost: (id) => request(`/club/${id}`, { method: 'DELETE' }),
  addClubComment: (id, text) => request(`/club/${id}/comments`, { method: 'POST', body: { text } }),
  submitSupport: (payload) => request('/support', { method: 'POST', body: payload, auth: false }),
  getNotifications: () => request('/notifications'),
  markNotificationsRead: () => request('/notifications/read', { method: 'POST' }),
  getSocialLinks: () => request('/social/links'),
  saveSocialLinks: (payload) => request('/social/links', { method: 'PUT', body: payload }),
  followUser: (id) => request(`/social/follow/${id}`, { method: 'POST' }),
  updateOnlineStatus: (isOnline) => request('/social/status', { method: 'PUT', body: { isOnline } }),
  getOnlineStatus: (id) => request(`/social/status/${id}`, { auth: false }),
  uploadMedia: (file) => {
    const body = new FormData();
    body.append('file', file);
    return request('/uploads/media', { method: 'POST', body });
  },
};

export { setToken as setAuthToken, getToken as getAuthToken };
