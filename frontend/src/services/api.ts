import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

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

export interface CreateTicketData {
  subject: string
  description: string
  customer_tier?: string
}

export const ticketApi = {
  create: (data: CreateTicketData) =>
    api.post<Ticket>('/tickets/', data),
  list: () =>
    api.get<{ tickets: Ticket[]; total: number }>('/tickets/'),
  get: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`)
}
