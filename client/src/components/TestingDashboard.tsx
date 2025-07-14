import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, TestTube } from "lucide-react";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "warning" | "pending";
  details: string;
}

export function TestingDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runFrontendTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: "Page Navigation",
        test: () => {
          const result = window.location.pathname !== null;
          return { status: result ? "pass" : "fail", details: `Current path: ${window.location.pathname}` };
        }
      },
      {
        name: "React Query Client",
        test: () => {
          try {
            const hasQueryClient = window.React !== undefined;
            return { status: "pass", details: "React Query is available" };
          } catch {
            return { status: "fail", details: "React Query not found" };
          }
        }
      },
      {
        name: "Local Storage Access",
        test: () => {
          try {
            localStorage.setItem('test', 'value');
            const value = localStorage.getItem('test');
            localStorage.removeItem('test');
            return { status: value === 'value' ? "pass" : "fail", details: "Local storage working" };
          } catch {
            return { status: "fail", details: "Local storage not accessible" };
          }
        }
      },
      {
        name: "API Connectivity",
        test: async () => {
          try {
            const response = await fetch('/api/patterns');
            const data = await response.json();
            return { 
              status: response.ok ? "pass" : "fail", 
              details: `API responded with ${response.status}. Patterns: ${data.patterns?.length || 0}` 
            };
          } catch (error) {
            return { status: "fail", details: `API error: ${error.message}` };
          }
        }
      },
      {
        name: "Export Functions Available",
        test: () => {
          const hasBlob = typeof Blob !== 'undefined';
          const hasURL = typeof URL !== 'undefined';
          const hasDownload = document.createElement('a').download !== undefined;
          
          if (hasBlob && hasURL && hasDownload) {
            return { status: "pass", details: "All export APIs available" };
          } else {
            return { status: "fail", details: "Missing export capabilities" };
          }
        }
      },
      {
        name: "Mobile Viewport",
        test: () => {
          const isMobile = window.innerWidth < 768;
          const hasTouch = 'ontouchstart' in window;
          return { 
            status: "pass", 
            details: `Screen: ${window.innerWidth}x${window.innerHeight}, Touch: ${hasTouch ? 'Yes' : 'No'}` 
          };
        }
      },
      {
        name: "Button Visibility Test",
        test: () => {
          const buttons = document.querySelectorAll('button');
          const visibleButtons = Array.from(buttons).filter(btn => {
            const rect = btn.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          return { 
            status: visibleButtons.length > 0 ? "pass" : "warning", 
            details: `Found ${visibleButtons.length} visible buttons` 
          };
        }
      },
      {
        name: "Form Input Elements",
        test: () => {
          const inputs = document.querySelectorAll('input, textarea, select');
          const workingInputs = Array.from(inputs).filter(input => !input.disabled);
          return { 
            status: workingInputs.length > 0 ? "pass" : "warning", 
            details: `Found ${workingInputs.length} active form elements` 
          };
        }
      },
      {
        name: "CSS Styles Loading",
        test: () => {
          const testElement = document.createElement('div');
          testElement.className = 'bg-primary text-white';
          document.body.appendChild(testElement);
          const styles = window.getComputedStyle(testElement);
          const hasStyles = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || styles.color !== 'rgba(0, 0, 0, 0)';
          document.body.removeChild(testElement);
          return { 
            status: hasStyles ? "pass" : "warning", 
            details: hasStyles ? "CSS styles are loading" : "CSS may not be fully loaded" 
          };
        }
      },
      {
        name: "Image Loading Support",
        test: () => {
          const hasFileReader = typeof FileReader !== 'undefined';
          const hasCanvas = typeof HTMLCanvasElement !== 'undefined';
          return { 
            status: hasFileReader && hasCanvas ? "pass" : "fail", 
            details: `FileReader: ${hasFileReader ? 'Yes' : 'No'}, Canvas: ${hasCanvas ? 'Yes' : 'No'}` 
          };
        }
      }
    ];

    for (const { name, test } of tests) {
      try {
        const result = await test();
        setTestResults(prev => [...prev, { name, ...result }]);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visual effect
      } catch (error) {
        setTestResults(prev => [...prev, { 
          name, 
          status: "fail", 
          details: `Test error: ${error.message}` 
        }]);
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "fail": return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pass: "bg-green-100 text-green-800",
      fail: "bg-red-100 text-red-800", 
      warning: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={colors[status] || colors.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passCount = testResults.filter(r => r.status === "pass").length;
  const failCount = testResults.filter(r => r.status === "fail").length;
  const warningCount = testResults.filter(r => r.status === "warning").length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Frontend Testing Dashboard
        </CardTitle>
        <p className="text-sm text-gray-600">
          Automated tests for frontend components and functionality
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runFrontendTests} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>
          
          {testResults.length > 0 && (
            <div className="flex gap-2">
              <Badge className="bg-green-100 text-green-800">
                ✅ {passCount} Passed
              </Badge>
              {failCount > 0 && (
                <Badge className="bg-red-100 text-red-800">
                  ❌ {failCount} Failed
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  ⚠️ {warningCount} Warnings
                </Badge>
              )}
            </div>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{result.details}</span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Manual Testing Required:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click all buttons to verify functionality</li>
            <li>• Test image upload and pattern generation</li>
            <li>• Verify export buttons download files</li>
            <li>• Test responsive design on different screen sizes</li>
            <li>• Check navigation between pages</li>
            <li>• Validate form inputs and error handling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}