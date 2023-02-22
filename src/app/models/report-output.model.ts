import { IReportOutput } from './report-output.interface';
export class ReportOutput implements IReportOutput{
    id: number = 0;
    reports: any[] = [];
    totalItem: number = 0;
    totalValue: number = 0;
    dateType: string = '';
    week: number;
    year: number;
    month: number;
    date: string;
    quarter: number;
    dateFrom: string = '';
    dateTo: string = '';
    filter: string = '';
}