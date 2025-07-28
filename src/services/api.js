// src/services/api.js

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    if (res.status === 401) { // 인증 실패 시
      localStorage.removeItem('token');
      window.location.reload();
    }
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
}

export async function loadProfile() {
  return request('/profile');
}

export async function saveProfile(exp) {
  return request('/profile', {
    method: 'PUT',
    body: JSON.stringify({ exp }),
  });
}