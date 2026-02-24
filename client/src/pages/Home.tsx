import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Zap, Shield, ArrowRight, Key, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">BYOK</h1>
            </div>
            <Button onClick={() => setLocation("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </header>

        {/* Welcome Section */}
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Welcome back, {user.name}!
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Securely manage your API keys and interact with AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setLocation("/chat")}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Chatting
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/api-key-setup")}>
                <Key className="w-5 h-5 mr-2" />
                Setup API Key
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Lock className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>End-to-End Encrypted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Your API keys are encrypted with AES-256-CBC and never exposed to the frontend.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Optimized for performance with secure server-side processing of all requests.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Rate Limited</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Built-in protection against abuse with daily and monthly request limits.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
              <CardDescription>
                A secure flow for managing your API keys and AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Add Your Key</h4>
                  <p className="text-sm text-slate-600">
                    Securely upload your API key. It gets encrypted immediately.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-600">2</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Start Chatting</h4>
                  <p className="text-sm text-slate-600">
                    Create chats and send messages. Your key stays on the server.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-600">3</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Monitor Usage</h4>
                  <p className="text-sm text-slate-600">
                    Track your API usage and stay within your limits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={() => setLocation("/dashboard")}>
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">BYOK</h1>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Secure API Key Management
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Bring Your Own Key (BYOK) platform for secure, encrypted AI API interactions. Your keys stay encrypted and never exposed to the frontend.
          </p>

          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Lock className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">AES-256 Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Industry-standard encryption keeps your API keys safe and secure.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Shield className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                Built-in protection with daily and monthly request limits.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Server-Side Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">
                All API interactions happen securely on the server.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="bg-slate-800 border-slate-700 mb-16">
          <CardHeader>
            <CardTitle className="text-white text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Sign In</h4>
                <p className="text-slate-300 text-sm">
                  Create an account or sign in with your existing credentials.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Add API Key</h4>
                <p className="text-slate-300 text-sm">
                  Upload your API key. It's encrypted with AES-256-CBC immediately.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <h4 className="font-semibold text-white mb-2">Start Using</h4>
                <p className="text-slate-300 text-sm">
                  Chat with AI securely. Your key stays encrypted on the server.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
            Start for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
