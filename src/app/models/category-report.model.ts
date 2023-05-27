import { ICategoryReport } from './category-report.interface';
export class CategoryReport implements ICategoryReport{
    createdAt = '';
    modifiedAt = '';
    id = 0;
    name = '';
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType = 0;
    dateFrom = '';
    dateTo = '';
    // 0: hiện toàn bộ, 1: tùy chọn
    categoryListType = 0;
    categoryListCustom = '';
    // 0: không loại ai cả, 1: tùy chọn
    ignoreCategory = 0;
    ignoredCategories = '';
}