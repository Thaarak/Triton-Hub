import { useState, useEffect } from 'react';
import './App.css';

const TOKEN_STORAGE_KEY = 'canvas_token';
const CANVAS_URL_STORAGE_KEY = 'canvas_url';

const CANVAS_UCSD_URL = 'https://canvas.ucsd.edu';

/** Base URL for Canvas API requests. Use proxy in dev to avoid CORS. */
function getCanvasApiBase(canvasUrl: string): string {
  const normalized = canvasUrl.replace(/\/$/, '');
  const isUcsd = normalized === CANVAS_UCSD_URL || normalized.includes('canvas.ucsd.edu');
  if (import.meta.env.DEV && isUcsd) {
    return '/canvas-api';
  }
  return normalized;
}

interface CourseGrade {
  id: number;
  name: string;
  courseCode: string;
  currentScore: number | null;
  finalScore: number | null;
  currentGrade: string | null;
  finalGrade: string | null;
  gradesUrl: string | null;
}

interface AssignmentItem {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  name: string;
  dueAt: string | null;
  pointsPossible: number | null;
  score: number | null;
  submittedAt: string | null;
  workflowState: string | null;
  htmlUrl: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  message: string;
  postedAt: string | null;
  contextCode: string;
  htmlUrl: string;
  courseName?: string;
}

interface ClassItem {
  id: number;
  name: string;
  courseCode: string;
  professor: string | null;
  term: string | null;
}

type TabId = 'grades' | 'assignments' | 'announcements' | 'classes';

function App() {
  const [canvasUrl, setCanvasUrl] = useState(CANVAS_UCSD_URL);
  const [accessToken, setAccessToken] = useState('');
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [grades, setGrades] = useState<CourseGrade[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[] | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[] | null>(null);
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('grades');
  const [loading, setLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = () => ({
    Authorization: `Bearer ${accessToken}`,
  });

  // Restore token/URL from sessionStorage on load
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUrl = sessionStorage.getItem(CANVAS_URL_STORAGE_KEY);
      if (stored) setAccessToken(stored);
      if (storedUrl) setCanvasUrl(storedUrl);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist token/URL when they change
  useEffect(() => {
    try {
      if (accessToken) sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      if (canvasUrl) sessionStorage.setItem(CANVAS_URL_STORAGE_KEY, canvasUrl);
    } catch {
      /* ignore */
    }
  }, [accessToken, canvasUrl]);



  const fetchUserData = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }
    setLoading(true);
    setError(null);
    setUserData(null);
    const base = getCanvasApiBase(canvasUrl);
    const apiUrl = `${base}/api/v1/users/self`;
    fetch(apiUrl, { headers: headers() })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchGrades = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }
    setGradesLoading(true);
    setError(null);
    setGrades(null);
    const base = getCanvasApiBase(canvasUrl);
    const url = `${base}/api/v1/courses?include[]=total_scores&enrollment_type=student&enrollment_state=active&per_page=50`;
    type CourseJson = Array<{
      id: number;
      name: string;
      course_code: string;
      enrollments?: Array<{
        type: string;
        grades?: {
          html_url?: string;
          current_score?: number | null;
          final_score?: number | null;
          current_grade?: string | null;
          final_grade?: string | null;
        };
        computed_current_score?: number | null;
        computed_final_score?: number | null;
        computed_current_grade?: string | null;
        computed_final_grade?: string | null;
      }>;
    }>;
    const toProxyUrl = (url: string) => {
      if (!import.meta.env.DEV || !url.includes('canvas.ucsd.edu')) return url;
      try {
        const u = new URL(url);
        return `${window.location.origin}/canvas-api${u.pathname}${u.search}`;
      } catch {
        return url;
      }
    };
    const fetchPage = (pageUrl: string): Promise<CourseJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((courses: CourseJson) =>
          nextUrl ? fetchPage(nextUrl).then((next) => [...courses, ...next]) : courses
        );
      });
    fetchPage(url).then((courses) => {
      const result: CourseGrade[] = courses.map((course) => {
        const enrollment = course.enrollments?.[0];
        const g = enrollment?.grades;
        const currentScore = enrollment?.computed_current_score ?? g?.current_score ?? null;
        const finalScore = enrollment?.computed_final_score ?? g?.final_score ?? null;
        const currentGrade = enrollment?.computed_current_grade ?? g?.current_grade ?? null;
        const finalGrade = enrollment?.computed_final_grade ?? g?.final_grade ?? null;
        return {
          id: course.id,
          name: course.name,
          courseCode: course.course_code ?? '',
          currentScore: currentScore != null ? currentScore : null,
          finalScore: finalScore != null ? finalScore : null,
          currentGrade: currentGrade ?? null,
          finalGrade: finalGrade ?? null,
          gradesUrl: g?.html_url ?? null,
        };
      });
      setGrades(result);
      setActiveTab('grades');
      setGradesLoading(false);
    }).catch((err: Error) => {
      setError(err.message);
      setGradesLoading(false);
    });
  };

  const fetchAnnouncements = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }
    setAnnouncementsLoading(true);
    setError(null);
    setAnnouncements(null);
    const base = getCanvasApiBase(canvasUrl);
    const toProxyUrl = (url: string) => {
      if (!import.meta.env.DEV || !url.includes('canvas.ucsd.edu')) return url;
      try {
        const u = new URL(url);
        return `${window.location.origin}/canvas-api${u.pathname}${u.search}`;
      } catch {
        return url;
      }
    };
    type CourseJson = Array<{ id: number; name: string }>;
    const coursesUrl = `${base}/api/v1/courses?enrollment_type=student&enrollment_state=active&per_page=50`;
    const fetchCoursesPage = (pageUrl: string): Promise<CourseJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((courses: CourseJson) =>
          nextUrl ? fetchCoursesPage(nextUrl).then((next) => [...courses, ...next]) : courses
        );
      });
    type AnnJson = Array<{
      id: number;
      title: string;
      message: string;
      posted_at: string | null;
      context_code: string;
      html_url?: string;
    }>;
    const fetchAnnPage = (pageUrl: string): Promise<AnnJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((data: AnnJson) =>
          nextUrl ? fetchAnnPage(nextUrl).then((next) => [...data, ...next]) : data
        );
      });
    fetchCoursesPage(coursesUrl)
      .then((courses) => {
        const contextCodes = courses.map((c) => `course_${c.id}`);
        const courseMap = new Map(courses.map((c) => [c.id, c.name]));
        const params = new URLSearchParams();
        contextCodes.forEach((code) => params.append('context_codes[]', code));
        const url = `${base}/api/v1/announcements?${params.toString()}&per_page=50`;
        return fetchAnnPage(url).then((list) =>
          list.map((a) => ({
            id: a.id,
            title: a.title,
            message: a.message ?? '',
            postedAt: a.posted_at,
            contextCode: a.context_code,
            htmlUrl: a.html_url ?? '#',
            courseName: courseMap.get(parseInt(a.context_code.replace('course_', ''), 10)),
          }))
        );
      })
      .then((result) => {
        result.sort((a, b) => {
          const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
          const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
          return tb - ta;
        });
        setAnnouncements(result);
        setActiveTab('announcements');
        setAnnouncementsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setAnnouncementsLoading(false);
      });
  };

  const fetchClasses = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }
    setClassesLoading(true);
    setError(null);
    setClasses(null);
    const base = getCanvasApiBase(canvasUrl);
    const url = `${base}/api/v1/courses?enrollment_type=student&enrollment_state=active&include[]=teachers&include[]=term&per_page=50`;
    const toProxyUrl = (url: string) => {
      if (!import.meta.env.DEV || !url.includes('canvas.ucsd.edu')) return url;
      try {
        const u = new URL(url);
        return `${window.location.origin}/canvas-api${u.pathname}${u.search}`;
      } catch {
        return url;
      }
    };
    type CourseJson = Array<{
      id: number;
      name: string;
      course_code: string;
      teachers?: Array<{ display_name: string }>;
      term?: { name: string };
    }>;
    const fetchPage = (pageUrl: string): Promise<CourseJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((courses: CourseJson) =>
          nextUrl ? fetchPage(nextUrl).then((next) => [...courses, ...next]) : courses
        );
      });
    fetchPage(url)
      .then((courses) => {
        // Map all courses with term info
        const allClasses: ClassItem[] = courses.map((course) => ({
          id: course.id,
          name: course.name,
          courseCode: course.course_code ?? '',
          professor: course.teachers?.[0]?.display_name ?? null,
          term: course.term?.name ?? null,
        }));

        // Find the most common term
        const termCounts = new Map<string, number>();
        allClasses.forEach((cls) => {
          if (cls.term) {
            termCounts.set(cls.term, (termCounts.get(cls.term) || 0) + 1);
          }
        });

        let mostCommonTerm: string | null = null;
        let maxCount = 0;
        termCounts.forEach((count, term) => {
          if (count > maxCount) {
            maxCount = count;
            mostCommonTerm = term;
          }
        });

        // Filter to only show classes from the most common term
        const filteredClasses = mostCommonTerm
          ? allClasses.filter((cls) => cls.term === mostCommonTerm)
          : allClasses;

        setClasses(filteredClasses);
        setActiveTab('classes');
        setClassesLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setClassesLoading(false);
      });
  };

  const fetchAssignments = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }
    setAssignmentsLoading(true);
    setError(null);
    setAssignments(null);
    const base = getCanvasApiBase(canvasUrl);
    const toProxyUrl = (url: string) => {
      if (!import.meta.env.DEV || !url.includes('canvas.ucsd.edu')) return url;
      try {
        const u = new URL(url);
        return `${window.location.origin}/canvas-api${u.pathname}${u.search}`;
      } catch {
        return url;
      }
    };
    type CourseJson = Array<{ id: number; name: string; course_code: string }>;
    const coursesUrl = `${base}/api/v1/courses?enrollment_type=student&enrollment_state=active&per_page=50`;
    const fetchCoursesPage = (pageUrl: string): Promise<CourseJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((courses: CourseJson) =>
          nextUrl ? fetchCoursesPage(nextUrl).then((next) => [...courses, ...next]) : courses
        );
      });
    type AssignmentJson = Array<{
      id: number;
      name: string;
      due_at: string | null;
      points_possible: number | null;
      html_url: string;
      course_id: number;
      submission?: {
        score: number | null;
        submitted_at: string | null;
        workflow_state: string;
      };
    }>;
    const fetchAssignmentsPage = (pageUrl: string): Promise<AssignmentJson> =>
      fetch(toProxyUrl(pageUrl), { headers: headers() }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const link = res.headers.get('Link');
        const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
        const nextUrl = nextMatch?.[1];
        return res.json().then((data: AssignmentJson) =>
          nextUrl ? fetchAssignmentsPage(nextUrl).then((next) => [...data, ...next]) : data
        );
      });
    fetchCoursesPage(coursesUrl)
      .then((courses) => {
        const promises = courses.map((course) => {
          const url = `${base}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=50&order_by=due_at`;
          return fetchAssignmentsPage(url).then((assigns) =>
            assigns.map((a) => ({
              id: a.id,
              courseId: a.course_id,
              courseName: course.name,
              courseCode: course.course_code ?? '',
              name: a.name,
              dueAt: a.due_at,
              pointsPossible: a.points_possible,
              score: a.submission?.score ?? null,
              submittedAt: a.submission?.submitted_at ?? null,
              workflowState: a.submission?.workflow_state ?? null,
              htmlUrl: a.html_url,
            }))
          );
        });
        return Promise.all(promises).then((arrays) => {
          const flat = arrays.flat();
          flat.sort((a, b) => {
            if (!a.dueAt) return 1;
            if (!b.dueAt) return -1;
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
          });
          return flat;
        });
      })
      .then((result) => {
        setAssignments(result);
        setActiveTab('assignments');
        setAssignmentsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setAssignmentsLoading(false);
      });
  };

  const formatDue = (dueAt: string | null) => {
    if (!dueAt) return '—';
    const d = new Date(dueAt);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPosted = (postedAt: string | null) => {
    if (!postedAt) return '—';
    const d = new Date(postedAt);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const assignmentsWithDue = (assignments ?? []).filter((a) => a.dueAt != null);
  const incompleteAssignments = assignmentsWithDue.filter(
    (a) => !['submitted', 'graded'].includes(a.workflowState ?? '')
  );
  const completedAssignments = assignmentsWithDue.filter((a) =>
    ['submitted', 'graded'].includes(a.workflowState ?? '')
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'classes', label: 'Classes' },
    { id: 'grades', label: 'Grades' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'announcements', label: 'Announcements' },
  ];

  const renderAssignmentTable = (rows: AssignmentItem[], emptyMsg: string) => {
    if (rows.length === 0) return <p className="muted">{emptyMsg}</p>;
    return (
      <table className="grades-table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Assignment</th>
            <th>Due</th>
            <th>Points</th>
            <th>Score</th>
            <th>Status</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.courseId}-${row.id}`}>
              <td>
                <span className="course-name">{row.courseName}</span>
                {row.courseCode && <span className="course-code"> ({row.courseCode})</span>}
              </td>
              <td>{row.name}</td>
              <td>{formatDue(row.dueAt)}</td>
              <td>{row.pointsPossible != null ? row.pointsPossible : '—'}</td>
              <td>{row.score != null ? row.score : '—'}</td>
              <td>{row.workflowState ?? '—'}</td>
              <td>
                <a href={row.htmlUrl} target="_blank" rel="noopener noreferrer">Open</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container">
      <h1>Canvas – UCSD</h1>
      <p className="subtitle">
        Generate a personal access token from{' '}
        <a href={`${CANVAS_UCSD_URL}/profile/settings`} target="_blank" rel="noopener noreferrer">Canvas → Settings → Approved Integrations</a>{' '}
        and paste it below.
      </p>

      <div className="form">
        <input
          type="text"
          placeholder="Canvas URL"
          value={canvasUrl}
          onChange={(e) => setCanvasUrl(e.target.value)}
        />
        <input
          type="password"
          placeholder="Access Token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
        <div className="form-actions">
          <button onClick={fetchUserData} disabled={loading}>
            {loading ? 'Loading...' : 'User Info'}
          </button>
          <button onClick={fetchClasses} disabled={classesLoading}>
            {classesLoading ? 'Loading...' : 'Get Classes'}
          </button>
          <button onClick={fetchGrades} disabled={gradesLoading}>
            {gradesLoading ? 'Loading...' : 'Get Grades'}
          </button>
          <button onClick={fetchAssignments} disabled={assignmentsLoading}>
            {assignmentsLoading ? 'Loading...' : 'Get Assignments'}
          </button>
          <button onClick={fetchAnnouncements} disabled={announcementsLoading}>
            {announcementsLoading ? 'Loading...' : 'Get Announcements'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <nav className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="tab-panel">
        {activeTab === 'classes' && (
          <>
            {classes && classes.length > 0 && (
              <div className="grades-section">
                <h2>Your Classes</h2>
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Code</th>
                      <th>Professor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>{cls.name}</td>
                        <td>{cls.courseCode}</td>
                        <td>{cls.professor ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {classes && classes.length === 0 && !classesLoading && (
              <p className="muted">No classes found. Click &quot;Get Classes&quot; to load.</p>
            )}
            {!classes && !classesLoading && (
              <p className="muted">Click &quot;Get Classes&quot; to load your classes.</p>
            )}
          </>
        )}

        {activeTab === 'grades' && (
          <>
            {grades && grades.length > 0 && (
              <div className="grades-section">
                <h2>Your Grades</h2>
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Code</th>
                      <th>Current Score</th>
                      <th>Final Score</th>
                      <th>Current Grade</th>
                      <th>Final Grade</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.courseCode}</td>
                        <td>{row.currentScore != null ? row.currentScore : '—'}</td>
                        <td>{row.finalScore != null ? row.finalScore : '—'}</td>
                        <td>{row.currentGrade ?? '—'}</td>
                        <td>{row.finalGrade ?? '—'}</td>
                        <td>
                          {row.gradesUrl ? (
                            <a href={row.gradesUrl} target="_blank" rel="noopener noreferrer">Grades</a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {grades && grades.length === 0 && !gradesLoading && (
              <p className="muted">No courses with grades. Click &quot;Get Grades&quot; to load.</p>
            )}
            {!grades && !gradesLoading && (
              <p className="muted">Click &quot;Get Grades&quot; to load your course grades.</p>
            )}
          </>
        )}

        {activeTab === 'assignments' && (
          <div className="grades-section assignments-section">
            <section className="assignment-block">
              <h2>Due – Incomplete</h2>
              <p className="section-desc">Assignments with a due date that are not yet submitted or graded.</p>
              {assignmentsLoading ? (
                <p className="muted">Loading assignments...</p>
              ) : (
                renderAssignmentTable(incompleteAssignments, 'No incomplete assignments with a due date.')
              )}
            </section>
            <section className="assignment-block">
              <h2>Due – Completed</h2>
              <p className="section-desc">Assignments with a due date that you have submitted or that are graded.</p>
              {assignmentsLoading ? null : (
                renderAssignmentTable(completedAssignments, 'No completed assignments with a due date.')
              )}
            </section>
            {assignments && assignments.length > 0 && assignmentsWithDue.length === 0 && !assignmentsLoading && (
              <p className="muted">No assignments have a due date. Showing all would list undated ones.</p>
            )}
            {!assignments && !assignmentsLoading && (
              <p className="muted">Click &quot;Get Assignments&quot; to load assignments (only those with due dates are shown).</p>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="announcements-section">
            <h2>Announcements</h2>
            {announcementsLoading ? (
              <p className="muted">Loading announcements...</p>
            ) : announcements && announcements.length > 0 ? (
              <ul className="announcements-list">
                {announcements.map((a) => (
                  <li key={a.id} className="announcement-card">
                    <div className="announcement-header">
                      <a href={a.htmlUrl} target="_blank" rel="noopener noreferrer" className="announcement-title">
                        {a.title}
                      </a>
                      {a.courseName && <span className="announcement-course">{a.courseName}</span>}
                    </div>
                    <time className="announcement-date">{formatPosted(a.postedAt)}</time>
                    {a.message && (
                      <div
                        className="announcement-message"
                        dangerouslySetInnerHTML={{ __html: a.message.substring(0, 300) + (a.message.length > 300 ? '…' : '') }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                {announcements && announcements.length === 0
                  ? 'No announcements found.'
                  : 'Click &quot;Get Announcements&quot; to load announcements.'}
              </p>
            )}
          </div>
        )}
      </div>

      {userData && (
        <div className="user-data">
          <h2>User Data</h2>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;