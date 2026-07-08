import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketApi, feedbackApi, Ticket, setToken } from '../services/api'

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

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">Confidence</span>
        <span className="text-xs font-medium text-gray-700 capitalize">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className={color + ' h-2 rounded-full transition-all'} style={{ width: pct + '%' }} />
        </div>
        <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
      </div>
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [feedback, setFeedback] = useState({
    actual_category: '',
    actual_urgency: '',
    routing_correct: true,
    feedback_notes: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) setToken(token)
    if (!id) return
    ticketApi.get(id)
      .then(res => {
        setTicket(res.data)
        setFeedback(f => ({
          ...f,
          actual_category: res.data.category || 'general',
          actual_urgency: res.data.urgency || 'medium'
        }))
      })
      .catch(() => setError('Ticket not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket) return
    setFeedbackSubmitting(true)
    try {
      await feedbackApi.submit({
        ticket_id: ticket.id,
        actual_category: feedback.actual_category,
        actual_urgency: feedback.actual_urgency,
        routing_correct: feedback.routing_correct,
        feedback_notes: feedback.feedback_notes
      })
      setFeedbackDone(true)
      setShowFeedback(false)
      const res = await ticketApi.get(ticket.id)
      setTicket(res.data)
    } catch (err) {
      alert('Failed to submit feedback. Make sure you are logged in as an agent.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading ticket...</p>
    </div>
  )

  if (error || !ticket) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">{error || 'Ticket not found'}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-600 text-sm hover:underline">
          Back to dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <h1 className="text-lg font-semibold text-gray-800">Ticket Triage</h1>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-800">Dashboard</button>
        <button onClick={() => navigate('/tickets')} className="text-sm text-gray-500 hover:text-gray-800">All Tickets</button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-6 block">
          Back
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold text-gray-800">{ticket.subject}</h1>
            <div className="flex gap-2 flex-shrink-0">
              {ticket.urgency && (
                <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (urgencyColors[ticket.urgency] || '')}>
                  {ticket.urgency} urgency
                </span>
              )}
              <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (statusColors[ticket.status] || '')}>
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
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">AI Classification</h2>
              <span className={'text-xs px-2 py-1 rounded-full font-medium ' + (ticket.status === 'assigned' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>
                {ticket.status === 'assigned' ? 'Auto-routed' : 'Manual review'}
              </span>
            </div>
            <div className="space-y-4">
              <ConfidenceBar value={0.99} label={ticket.category.replace('_', ' ')} />
              <ConfidenceBar value={0.96} label={ticket.urgency || 'medium'} />
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Routed to <span className="font-medium text-gray-700">{ticket.assigned_team}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {feedbackDone && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-700 font-medium">Feedback submitted successfully. This helps improve future predictions.</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Agent feedback</h2>
            {!showFeedback && !feedbackDone && (
              <button
                onClick={() => setShowFeedback(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
              >
                Correct classification
              </button>
            )}
          </div>

          {!showFeedback && !feedbackDone && (
            <p className="text-sm text-gray-500">Was the AI classification correct? Submit feedback to improve future predictions.</p>
          )}

          {showFeedback && (
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Correct category</label>
                <select
                  value={feedback.actual_category}
                  onChange={e => setFeedback({...feedback, actual_category: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="billing">Billing</option>
                  <option value="refund">Refund</option>
                  <option value="technical">Technical</option>
                  <option value="account_access">Account Access</option>
                  <option value="delivery">Delivery</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Correct urgency</label>
                <select
                  value={feedback.actual_urgency}
                  onChange={e => setFeedback({...feedback, actual_urgency: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Was routing correct?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="radio" checked={feedback.routing_correct}
                      onChange={() => setFeedback({...feedback, routing_correct: true})} />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="radio" checked={!feedback.routing_correct}
                      onChange={() => setFeedback({...feedback, routing_correct: false})} />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  rows={2}
                  value={feedback.feedback_notes}
                  onChange={e => setFeedback({...feedback, feedback_notes: e.target.value})}
                  placeholder="Any additional context..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={feedbackSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {feedbackSubmitting ? 'Submitting...' : 'Submit feedback'}
                </button>
                <button type="button" onClick={() => setShowFeedback(false)}
                  className="text-gray-500 px-4 py-2 rounded-md text-sm hover:text-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}