import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class PlanService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService) {
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
