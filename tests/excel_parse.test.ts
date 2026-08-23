import ExcelJS from 'exceljs';

describe('Excel Parsing Logic (ExcelJS)', () => {
  it('should parse an Excel workbook in-memory and return headers and rawData', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');
    worksheet.addRow(['student_roll', 'subject', 'date', 'status', 'method', 'time_slot']);
    worksheet.addRow(['CS23B1024', 'Mathematics', '2026-06-01', 'present', 'manual', '09:00-10:00']);
    worksheet.addRow(['CS23B1025', 'Physics', '2026-06-01', 'absent', 'manual', '10:00-11:00']);

    const buffer = await workbook.xlsx.writeBuffer();

    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(buffer as ArrayBuffer);
    const readWorksheet = readWorkbook.worksheets[0];
    expect(readWorksheet.name).toBe('Attendance');

    const rawRows: any[][] = [];
    readWorksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rawRows.push(values.map(v => (v !== null && v !== undefined ? String(v) : '')));
    });

    expect(rawRows.length).toBe(3); // 1 header row + 2 data rows

    const headers = (rawRows[0] || []).map(h => String(h).trim()).filter(h => h !== '');
    expect(headers).toEqual(['student_roll', 'subject', 'date', 'status', 'method', 'time_slot']);

    const dataRows = rawRows.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, index) => {
        obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));

    expect(dataRows.length).toBe(2);
    expect(dataRows[0].student_roll).toBe('CS23B1024');
    expect(dataRows[0].subject).toBe('Mathematics');
    expect(dataRows[0].status).toBe('present');
    expect(dataRows[1].student_roll).toBe('CS23B1025');
    expect(dataRows[1].status).toBe('absent');
  });

  it('should ignore empty rows and columns in the workbook', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.addRow(['student_roll', 'subject', 'date', 'status', '']);
    worksheet.addRow(['CS23B1026', 'Chemistry', '2026-06-02', 'present', '']);
    worksheet.addRow(['', '', '', '', '']);
    worksheet.addRow(['CS23B1027', 'Biology', '2026-06-02', 'late', '']);

    const buffer = await workbook.xlsx.writeBuffer();

    const readWorkbook = new ExcelJS.Workbook();
    await readWorkbook.xlsx.load(buffer as ArrayBuffer);
    const readWorksheet = readWorkbook.worksheets[0];

    const rawRowsParsed: any[][] = [];
    readWorksheet.eachRow({ includeEmpty: true }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rawRowsParsed.push(values.map(v => (v !== null && v !== undefined ? String(v) : '')));
    });

    const headers = (rawRowsParsed[0] || []).map(h => String(h).trim()).filter(h => h !== '');
    expect(headers).toEqual(['student_roll', 'subject', 'date', 'status']);

    const dataRows = rawRowsParsed.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h, index) => {
        obj[h] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));

    expect(dataRows.length).toBe(2);
    expect(dataRows[0].student_roll).toBe('CS23B1026');
    expect(dataRows[1].student_roll).toBe('CS23B1027');
  });
});
