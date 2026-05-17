import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { Calculator, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function AchievementQuantifier() {
  const [achievement, setAchievement] = useState("");
  const [quantifying, setQuantifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  const quantifyAchievement = async () => {
    if (!achievement.trim()) {
      alert("Please enter an achievement to quantify.");
      return;
    }

    setQuantifying(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Transform the following resume achievement into a quantified, impact-driven bullet point using the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]).
        If numbers are missing, suggest realistic metrics the user could estimate or track.
        
        Original Achievement:
        ${achievement}
        
        Provide 3 improved versions (from conservative to strong) and a list of metrics they should try to find.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedVersions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedMetrics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              feedback: { type: Type.STRING },
            },
            required: ["improvedVersions", "suggestedMetrics", "feedback"],
          },
        },
      });

      const analysisResult = JSON.parse(response.text || "{}");
      setResult(analysisResult);
    } catch (error) {
      console.error("Error quantifying achievement:", error);
      alert("Failed to quantify achievement. Please try again.");
    } finally {
      setQuantifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
        <Calculator className="w-8 h-8 text-blue-600" />
        Achievement Quantifier
      </h1>

      <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Original Resume Bullet Point
          </label>
          <textarea
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm shadow-sm"
            placeholder="e.g., 'Improved website performance and fixed bugs' or 'Managed a team of developers to build a new feature'"
            value={achievement}
            onChange={(e) => setAchievement(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Paste a weak or unquantified bullet point from your resume.
          </p>
        </div>

        <button
          onClick={quantifyAchievement}
          disabled={quantifying || !achievement.trim()}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          {quantifying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Quantifying...
            </>
          ) : (
            <>
              Quantify Achievement
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 font-display">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Improved Versions (XYZ Formula)
            </h3>
            <div className="space-y-4">
              {result.improvedVersions.map((version: string, i: number) => (
                <div
                  key={i}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <p className="text-slate-800 font-medium">"{version}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6 font-display">
                Metrics to Track Down
              </h3>
              <ul className="space-y-4">
                {result.suggestedMetrics.map((metric: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <span className="text-orange-500 mt-0.5 font-bold">•</span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6 font-display">
                Feedback
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                {result.feedback}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
