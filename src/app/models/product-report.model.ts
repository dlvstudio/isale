import { IProductReport } from './product-report.interface';
export class ProductReport implements IProductReport{
    id: number = 0;
    name: string = '';
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType: number = 0;
    dateFrom: string = '';
    dateTo: string = '';
    // 0: hiện toàn bộ, 1: tùy chọn
    productListType: number = 0;
    productListCustom: string = '';
    // 0: không loại ai cả, 1: tùy chọn
    ignoreProduct: number = 0;
    ignoredProducts: string = '';
    createdAt: string = '';
    modifiedAt: string = '';
}