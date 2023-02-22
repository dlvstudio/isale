import { Injectable } from '@angular/core';


import { UserService } from './user.service';
import { ApiService } from './api.service';

@Injectable()
export class ActivityService {

    constructor(
        private apiService: ApiService,
        private userService: UserService) {
    }

    logActivity(activity: any): Promise<number> {
        return new Promise((r, j) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this.userService.loggedUser
            ? this.apiService.post(this.userService.apiUrl + '/activity/log', activity)
            : this.apiService.postNoToken(this.userService.apiUrl + '/activity/log', activity);
        });
    }
}
