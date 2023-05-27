import { IContact } from './contact.interface';
import { IStaff } from './staff.interface';
import { Staff } from './staff.model';
export class Contact implements IContact {
    id = 0;
    code = '';
    staffId = 0;
    businessTypeId = 0;
    salesLineId = 0;
    avatarUrl = '';
    fullName = '';
    mobile = '';
    isImportant = false;
    gender = '';
    email = '';
    address = '';
    dateOfBirth = '';
    lastActive = '';
    lastAction = '';
    onlineId = 0;
    staff: IStaff = new Staff();
    businessType: any = null;
    salesLine: any = null;
    point = 0;
    levelId = 0;
    level: any = null;
    buyCount = 0;
    fbUserId: string = null;
    source: string = null;

    constructor(id: number = 0, avatarUrl: string = '', fullName: string = '', mobile: string = '', isImportant: boolean = false) {
        this.id = id;
        this.avatarUrl = avatarUrl;
        this.fullName = fullName;
        this.mobile = mobile;
        this.isImportant = isImportant;
    }
}