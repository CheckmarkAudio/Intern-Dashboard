import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

// #region agent log
fetch('http://127.0.0.1:7877/ingest/db881b4b-41b3-45a6-b8aa-216a512aebee',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e7c691'},body:JSON.stringify({sessionId:'e7c691',location:'main.tsx:8',message:'React app mounting',data:{url:window.location.href,pathname:window.location.pathname},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
// #endregion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/Intern-Dashboard">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
