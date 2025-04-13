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

interface AudioResponse {
  audioUrl: string;
  videoUrl?: string;
  question: string;
  answer: {
    text: string;
  };
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

export function VideoAnswerForm() {
  const [question, setQuestion] = useState("");
  const [studentContext, setStudentContext] = useState<StudentContext>({
    gradeLevel: "",
    subject: "",
    previousTopics: [],
    learningStyle: "",
    difficultyLevel: "intermediate"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [audioResponse, setAudioResponse] = useState<AudioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousTopicsInput, setPreviousTopicsInput] = useState("");

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
      setAudioResponse({
        audioUrl: `${API_BASE_URL}/${data.audioFile}`,
        videoUrl: data.videoFile ? `${API_BASE_URL}/${data.videoFile}` : undefined,
        question: question,
        answer: data.answer
      });
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
            Ask a question and get a personalized video and audio response
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

            {/* Audio Response */}
            {audioResponse && (
              <div className="bg-card rounded-lg border shadow-sm p-5">
                <h2 className="font-semibold text-lg mb-2">Answer</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Question: {audioResponse.question}
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 mb-5">
                  {audioResponse.answer && (
                    <p className="text-sm leading-relaxed">{audioResponse.answer.text}</p>
                  )}
                </div>
                
                {audioResponse.videoUrl && (
                  <div className="bg-primary/5 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" />
                        <line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" />
                        <line x1="17" y1="7" x2="22" y2="7" />
                      </svg>
                      Video Response
                    </h3>
                    <video 
                      src={audioResponse.videoUrl} 
                      controls 
                      className="w-full rounded-md" 
                    />
                  </div>
                )}
                
                <div className="bg-primary/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                    Audio Version
                  </h3>
                  <audio 
                    src={audioResponse.audioUrl} 
                    controls 
                    className="w-full" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 