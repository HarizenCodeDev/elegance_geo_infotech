import React from 'react'
import { useToast } from '../context/ToastContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()
  return (
    <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded shadow-lg text-sm text-white ${t.type === 'error' ? 'bg-rose-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
          <div className="flex items-center gap-3">
            <div className="flex-1">{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="text-white/80 hover:text-white">×</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
