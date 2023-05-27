export interface IDebtReport {
    id: number;
    name: string;
    // 0: for customer, 1: for category, 2: for produc
    reportType: number;
    // 0: borrow who, 1: who borrow, 2: own who, 3: who own
    debtType: number;
    dateType: number;
    dateFrom: string;
    dateTo: string;
    // 0: hiện toàn bộ, 1: tùy chọn
    customListType: number;
    customList: string;
    // 0: không loại ai cả, 1: tùy chọn
    ignore: number;
    ignoredList: string;
    genderType: number;
    ageType: number;
    ageFrom: number;
    ageTo: number;
    createdAt: string;
    modifiedAt: string;
}