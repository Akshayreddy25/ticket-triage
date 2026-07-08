import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + '/api/v1' : 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  team: string | null
}

export const authApi = {
  login: async (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const res = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return res.data
  }
}

export const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export const getStoredToken = () => localStorage.getItem('token')

export default api