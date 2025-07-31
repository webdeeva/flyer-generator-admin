import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useUser } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Generator from './pages/Generator'
import GeneratedFlyer from './pages/GeneratedFlyer'
import Gallery from './pages/Gallery'
import Pricing from './pages/Pricing'
import Landing from './pages/Landing'
import Inpainting from './pages/Inpainting'
import StyleGenerator from './pages/StyleGenerator'

// Admin imports
import AdminLayout from './admin/components/AdminLayout'
import AdminDashboard from './admin/pages/Dashboard'
import PromptList from './admin/pages/PromptList'
import PromptForm from './admin/pages/PromptForm'

function App() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Routes>
      <Route path="/" element={isSignedIn ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" forceRedirectUrl="/dashboard" />} />
      <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" forceRedirectUrl="/dashboard" />} />
      
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          isSignedIn ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/generate"
        element={
          isSignedIn ? (
            <Layout>
              <Generator />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/gallery"
        element={
          isSignedIn ? (
            <Layout>
              <Gallery />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/generated"
        element={
          isSignedIn ? (
            <GeneratedFlyer />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/pricing"
        element={
          isSignedIn ? (
            <Layout>
              <Pricing />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/inpainting"
        element={
          isSignedIn ? (
            <Layout>
              <Inpainting />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      <Route
        path="/style-generator"
        element={
          isSignedIn ? (
            <Layout>
              <StyleGenerator />
            </Layout>
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          isSignedIn ? (
            <AdminLayout />
          ) : (
            <Navigate to="/sign-in" replace />
          )
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="prompts" element={<PromptList />} />
        <Route path="prompts/new" element={<PromptForm />} />
        <Route path="prompts/edit/:id" element={<PromptForm />} />
        <Route path="categories" element={<div>Categories Management (Coming Soon)</div>} />
        <Route path="analytics" element={<div>Analytics (Coming Soon)</div>} />
        <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
      </Route>
    </Routes>
    </>
  )
}

export default App