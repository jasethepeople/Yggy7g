import { Pattern } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";

interface InstructionsViewProps {
  pattern: Pattern | null;
}

export function InstructionsView({ pattern }: InstructionsViewProps) {
  if (!pattern) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No instructions available</p>
          <p className="text-sm mt-1">Generate a pattern to see the written instructions</p>
        </div>
      </div>
    );
  }

  // Parse yarn usage from pattern data
  const yarnUsage = Array.isArray(pattern.yarnUsage) ? pattern.yarnUsage : [];
  const colorPalette = Array.isArray(pattern.colorPalette) ? pattern.colorPalette : [];

  return (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Written Instructions</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" />
            Print
          </Button>
          <Button className="bg-primary text-white hover:bg-primary/90" size="sm">
            <FileText className="w-4 h-4 mr-1" />
            Export PDF
          </Button>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg h-[calc(100%-80px)] overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{pattern.name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Difficulty:</span>
                <span className="text-gray-600 ml-2">{pattern.difficulty}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Finished Size:</span>
                <span className="text-gray-600 ml-2">{pattern.width} × {pattern.height} stitches</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Estimated Time:</span>
                <span className="text-gray-600 ml-2">{pattern.estimatedTime}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Stitch Count:</span>
                <span className="text-gray-600 ml-2">{pattern.stitchCount}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Materials Needed</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Worsted weight yarn in the following colors:</li>
                {yarnUsage.map((yarn: any, index: number) => (
                  <li key={index} className="ml-4">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: yarn.color }}
                    ></span>
                    Color {index + 1}: {yarn.amount}g
                  </li>
                ))}
                <li>Crochet hook size G (4.0mm)</li>
                <li>Tapestry needle</li>
                <li>Scissors</li>
                <li>Stitch markers</li>
                {pattern.complexity !== "simple" && <li>Polyfill stuffing (if making amigurumi)</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Abbreviations</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>ch = chain</div>
                <div>sc = single crochet</div>
                <div>dc = double crochet</div>
                <div>hdc = half double crochet</div>
                <div>tc = treble crochet</div>
                <div>sl st = slip stitch</div>
                <div>inc = increase</div>
                <div>dec = decrease</div>
                <div>rnd = round</div>
                <div>st(s) = stitch(es)</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Pattern Instructions</h4>
              <div className="prose prose-sm max-w-none">
                {pattern.instructions ? (
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {pattern.instructions}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Foundation</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 pl-4">
                        <li>Ch {pattern.width + 1}</li>
                        <li>Row 1: Sc in 2nd ch from hook and each ch across ({pattern.width} sc)</li>
                        <li>Ch 1, turn</li>
                      </ol>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Main Pattern</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 pl-4">
                        <li>Follow the stitch pattern grid for color changes and stitch variations</li>
                        <li>Work {pattern.height} rows total</li>
                        <li>Change colors as indicated in the pattern grid</li>
                        <li>Maintain consistent tension throughout</li>
                      </ol>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">Finishing</h5>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 pl-4">
                        <li>Fasten off and weave in all ends</li>
                        <li>Block if desired</li>
                        <li>Add any finishing touches as desired</li>
                      </ol>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">Tips for Success</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                        <li>Use stitch markers to keep track of your place</li>
                        <li>Count your stitches at the end of each row</li>
                        <li>Keep a consistent tension for even stitches</li>
                        <li>Block your finished piece for a professional look</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
