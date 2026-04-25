// Central API configuration
// In development: reads from frontend/.env (VITE_API_URL=http://localhost:8000)
// In production: set VITE_API_URL in your Vercel Environment Variables to your Render backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
