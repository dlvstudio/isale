import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../providers/analytics.service';
import { ApiService } from '../../providers/api.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { StaffService } from '../../providers/staff.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'change-password',
    templateUrl: 'change-password.component.html',
})
export class ChangePasswordComponent {
    oldPassword = '';
    password = '';
    confirm = '';
    constructor(public navCtrl: RouteHelperService,
                private translateService: TranslateService,
                public userService: UserService,
                public apiService: ApiService,
                private alertCtrl: AlertController,
                private analyticsService: AnalyticsService,
                private staffService: StaffService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('change-password');
    }

    async changePassword(): Promise<void> {
        if (!this.oldPassword || this.oldPassword.trim() == '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('change-password.alert-old-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.password || this.password == '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('change-password.alert-new-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (!this.confirm || this.confirm == '') {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('change-password.alert-confirm-new-password-required'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        if (this.confirm !== this.password) {
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('change-password.alert-confirm-notmatch'),
                buttons: ['OK']
            });
            await alert.present();
            return;
        }
        const loading = await this.navCtrl.loading();
        this.apiService.changePassword(this.password, this.oldPassword).then(async (res) => {
            await loading.dismiss();
            if (!res) {
                const alert2 = await this.alertCtrl.create({
                    header: this.translateService.instant('common.alert'),
                    subHeader: this.translateService.instant('change-password.change-password-not-successfully'),
                    buttons: ['OK']
                });
                await alert2.present();
                return;
            }
            this.analyticsService.logEvent('change-password-successfully');
            const alert = await this.alertCtrl.create({
                header: this.translateService.instant('common.alert'),
                subHeader: this.translateService.instant('change-password.change-password-successfully'),
                buttons: ['OK']
            });
            await alert.present();
            await alert.onDidDismiss();
            this.navCtrl.pop();
            this.logout();
        });
    }

    logout(): void {
        this.userService.removeRefreshToken().then(async () => {
            this.analyticsService.logEvent('logout-successfully');
            this.userService.setLoggedUser(null);
            this.staffService.hasChooseStaff = false;
            this.staffService.selectedStaff = null;
            this.userService.getRefreshToken().then((token) => {
            });
            this.navCtrl.navigateRoot('/login');
        });
    }

    validate(str: string): boolean {
        return this.validateEmail(str) || this.validatePhonenumber(str);
    }

    validateEmail(mail): boolean {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
            return true;
        }
        return false;
    }

    validatePhonenumber(str: string): boolean {
        const phoneno = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        if (str.match(phoneno)) {
            return true;
        } else {
            return false;
        }
    }
}
