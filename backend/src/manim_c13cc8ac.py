
from manim import *

class DoubtAnimationScene(Scene):
    def construct(self):
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
        title = MathTex("\text{Mathematical Concept}", font_size=36, color=BLUE)
        title.to_edge(UP, buff=1)
        self.play(Write(title))
        self.wait(1)
        
        # Create a simple function visualization
        axes = create_custom_axes()
        self.play(Create(axes))
        self.wait(1)
        
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
        self.play(
            FadeOut(axes), FadeOut(curve_dots), FadeOut(curve_lines),
            FadeOut(func_eq), FadeOut(tangent_dot), FadeOut(tangent_line),
            FadeOut(deriv_label), FadeOut(slope_label), FadeOut(title)
        )
        
        # Final pause before ending
        self.wait(1)

if __name__ == "__main__":
    scene = DoubtAnimationScene()
    scene.render()
