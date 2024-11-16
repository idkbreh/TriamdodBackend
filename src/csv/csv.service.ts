import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

@Injectable()
export class CsvService implements OnModuleInit {
  private csvData: any[] = [];

  onModuleInit() {
    this.loadCsvData();
  }

  private loadCsvData() {
    const filePath = path.join(__dirname, '../../src/data/students.csv');
    fs.createReadStream(filePath)
    .pipe(csv({ headers: ['studentId', 'startna', 'firstname', 'secondname', 'birthdate', 'class', 'room', 'number'] }))
      .on('data', (data) => {
        //console.log(data);
        this.csvData.push(data);
      })
      .on('end', () => {
        //console.log('CSV file successfully processed');
      });
  }

  findStudent(studentId: string, birthdate: string): any {
    const student = this.csvData.find(
      (entry) => entry.studentId === studentId && entry.birthdate === birthdate
    );
    if (!student) {
      console.log('Student not found');
      return null;
    }
    return {
      ...student,
      firstname: student.firstname,
      secondname: student.secondname
    };
  }
}