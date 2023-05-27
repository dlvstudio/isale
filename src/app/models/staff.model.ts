import { IStaff } from './staff.interface';
export class Staff implements IStaff {
    hourLimit = 1;
    storeId = 0;
    store: any = null;
    isCollaborator = false;
    shiftId = 0;
    shift: any = null;
    blockViewingQuantity = false;
    id = 0;
    avatarUrl = '';
    name = '';
    userName = '';
    shopName = '';
    createdAt = '';
    hasFullAccess = false;
    canCreateOrder = false;
    canUpdateDeleteOrder = false;
    canCreateNewTransaction = false;
    canUpdateDeleteTransaction = false;
    canCreateUpdateNote = false;
    canCreateUpdateDebt = false;
    canUpdateDeleteProduct = false;
    canViewProductCostPrice = false;
    canUpdateProductCostPrice = false;
    canViewAllContacts = false;
    canManageContacts = false;
    updateStatusExceptDone = false;
    blockEditingOrderPrice = false;

    constructor(id: number = 0, avatarUrl: string = '', name: string = '', userName: string = '') {
        this.id = id;
        this.avatarUrl = avatarUrl;
        this.name = name;
        this.userName = userName;
    }
}