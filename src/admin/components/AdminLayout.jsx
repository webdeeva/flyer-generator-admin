import { Link, useLocation, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { 
  LayoutDashboard, 
  FileText, 
  Tags, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin'

const AdminLayout = () => {
  const location = useLocation()
  const { isAdmin, isLoading } = useAdmin()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Prompts', href: '/admin/prompts', icon: FileText },
    { name: 'Categories', href: '/admin/categories', icon: Tags },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href) => {
    if (href === '/admin' && location.pathname === '/admin') return true
    if (href !== '/admin' && location.pathname.startsWith(href)) return true
    return false
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to App
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1
                    ${active 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon
                    className={`
                      mr-3 h-5 w-5
                      ${active 
                        ? 'text-indigo-700' 
                        : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout