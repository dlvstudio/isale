import { IChart } from './chart.interface';
export class Chart implements IChart{
    id = 0;
    name = '';
    // 0: so sánh, 1: xu hướng, 2: so sánh + xu hướng
    chartType = 0;
    // 0: line, 1: bar, 2: pie
    chartView = 0;
    dateType = 0;
    dateFrom = '';
    dateTo = '';
    // 0: report, 1: category
    dataType = 0;
    dataSources = '';
}