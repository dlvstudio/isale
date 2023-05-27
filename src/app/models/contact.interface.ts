import { IStaff } from './staff.interface';
export interface IContact {
    id: number;
    code: string;
    staffId: number;
    businessTypeId: number;
    salesLineId: number;
    avatarUrl: string;
    fullName: string;
    mobile: string;
    isImportant: boolean;
    gender: string;
    email: string;
    address: string;
    dateOfBirth: string;
    lastActive: string;
    lastAction: string;
    onlineId: number;
    staff: IStaff;
    businessType: any;
    salesLine: any;
    point: number;
    levelId: number;
    level: any;
    buyCount: number;
    fbUserId: string;
    source: string;
}