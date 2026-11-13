type CanvasGrades = {
  current_score?: number;
  current_grade?: string;
};

export type CanvasCourse = {
  id: number;
  name: string;
  course_code?: string;
  term?: { name?: string };
  teachers?: { display_name?: string }[];
  enrollments?: { computed_current_score?: number; computed_current_grade?: string; grades?: CanvasGrades }[];
};

export async function getCanvasCourses(): Promise<CanvasCourse[]> {
  const response = await fetch("/canvas-api/api/v1/courses?include[]=total_scores&include[]=teachers&include[]=term&include[]=enrollments&enrollment_type=student&enrollment_state=active&per_page=50");
  if (!response.ok) throw new Error("Canvas courses are unavailable.");
  const courses: CanvasCourse[] = await response.json();
  const termCounts = new Map<string, number>();
  for (const course of courses) {
    const name = course.term?.name;
    if (name) termCounts.set(name, (termCounts.get(name) ?? 0) + 1);
  }
  const [mostCommon] = [...termCounts.entries()].sort((a, b) => b[1] - a[1]);
  return mostCommon ? courses.filter((course) => course.term?.name === mostCommon[0]) : courses;
}

export async function getCanvasClassCards() {
  const courses = await getCanvasCourses();
  return courses.map((course) => {
    const enrollment = course.enrollments?.[0];
    return {
      id: course.id,
      name: course.name,
      courseCode: course.course_code || course.name,
      filterKey: course.name,
      professor: course.teachers?.[0]?.display_name ?? null,
      term: course.term?.name ?? null,
      currentScore: enrollment?.computed_current_score ?? enrollment?.grades?.current_score ?? null,
      currentGrade: enrollment?.computed_current_grade ?? enrollment?.grades?.current_grade ?? null,
    };
  });
}
