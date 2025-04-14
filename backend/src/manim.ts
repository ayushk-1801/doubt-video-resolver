import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY environment variable is not set");

/**
 * Generates a Manim animation based on the student's doubt and the provided answer
 * @param doubt The student's doubt/question
 * @param answer The answer provided by the system
 * @param outputPath Directory where the animation video will be saved
 * @returns Path to the generated animation video
 */
export async function generateManimAnimation(
  doubt: string,
  answer: string,
  outputPath: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure the output directory exists
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }

      // Create a unique ID for this animation
      const animationId = uuidv4().substring(0, 8);
      const pythonScriptPath = path.join(__dirname, `manim_${animationId}.py`);
      const outputFileName = `doubt_animation_${animationId}.mp4`;
      const outputFilePath = path.join(outputPath, outputFileName);

      // Generate Python script with custom Manim animation
      const pythonScript = await generateManimScriptWithGroq(doubt, answer);
      fs.writeFileSync(pythonScriptPath, pythonScript);

      // Execute the Manim command to generate the animation
      const command = `cd ${path.dirname(pythonScriptPath)} && python -m manim ${pythonScriptPath} DoubtAnimationScene -qm --output_file=${outputFilePath}`;

      console.log(`Executing Manim: ${command}`);

      exec(command, (error, stdout, stderr) => {
        // Clean up the temporary Python script
        if (fs.existsSync(pythonScriptPath)) {
          fs.unlinkSync(pythonScriptPath);
        }
        
        if (error) {
          console.error(`Manim execution error: ${error}`);
          return reject(error);
        }

        if (stderr) {
          console.warn(`Manim stderr: ${stderr}`);
        }

        console.log(`Manim stdout: ${stdout}`);

        if (fs.existsSync(outputFilePath)) {
          return resolve(outputFilePath);
        } else {
          return reject(new Error("Manim animation file was not generated"));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Uses Groq's qwen-2.5-coder-32b model to generate a customized Manim script based on the doubt and answer
 */
async function generateManimScriptWithGroq(doubt: string, answer: string): Promise<string> {
  try {
    const prompt = `
You are an expert in mathematics and visualization who will create a Manim animation script to explain a student's doubt.

The student has asked: "${doubt}"

An answer has been provided: "${answer}"

Create a Python Manim script that will:
1. Create a visually engaging explanation using Manim's animation capabilities
2. Include relevant visualizations and graphics that help explain the concepts
3. Break down complex ideas into visual components
4. Use appropriate colors, highlighting, and animation techniques
5. Make sure to include visual elements like graphs, geometric shapes, etc. relevant to the topic
6. Structure the animation in a logical teaching sequence

IMPORTANT REQUIREMENTS:
- The script must be complete and immediately runnable with Manim
- Use Manim's Scene class as the base for your animation
- Name your main class "DoubtAnimationScene" 
- Only use Manim libraries and features that are standard in Manim CE
- Include all necessary imports at the top
- DO NOT include ANY explanatory comments at the beginning or end of the script
- ONLY provide Python code, no explanations before or after
- ALWAYS define any variables before using them (e.g., declare 'font_size = 22' at the beginning of your script)
- ALWAYS include proper error handling and variable initialization

LAYOUT REQUIREMENTS:
- Implement a split-screen layout with text on the left side and diagrams on the right side
- For text and explanations: place all Text objects on the LEFT half of the screen
- For diagrams and visuals: place all graphical elements on the RIGHT half of the screen
- Example positioning:
  * text_element.to_edge(LEFT, buff=0.5)  # Place text on left side
  * diagram.to_edge(RIGHT, buff=1.0)  # Place diagram on right side
- You can use a vertical line to separate the two sections if needed
- Keep all text aligned on the left side throughout the animation
- As concepts progress, update the diagram on the right while keeping text on the left

SCENE CLASS REQUIREMENTS:
- For 2D animations: Your class should inherit from Scene (class DoubtAnimationScene(Scene))
- For 3D animations: Your class should inherit from ThreeDScene (class DoubtAnimationScene(ThreeDScene)) 
- DO NOT create instances of Scene or ThreeDScene - they are base classes to inherit from
- INCORRECT: 'scene_3d = ThreeDScene()' - This will cause errors
- CORRECT: 'class DoubtAnimationScene(ThreeDScene):'
- For 3D scenes, use camera adjustments inside the construct method:
  * self.set_camera_orientation(phi=75*DEGREES, theta=-45*DEGREES)
  * self.begin_ambient_camera_rotation(rate=0.1)
- If you need to switch between 2D and 3D in a single animation, it's better to simulate 3D in 2D space

MANIM CLASS REQUIREMENTS:
- ONLY use standard Manim classes and objects that exist in Manim CE
- DO NOT use custom classes like 'RightTriangle' unless you define them yourself
- For right-angled triangles, use Polygon class with appropriate vertices
- Any custom shapes must be defined using existing primitives (Polygon, Line, etc.)
- Correct usage for a right triangle: 
  * vertices = [ORIGIN, RIGHT*3, UP*2]  # Right angle at ORIGIN
  * triangle = Polygon(*vertices, fill_opacity=0.5, color=BLUE)
- Always include implementation for any non-standard components you need

CRITICAL DISPLAY REQUIREMENTS:
- Text must NEVER overflow the bottom of the frame - this is the most critical issue to avoid
- Use pagination: display at most 5 lines of text at once, then fade out and show the next set
- Use small font sizes (20-22) for content text to ensure it fits
- Implement a paging mechanism where text is shown in chunks, with transitions between pages
- After displaying 5 lines of text, fade them out before showing the next set
- ALWAYS explicitly REMOVE objects from scene after fading them out with self.remove()
- Implement a clear_all_mobjects helper method to thoroughly clear the scene between sections
- Track ALL created objects and ensure they are properly removed when no longer needed
- Keep all graphics and visualizations properly scaled to fit the screen
- Test all coordinates to ensure content is fully visible within default Manim frame

Provide STRICTLY ONLY the Python code for the Manim script, with absolutely no additional explanation text before or after the code.
`;

    // Use Groq SDK to generate the Manim script
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system" as const,
          content: "You are an expert Python programmer specializing in Manim animations for educational content. Return only executable Python code with no explanations or comments outside the code. ALWAYS define all variables before using them. ONLY use standard Manim classes that exist in Manim CE, not custom ones unless you define them yourself. If creating 3D scenes, inherit from ThreeDScene rather than instantiating it. Create animations with text on the left and diagrams on the right."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      model: "qwen-2.5-coder-32b",
      temperature: 0.2,
      max_tokens: 4000
    });

    const scriptText = chatCompletion.choices[0].message.content || '';
    
    // Clean up any code block markers and extract only the Python code
    let cleanScript = extractPythonCode(scriptText);
    
    // Make sure imports are at the top if not already
    if (!cleanScript.startsWith("from manim import") && !cleanScript.startsWith("import")) {
      cleanScript = "from manim import *\n\n" + cleanScript;
    }
    
    // Add a safety check to ensure we have a valid script with a main class
    if (!cleanScript.includes("class DoubtAnimationScene") && !cleanScript.includes("class DoubtAnimationScene(")) {
      throw new Error("Generated script is missing the required DoubtAnimationScene class");
    }
    
    // Add common variable definitions if they don't exist to prevent undefined errors
    if (!cleanScript.includes("font_size") && 
        (cleanScript.includes("font_size=") || cleanScript.includes("font_size ="))) {
      // Add font_size definition at the start of the class
      cleanScript = cleanScript.replace(
        /class DoubtAnimationScene\(Scene\):\s*\n\s*def construct\(self\):/,
        "class DoubtAnimationScene(Scene):\n    def construct(self):\n        # Define common variables\n        font_size = 22"
      );
    }
    
    // Add the entry point if it's missing
    if (!cleanScript.includes("if __name__ == \"__main__\"")) {
      cleanScript += `

if __name__ == "__main__":
    scene = DoubtAnimationScene()
    scene.render()
`;
    }
    
    return cleanScript;
  } catch (error) {
    console.error("Failed to generate Manim script with Groq:", error);
    // Fall back to the template-based script if Groq fails
    return generateBasicManimScript(doubt, answer);
  }
}

/**
 * Extracts valid Python code from the model response, removing any explanatory text
 */
function extractPythonCode(text: string): string {
  // First, try to find code between ```python and ``` markers
  const pythonCodeBlockRegex = /```python\s*([\s\S]*?)\s*```/;
  const codeBlockMatch = text.match(pythonCodeBlockRegex);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // If no ```python blocks, try to find any ``` code blocks
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const genericBlockMatch = text.match(codeBlockRegex);
  
  if (genericBlockMatch && genericBlockMatch[1]) {
    return genericBlockMatch[1].trim();
  }
  
  // If no clear code blocks, try to identify and extract Python code by common patterns
  // First, remove any markdown or explanatory text at the beginning and end
  let cleanedText = text.trim();
  
  // Remove any explanatory text at the beginning until we find an import or a class definition
  const startOfCodeRegex = /(from\s+\w+\s+import|import\s+\w+|class\s+\w+)/;
  const startMatch = cleanedText.match(startOfCodeRegex);
  
  if (startMatch && startMatch.index !== undefined) {
    cleanedText = cleanedText.substring(startMatch.index);
  }
  
  // Remove any trailing explanation text that's not valid Python
  // Look for common ending patterns in Python files
  const endOfCodeRegex = /(if\s+__name__\s*==\s*["']__main__["']\s*:[\s\S]*?\n\s*scene\.render\(\))|(scene\.render\(\)\s*$)/;
  const endMatch = cleanedText.match(endOfCodeRegex);
  
  if (endMatch && endMatch.index !== undefined && endMatch[0]) {
    const endIndex = endMatch.index + endMatch[0].length;
    cleanedText = cleanedText.substring(0, endIndex);
  }
  
  // Find and remove any lines that aren't valid Python syntax (like explanatory text paragraphs)
  const lines = cleanedText.split('\n');
  const pythonLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // Skip empty lines
    if (trimmedLine === '') return true;
    // Skip potential explanatory paragraphs (long text without Python syntax)
    if (trimmedLine.length > 50 && 
        !trimmedLine.includes('(') && 
        !trimmedLine.includes(':') && 
        !trimmedLine.includes('=') && 
        !trimmedLine.startsWith('#')) {
      return false;
    }
    return true;
  });
  
  return pythonLines.join('\n').trim();
}

/**
 * Generates a basic template-based Manim script as a fallback
 */
function generateBasicManimScript(doubt: string, answer: string): string {
  // Clean and escape text for Python
  const cleanText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")  // Escape backslashes first
      .replace(/"""/g, '\\"\\"\\"') // Handle triple quotes
      .replace(/\n/g, "\\n");  // Handle newlines
  };
  
  const cleanDoubt = cleanText(doubt);
  const cleanAnswer = cleanText(answer);
  
  // Simple template for a Manim animation that explains the doubt and answer
  // Using Text instead of Tex to avoid LaTeX dependency
  return `
from manim import *

class DoubtAnimationScene(Scene):
    def construct(self):
        # Clear everything helper
        def clear_all_mobjects(self):
            self.play(*[FadeOut(mob) for mob in self.mobjects if mob != self.camera.frame])
            self.remove(*self.mobjects)
            self.add(self.camera.frame)
        
        # Create a custom coordinate system (without using Axes which uses LaTeX)
        def create_custom_axes():
            # Create the axes lines
            x_axis = Line(LEFT * 4, RIGHT * 4, color=WHITE)
            y_axis = Line(DOWN * 3, UP * 3, color=WHITE)
            
            # Create origin point
            origin = Dot(np.array([0, 0, 0]), color=WHITE)
            
            # Create axis labels using Text
            x_label = Text("x", font_size=20, color=WHITE)
            x_label.next_to(x_axis, RIGHT)
            y_label = Text("y", font_size=20, color=WHITE)
            y_label.next_to(y_axis, UP)
            
            # Tick marks on x-axis - using lines and Text (not LaTeX)
            x_ticks = VGroup()
            x_labels = VGroup()
            for i in range(-3, 4):
                if i == 0:
                    continue  # Skip origin
                
                # Create tick mark
                tick = Line(DOWN * 0.1, UP * 0.1, color=WHITE)
                tick.move_to(np.array([i, 0, 0]))
                x_ticks.add(tick)
                
                # Create label with Text
                label = Text(str(i), font_size=16, color=WHITE)
                label.next_to(tick, DOWN, buff=0.1)
                x_labels.add(label)
            
            # Tick marks on y-axis
            y_ticks = VGroup()
            y_labels = VGroup()
            for i in range(-2, 3):
                if i == 0:
                    continue  # Skip origin
                
                # Create tick mark
                tick = Line(LEFT * 0.1, RIGHT * 0.1, color=WHITE)
                tick.move_to(np.array([0, i, 0]))
                y_ticks.add(tick)
                
                # Create label with Text
                label = Text(str(i), font_size=16, color=WHITE)
                label.next_to(tick, LEFT, buff=0.1)
                y_labels.add(label)
            
            # Group everything together
            axes = VGroup(x_axis, y_axis, origin, x_label, y_label, 
                          x_ticks, x_labels, y_ticks, y_labels)
            return axes
        
        # Create a title with the doubt
        doubt_text = """${cleanDoubt}"""
        
        # Create title that stays at the top throughout the animation
        title = Text("Question:", font_size=36, color=BLUE)
        title.to_edge(UP + LEFT, buff=0.5)
        self.play(Write(title))
        self.wait(0.5)
        
        # Process doubt text to ensure it fits
        doubt_words = doubt_text.split()
        doubt_lines = []
        current_line = ""
        
        # Break the doubt into lines of reasonable length
        for word in doubt_words:
            if len(current_line + " " + word) > 60:  # character limit per line
                doubt_lines.append(current_line)
                current_line = word
            else:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
        if current_line:
            doubt_lines.append(current_line)
        
        # Calculate how many lines we can show at once (limit to 5 lines per page)
        lines_per_page = 5
        total_pages = (len(doubt_lines) + lines_per_page - 1) // lines_per_page  # Ceiling division
        
        # Track all text objects for proper removal
        all_doubt_text_objects = []
        
        # Show doubt text page by page
        for page in range(total_pages):
            start_idx = page * lines_per_page
            end_idx = min(start_idx + lines_per_page, len(doubt_lines))
            
            # Create text objects for this page
            doubt_text_objects = VGroup()
            for i in range(start_idx, end_idx):
                line = doubt_lines[i]
                line_text = Text(line, font_size=22)
                if i == start_idx:
                    line_text.next_to(title, DOWN, aligned_edge=LEFT, buff=0.3)
                else:
                    line_text.next_to(doubt_text_objects[-1], DOWN, aligned_edge=LEFT, buff=0.2)
                doubt_text_objects.add(line_text)
                all_doubt_text_objects.append(line_text)
            
            # Add all objects to the scene explicitly
            self.add(doubt_text_objects)
            
            # Show this page
            for line in doubt_text_objects:
                self.play(Write(line), run_time=0.5)
            
            # Wait between pages
            self.wait(1.5)
            
            # If not the last page, explicitly remove before showing next page
            if page < total_pages - 1:
                self.play(FadeOut(doubt_text_objects))
                self.remove(doubt_text_objects)
        
        # Explicitly clear all doubt text from scene
        if all_doubt_text_objects:
            self.play(*[FadeOut(obj) for obj in all_doubt_text_objects])
            for obj in all_doubt_text_objects:
                self.remove(obj)
        
        # Clear everything for answer section
        clear_all_mobjects(self)
        
        # Add title back since we cleared everything
        title = Text("Answer:", font_size=36, color=GREEN)
        title.to_edge(UP + LEFT, buff=0.5)
        self.play(Write(title))
        self.wait(0.5)
        
        # Process the answer text
        answer_text = """${cleanAnswer}"""
        words = answer_text.split()
        answer_lines = []
        current_line = ""
        
        # Break the answer into lines of reasonable length
        for word in words:
            if len(current_line + " " + word) > 60:  # character limit per line
                answer_lines.append(current_line)
                current_line = word
            else:
                if current_line:
                    current_line += " " + word
                else:
                    current_line = word
        if current_line:
            answer_lines.append(current_line)
        
        # Show answer text page by page (5 lines per page)
        lines_per_page = 5
        total_pages = (len(answer_lines) + lines_per_page - 1) // lines_per_page
        
        # Track all answer text objects for proper removal
        all_answer_objects = []
        
        for page in range(total_pages):
            start_idx = page * lines_per_page
            end_idx = min(start_idx + lines_per_page, len(answer_lines))
            
            # Create text objects for this page
            answer_objects = VGroup()
            for i in range(start_idx, end_idx):
                line = answer_lines[i]
                line_text = Text(line, font_size=22)
                if i == start_idx:
                    line_text.next_to(title, DOWN, aligned_edge=LEFT, buff=0.3)
                else:
                    line_text.next_to(answer_objects[-1], DOWN, aligned_edge=LEFT, buff=0.2)
                answer_objects.add(line_text)
                all_answer_objects.append(line_text)
            
            # Add all objects to the scene explicitly
            self.add(answer_objects)
            
            # Show this page
            for line in answer_objects:
                self.play(Write(line), run_time=0.5)
            
            # Wait between pages
            self.wait(2)
            
            # If not the last page, explicitly remove before showing next page
            if page < total_pages - 1:
                self.play(FadeOut(answer_objects))
                self.remove(answer_objects)
                for obj in answer_objects:
                    self.remove(obj)
            # If this is the last page of text, keep it visible and add a visual element
            elif page == total_pages - 1 and "derivative" in answer_text.lower():
                # Create a simple visual for derivative concept (without using Axes)
                # This custom visual uses only Lines, Dots, and Text to explain derivatives
                self.wait(1)
                
                # Add a visual element after the text
                self.play(FadeOut(answer_objects))
                
                # Create custom coordinate system
                axes = create_custom_axes()
                self.play(Create(axes))
                
                # Create a parabola curve using dots and lines (instead of using plot function)
                parabola_points = []
                for x in np.linspace(-3, 3, 30):
                    y = x**2  # Parabola function
                    parabola_points.append(np.array([x, y, 0]))
                
                curve_dots = VGroup(*[Dot(point, radius=0.02, color=BLUE) for point in parabola_points])
                
                # Connect the dots with small line segments
                curve_lines = VGroup()
                for i in range(len(parabola_points) - 1):
                    line = Line(parabola_points[i], parabola_points[i+1], color=BLUE)
                    curve_lines.add(line)
                
                # Draw the curve
                self.play(Create(curve_dots), Create(curve_lines))
                
                # Add label for the function
                func_label = Text("f(x) = x²", font_size=20, color=BLUE)
                func_label.move_to(np.array([2, 6, 0]))
                self.play(Write(func_label))
                
                # Show a tangent line at x=1
                tangent_point = np.array([1, 1, 0])
                tangent_dot = Dot(tangent_point, color=RED)
                # Tangent to x² at x=1 has slope 2x = 2(1) = 2
                tangent_line = Line(
                    np.array([0, -1, 0]),  # Point on line with x=0
                    np.array([2, 3, 0]),   # Point on line with x=2
                    color=RED
                )
                
                self.play(Create(tangent_dot), Create(tangent_line))
                
                # Add label for derivative
                deriv_label = Text("f'(x) = 2x", font_size=20, color=RED)
                deriv_label.move_to(np.array([-2, 6, 0]))
                
                # Add label for slope at point
                slope_label = Text("Slope at x=1: f'(1) = 2", font_size=18, color=RED)
                slope_label.move_to(np.array([0, 4, 0]))
                
                self.play(Write(deriv_label), Write(slope_label))
                
                self.wait(3)
                
                # Fade everything out
                self.play(
                    FadeOut(axes), FadeOut(curve_dots), FadeOut(curve_lines),
                    FadeOut(func_label), FadeOut(tangent_dot), FadeOut(tangent_line),
                    FadeOut(deriv_label), FadeOut(slope_label)
                )
        
        # Final pause before ending
        self.wait(1)
        
        # Ensure we clear everything at the end
        clear_all_mobjects(self)

if __name__ == "__main__":
    scene = DoubtAnimationScene()
    scene.render()
`;
}
