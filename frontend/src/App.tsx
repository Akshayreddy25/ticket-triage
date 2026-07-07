import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SubmitTicket from './pages/SubmitTicket'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/submit" element={<SubmitTicket />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
