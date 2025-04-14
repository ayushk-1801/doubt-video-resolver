import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AnimationResponse {
  animationUrl?: string;
  question: string;
  answer: {
    text: string;
  };
  animationError?: boolean;
}

interface StudentContext {
  gradeLevel?: string;
  subject?: string;
  previousTopics?: string[];
  learningStyle?: string;
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
}

// Update this to match your backend URL
const API_BASE_URL = "http://localhost:3001"; // Adjust this to your backend's address

export function DoubtResolverForm() {
  const [question, setQuestion] = useState("");
  const [studentContext, setStudentContext] = useState<StudentContext>({
    gradeLevel: "",
    subject: "",
    previousTopics: [],
    learningStyle: "",
    difficultyLevel: "intermediate"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [animationResponse, setAnimationResponse] = useState<AnimationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousTopicsInput, setPreviousTopicsInput] = useState("");
  const [animationError, setAnimationError] = useState(false);

  const handleContextChange = (field: keyof StudentContext, value: string | string[]) => {
    setStudentContext(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreviousTopicsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviousTopicsInput(e.target.value);
    const topics = e.target.value.split(',').map(topic => topic.trim()).filter(Boolean);
    handleContextChange('previousTopics', topics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnimationError(false);
    
    try {
      // Clean up the student context to remove empty fields
      const cleanedContext = Object.fromEntries(
        Object.entries(studentContext).filter(([, value]) => {
          if (Array.isArray(value)) return value.length > 0;
          return value !== "";
        })
      );
      
      const response = await fetch(`${API_BASE_URL}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          doubt: question,
          studentContext: Object.keys(cleanedContext).length > 0 ? cleanedContext : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnimationResponse({
        animationUrl: data.animationFile ? `${API_BASE_URL}/${data.animationFile}` : undefined,
        question: question,
        answer: data.answer,
        animationError: data.animationError
      });
      
      // If the backend reported an animation error, set our state accordingly
      if (data.animationError) {
        setAnimationError(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Doubt Solver AI
          </h1>
          <p className="text-muted-foreground">
            Ask a question and get a mathematical visualization with diagrams and equations
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left column - Student Context */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg border shadow-sm p-5">
              <h2 className="font-semibold text-lg mb-4">Student Context</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="gradeLevel" className="block text-sm font-medium mb-1">
                      Grade Level
                    </label>
                    <Input
                      id="gradeLevel"
                      value={studentContext.gradeLevel}
                      onChange={(e) => handleContextChange('gradeLevel', e.target.value)}
                      placeholder="e.g., 10th grade"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      value={studentContext.subject}
                      onChange={(e) => handleContextChange('subject', e.target.value)}
                      placeholder="e.g., Math, Physics"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="previousTopics" className="block text-sm font-medium mb-1">
                    Previous Topics
                  </label>
                  <Input
                    id="previousTopics"
                    value={previousTopicsInput}
                    onChange={handlePreviousTopicsChange}
                    placeholder="Comma separated topics"
                  />
                </div>
                
                <div>
                  <label htmlFor="learningStyle" className="block text-sm font-medium mb-1">
                    Learning Style
                  </label>
                  <Input
                    id="learningStyle"
                    value={studentContext.learningStyle}
                    onChange={(e) => handleContextChange('learningStyle', e.target.value)}
                    placeholder="e.g., Visual, Hands-on"
                  />
                </div>
                
                <div>
                  <label htmlFor="difficultyLevel" className="block text-sm font-medium mb-1">
                    Difficulty Level
                  </label>
                  <Select
                    value={studentContext.difficultyLevel}
                    onValueChange={(value) => handleContextChange('difficultyLevel', value as "beginner" | "intermediate" | "advanced")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Question and Answer */}
          <div className="md:col-span-3 space-y-6">
            {/* Question Form */}
            <form onSubmit={handleSubmit} className="bg-card rounded-lg border shadow-sm p-5">
              <h2 className="font-semibold text-lg mb-4">Ask Your Question</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium mb-1">
                    What would you like to know?
                  </label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="min-h-[120px]"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || !question.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span> 
                    : "Get Answer"
                  }
                </Button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive font-medium rounded-lg p-4 border border-destructive/20">
                {error}
              </div>
            )}

            {/* Animation Response */}
            {animationResponse && (
              <div className="bg-card rounded-lg border shadow-sm p-5">
                <h2 className="font-semibold text-lg mb-2">Answer</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Question: {animationResponse.question}
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-5">
                  {animationResponse.answer && (
                    <p className="text-sm leading-relaxed">{animationResponse.answer.text}</p>
                  )}
                </div>
                
                {animationResponse.animationUrl && (
                  <div className="mb-5">
                    <h3 className="text-md font-semibold mb-3 border-b pb-2">Visual Explanation</h3>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mb-4 border border-blue-100 dark:border-blue-900">
                      <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                          <path d="M12 2v6.5" />
                          <path d="M18.4 6.5 13.5 9" />
                          <path d="M18.4 17.5 13.5 15" />
                          <path d="M12 15.5V22" />
                          <path d="M5.6 17.5 10.5 15" />
                          <path d="M5.6 6.5 10.5 9" />
                        </svg>
                        Mathematical Visualization
                      </h3>
                      <p className="text-xs text-blue-600/70 dark:text-blue-500/70 mb-2">
                        A visual diagram with mathematical equations to explain the concept.
                      </p>
                      
                      {animationResponse?.animationUrl && !animationError && (
                        <video 
                          src={animationResponse.animationUrl} 
                          controls 
                          className="w-full rounded-md" 
                          onError={() => setAnimationError(true)}
                        />
                      )}

                      {animationError && (
                        <>
                          <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded text-xs">
                            <p className="text-red-600 font-medium mb-1">
                              {animationResponse?.animationError 
                                ? "The animation could not be generated due to a technical issue."
                                : "Unable to load the animation. This could be due to one of the following reasons:"}
                            </p>
                            <ul className="list-disc pl-4 text-red-500 space-y-1">
                              {!animationResponse?.animationError && (
                                <>
                                  <li>The animation is still being generated (it may take up to 30-45 seconds)</li>
                                  <li>The server is experiencing high load</li>
                                </>
                              )}
                              <li>The animation generation encountered a compatibility issue with the mathematical concepts</li>
                              <li>The system may need additional context to properly visualize this concept</li>
                            </ul>
                            <div className="mt-2">
                              <button 
                                className="bg-red-100 hover:bg-red-200 text-red-700 text-xs py-1 px-2 rounded transition-colors"
                                onClick={() => window.location.reload()}
                              >
                                Refresh Page
                              </button>
                              {!animationResponse?.animationError && (
                                <button 
                                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1 px-2 rounded ml-2 transition-colors"
                                  onClick={() => setAnimationError(false)}
                                >
                                  Try Again
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Fallback mathematical animation illustration */}
                          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-blue-900/50">
                            <p className="text-xs text-center text-gray-500 mb-2">Displaying mathematical equations visualization</p>
                            <div className="flex justify-center">
                              <div 
                                className="h-64 w-full bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center overflow-hidden"
                                style={{ 
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%236366f1' fill-opacity='0.1' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'%3E%3C/path%3E%3C/svg%3E")`,
                                }}
                              >
                                <div className="py-4 px-6 bg-white/80 dark:bg-gray-900/80 rounded shadow-md transform rotate-1">
                                  <div className="text-center">
                                    <div className="mb-2 text-blue-800 dark:text-blue-300 font-math text-lg">f(x) = x<sup>2</sup></div>
                                    <div className="text-red-800 dark:text-red-300 font-math text-lg">f'(x) = 2x</div>
                                    <div className="mt-3 border-t border-blue-100 dark:border-blue-800 pt-2">
                                      <div className="text-purple-800 dark:text-purple-300 font-math text-lg">∫ x<sup>2</sup> dx = <sup>x<sup>3</sup></sup>⁄<sub>3</sub> + C</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {!animationError && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          Note: Animation generation may take up to 45 seconds. If it doesn't appear, please wait and refresh.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 