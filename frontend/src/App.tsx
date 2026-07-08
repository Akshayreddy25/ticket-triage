import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getStoredToken, setToken } from './services/api'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitTicket from './pages/SubmitTicket'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const token = getStoredToken()
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  const token = getStoredToken()
  if (token) setToken(token)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tickets" element={<PrivateRoute><TicketList /></PrivateRoute>} />
        <Route path="/tickets/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />
        <Route path="/submit" element={<PrivateRoute><SubmitTicket /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App