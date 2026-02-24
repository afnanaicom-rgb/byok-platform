import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Key, BarChart3, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: keyStatus } = trpc.byok.apiKey.exists.useQuery();
  const { data: chatsData } = trpc.byok.chat.list.useQuery();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">BYOK Dashboard</h1>
            <p className="text-sm text-slate-600">Secure AI API Management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-slate-900">{user?.name || "User"}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* API Key Status */}
          <Card className={keyStatus?.exists ? "border-l-4 border-l-green-500" : "border-l-4 border-l-amber-500"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-2">
                {keyStatus?.exists ? "✓ Configured" : "⚠ Not Set"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/api-key-setup")}
              >
                {keyStatus?.exists ? "Update" : "Setup"} Key
              </Button>
            </CardContent>
          </Card>

          {/* Chat Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-2">{chatsData?.count || 0}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/chat")}
              >
                Open Chat
              </Button>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-2">Coming Soon</p>
              <p className="text-xs text-slate-500">Usage tracking enabled</p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-2">Manage your account</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setLocation("/settings")}
              >
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Getting Started */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Follow these steps to set up your BYOK system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Configure Your API Key</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Add your API key securely. It will be encrypted with AES-256-CBC and stored safely.
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 p-0 h-auto"
                      onClick={() => setLocation("/api-key-setup")}
                    >
                      Setup API Key →
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Start Chatting</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Create a new chat and start interacting with AI. Your API key is used securely on the server.
                    </p>
                    <Button
                      variant="link"
                      className="mt-2 p-0 h-auto"
                      onClick={() => setLocation("/chat")}
                    >
                      Open Chat →
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Monitor Usage</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Track your API usage and stay within your rate limits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <strong>✓ Encrypted Storage</strong>
                  <p className="mt-1 text-xs">API keys are encrypted with AES-256-CBC</p>
                </AlertDescription>
              </Alert>

              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <strong>✓ Server-Side Only</strong>
                  <p className="mt-1 text-xs">Keys never leave the server</p>
                </AlertDescription>
              </Alert>

              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  <strong>✓ Rate Limited</strong>
                  <p className="mt-1 text-xs">Protected against abuse</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
