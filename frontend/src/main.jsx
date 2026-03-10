import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'
import sirabaLogo from './assets/SIRABALOGO.png'

const favicon = document.querySelector("link[rel~='icon']")
if (favicon) {
  favicon.href = sirabaLogo
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
