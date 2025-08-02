import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './polyfills.ts'
import App from './App.tsx'
import Providers from './provider/privyAuthProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
          <App />
    </Providers>

  </StrictMode>,
)
