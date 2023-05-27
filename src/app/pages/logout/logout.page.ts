import { Component } from '@angular/core';
import { UserService } from '../../providers/user.service';
import { StaffService } from '../../providers/staff.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { StoreService } from '../../providers/store.service';
import { FcmTokenService } from '../../providers/fcmtoken.service';

@Component({
    selector: 'logout',
    templateUrl: 'logout.page.html',
})
export class LogoutPage {
    username = '';
    password = '';
    hasNoUser = false;

    constructor(public navCtrl: RouteHelperService,
                private userService: UserService,
                private staffService: StaffService,
                private storeService: StoreService,
                private fcmTokenService: FcmTokenService,
                private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('logout');
    }

    logout(): void {
        this.userService.removeRefreshToken().then(async () => {
            this.analyticsService.logEvent('logout-successfully');
            await this.storeService.exitStore();
            await this.fcmTokenService.removeLoggedTokens();
            this.userService.setLoggedUser(null, false);
            this.staffService.hasChooseStaff = false;
            this.staffService.selectedStaff = null;
            this.staffService.staffsToSelect = null;
            const arr = [];
            arr.push(this.userService.removeAttr('current-currency'));
            arr.push(this.userService.removeAttr('current-language'));
            arr.push(this.userService.removeAttr('date-format'));
            arr.push(this.userService.removeLastBackup());
            arr.push(this.userService.removeLastLogin());
            arr.push(this.userService.removeOutstock());
            arr.push(this.userService.removeAttr('time-format'));
            await Promise.all(arr);
            await this.userService.removeRefreshToken();
            this.navCtrl.navigateRoot('/login');
        });
    }

    close(): void {
        this.navCtrl.pop();
    }
}
