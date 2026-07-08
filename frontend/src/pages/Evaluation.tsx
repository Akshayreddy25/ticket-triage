import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/api'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8000/api/v1' })

interface Stats {
  total_tickets: number
  by_status: Record<string, number>
  high_urgency: number
  by_category: Record<string, number>
  routing_accuracy: number
  total_feedback: number
}

export default function Evaluation() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [feedbackStats, setFeedbackStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    setToken(token)
    api.defaults.headers.common['Authorization'] = 'Bearer ' + token
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/feedback/stats')
    ]).then(([statsRes, feedbackRes]) => {
      setStats(statsRes.data)
      setFeedbackStats(feedbackRes.data)
    }).catch(() => navigate('/login'))
    .finally(() => setLoading(false))
  }, [navigate])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading metrics...</p>
    </div>
  )

  const resolved = stats?.by_status?.resolved || 0
  const total = stats?.total_tickets || 1
  const resolutionRate = Math.round(resolved / total * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <h1 className="text-lg font-semibold text-gray-800">Ticket Triage</h1>
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-800">Dashboard</button>
        <button onClick={() => navigate('/tickets')} className="text-sm text-gray-500 hover:text-gray-800">All Tickets</button>
        <span className="text-sm text-blue-600 font-medium">Evaluation</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Evaluation metrics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total tickets</p>
            <p className="text-3xl font-semibold text-gray-800 mt-1">{stats?.total_tickets.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Feedback collected</p>
            <p className="text-3xl font-semibold text-blue-600 mt-1">{feedbackStats?.total_feedback || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Routing accuracy</p>
            <p className="text-3xl font-semibold text-green-600 mt-1">
              {feedbackStats?.total_feedback > 0 ? feedbackStats.routing_accuracy + '%' : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Resolution rate</p>
            <p className="text-3xl font-semibold text-purple-600 mt-1">{resolutionRate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ticket status breakdown</h3>
            {stats && Object.entries(stats.by_status).map(([status, count]) => {
              const pct = Math.round((count as number) / total * 100)
              const colors: Record<string, string> = {
                new: 'bg-blue-500', assigned: 'bg-yellow-500',
                in_progress: 'bg-purple-500', resolved: 'bg-green-500'
              }
              return (
                <div key={status} className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span>{(count as number).toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className={(colors[status] || 'bg-gray-400') + ' h-2 rounded-full'} style={{ width: pct + '%' }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Category distribution</h3>
            {stats && Object.entries(stats.by_category).map(([cat, count]) => {
              const pct = Math.round((count as number) / total * 100)
              return (
                <div key={cat} className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="capitalize">{cat.replace('_', ' ')}</span>
                    <span>{(count as number).toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: pct + '%' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Model performance</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0">Category F1</span>
              <span className="text-sm text-green-700">1.00 on Bitext test set (23,907 examples, 6 categories)</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0">Urgency F1</span>
              <span className="text-sm text-green-700">0.99 on Bitext test set</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700 text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0">Note</span>
              <span className="text-sm text-yellow-700">High F1 reflects clean training data. Real-world confidence ranges 36-91% on production tickets.</span>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0">Thresholds</span>
              <span className="text-sm text-blue-700">Auto at 85%+ confidence, suggested at 60-85%, manual below 60% or critical keywords</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}