export interface IReportOutput {
    id: number;
    reports: any[];
    totalItem: number;
    totalValue: number;
    dateType: string;
    week: number;
    year: number;
    month: number;
    date: string;
    quarter: number;
    dateFrom: string;
    dateTo: string;
    filter: string;
}