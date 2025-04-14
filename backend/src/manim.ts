import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

dotenv.config();

// Initialize Gemini client
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

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

      // Generate Python script with custom Manim animation using Gemini API
      const pythonScript = await generateManimScriptWithGemini(doubt, answer);
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
 * Uses Gemini's model to generate a customized Manim script based on the doubt and answer
 */
async function generateManimScriptWithGemini(doubt: string, answer: string): Promise<string> {
  try {
    const prompt = `
You are an expert in mathematics and visualization who will create a Manim animation script focusing on DIAGRAMS and EQUATIONS to explain a mathematical concept.

The student has asked: "${doubt}"

An answer has been provided: "${answer}"

Create a Python Manim script that will:
1. Focus PRIMARILY on visual diagrams, graphs, and mathematical equations
2. Use MINIMAL text - only essential labels, titles, and brief annotations
3. Prioritize mathematical notation using MathTex for equations rather than explanatory text
4. Create clean, clear visualizations that demonstrate the concept visually
5. Use animations, transformations, and highlighting to show relationships and processes
6. Structure the animation in a logical teaching sequence

IMPORTANT VISUALIZATION REQUIREMENTS:
- Focus on DIAGRAMS FIRST - create meaningful visual representations
- Use color strategically to highlight important elements
- Use animations to show mathematical processes and transformations
- Keep visual elements clean, minimal, and easy to understand
- Only include text for essential labels and brief annotations
- Use MathTex for mathematical notation rather than Text objects when possible
- Show space between words in the animation

SPECIFIC TEXT LIMITATIONS:
- NO paragraphs of explanatory text
- NO step-by-step instructions written as text
- NO verbose explanations - if text is needed, keep it under 5 words per label
- The animation should be understandable without reading large amounts of text
- Use mathematical notation rather than words whenever possible

TECHNICAL REQUIREMENTS:
- The script must be complete and immediately runnable with Manim
- Use Manim's Scene class as the base for your animation
- Name your main class "DoubtAnimationScene" 
- Only use Manim libraries and features that are standard in Manim CE
- Include all necessary imports at the top
- DO NOT include ANY explanatory comments at the beginning or end of the script
- ONLY provide Python code, no explanations before or after
- ALWAYS define any variables before using them (e.g., declare 'font_size = 22' at the beginning of your script)
- ALWAYS include proper error handling and variable initialization
- ALWAYS define ALL objects individually FIRST, then create any VGroup, then position objects
- NEVER use references to objects that haven't been defined yet

CRITICAL SAFETY REQUIREMENTS:
- ALWAYS check if an object exists or has elements before accessing it with indexes
- When using indexed access like equation[0], ALWAYS use a try/except block or verify the length first
- Use safe methods for positioning like:
  * obj.next_to(reference, direction, buff=0.2)
  * obj.to_edge(direction, buff=0.5)
- When accessing components of MathTex, use get_parts_by_tex() when possible
- When you need index access, verify length first:
  * if len(equation) > 2: equation[2]...
- Alternatively, use a safe getter function like:
  * def safe_get(obj, idx, default_pos=ORIGIN):
      try:
          return obj[idx].get_center()
      except (IndexError, TypeError):
          return default_pos

CLEAR SCREEN HELPER:
- Use this exact implementation for the clear_all_mobjects helper method:
  def clear_all_mobjects(self):
      if self.mobjects:
          self.play(*[FadeOut(mob) for mob in self.mobjects])
          self.remove(*self.mobjects)
- NEVER use self.camera.frame in your clear method - it causes errors
- When clearing the screen between sections, use this helper method as shown:
  * self.clear_all_mobjects()
- Clear the screen between sections to avoid clutter

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

MANIM COMPATIBILITY REQUIREMENTS:
- When using ParametricFunction or FunctionGraph, use 'points' NOT 'graph_points()'
- For any function f, access its points with 'f.points' not 'f.graph_points()'  
- For getting specific points on a function graph, use 'f.point_from_proportion(0.5)' for midpoint
- For endpoints, use 'f.points[0]' for start and 'f.points[-1]' for end
- NEVER use graph_points() method as it doesn't exist in current Manim versions
- Create axes explicitly with NumberPlane() or Axes() before plotting functions

CRITICAL DISPLAY REQUIREMENTS:
- Prioritize VISUALS over text - the animation should be primarily diagrams and equations
- Keep any text brief and focused on labels rather than explanations
- Use MathTex for equations and mathematical notation
- Use MathTex instead of Text wherever mathematical notation is needed
- Keep any text small and concise (font_size around 18-22)
- ALWAYS explicitly REMOVE objects from scene after fading them out with self.remove()
- Implement a clear_all_mobjects helper method exactly as specified above
- Track ALL created objects and ensure they are properly removed when no longer needed
- Keep all graphics and visualizations properly scaled to fit the screen
- Test all coordinates to ensure content is fully visible within default Manim frame
- Clear the screen between sections to avoid clutter
- Show space between words in the animation

Provide STRICTLY ONLY the Python code for the Manim script, with absolutely no additional explanation text before or after the code.
`;

    const generationConfig: GenerationConfig = {
      temperature: 0.2,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    };

    // Use Gemini to generate the Manim script
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const scriptText = result.response.text();
    
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
    
    // Fix common Manim compatibility issues
    
    // Replace any usage of graph_points() with points
    cleanScript = cleanScript.replace(/\.graph_points\(\)/g, '.points');
    
    // Replace any usage of point_from_prop as needed
    if (!cleanScript.includes('point_from_proportion') && cleanScript.includes('get_point_from_function')) {
      cleanScript = cleanScript.replace(/\.get_point_from_function\(/g, '.point_from_proportion(');
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
    console.error("Failed to generate Manim script with Gemini:", error);
    // Fall back to the template-based script if Gemini fails
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
  
  // Simple template for a Manim animation that explains using diagrams
  return `
from manim import *

class DoubtAnimationScene(Scene):
    def construct(self):
        # Define common variables
        font_size = 22
        
        # Helper function to safely get positions from indexed objects
        def safe_get_center(obj, idx, default_offset=np.array([0, 0, 0])):
            try:
                if obj and idx < len(obj):
                    return obj[idx].get_center()
                return ORIGIN + default_offset
            except (IndexError, TypeError, AttributeError):
                return ORIGIN + default_offset
        
        # Clear everything helper
        def clear_all_mobjects(self):
            if self.mobjects:
                self.play(*[FadeOut(mob) for mob in self.mobjects])
                self.remove(*self.mobjects)
        
        # Create a custom coordinate system
        def create_custom_axes():
            # Create the axes lines
            x_axis = Line(LEFT * 4, RIGHT * 4, color=WHITE)
            y_axis = Line(DOWN * 3, UP * 3, color=WHITE)
            
            # Create origin point
            origin = Dot(np.array([0, 0, 0]), color=WHITE)
            
            # Create axis labels using MathTex
            x_label = MathTex("x", font_size=24, color=WHITE)
            x_label.next_to(x_axis, DOWN, buff=0.2)
            y_label = MathTex("y", font_size=24, color=WHITE)
            y_label.next_to(y_axis, RIGHT, buff=0.2)
            
            # Tick marks on x-axis
            x_ticks = VGroup()
            x_labels = VGroup()
            for i in range(-3, 4):
                if i == 0:
                    continue  # Skip origin
                
                # Create tick mark
                tick = Line(DOWN * 0.1, UP * 0.1, color=WHITE)
                tick.move_to(np.array([i, 0, 0]))
                x_ticks.add(tick)
                
                # Create label with MathTex
                label = MathTex(str(i), font_size=20, color=WHITE)
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
                
                # Create label with MathTex
                label = MathTex(str(i), font_size=20, color=WHITE)
                label.next_to(tick, LEFT, buff=0.1)
                y_labels.add(label)
            
            # Group everything together
            axes = VGroup(x_axis, y_axis, origin, x_label, y_label, 
                          x_ticks, x_labels, y_ticks, y_labels)
            return axes
        
        # Start with a minimal title
        title = MathTex("\\text{Mathematical Concept}", font_size=36, color=BLUE)
        title.to_edge(UP, buff=1)
        self.play(Write(title))
        self.wait(1)
        
        # Create a simple function visualization
        axes = create_custom_axes()
        self.play(Create(axes))
        self.wait(1)
        
        # For quadratic equations, show the standard form
        if "quadratic" in "${cleanDoubt}".lower():
            # Show quadratic equation
            quadratic = MathTex("ax^2 + bx + c = 0", font_size=32, color=WHITE)
            quadratic.next_to(title, DOWN, buff=0.5)
            self.play(Write(quadratic))
            
            # Highlight the coefficients
            a_label = MathTex("a", font_size=28, color=RED)
            b_label = MathTex("b", font_size=28, color=GREEN)
            c_label = MathTex("c", font_size=28, color=BLUE)
            
            # Position safely without assuming indices
            try:
                if len(quadratic) > 0:
                    a_pos = quadratic[0].get_center() + UP * 0.5 + LEFT * 1.0
                    b_pos = quadratic[0].get_center() + UP * 0.5
                    c_pos = quadratic[0].get_center() + UP * 0.5 + RIGHT * 1.0
                else:
                    a_pos = LEFT * 1.5 + UP * 0.5
                    b_pos = ORIGIN + UP * 0.5
                    c_pos = RIGHT * 1.5 + UP * 0.5
            except (IndexError, TypeError):
                a_pos = LEFT * 1.5 + UP * 0.5
                b_pos = ORIGIN + UP * 0.5
                c_pos = RIGHT * 1.5 + UP * 0.5
            
            a_label.move_to(a_pos)
            b_label.move_to(b_pos)
            c_label.move_to(c_pos)
            
            self.play(Write(a_label), Write(b_label), Write(c_label))
            
            # Show the quadratic formula
            formula = MathTex("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", font_size=32, color=YELLOW)
            formula.next_to(quadratic, DOWN, buff=0.7)
            
            self.play(Write(formula))
            self.wait(1.5)
            
            # Show a parabola
            parabola_points = []
            for x in np.linspace(-3, 3, 30):
                y = x**2  # Simple parabola
                parabola_points.append(np.array([x, y, 0]))
            
            # Create the curve
            curve = VMobject(color=YELLOW)
            curve.set_points_as_corners(parabola_points)
            curve.shift(DOWN * 0.5)  # Move down to fit in frame
            
            self.play(Create(curve))
            
            # Mark the roots for a simple case where roots are visible
            root1 = Dot(np.array([-1, 1, 0]), color=RED)
            root2 = Dot(np.array([1, 1, 0]), color=RED)
            
            root1_label = MathTex("x_1", font_size=24, color=RED)
            root2_label = MathTex("x_2", font_size=24, color=RED)
            
            root1_label.next_to(root1, DOWN, buff=0.2)
            root2_label.next_to(root2, DOWN, buff=0.2)
            
            self.play(Create(root1), Create(root2), Write(root1_label), Write(root2_label))
            self.wait(1)
        else:
            # Show a simple function
            func_eq = MathTex("f(x) = x^2", font_size=32)
            func_eq.next_to(title, DOWN, buff=0.5)
            self.play(Write(func_eq))
            
            # Create the parabola
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
            self.wait(1)
            
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
            
            # Add derivative label
            deriv_label = MathTex("f'(x) = 2x", font_size=32, color=RED)
            deriv_label.next_to(func_eq, DOWN, buff=0.4)
            
            # Add label for slope at point
            slope_label = MathTex("f'(1) = 2", font_size=28, color=RED)
            slope_label.next_to(deriv_label, DOWN, buff=0.4)
            
            self.play(Write(deriv_label), Write(slope_label))
        
        self.wait(2)
        
        # Fade everything out
        self.play(*[FadeOut(mob) for mob in self.mobjects])
        
        # Final pause before ending
        self.wait(1)

if __name__ == "__main__":
    scene = DoubtAnimationScene()
    scene.render()
`;
}
