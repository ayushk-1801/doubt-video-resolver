from manim import *

class ExplanationScene(Scene):
    def construct(self):
        # Create a title
        title = Text("Welcome to the Explanation", font_size=40)
        self.play(Write(title))
        self.wait()
        self.play(FadeOut(title))

        # Create and animate a circle
        circle = Circle(radius=2, color=BLUE)
        self.play(Create(circle))
        self.wait()

        # Add some text
        explanation = Text("This is an example animation", font_size=32)
        explanation.next_to(circle, DOWN)
        self.play(Write(explanation))
        self.wait()

        # Transform the circle into a square
        square = Square(side_length=4, color=GREEN)
        self.play(Transform(circle, square))
        self.wait()

        # Fade everything out
        self.play(
            FadeOut(circle),
            FadeOut(explanation)
        )
        self.wait()


if __name__ == "__main__":
    scene = ExplanationScene()
    scene.render()
