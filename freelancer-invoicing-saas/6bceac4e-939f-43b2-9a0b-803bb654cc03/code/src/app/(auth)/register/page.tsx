import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Register - InvoiceFlow',
  description: 'Create your InvoiceFlow account',
}

export default async function RegisterPage() {
  const session = await getSession()
  
  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-white font-bold text-xl">IF</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              InvoiceFlow
            </span>
          </Link>
          <h1 className="text-3xl font-bold mt-6">Create your account</h1>
          <p className="text-muted-foreground mt-2">
            Get started with professional invoicing in minutes
          </p>
        </div>

        <RegisterForm />

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            <Link 
              href="/" 
              className="hover:text-foreground transition-colors"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}