import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Save, 
  ArrowLeft, 
  AlertCircle,
  Plus,
  X
} from 'lucide-react'

const PromptForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prompt_template: '',
    category_id: '',
    category: 'realistic', // fallback
    is_active: true,
    additional_elements: [],
    tags: [],
    metadata: {
      requires_face_swap: false,
      style_type: 'auto',
      recommended_quality: 'auto'
    }
  })

  const [newTag, setNewTag] = useState('')
  const [newElement, setNewElement] = useState('')

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchPrompt()
    }
  }, [id])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('prompt_categories')
      .select('*')
      .order('display_order')
    
    if (data) setCategories(data)
  }

  const fetchPrompt = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('base_prompts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setFormData({
        ...data,
        tags: data.tags || [],
        additional_elements: data.additional_elements || [],
        metadata: data.metadata || {
          requires_face_swap: false,
          style_type: 'auto',
          recommended_quality: 'auto'
        }
      })
    } catch (error) {
      console.error('Error fetching prompt:', error)
      setError('Failed to load prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Get category slug for backward compatibility
      const selectedCategory = categories.find(c => c.id === formData.category_id)
      
      const promptData = {
        ...formData,
        category: selectedCategory?.slug || formData.category,
        updated_at: new Date().toISOString()
      }

      let result
      if (isEditing) {
        const { data, error } = await supabase
          .from('base_prompts')
          .update(promptData)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        result = data

        // Log admin action
        await supabase.rpc('log_admin_action', {
          p_action: 'update_prompt',
          p_entity_type: 'base_prompts',
          p_entity_id: id,
          p_changes: promptData
        })
      } else {
        const { data, error } = await supabase
          .from('base_prompts')
          .insert(promptData)
          .select()
          .single()
        
        if (error) throw error
        result = data

        // Log admin action
        await supabase.rpc('log_admin_action', {
          p_action: 'create_prompt',
          p_entity_type: 'base_prompts',
          p_entity_id: result.id,
          p_changes: promptData
        })
      }

      navigate('/admin/prompts')
    } catch (error) {
      console.error('Error saving prompt:', error)
      setError(error.message || 'Failed to save prompt')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleMetadataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addElement = () => {
    if (newElement.trim() && !formData.additional_elements.includes(newElement.trim())) {
      setFormData(prev => ({
        ...prev,
        additional_elements: [...prev.additional_elements, newElement.trim()]
      }))
      setNewElement('')
    }
  }

  const removeElement = (elementToRemove) => {
    setFormData(prev => ({
      ...prev,
      additional_elements: prev.additional_elements.filter(el => el !== elementToRemove)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/prompts')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Prompts
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Bold Marketing Flyer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of what this prompt creates..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Active (visible to users)
                </span>
              </label>
            </div>
          </div>

          {/* Prompt Template */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Prompt Template</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Template *
              </label>
              <textarea
                name="prompt_template"
                value={formData.prompt_template}
                onChange={handleChange}
                required
                rows="6"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Enter the prompt template. Use {{variable}} for dynamic content..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Use variables like {'{{business_type}}'}, {'{{color_scheme}}'}, etc.
              </p>
            </div>
          </div>

          {/* Additional Elements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Elements</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Elements
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newElement}
                  onChange={(e) => setNewElement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addElement())}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Logo, Contact info, QR code"
                />
                <button
                  type="button"
                  onClick={addElement}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.additional_elements.map((element, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {element}
                    <button
                      type="button"
                      onClick={() => removeElement(element)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (for organization)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Face Swap
                </label>
                <select
                  value={formData.metadata.requires_face_swap}
                  onChange={(e) => handleMetadataChange('requires_face_swap', e.target.value === 'true')}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes (for realistic faces)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style Type
                </label>
                <select
                  value={formData.metadata.style_type}
                  onChange={(e) => handleMetadataChange('style_type', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="realistic">Realistic</option>
                  <option value="artistic">Artistic</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Quality
                </label>
                <select
                  value={formData.metadata.recommended_quality}
                  onChange={(e) => handleMetadataChange('recommended_quality', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="auto">Auto</option>
                  <option value="low">Low (fast)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (slow)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/prompts')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Prompt' : 'Create Prompt'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PromptForm