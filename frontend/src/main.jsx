import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'
import OfflineBanner from './components/OfflineBanner.jsx'
import PWAInstallBanner from './components/PWAInstallBanner.jsx'
import SWUpdateBanner from './components/SWUpdateBanner.jsx'

// Configure SweetAlert2 with professional styling
Swal.mixin({
  customClass: {
    popup: 'bg-white rounded-xl shadow-2xl',
    title: 'text-gray-800 text-xl font-bold',
    content: 'text-gray-600',
    confirmButton: 'bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all duration-200',
  },
  buttonsStyling: false,
  confirmButtonColor: '#9333ea',
  cancelButtonColor: '#6b7280',
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global offline/PWA overlays — outside App so they always render */}
    <OfflineBanner />
    <PWAInstallBanner />
    <SWUpdateBanner />
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
        },
      }}
    />
  </React.StrictMode>,
)
