import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

export default function DefaultLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl">
        <Sidebar />
      </div>
      <div className="ml-72 min-h-screen">
        <Navbar />
        <main className="min-h-screen bg-slate-950 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
