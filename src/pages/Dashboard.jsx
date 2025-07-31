import { useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Wand2, Image, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const { user } = useUser()
  const [stats, setStats] = useState({
    totalGenerations: 0,
    thisMonth: 0,
    remaining: 10
  })
  const [recentGenerations, setRecentGenerations] = useState([])

  useEffect(() => {
    if (user) {
      fetchUserStats()
      fetchRecentGenerations()
    }
  }, [user])

  const fetchUserStats = async () => {
    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No row exists, create one
      const { data: newData, error: insertError } = await supabase
        .from('usage_tracking')
        .insert({ user_id: user.id, generation_count: 0 })
        .select()
        .single()
      
      if (newData) {
        setStats({
          totalGenerations: 0,
          thisMonth: 0,
          remaining: 10
        })
      }
    } else if (data) {
      setStats({
        totalGenerations: data.generation_count,
        thisMonth: data.generation_count,
        remaining: 10 - data.generation_count
      })
    }
  }

  const fetchRecentGenerations = async () => {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)

    if (data) {
      setRecentGenerations(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Ready to create amazing flyers?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Generations</p>
              <p className="text-2xl font-bold">{stats.totalGenerations}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </div>
            <Image className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold">{stats.remaining}</p>
            </div>
            <Wand2 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Generations</h2>
          <Link
            to="/gallery"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        {recentGenerations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentGenerations.map((gen) => (
              <div key={gen.id} className="relative group">
                <img
                  src={gen.result_url || gen.image_url}
                  alt="Generated flyer"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium transition-all">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No generations yet</p>
            <Link
              to="/generate"
              className="inline-block mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Create Your First Flyer
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard