import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { IStaff } from '../../models/staff.interface';
import { AnalyticsService } from '../../providers/analytics.service';
import { ExcelService } from '../../providers/excel.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';

@Component({
    selector: 'excel-report-home',
    templateUrl: 'excel-report-home.component.html',
})
export class ExcelReportHomeComponent {

    staffsToSelect: IStaff[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        private analyticsService: AnalyticsService,
        private excelService: ExcelService,
        private alertCtrl: AlertController,
        private translateService: TranslateService,
        private userService: UserService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('excel-report');
    }

    exportSalesReportByOrder(): void {
        this.navCtrl.push('/order/export', { reportType: 0 });
    }

    exportSalesReportByProduct(): void {
        this.navCtrl.push('/order/export', { reportType: 1 });
    }

    exportSalesReportByCustomer(): void {
        this.navCtrl.push('/order/export', { reportType: 2 });
    }

    exportSalesReportByStaff(): void {
        this.navCtrl.push('/order/export', { reportType: 3 });
    }

    exportProductNotesReport(reportType: number): void {
        this.navCtrl.push('/product/export', { reportType });
    }

    async exportProductsReport(): Promise<void> {
        const fileName = 'products-report.xlsx';
        const loading = await this.navCtrl.loading();
        this.excelService.downloadProductsReport(fileName).then(async (url) => {
            this.analyticsService.logEvent('product-export-to-excel-success');
            await loading.dismiss();
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + url,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFileUrl(fileName, fileName, url);
        });
    }

    gotoPage(page) {
        this.navCtrl.push(page);
    }
}
