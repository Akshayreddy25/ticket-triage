import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, ticketApi, DashboardStats, Ticket, setToken } from '../services/api'

const urgencyColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600'
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [injecting, setInjecting] = useState(false)
  const [filter, setFilter] = useState({ urgency: '', category: '', status: '' })
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        dashboardApi.stats(),
        ticketApi.list({ limit: 50 })
      ])
      setStats(statsRes.data)
      setTickets(ticketsRes.data.tickets)
      setTotal(ticketsRes.data.total)
    } catch (err) {
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    setToken(token)
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData, navigate])

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleInject = async () => {
    setInjecting(true)
    try {
      await dashboardApi.burst(10)
      await fetchData()
    } finally {
      setInjecting(false)
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (filter.urgency && t.urgency !== filter.urgency) return false
    if (filter.category && t.category !== filter.category) return false
    if (filter.status && t.status !== filter.status) return false
    return true
  })

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-gray-800">Ticket Triage</h1>
          <button onClick={() => navigate('/tickets')} className="text-sm text-gray-500 hover:text-gray-800">All Tickets</button>
          <button onClick={() => navigate('/submit')} className="text-sm text-gray-500 hover:text-gray-800">Submit Ticket</button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.full_name} - {user.role}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Sign out</button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total tickets</p>
              <p className="text-3xl font-semibold text-gray-800 mt-1">{stats.total_tickets.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">High urgency</p>
              <p className="text-3xl font-semibold text-red-600 mt-1">{stats.high_urgency.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pending review</p>
              <p className="text-3xl font-semibold text-blue-600 mt-1">{stats.by_status.new.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Routing accuracy</p>
              <p className="text-3xl font-semibold text-green-600 mt-1">
                {stats.total_feedback > 0 ? stats.routing_accuracy + '%' : 'N/A'}
              </p>
            </div>
          </div>
        )}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(stats.by_category).map(([cat, count]) => (
              <div key={cat} className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{cat.replace('_', ' ')}</span>
                <span className="text-sm font-semibold text-gray-800">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filter.urgency} onChange={e => setFilter({...filter, urgency: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
              <option value="">All urgencies</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filter.category} onChange={e => setFilter({...filter, category: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
              <option value="">All categories</option>
              <option value="billing">Billing</option>
              <option value="refund">Refund</option>
              <option value="technical">Technical</option>
              <option value="account_access">Account Access</option>
              <option value="delivery">Delivery</option>
              <option value="general">General</option>
            </select>
            <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            {(filter.urgency || filter.category || filter.status) && (
              <button onClick={() => setFilter({ urgency: '', category: '', status: '' })}
                className="text-sm text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{filteredTickets.length} shown / {total} total</span>
            <button onClick={handleInject} disabled={injecting}
              className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {injecting ? 'Injecting...' : '+ Inject 10 tickets'}
            </button>
            <button onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">
              Refresh
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} onClick={() => navigate('/tickets/' + ticket.id)}
              className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{ticket.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ticket.urgency && (
                    <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (urgencyColors[ticket.urgency] || '')}>
                      {ticket.urgency}
                    </span>
                  )}
                  <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (statusColors[ticket.status] || '')}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                {ticket.category && <span className="text-xs text-gray-400 capitalize">{ticket.category.replace('_', ' ')}</span>}
                {ticket.assigned_team && <span className="text-xs text-gray-400">{ticket.assigned_team}</span>}
                <span className="text-xs text-gray-300 ml-auto">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}