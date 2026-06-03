import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'
import OfflineBanner from './components/OfflineBanner.jsx'
import PWAInstallBanner from './components/PWAInstallBanner.jsx'
import UpdateModal from './components/UpdateModal.jsx'
import { getModalZ } from './components/ui/Modal.jsx'

const baseSwalOptions = {
  customClass: {
    popup: 'bg-white rounded-xl shadow-2xl',
    title: 'text-gray-800 text-xl font-bold',
    content: 'text-gray-600',
    confirmButton: 'bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200',
    cancelButton: 'bg-slate-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-all duration-200',
  },
  buttonsStyling: false,
  confirmButtonColor: '#9333ea',
  cancelButtonColor: '#6b7280',
  heightAuto: false,
}

const getTopLayerZ = () => {
  const modalCounterZ = getModalZ()
  if (typeof window === 'undefined') return modalCounterZ

  let highestZ = modalCounterZ
  document.querySelectorAll('body *').forEach((node) => {
    const z = window.getComputedStyle(node).zIndex
    const parsed = Number.parseInt(z, 10)
    if (Number.isFinite(parsed)) {
      highestZ = Math.max(highestZ, parsed + 10)
    }
  })
  return highestZ
}

const withSwalDefaults = (options = {}) => {
  const userDidOpen = options.didOpen
  return {
    ...baseSwalOptions,
    ...options,
    customClass: {
      ...baseSwalOptions.customClass,
      ...(options.customClass || {}),
    },
    didOpen: (popup) => {
      const container = Swal.getContainer()
      if (container) {
        container.style.zIndex = String(getTopLayerZ())
      }
      userDidOpen?.(popup)
    },
  }
}

const originalSwalFire = Swal.fire.bind(Swal)

Swal.fire = (...args) => {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return originalSwalFire(withSwalDefaults(args[0]))
  }

  if (typeof args[0] === 'string') {
    return originalSwalFire(withSwalDefaults({
      title: args[0],
      text: args[1],
      icon: args[2],
    }))
  }

  return originalSwalFire(...args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global offline/PWA overlays — outside App so they always render */}
    <OfflineBanner />
    <PWAInstallBanner />
    <UpdateModal />
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 10px -5px rgb(0 0 0 / 0.05)',
          border: '1px solid rgb(226 232 240)',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
      }}
    />
  </React.StrictMode>,
)
