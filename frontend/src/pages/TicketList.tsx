import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export default function TicketList() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketApi.list().then(res => {
      setTickets(res.data.tickets)
      setTotal(res.data.total)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading tickets...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Support Tickets</h1>
            <p className="text-gray-500 text-sm mt-1">{total} total tickets</p>
          </div>
          <button
            onClick={() => navigate('/submit')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            New Ticket
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No tickets yet.</p>
            <button
              onClick={() => navigate('/submit')}
              className="mt-4 text-blue-600 text-sm hover:underline"
            >
              Submit the first ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{ticket.subject}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ticket.urgency && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyColors[ticket.urgency]}`}>
                        {ticket.urgency}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  {ticket.category && (
                    <span className="text-xs text-gray-500">
                      Category: <span className="font-medium">{ticket.category}</span>
                    </span>
                  )}
                  {ticket.assigned_team && (
                    <span className="text-xs text-gray-500">
                      Team: <span className="font-medium">{ticket.assigned_team}</span>
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
