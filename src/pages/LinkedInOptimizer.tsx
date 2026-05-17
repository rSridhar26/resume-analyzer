import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Linkedin, Loader2, Copy, CheckCircle, Lightbulb } from "lucide-react";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function LinkedInOptimizer() {
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [role, setRole] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const optimizeProfile = async () => {
    if (!role.trim() || (!headline.trim() && !about.trim())) {
      alert(
        "Please provide your target role and at least your current headline or about section.",
      );
      return;
    }

    setGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Optimize this LinkedIn profile for a ${role} role.
        Current Headline: ${headline || "None provided"}
        Current About Section: ${about || "None provided"}
        
        Provide 3 improved headline options, a rewritten about section, and 3 tips for their profile photo/banner.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
              aboutSection: { type: Type.STRING },
              profileTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["headlines", "aboutSection", "profileTips"],
          },
        },
      });

      const optimizationResult = JSON.parse(response.text || "{}");
      setResult(optimizationResult);
    } catch (error) {
      console.error("Error optimizing profile:", error);
      alert("Failed to optimize profile. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
        <Linkedin className="w-8 h-8 text-blue-600" />
        LinkedIn Profile Optimizer
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Role
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., Software Engineer, Product Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Headline
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="e.g., Student at XYZ University"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current About Section
            </label>
            <textarea
              className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none"
              placeholder="Paste your current about section here..."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </div>
          <button
            onClick={optimizeProfile}
            disabled={
              generating || !role.trim() || (!headline.trim() && !about.trim())
            }
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Optimizing Profile...
              </>
            ) : (
              "Optimize Profile"
            )}
          </button>
        </div>

        <div className="space-y-8">
          {result ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 font-display">
                  <Lightbulb className="w-6 h-6 text-orange-500" />
                  Suggested Headlines
                </h3>
                <div className="space-y-4">
                  {result.headlines.map((hl: string, i: number) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-start gap-4 shadow-sm"
                    >
                      <p className="text-sm text-slate-700 font-medium">{hl}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(hl)}
                        className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Optimized About Section
                  </h3>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(result.aboutSection)
                    }
                    className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </button>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {result.aboutSection}
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6 font-display">
                  Profile Tips
                </h3>
                <ul className="space-y-4">
                  {result.profileTips.map((tip: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-slate-700 text-sm"
                    >
                      <span className="text-blue-500 mt-0.5 font-bold">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[2rem] shadow-md border border-slate-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Linkedin className="w-20 h-20 text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">
                Ready to optimize
              </h3>
              <p className="text-slate-500 max-w-sm">
                Enter your current LinkedIn details and target role to get
                AI-powered suggestions for your profile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
