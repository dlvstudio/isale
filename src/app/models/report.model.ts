import { IReport } from './report.interface';
export class Report implements IReport{
    id: number = 0;
    name: string = '';
    // 0: trong tuần, 1: trong tháng, 2: trong năm, 3: trong ngày, 4: tùy chọn, 5: trong quý
    dateType: number = 0;
    dateFrom: string = '';
    dateTo: string = '';
    // 0: hiện toàn bộ, 1: tùy chọn
    contactListType: number = 0;
    contactListCustom: string = '';
    // 0: không loại ai cả, 1: tùy chọn
    ignoreContact: number = 0;
    ignoredContacts: string = '';
    // 0: hiện toàn bộ, 1: nam, 2: nữ
    genderType: number = 0;
    // 0: hiện toàn bộ, 1: tùy chọn (theo năm), 2: tùy chọn (theo số tuổi)
    ageType: number = 0;
    ageFrom: number = 0;
    ageTo: number = 0;
    createdAt: string = '';
    modifiedAt: string = '';
}