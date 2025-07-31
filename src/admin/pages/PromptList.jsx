import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Search,
  Filter
} from 'lucide-react'

const PromptList = () => {
  const [prompts, setPrompts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetchPrompts()
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('prompt_categories')
      .select('*')
      .order('display_order')
    
    if (data) setCategories(data)
  }

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('base_prompts')
        .select(`
          *,
          prompt_categories (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePromptStatus = async (promptId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('base_prompts')
        .update({ is_active: !currentStatus })
        .eq('id', promptId)

      if (!error) {
        // Update local state
        setPrompts(prompts.map(p => 
          p.id === promptId ? { ...p, is_active: !currentStatus } : p
        ))
        
        // Log admin action
        await supabase.rpc('log_admin_action', {
          p_action: 'toggle_prompt_status',
          p_entity_type: 'base_prompts',
          p_entity_id: promptId,
          p_changes: { is_active: !currentStatus }
        })
      }
    } catch (error) {
      console.error('Error toggling prompt status:', error)
    }
  }

  const deletePrompt = async (promptId) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) return

    try {
      const { error } = await supabase
        .from('base_prompts')
        .delete()
        .eq('id', promptId)

      if (!error) {
        setPrompts(prompts.filter(p => p.id !== promptId))
        
        // Log admin action
        await supabase.rpc('log_admin_action', {
          p_action: 'delete_prompt',
          p_entity_type: 'base_prompts',
          p_entity_id: promptId
        })
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
    }
  }

  const duplicatePrompt = async (prompt) => {
    try {
      const newPrompt = {
        ...prompt,
        title: `${prompt.title} (Copy)`,
        is_active: false,
        usage_count: 0,
        created_at: new Date().toISOString()
      }
      delete newPrompt.id

      const { data, error } = await supabase
        .from('base_prompts')
        .insert(newPrompt)
        .select()
        .single()

      if (!error && data) {
        setPrompts([data, ...prompts])
        
        // Log admin action
        await supabase.rpc('log_admin_action', {
          p_action: 'duplicate_prompt',
          p_entity_type: 'base_prompts',
          p_entity_id: data.id,
          p_changes: { original_id: prompt.id }
        })
      }
    } catch (error) {
      console.error('Error duplicating prompt:', error)
    }
  }

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchTerm === '' || 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.prompt_template?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === '' || 
      prompt.category_id === selectedCategory

    const matchesStatus = showInactive || prompt.is_active

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your flyer generation prompts
          </p>
        </div>
        <Link
          to="/admin/prompts/new"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Prompt
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prompts..."
                className="pl-10 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Show inactive prompts
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Prompts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPrompts.map((prompt) => (
              <tr key={prompt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {prompt.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {prompt.description?.substring(0, 60)}...
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {prompt.prompt_categories?.name || prompt.category || 'Uncategorized'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {prompt.usage_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => togglePromptStatus(prompt.id, prompt.is_active)}
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                      prompt.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {prompt.is_active ? (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/admin/prompts/edit/${prompt.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => duplicatePrompt(prompt)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePrompt(prompt.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No prompts found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PromptList