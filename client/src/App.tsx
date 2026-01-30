import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CreateBoardPage from './pages/CreateBoardPage'
import BoardPage from './pages/BoardPage'
import ViewBoardPage from './pages/ViewBoardPage'
import ErrorDisplay, { DetailedError } from './components/ErrorDisplay'
import { setErrorDisplayCallback, clearErrorDisplayCallback } from './lib/api'

function App() {
  const { loadUser } = useAuthStore()
  const [devError, setDevError] = useState<DetailedError | null>(null)

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Register error display callback - always register, server decides when to send detailed errors
  useEffect(() => {
    setErrorDisplayCallback((error) => {
      setDevError(error)
    })
    return () => clearErrorDisplayCallback()
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="create" element={<CreateBoardPage />} />
          <Route path="board/:id" element={<BoardPage />} />
        </Route>
        <Route path="/b/:shareCode" element={<ViewBoardPage />} />
      </Routes>
      
      {/* Dev Error Display Modal */}
      {devError && (
        <ErrorDisplay error={devError} onClose={() => setDevError(null)} />
      )}
    </>
  )
}

export default App
