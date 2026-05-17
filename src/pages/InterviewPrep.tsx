import React, { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import {
  MessageSquare,
  Loader2,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Eye,
  Smile,
  Hand
} from "lucide-react";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function InterviewPrep() {
  const [activeTab, setActiveTab] = useState<'practice' | 'body-language'>('practice');
  const [role, setRole] = useState("");
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const generateQuestions = async () => {
    if (!role.trim()) {
      alert("Please enter a target role.");
      return;
    }

    setGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 interview questions for a ${role} position. Include a mix of technical, behavioral, and HR questions.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  enum: ["Technical", "Behavioral", "HR"],
                },
                hint: { type: Type.STRING },
              },
              required: ["question", "type", "hint"],
            },
          },
        },
      });

      const generatedQuestions = JSON.parse(response.text || "[]");
      setQuestions(generatedQuestions);
      setActiveQuestion(null);
      setFeedback(null);
      setUserAnswer("");
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const evaluateAnswer = async () => {
    if (activeQuestion === null || !userAnswer.trim()) {
      alert("Please provide an answer.");
      return;
    }

    setEvaluating(true);
    try {
      const question = questions[activeQuestion].question;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Evaluate this interview answer.
        Question: ${question}
        User Answer: ${userAnswer}
        
        Provide a score out of 10, what went well, what could be improved, and an example of a perfect answer using the STAR method if applicable.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              wentWell: { type: Type.STRING },
              improvement: { type: Type.STRING },
              perfectAnswer: { type: Type.STRING },
            },
            required: ["score", "wentWell", "improvement", "perfectAnswer"],
          },
        },
      });

      const evaluation = JSON.parse(response.text || "{}");
      setFeedback(evaluation);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h1 className="text-3xl font-extrabold text-slate-900 font-display">
        AI Interview Preparation
      </h1>

      <div className="flex space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('practice')}
          className={`pb-4 px-2 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'practice'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Practice Questions
        </button>
        <button
          onClick={() => setActiveTab('body-language')}
          className={`pb-4 px-2 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'body-language'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Body Language Tips
        </button>
      </div>

      {activeTab === 'practice' ? (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Role
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                className="flex-1 px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                placeholder="e.g., Frontend Developer, Data Analyst, Marketing Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <button
                onClick={generateQuestions}
                disabled={generating || !role.trim()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center whitespace-nowrap shadow-sm hover:shadow-md"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Questions"
                )}
              </button>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-4">
                <h2 className="font-bold text-xl text-slate-900 mb-4 font-display">Questions</h2>
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveQuestion(idx);
                      setFeedback(null);
                      setUserAnswer("");
                    }}
                    className={`w-full text-left p-5 rounded-2xl border transition-colors shadow-sm ${
                      activeQuestion === idx
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          q.type === "Technical"
                            ? "bg-blue-100 text-blue-800"
                            : q.type === "Behavioral"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {q.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{q.question}</p>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2">
                {activeQuestion !== null ? (
                  <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100 space-y-8 animate-in fade-in">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">
                        {questions[activeQuestion].question}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <LightbulbIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">
                          <strong className="text-slate-800">Hint:</strong> {questions[activeQuestion].hint}
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Answer
                      </label>
                      <textarea
                        className="w-full h-40 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none"
                        placeholder="Type your answer here as if you were speaking in an interview..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={evaluateAnswer}
                      disabled={evaluating || !userAnswer.trim()}
                      className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm hover:shadow-md"
                    >
                      {evaluating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5 mr-2" />
                          Evaluate My Answer
                        </>
                      )}
                    </button>

                    {feedback && (
                      <div className="mt-8 space-y-8 border-t border-slate-100 pt-8 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-6">
                          <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-sm ${
                              feedback.score >= 8
                                ? "bg-green-100 text-green-700 border-4 border-green-200"
                                : feedback.score >= 5
                                  ? "bg-orange-100 text-orange-700 border-4 border-orange-200"
                                  : "bg-red-100 text-red-700 border-4 border-red-200"
                            }`}
                          >
                            {feedback.score}/10
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-slate-900 font-display">
                              Feedback Score
                            </h4>
                            <p className="text-slate-500 mt-1">
                              Based on clarity, relevance, and structure.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
                            <h5 className="font-bold text-green-800 flex items-center gap-2 mb-3 text-lg">
                              <CheckCircle className="w-5 h-5" /> What went well
                            </h5>
                            <p className="text-sm text-green-700 leading-relaxed">
                              {feedback.wentWell}
                            </p>
                          </div>
                          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                            <h5 className="font-bold text-orange-800 flex items-center gap-2 mb-3 text-lg">
                              <AlertCircle className="w-5 h-5" /> Areas to improve
                            </h5>
                            <p className="text-sm text-orange-700 leading-relaxed">
                              {feedback.improvement}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                          <h5 className="font-bold text-slate-900 mb-3 text-lg font-display">
                            Example Perfect Answer (STAR Method)
                          </h5>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {feedback.perfectAnswer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-[2rem] shadow-md border border-slate-100 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                    <MessageSquare className="w-20 h-20 text-slate-200 mb-6" />
                    <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">
                      Select a question
                    </h3>
                    <p className="text-slate-500">
                      Choose a question from the list to start practicing your
                      interview skills.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Posture & Presence</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Sit up straight but relaxed. Avoid slouching or being too rigid.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Lean slightly forward to show interest and engagement.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Keep your shoulders back and down to appear confident.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Plant your feet firmly on the ground to avoid fidgeting.</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Eye Contact</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Maintain eye contact for about 60-70% of the time.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> In a panel interview, look at the person asking the question, but briefly scan the others.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> For video interviews, look directly at the camera, not the screen, to simulate eye contact.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Break eye contact naturally by looking slightly to the side, not down.</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-xl text-green-600 shadow-sm">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Hand Gestures</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Use natural hand gestures to emphasize points, but keep them contained within your shoulder width.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Rest your hands on the table or your lap when not speaking.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Avoid crossing your arms, as it can appear defensive or closed off.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Do not fidget with pens, jewelry, or your hair.</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 shadow-sm">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-display">Facial Expressions</h3>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Smile genuinely when appropriate, especially during introductions and wrap-ups.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Nod occasionally to show active listening and understanding.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Keep a pleasant, neutral expression when listening to questions.</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> Avoid frowning or showing frustration if you stumble on a question.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
