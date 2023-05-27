import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { DataService } from './data.service';

@Injectable()
export class PlanService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private dataService: DataService,
        private staffService: StaffService) {
    }

    async isOnTrial(currentPlanInput = null, shopInput = null) {
        const currentPlan = currentPlanInput ? currentPlanInput : await this.getCurrentPlan();
        const shop = !shopInput
            ? await this.dataService.getFirstObject('shop')
            : shopInput;
        const shopCreatedAt = shop ? new Date(shop.createdAt) : null;
        let shopCreatedAtPlus6 = null;
        if (shopCreatedAt) {
            shopCreatedAtPlus6 = new Date(shop.createdAt);
            shopCreatedAtPlus6.setDate(shopCreatedAtPlus6.getDate() + 6);
        }
        const currentDateMinus6 = new Date();
        currentDateMinus6.setDate(currentDateMinus6.getDate() - 6);
        const isOnTrial = !currentPlan && shopCreatedAt && (shopCreatedAt >= currentDateMinus6);
        return isOnTrial;
    }

    getCurrentPlan(): Promise<any> {
        let url = this.userService.apiUrl + '/plan/GetCurrentPlan';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    checkProduct(): Promise<any> {
        let url = this.userService.apiUrl + '/plan/CheckProduct';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    checkOrder(): Promise<any> {
        let url = this.userService.apiUrl + '/plan/CheckOrder';
        if (this.staffService.selectedStaff) {
            url += '?staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }
}
