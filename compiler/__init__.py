"""
TeachYourself LessonIR Compiler Package
Compilador determinístico de Lesson Intermediate Representation para MDX publicável.
"""

from .lesson_compiler import compile_lesson_ir, compile_lesson_to_mdx

__all__ = ["compile_lesson_ir", "compile_lesson_to_mdx"]
