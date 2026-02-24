import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ApiKeySetup() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Check if API key already exists
  const { data: keyStatus, isLoading: isCheckingKey } = trpc.byok.apiKey.exists.useQuery();

  // Save API key mutation
  const saveKeyMutation = trpc.byok.apiKey.save.useMutation({
    onSuccess: () => {
      toast.success("API key saved successfully!");
      setApiKey("");
      setShowKey(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save API key");
    },
  });

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    setIsLoading(true);
    try {
      await saveKeyMutation.mutateAsync({
        apiKey: apiKey.trim(),
        provider,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">API Key Setup</h1>
          <p className="text-lg text-slate-600">
            Securely configure your API key for AI interactions
          </p>
        </div>

        {/* Status Card */}
        {!isCheckingKey && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {keyStatus?.exists ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    API Key Configured
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    API Key Not Set
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {keyStatus?.exists
                  ? `Your ${keyStatus.provider} API key is securely stored and encrypted.`
                  : "Add your API key to start using AI features."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Your API Key</CardTitle>
            <CardDescription>
              Your API key is encrypted with AES-256-CBC and stored securely. It is never exposed to the frontend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveKey} className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Security Notice:</strong> Your API key is encrypted on the server using AES-256-CBC encryption.
                  The encryption key is stored as a secure environment variable and is never exposed.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !apiKey.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save API Key"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="mt-6 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>1. Secure Storage:</strong> Your API key is encrypted using AES-256-CBC before being stored in the database.
            </p>
            <p>
              <strong>2. Server-Side Decryption:</strong> When you send a message, the server decrypts your key and uses it to call the AI API.
            </p>
            <p>
              <strong>3. No Frontend Exposure:</strong> Your API key is never sent to or stored on your browser.
            </p>
            <p>
              <strong>4. Rate Limiting:</strong> Your usage is tracked with daily and monthly limits to prevent abuse.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
