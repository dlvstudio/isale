import { IDebtReport } from './debt-report.interface';
export class DebtReport implements IDebtReport{
    id: number = 0;
    name: string = '';
    // 0: for customer, 1: for category, 2: for product
    reportType: number = 0;
    // 0: borrow who, 1: who borrow, 2: own who, 3: who own
    debtType: number = 0;
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType: number = 0;
    dateFrom: string = '';
    dateTo: string = '';
    // 0: hiện toàn bộ, 1: tùy chọn
    customListType: number = 0;
    customList: string = '';
    // 0: không loại ai cả, 1: tùy chọn
    ignore: number = 0;
    ignoredList: string = '';
    // FOR report type = 0 - customer
    // 0: hiện toàn bộ, 1: nam, 2: nữ
    genderType: number = 0;
    // 0: hiện toàn bộ, 1: tùy chọn (theo năm), 2: tùy chọn (theo số tuổi)
    ageType: number = 0;
    ageFrom: number = 0;
    ageTo: number = 0;
    
    createdAt: string = '';
    modifiedAt: string = '';
}