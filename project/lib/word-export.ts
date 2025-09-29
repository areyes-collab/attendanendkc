import { 
  Document, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle,
  HeadingLevel,
  TextRun,
  AlignmentType,
  WidthType,
  Packer
} from 'docx';
import { saveAs } from 'file-saver';

interface TeacherStats {
  name: string;
  onTime: number;
  late: number;
  absent: number;
  total: number;
  punctualityRate: number;
}

interface WeeklyData {
  week: string;
  onTime: number;
  late: number;
  absent: number;
}

export async function generateWordReport(
  stats: {
    totalScans: number;
    onTimeCount: number;
    lateCount: number;
    absentCount: number;
    earlyLeaveCount: number;
    punctualityRate: number;
  },
  teacherStats: TeacherStats[],
  weeklyData: WeeklyData[],
  dateRange: { start: string; end: string }
) {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 32,
            bold: true,
            color: '2E74B5'
          }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: '2E74B5'
          }
        }
      ]
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Attendance Report',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleString()}`,
                bold: true
              })
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date Range: ${dateRange.start} to ${dateRange.end}`,
                bold: true
              })
            ],
            spacing: { after: 400 }
          }),

          // Overview Statistics
          new Paragraph({
            text: 'Overview Statistics',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Metric', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Value', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Total Scans')] }),
                  new TableCell({ children: [new Paragraph({ text: stats.totalScans.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('On Time')] }),
                  new TableCell({ children: [new Paragraph({ text: stats.onTimeCount.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Late')] }),
                  new TableCell({ children: [new Paragraph({ text: stats.lateCount.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Absent')] }),
                  new TableCell({ children: [new Paragraph({ text: stats.absentCount.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Early Leave')] }),
                  new TableCell({ children: [new Paragraph({ text: stats.earlyLeaveCount.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Punctuality Rate')] }),
                  new TableCell({ children: [new Paragraph({ text: `${stats.punctualityRate}%`, alignment: AlignmentType.RIGHT })] })
                ]
              })
            ]
          }),

          // Teacher Performance
          new Paragraph({
            text: 'Teacher Performance',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Name', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'On Time', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Late', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Absent', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Total', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Rate', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } })
                ]
              }),
              ...teacherStats.map(teacher => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(teacher.name)] }),
                  new TableCell({ children: [new Paragraph({ text: teacher.onTime.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: teacher.late.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: teacher.absent.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: teacher.total.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: `${teacher.punctualityRate}%`, alignment: AlignmentType.RIGHT })] })
                ]
              }))
            ]
          }),

          // Weekly Trends
          new Paragraph({
            text: 'Weekly Trends',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Week', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'On Time', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Late', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } }),
                  new TableCell({ children: [new Paragraph({ text: 'Absent', alignment: AlignmentType.CENTER })], shading: { fill: 'E7E6E6' } })
                ]
              }),
              ...weeklyData.map(week => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(week.week)] }),
                  new TableCell({ children: [new Paragraph({ text: week.onTime.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: week.late.toString(), alignment: AlignmentType.RIGHT })] }),
                  new TableCell({ children: [new Paragraph({ text: week.absent.toString(), alignment: AlignmentType.RIGHT })] })
                ]
              }))
            ]
          })
        ]
      }
    ]
  });

  // Generate and save the document
  Packer.toBlob(doc).then((blob: Blob) => {
    saveAs(blob, `attendance_report_${dateRange.start}_to_${dateRange.end}.docx`);
  });
}