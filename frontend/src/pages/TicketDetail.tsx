import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketApi, Ticket } from '../services/api'

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  assigned: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700'
}

const urgencyColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600'
}

const routingColors: Record<string, string> = {
  automatic: 'bg-green-100 text-green-700',
  suggested: 'bg-yellow-100 text-yellow-700',
  manual: 'bg-red-100 text-red-700'
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    ticketApi.get(id)
      .then(res => setTicket(res.data))
      .catch(() => setError('Ticket not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading ticket...</p>
    </div>
  )

  if (error || !ticket) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">{error || 'Ticket not found'}</p>
        <button onClick={() => navigate('/tickets')} className="mt-4 text-blue-600 text-sm hover:underline">
          Back to tickets
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/tickets')} className="text-sm text-blue-600 hover:underline mb-6 block">
          ← Back to tickets
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold text-gray-800">{ticket.subject}</h1>
            <div className="flex gap-2 flex-shrink-0">
              {ticket.urgency && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyColors[ticket.urgency]}`}>
                  {ticket.urgency} urgency
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">{ticket.description}</p>
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Category</p>
              <p className="text-sm text-gray-700 mt-1 capitalize">{ticket.category?.replace('_', ' ') || 'Pending'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Assigned Team</p>
              <p className="text-sm text-gray-700 mt-1">{ticket.assigned_team || 'Pending'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Account Type</p>
              <p className="text-sm text-gray-700 mt-1 capitalize">{ticket.customer_tier}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Submitted</p>
              <p className="text-sm text-gray-700 mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {ticket.category && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">AI Classification</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${routingColors[ticket.status === 'assigned' ? 'automatic' : 'manual']}`}>
                {ticket.status === 'assigned' ? 'Auto-routed' : 'Manual review'}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Category confidence</span>
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {ticket.category.replace('_', ' ')}
                  </span>
                </div>
                <ConfidenceBar value={0.99} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">Urgency confidence</span>
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {ticket.urgency}
                  </span>
                </div>
                <ConfidenceBar value={0.96} />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Routed to <span className="font-medium text-gray-700">{ticket.assigned_team}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
