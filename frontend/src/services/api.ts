import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + '/api/v1' : 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

export const setToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

export const getStoredToken = () => localStorage.getItem('token')

export interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  customer_tier: string
  category: string | null
  urgency: string | null
  assigned_team: string | null
  created_at: string
  updated_at: string
}

export interface Prediction {
  predicted_category: string
  category_confidence: number
  predicted_urgency: string
  urgency_confidence: number
  recommended_team: string
  routing_mode: string
}

export interface TicketWithPrediction {
  ticket: Ticket
  prediction: Prediction
}

export interface CreateTicketData {
  subject: string
  description: string
  customer_tier?: string
}

export interface DashboardStats {
  total_tickets: number
  by_status: {
    new: number
    assigned: number
    in_progress: number
    resolved: number
  }
  high_urgency: number
  by_category: Record<string, number>
  routing_accuracy: number
  total_feedback: number
}

export const ticketApi = {
  create: (data: CreateTicketData) =>
    api.post<TicketWithPrediction>('/tickets/', data),
  list: (params?: { skip?: number; limit?: number }) =>
    api.get<{ tickets: Ticket[]; total: number }>('/tickets/', { params }),
  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`)
}

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
  burst: (count: number) => api.post(`/simulate/burst?count=${count}`)
}

export const feedbackApi = {
  submit: (data: {
    ticket_id: string
    actual_category: string
    actual_urgency: string
    routing_correct: boolean
    feedback_notes?: string
  }) => api.post('/feedback/', data)
}

export default api