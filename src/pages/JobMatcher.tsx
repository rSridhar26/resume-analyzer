import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";
import { GoogleGenAI, Type } from "@google/genai";
import {
  Briefcase,
  Loader2,
  Target,
  Upload,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Wand2,
  History,
  FileText,
  Link as LinkIcon,
  Search
} from "lucide-react";
import { extractTextFromFile } from "../utils/fileExtractor";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function JobMatcher() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Resume State
  const [resumeText, setResumeText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [savedResumes, setSavedResumes] = useState<any[]>([]);
  
  // JD State
  const [jdInputType, setJdInputType] = useState<"text" | "url" | "infer">("text");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  
  // Fix Resume State
  const [fixingResume, setFixingResume] = useState(false);
  const [fixedResume, setFixedResume] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 5; // Reaches 95% in 19 seconds
        });
      }, 1000);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setExtracting(true);
      try {
        const text = await extractTextFromFile(selectedFile);
        setResumeText(text);
      } catch (error: any) {
        alert(error.message || "Failed to extract text from file.");
      } finally {
        setExtracting(false);
      }
    }
  };

  const getJdContent = async () => {
    if (jdInputType === "text") return jobDescription;
    if (jdInputType === "url") {
      // We will ask Gemini to fetch the URL using urlContext tool
      return `Please analyze the job description found at this URL: ${jobUrl}`;
    }
    if (jdInputType === "infer") {
      return `Please infer a typical detailed job description for the role of "${jobTitle}" at "${companyName}".`;
    }
    return "";
  };

  const matchJob = async () => {
    const jdContent = await getJdContent();
    if (!resumeText.trim() || !jdContent.trim()) {
      alert("Please provide both resume and job details.");
      return;
    }

    setAnalyzing(true);
    setStep(3);
    setFixedResume("");
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert ATS and recruiter. Compare this resume with the job description.
        
        Job Description Input:
        ${jdContent}
        
        Resume:
        ${resumeText}
        
        Provide a detailed JSON response with:
        1. matchPercentage (0-100)
        2. confidenceScore (0-100 based on how detailed the JD is)
        3. confidenceMessage (warning if JD is too brief)
        4. breakdown (scores out of 100 and 1-line explanations for: keywordOverlap, requiredSkills, experienceAlignment, educationMatch, roleTitleProximity)
        5. missingSkills (array of objects with 'skill' and 'importance' which must be "Required", "Preferred", or "Nice-to-have")
        6. marketSkillsInsight (array of strings: what skills are commonly listed in similar JDs on the market but not necessarily in this specific JD)
        7. inferredJobTitle (string: the job title you analyzed against)
        8. inferredCompany (string: the company name if available)
        
        Keep all explanations extremely concise (max 10 words).`,
        config: {
          responseMimeType: "application/json",
          ...(jdInputType === "url" ? { tools: [{ urlContext: {} }] } : {}),
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchPercentage: { type: Type.NUMBER },
              confidenceScore: { type: Type.NUMBER },
              confidenceMessage: { type: Type.STRING },
              inferredJobTitle: { type: Type.STRING },
              inferredCompany: { type: Type.STRING },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  keywordOverlap: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
                  requiredSkills: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
                  experienceAlignment: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
                  educationMatch: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
                  roleTitleProximity: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } } },
                }
              },
              missingSkills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    importance: { type: Type.STRING }
                  }
                }
              },
              marketSkillsInsight: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["matchPercentage", "confidenceScore", "confidenceMessage", "breakdown", "missingSkills", "marketSkillsInsight"]
          }
        }
      });

      const matchResult = JSON.parse(response.text || "{}");
      setResult(matchResult);
    } catch (error) {
      console.error("Error matching job:", error);
      alert("Failed to calculate role readiness. Please try again.");
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const fixResume = async () => {
    setFixingResume(true);
    try {
      const jdContent = await getJdContent();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an expert resume writer. Rewrite this resume to perfectly align with the job description.
        Weave in the missing keywords and skills naturally into the bullet points and summary. Do not just stuff keywords.
        Improve the formatting to be clean text.
        
        Job Description:
        ${jdContent}
        
        Original Resume:
        ${resumeText}
        
        Missing Skills to weave in (if applicable to the user's experience):
        ${result.missingSkills.map((s: any) => s.skill).join(", ")}
        
        Return ONLY the rewritten resume text.`,
        config: {
          ...(jdInputType === "url" ? { tools: [{ urlContext: {} }] } : {}),
        }
      });
      setFixedResume(response.text || "");
    } catch (error) {
      console.error("Error fixing resume:", error);
      alert("Failed to fix resume.");
    } finally {
      setFixingResume(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Role Readiness Score</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <div className={`w-16 h-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${step >= 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>3</div>
        </div>
      </div>

      {/* Step 1: Resume Input */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 animate-in fade-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 font-display">Step 1: Provide Your Resume</h2>
          
          <div className="space-y-6">
            {savedResumes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select from saved resumes</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedResumes.slice(0, 2).map((res, idx) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        if (res.resumeText) {
                          setResumeText(res.resumeText);
                          setStep(2);
                        } else {
                          alert("This saved resume doesn't have the full text stored. Please upload it again.");
                        }
                      }}
                      className="p-4 border border-slate-200 rounded-xl text-left hover:border-blue-500 hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
                    >
                      <p className="font-bold text-slate-900">Resume Analysis {idx + 1}</p>
                      <p className="text-sm font-medium text-slate-500">{new Date(res.createdAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
                <div className="my-6 flex items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center w-full relative">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {extracting ? (
                    <Loader2 className="w-8 h-8 text-blue-500 mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  )}
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold">{extracting ? "Extracting text..." : "Click to upload"}</span> {!extracting && "or drag and drop"}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} disabled={extracting} />
              </label>
            </div>

            <textarea
              className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="Or paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={extracting}
            />

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!resumeText.trim()}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center shadow-sm hover:shadow-md"
              >
                Next Step <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: JD Input */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 font-display">Step 2: Job Description</h2>
            <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:text-blue-800 font-bold">
              &larr; Back to Resume
            </button>
          </div>

          <div className="flex space-x-2 mb-6 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setJdInputType("text")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${jdInputType === "text" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <FileText className="w-4 h-4 mr-2" /> Paste Text
            </button>
            <button
              onClick={() => setJdInputType("url")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${jdInputType === "url" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <LinkIcon className="w-4 h-4 mr-2" /> Paste URL
            </button>
            <button
              onClick={() => setJdInputType("infer")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${jdInputType === "infer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Search className="w-4 h-4 mr-2" /> Infer Role
            </button>
          </div>

          <div className="space-y-6">
            {jdInputType === "text" && (
              <textarea
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            )}

            {jdInputType === "url" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Job Posting URL</label>
                <input
                  type="url"
                  className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://linkedin.com/jobs/view/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">We will automatically fetch and parse the job description from this URL.</p>
              </div>
            )}

            {jdInputType === "infer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Job Title</label>
                  <input
                    type="text"
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Senior Product Manager"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Company Name (Optional)</label>
                  <input
                    type="text"
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Google"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-500 md:col-span-2 mt-2">We will infer a typical job description for this role to score your readiness.</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={matchJob}
                disabled={
                  (jdInputType === "text" && !jobDescription.trim()) ||
                  (jdInputType === "url" && !jobUrl.trim()) ||
                  (jdInputType === "infer" && !jobTitle.trim())
                }
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center shadow-sm hover:shadow-md"
              >
                Calculate Score <Target className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && analyzing && (
        <div className="bg-white p-12 rounded-[2rem] shadow-md border border-slate-100 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-blue-50 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 font-display">Analyzing Role Readiness... ({progress}%)</h2>
            <p className="text-slate-500 mt-2 font-medium">Comparing your experience against market requirements.</p>
          </div>
        </div>
      )}

      {step === 3 && !analyzing && result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <button onClick={() => setStep(2)} className="text-sm text-blue-600 hover:text-blue-800 font-bold">
              &larr; Modify Inputs
            </button>
            <button
              onClick={fixResume}
              disabled={fixingResume}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center shadow-sm hover:shadow-md"
            >
              {fixingResume ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              Fix This Resume
            </button>
          </div>

          {result.confidenceScore < 60 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-bold text-orange-800">Data Quality Warning</h4>
                <p className="text-sm font-medium text-orange-700 mt-1">{result.confidenceMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[12px] border-slate-50 flex-shrink-0">
                <div
                  className={`absolute inset-0 rounded-full border-[12px] ${result.matchPercentage >= 80 ? "border-emerald-500" : result.matchPercentage >= 60 ? "border-orange-500" : "border-red-500"}`}
                  style={{ clipPath: `polygon(0 0, 100% 0, 100% ${result.matchPercentage}%, 0 ${result.matchPercentage}%)` }}
                ></div>
                <div className="text-center">
                  <span className="text-5xl font-extrabold text-slate-900 font-display">{result.matchPercentage}%</span>
                  <span className="block text-sm font-bold text-slate-500 uppercase tracking-wider mt-2">Readiness</span>
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-5">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">Score Breakdown</h3>
                <BreakdownBar title="Keyword Overlap" data={result.breakdown?.keywordOverlap} />
                <BreakdownBar title="Required Skills" data={result.breakdown?.requiredSkills} />
                <BreakdownBar title="Experience Level" data={result.breakdown?.experienceAlignment} />
                <BreakdownBar title="Education Match" data={result.breakdown?.educationMatch} />
                <BreakdownBar title="Role Title Proximity" data={result.breakdown?.roleTitleProximity} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-display">
                <Target className="w-6 h-6 text-red-500" /> Missing Skills
              </h3>
              <div className="space-y-3">
                {result.missingSkills?.map((skill: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <span className="font-bold text-slate-800">{skill.skill}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${
                      skill.importance === 'Required' ? 'bg-red-100 text-red-700' :
                      skill.importance === 'Preferred' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {skill.importance}
                    </span>
                  </div>
                ))}
                {(!result.missingSkills || result.missingSkills.length === 0) && (
                  <p className="text-slate-500 font-medium">You have all the skills mentioned in the JD!</p>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-display">
                <Briefcase className="w-6 h-6 text-blue-500" /> People Also Applied With
              </h3>
              <p className="text-base font-medium text-slate-600 mb-4">Market insights show that similar roles often require these skills:</p>
              <div className="flex flex-wrap gap-3">
                {result.marketSkillsInsight?.map((skill: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold border border-blue-100 shadow-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {fixedResume && (
            <div className="bg-white p-8 rounded-[2rem] shadow-md border border-emerald-200 animate-in fade-in">
              <h3 className="text-2xl font-bold text-emerald-900 flex items-center gap-2 mb-4 font-display">
                <CheckCircle className="w-6 h-6 text-emerald-600" /> Optimized Resume
              </h3>
              <p className="text-base font-medium text-emerald-700 mb-6">We've naturally woven in missing keywords and improved the formatting.</p>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 whitespace-pre-wrap text-sm text-slate-800 font-mono shadow-inner">
                {fixedResume}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Match History */}
      {step === 1 && matchHistory.length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6 font-display">
            <History className="w-6 h-6 text-slate-500" /> Match History
          </h3>
          <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-5 font-bold text-slate-700">Role</th>
                  <th className="px-6 py-5 font-bold text-slate-700">Company</th>
                  <th className="px-6 py-5 font-bold text-slate-700">Score</th>
                  <th className="px-6 py-5 font-bold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matchHistory.map((match) => (
                  <tr key={match.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900">{match.jobTitle}</td>
                    <td className="px-6 py-5 font-medium text-slate-600">{match.company}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold shadow-sm ${
                        match.matchPercentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        match.matchPercentage >= 60 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {match.matchPercentage}%
                      </span>
                    </td>
                    <td className="px-6 py-5 font-medium text-slate-500">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ title, data }: { title: string, data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-bold text-slate-700">{title}</span>
        <span className="font-extrabold text-slate-900">{data.score}/100</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-3 shadow-inner">
        <div 
          className={`h-3 rounded-full ${data.score >= 80 ? 'bg-emerald-500' : data.score >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} 
          style={{ width: `${data.score}%` }}
        ></div>
      </div>
      <p className="text-xs font-medium text-slate-500 mt-1">{data.explanation}</p>
    </div>
  );
}
