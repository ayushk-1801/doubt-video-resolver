from manim import *

class DoubtAnimationScene(ThreeDScene):
    def clear_all_mobjects(self):
        self.remove(*self.mobjects)

    def construct(self):
        font_size = 22
        text_width = 4
        diagram_width = 6

        # Introduction
        intro_text = Text("Moving from 2D to 3D geometry can feel tricky at first,\nbut it's really just an extension of the same principles — now with an extra axis.", font_size=font_size, width=text_width)
        intro_text.to_edge(LEFT, buff=0.5)
        self.play(Write(intro_text))
        self.wait(2)
        self.remove(intro_text)

        # 2D vs 3D Axes
        axes_2d = Axes(x_range=[-5, 5], y_range=[-5, 5], x_length=diagram_width, y_length=diagram_width)
        axes_2d.to_edge(RIGHT, buff=1.0)
        axes_3d = ThreeDAxes(x_range=[-5, 5], y_range=[-5, 5], z_range=[-5, 5], x_length=diagram_width, y_length=diagram_width, z_length=diagram_width)
        axes_3d.to_edge(RIGHT, buff=1.0)

        axes_2d_text = Text("2D Axes: x-axis and y-axis", font_size=font_size, width=text_width)
        axes_2d_text.to_edge(LEFT, buff=0.5)
        self.play(Write(axes_2d_text), Create(axes_2d))
        self.wait(2)
        self.remove(axes_2d_text, axes_2d)

        axes_3d_text = Text("3D Axes: x-axis, y-axis, and z-axis", font_size=font_size, width=text_width)
        axes_3d_text.to_edge(LEFT, buff=0.5)
        self.play(Write(axes_3d_text), Create(axes_3d))
        self.wait(2)
        self.remove(axes_3d_text, axes_3d)

        # Point in 3D
        point_text = Text("Point in 3D: (x, y, z)", font_size=font_size, width=text_width)
        point_text.to_edge(LEFT, buff=0.5)
        point = Dot3D(point=(1, 2, 3), color=RED)
        point_label = MathTex(r"(1, 2, 3)").next_to(point, RIGHT)
        self.play(Write(point_text), Create(point), Write(point_label))
        self.wait(2)
        self.remove(point_text, point, point_label)

        # Line in 3D
        line_text = Text("Line in 3D: parametric form", font_size=font_size, width=text_width)
        line_text.to_edge(LEFT, buff=0.5)
        line = Line3D(start=(0, 0, 0), end=(3, 3, 3), color=GREEN)
        line_label = MathTex(r"x = x_0 + at, y = y_0 + bt, z = z_0 + ct").next_to(line, RIGHT)
        self.play(Write(line_text), Create(line), Write(line_label))
        self.wait(2)
        self.remove(line_text, line, line_label)

        # Plane in 3D
        plane_text = Text("Plane in 3D: Ax + By + Cz + D = 0", font_size=font_size, width=text_width)
        plane_text.to_edge(LEFT, buff=0.5)
        plane = Surface(lambda u, v: np.array([u, v, 0]), u_range=[-5, 5], v_range=[-5, 5], checkerboard_colors=[BLUE, BLUE], resolution=(20, 20))
        plane_label = MathTex(r"Ax + By + Cz + D = 0").next_to(plane, RIGHT)
        self.play(Write(plane_text), Create(plane), Write(plane_label))
        self.wait(2)
        self.remove(plane_text, plane, plane_label)

        # Distance formulas in 3D
        distance_text = Text("Distance formulas in 3D", font_size=font_size, width=text_width)
        distance_text.to_edge(LEFT, buff=0.5)
        point1 = Dot3D(point=(1, 2, 3), color=RED)
        point2 = Dot3D(point=(4, 5, 6), color=GREEN)
        distance_line = Line3D(start=(1, 2, 3), end=(4, 5, 6), color=YELLOW)
        distance_label = MathTex(r"\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}").next_to(distance_line, RIGHT)
        self.play(Write(distance_text), Create(point1), Create(point2), Create(distance_line), Write(distance_label))
        self.wait(2)
        self.remove(distance_text, point1, point2, distance_line, distance_label)

        # Visualization of 3D space
        space_text = Text("Visualizing 3D space", font_size=font_size, width=text_width)
        space_text.to_edge(LEFT, buff=0.5)
        self.set_camera_orientation(phi=75*DEGREES, theta=-45*DEGREES)
        self.begin_ambient_camera_rotation(rate=0.1)
        self.play(Write(space_text), Create(axes_3d))
        self.wait(4)
        self.stop_ambient_camera_rotation()
        self.remove(space_text, axes_3d)

        # Conclusion
        conclusion_text = Text("3D geometry is incredibly useful in real-world applications.", font_size=font_size, width=text_width)
        conclusion_text.to_edge(LEFT, buff=0.5)
        self.play(Write(conclusion_text))
        self.wait(2)
        self.remove(conclusion_text)

if __name__ == "__main__":
    scene = DoubtAnimationScene()
    scene.render()
