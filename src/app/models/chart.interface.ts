export interface IChart {
    id: number;
    name: string;
    // 0: so sánh, 1: xu hướng, 2: so sánh + xu hướng
    chartType: number;
    // 0: line, 1: bar, 2: pie
    chartView: number;
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType: number;
    dateFrom: string;
    dateTo: string;
    // 0: report, 1: category
    dataType: number;
    dataSources: string;
}