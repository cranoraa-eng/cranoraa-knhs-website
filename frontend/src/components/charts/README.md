# Data Visualization Components

Chart components built with Recharts for responsive, accessible data visualization.

## Components

### LineChartComponent
Responsive line chart with multiple series support.

**Features:**
- Multiple line series
- Configurable axes and legend
- Hover tooltips with data details
- Custom colors
- Empty state handling
- Smooth animations

**Usage:**
```jsx
import { LineChartComponent } from '@/components/charts';

const data = [
  { name: 'Q1', math: 85, science: 90, english: 88 },
  { name: 'Q2', math: 88, science: 92, english: 90 },
  { name: 'Q3', math: 90, science: 94, english: 92 },
  { name: 'Q4', math: 92, science: 95, english: 94 },
];

const lines = [
  { dataKey: 'math', name: 'Math', color: '#7c3aed' },
  { dataKey: 'science', name: 'Science', color: '#3b82f6' },
  { dataKey: 'english', name: 'English', color: '#10b981' },
];

<LineChartComponent
  data={data}
  lines={lines}
  xAxisKey="name"
  xAxisLabel="Quarter"
  yAxisLabel="Grade"
  showLegend={true}
  showGrid={true}
  height={300}
  formatYAxis={(value) => `${value}%`}
/>
```

### BarChartComponent
Vertical and horizontal bar charts with value labels.

**Features:**
- Vertical and horizontal layouts
- Multiple bar series
- Optional value labels on bars
- Configurable colors
- Handles negative values
- Empty state handling

**Usage:**
```jsx
import { BarChartComponent } from '@/components/charts';

const data = [
  { name: 'Student A', score: 95 },
  { name: 'Student B', score: 88 },
  { name: 'Student C', score: 92 },
];

const bars = [
  { dataKey: 'score', name: 'Score', color: '#7c3aed' },
];

<BarChartComponent
  data={data}
  bars={bars}
  xAxisKey="name"
  yAxisLabel="Score"
  layout="vertical"
  showValueLabels={true}
  height={300}
/>

// Horizontal layout
<BarChartComponent
  data={data}
  bars={bars}
  xAxisKey="name"
  layout="horizontal"
  showValueLabels={true}
  height={300}
/>
```

### AttendanceCalendar
Month grid calendar with attendance status heatmap.

**Features:**
- Color-coded attendance status
- Present (green), Absent (red), Late (amber), Excused (blue), Holiday (purple)
- Color-blind friendly with icons
- Click handler for day details
- Month/year navigation
- Today highlight
- Responsive sizing

**Usage:**
```jsx
import { AttendanceCalendar } from '@/components/charts';

const attendanceData = [
  { date: '2026-07-01', status: 'present' },
  { date: '2026-07-02', status: 'present' },
  { date: '2026-07-03', status: 'late' },
  { date: '2026-07-04', status: 'absent' },
  { date: '2026-07-05', status: 'present' },
];

<AttendanceCalendar
  attendanceData={attendanceData}
  year={2026}
  month={6} // July (0-indexed)
  onDayClick={(date, status) => {
    console.log('Clicked:', date, status);
  }}
  onMonthChange={(year, month) => {
    console.log('Month changed:', year, month);
  }}
/>
```

**Status Types:**
- `present` - Green with ✓
- `absent` - Red with ✗
- `late` - Amber with ⚠
- `excused` - Blue with E
- `holiday` - Purple with ★

### ChartTableToggle
Toggle between chart and table views with persistent preference.

**Features:**
- Switch between chart and table
- Persistent localStorage preference
- Screen reader accessible
- Smooth transitions
- Responsive design

**Usage:**
```jsx
import { ChartTableToggle, LineChartComponent } from '@/components/charts';

const data = [
  { quarter: 'Q1', grade: 85 },
  { quarter: 'Q2', grade: 88 },
  { quarter: 'Q3', grade: 90 },
];

const columns = [
  { key: 'quarter', label: 'Quarter' },
  { 
    key: 'grade', 
    label: 'Grade',
    render: (row) => `${row.grade}%`
  },
];

const chartView = (
  <LineChartComponent
    data={data}
    lines={[{ dataKey: 'grade', name: 'Grade' }]}
    xAxisKey="quarter"
  />
);

<ChartTableToggle
  chartView={chartView}
  data={data}
  columns={columns}
  storageKey="grade-trend-view"
  defaultView="chart"
  title="Grade Trends"
/>
```

## Grade Color Utilities

Color-coded grade visualization with color-blind friendly patterns.

### getGradeStatus
Get grade status classification.

```jsx
import { getGradeStatus } from '@/components/charts';

const status = getGradeStatus(92); // 'excellent'
```

**Status Thresholds:**
- `excellent`: 95-100
- `good`: 90-94
- `passing`: 75-89
- `warning`: 60-74
- `failing`: 0-59
- `incomplete`: null/undefined

### getGradeConfig
Get complete configuration for a grade.

```jsx
import { getGradeConfig } from '@/components/charts';

const config = getGradeConfig(92);
// {
//   color: 'bg-green-500',
//   textColor: 'text-green-700',
//   lightBg: 'bg-green-50',
//   label: 'Excellent',
//   icon: '★',
//   ...
// }
```

### getGradeBadgeClasses
Get Tailwind classes for grade badge.

```jsx
import { getGradeBadgeClasses } from '@/components/charts';

<span className={`px-3 py-1 rounded-full ${getGradeBadgeClasses(92, 'light')}`}>
  92
</span>
```

**Variants:**
- `light` - Light background (default)
- `solid` - Solid dark background
- `outline` - White background with colored border

### formatGrade
Format grade with icon and label.

```jsx
import { formatGrade } from '@/components/charts';

const grade = formatGrade(92, { showIcon: true, showLabel: true, decimals: 1 });
// {
//   value: 92,
//   status: 'excellent',
//   config: {...},
//   formatted: '92.0 (Excellent)',
//   icon: '★'
// }
```

### compareGrades
Compare two grades and get trend.

```jsx
import { compareGrades, getGradeTrendIcon } from '@/components/charts';

const comparison = compareGrades(92, 85);
// { trend: 'up', difference: 7, percentage: 8.24 }

const icon = getGradeTrendIcon(comparison.trend); // '↑'
```

### getGradeStatistics
Get statistics for an array of grades.

```jsx
import { getGradeStatistics } from '@/components/charts';

const stats = getGradeStatistics([85, 90, 88, 92, 87]);
// {
//   count: 5,
//   min: 85,
//   max: 92,
//   average: 88.4,
//   median: 88,
//   passing: 5,
//   failing: 0
// }
```

## Grade Badge Component Example

```jsx
import { getGradeBadgeClasses, getGradeIcon } from '@/components/charts';

function GradeBadge({ grade }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getGradeBadgeClasses(grade, 'light')}`}>
      <span aria-hidden="true">{getGradeIcon(grade)}</span>
      {grade}
    </span>
  );
}
```

## Accessibility

All chart components follow WCAG 2.1 AA guidelines:
- Proper ARIA roles and labels
- Screen reader accessible table fallback
- Color-blind friendly with icons/patterns
- Keyboard navigation support
- Sufficient color contrast
- Focus indicators

### Chart-to-Table for Accessibility
Use `ChartTableToggle` to provide table alternative for charts:
- Screen readers can read tabular data
- Users can toggle between visual and tabular views
- Preference persists in localStorage

## Responsive Design

All charts are fully responsive:
- ResponsiveContainer adapts to parent width
- Mobile-friendly touch interactions
- Readable on all screen sizes
- Configurable heights

## Customization

### Custom Colors
```jsx
const lines = [
  { dataKey: 'math', name: 'Math', color: '#7c3aed' },
  { dataKey: 'science', name: 'Science', color: '#3b82f6' },
];
```

### Custom Formatters
```jsx
<LineChartComponent
  formatYAxis={(value) => `${value}%`}
  formatTooltip={(value) => `Score: ${value}`}
  formatLabel={(value) => `${value} pts`}
/>
```

### Custom Empty State
```jsx
<LineChartComponent
  data={[]}
  emptyState={
    <div className="text-center py-12">
      <p>No grade data available yet</p>
      <button>Load Data</button>
    </div>
  }
/>
```

## Requirements
- React 18.2+
- Recharts 3.8+
- Tailwind CSS 3.3+
- Framer Motion 12.40+

## Implementation Status

✅ Task 10.1 - LineChart component  
✅ Task 10.2 - BarChart component  
✅ Task 10.3 - AttendanceCalendar heatmap  
✅ Task 10.4 - Grade color visualization utility  
✅ Task 10.5 - Chart-to-table toggle  

## Integration Examples

### Grade Trend Chart
```jsx
import { LineChartComponent, ChartTableToggle } from '@/components/charts';

function GradeTrends({ studentId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchGradeTrends(studentId).then(setData);
  }, [studentId]);

  return (
    <ChartTableToggle
      chartView={
        <LineChartComponent
          data={data}
          lines={[
            { dataKey: 'math', name: 'Math' },
            { dataKey: 'science', name: 'Science' },
          ]}
          xAxisKey="quarter"
          yAxisLabel="Grade"
        />
      }
      data={data}
      columns={[
        { key: 'quarter', label: 'Quarter' },
        { key: 'math', label: 'Math' },
        { key: 'science', label: 'Science' },
      ]}
      storageKey="student-grade-trends"
      title="Grade Trends"
    />
  );
}
```

### Class Performance Chart
```jsx
import { BarChartComponent } from '@/components/charts';
import { getGradeBadgeClasses } from '@/components/charts';

function ClassPerformance({ classId }) {
  const [data, setData] = useState([]);

  return (
    <BarChartComponent
      data={data}
      bars={[{ dataKey: 'average', name: 'Average Grade' }]}
      xAxisKey="student"
      yAxisLabel="Grade"
      showValueLabels={true}
      formatLabel={(value) => `${value}%`}
    />
  );
}
```

### Attendance Heatmap
```jsx
import { AttendanceCalendar } from '@/components/charts';

function StudentAttendance({ studentId }) {
  const [attendance, setAttendance] = useState([]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6);

  useEffect(() => {
    fetchAttendance(studentId, year, month).then(setAttendance);
  }, [studentId, year, month]);

  return (
    <AttendanceCalendar
      attendanceData={attendance}
      year={year}
      month={month}
      onDayClick={(date, status) => showAttendanceDetails(date)}
      onMonthChange={(y, m) => {
        setYear(y);
        setMonth(m);
      }}
    />
  );
}
```
