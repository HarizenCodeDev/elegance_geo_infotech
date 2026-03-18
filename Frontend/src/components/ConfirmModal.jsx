import React from 'react'

const ConfirmModal = ({ open, title = 'Confirm', message, onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <div className="text-sm text-slate-700 dark:text-slate-300 mb-4">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-slate-200 dark:bg-slate-700">Cancel</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded bg-rose-600 text-white">Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
