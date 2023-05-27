import { Injectable } from '@angular/core';


import { UserService } from './user.service';
import { ApiService } from './api.service';
import { IStaff } from '../models/staff.interface';
import { kebabToCamel } from './helper';

@Injectable()
export class StaffService {

    private static staffPermissions = {
        'has-full-access': [false],
        'can-create-order': [false],
        'hour-limit': [1, 'can-create-order'],
        'can-update-delete-order': [false],
        'update-status-except-done': [false],
        'can-create-update-debt': [false],
        'can-create-update-note': [false],
        'can-view-product-cost-price': [false],
        'can-update-product-cost-price': [false],
        'can-create-new-transaction': [false],
        'can-update-delete-transaction': [false],
        'can-manage-contacts': [false],
        'can-view-all-contacts': [false],
        'block-viewing-quantity': [false],
        'block-editing-order-price': [false],
    }

    selectedStaff: IStaff = null;
    hasChooseStaff = false;
    staffsToSelect: any[] = null;

    constructor(
        private apiService: ApiService,
        private userService: UserService
    ) {
    }

    permissionValue(name) {
        return this.selectedStaff != null ? this.selectedStaff[kebabToCamel(name)] : null;
    }

    getPermissionsKey() {
        return Object.keys(StaffService.staffPermissions);
    }

    getAllStaffPermissions() {
        return StaffService.staffPermissions;
    }

    getAllStaffPermissionProps() {
        const prop: any = {};
        for(const key of Object.keys(StaffService.staffPermissions)) {
            prop[key] = kebabToCamel(key);
        }
        return prop;
    }

    getAllTypesOfStaffPermissions() {
        const types = [];
        for(const key of Object.keys(StaffService.staffPermissions)) {
            types[key] = this.typeOfPermission(key);
        }
        return types;
    }

    typeOfPermission(name) {
        const itemAndValue = Object.keys(StaffService.staffPermissions).find(c => c === name);
        return typeof StaffService.staffPermissions[itemAndValue][0];
    }

    getStaffs(storeId = -1, shiftId = -1): Promise<IStaff[]> {
        const model: any = { table: 'staff' };
        if (this.selectedStaff) {
            model.staffId = this.selectedStaff.id.toString();
        }
        if (storeId != -1) {
            model.storeId = storeId;
        }
        if (shiftId != -1) {
            model.shiftId = shiftId;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    checkPermissions(): Promise<IStaff[]> {
        return this.apiService.get(this.userService.apiUrl + '/staff/CheckPermissions');
    }

    get(id: number): Promise<IStaff>  {
        return this.apiService.get(this.userService.apiUrl + '/data?table=staff&id=' + id);
    }

    saveStaff(staff: IStaff): Promise<number> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/staff/Save', staff).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                staff.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    deleteStaff(staff: IStaff): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/staff/remove?id=' + staff.id, null);
    }

    canAddUpdateProduct(): boolean {
        return !this.selectedStaff || this.selectedStaff.hasFullAccess || this.selectedStaff.canUpdateDeleteProduct;
    }

    isStaff(): boolean {
        return this.selectedStaff != null;
    }

    canCreateTrade(): boolean {
        return !this.selectedStaff || this.selectedStaff.hasFullAccess || this.selectedStaff.canCreateNewTransaction;
    }

    canUpdateDeleteTrade(): boolean {
        return !this.selectedStaff || this.selectedStaff.hasFullAccess || this.selectedStaff.canUpdateDeleteTransaction;
    }
}
