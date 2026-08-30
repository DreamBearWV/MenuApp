import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router' // 👈 直接從 'react-router' 匯入
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/MenuApp">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
