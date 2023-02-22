import { ICategoryReport } from './category-report.interface';
export class CategoryReport implements ICategoryReport{
    id: number = 0;
    name: string = '';
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType: number = 0;
    dateFrom: string = '';
    dateTo: string = '';
    // 0: hiện toàn bộ, 1: tùy chọn
    categoryListType: number = 0;
    categoryListCustom: string = '';
    // 0: không loại ai cả, 1: tùy chọn
    ignoreCategory: number = 0;
    ignoredCategories: string = '';
    createdAt: string = '';
    modifiedAt: string = '';
}