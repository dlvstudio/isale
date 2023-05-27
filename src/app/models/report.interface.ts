export interface IReport {
    id: number;
    name: string;    
    dateType: number;
    dateFrom: string;
    dateTo: string;
    contactListType: number;
    contactListCustom: string;
    ignoreContact: number;
    ignoredContacts: string;
    genderType: number;
    ageType: number;
    ageFrom: number;
    ageTo: number;
    createdAt: string;
    modifiedAt: string;
}