import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  FileText, 
  Users, 
  Image, 
  TrendingUp,
  Activity,
  Eye
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    activePrompts: 0,
    totalGenerations: 0,
    totalUsers: 0,
    recentGenerations: [],
    popularPrompts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch prompt stats
      const { data: prompts, error: promptError } = await supabase
        .from('base_prompts')
        .select('*', { count: 'exact' })

      const activePrompts = prompts?.filter(p => p.is_active) || []

      // Fetch generation stats
      const { count: generationCount } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true })

      // Fetch user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch recent generations
      const { data: recentGens } = await supabase
        .from('generations')
        .select(`
          *,
          base_prompts (title)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch popular prompts (by usage count)
      const { data: popularPrompts } = await supabase
        .from('base_prompts')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(5)

      setStats({
        totalPrompts: prompts?.length || 0,
        activePrompts: activePrompts.length,
        totalGenerations: generationCount || 0,
        totalUsers: userCount || 0,
        recentGenerations: recentGens || [],
        popularPrompts: popularPrompts || []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your flyer generator platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Prompts"
          value={stats.totalPrompts}
          icon={FileText}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Prompts"
          value={stats.activePrompts}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="Total Generations"
          value={stats.totalGenerations}
          icon={Image}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Generations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
              Recent Generations
            </h2>
          </div>
          <div className="p-6">
            {stats.recentGenerations.length > 0 ? (
              <div className="space-y-3">
                {stats.recentGenerations.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {gen.base_prompts?.title || 'Custom Prompt'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(gen.created_at).toLocaleString()}
                      </p>
                    </div>
                    {gen.result_url && (
                      <a
                        href={gen.result_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent generations</p>
            )}
          </div>
        </div>

        {/* Popular Prompts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
              Popular Prompts
            </h2>
          </div>
          <div className="p-6">
            {stats.popularPrompts.length > 0 ? (
              <div className="space-y-3">
                {stats.popularPrompts.map((prompt) => (
                  <div key={prompt.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {prompt.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Used {prompt.usage_count || 0} times
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      prompt.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prompt.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No prompts yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard