import { ProductReportDetailComponent } from './product-report-detail.component';
import { ProductReportAddComponent } from './product-report-add.component';
import { IProductReport } from './../../../models/product-report.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ReportService } from '../../../providers/report.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../../providers/datetime.service';
import { AnalyticsService } from '../../../providers/analytics.service';
import { Helper } from '../../../providers/helper.service';

@Component({
    selector: 'product-report',
    templateUrl: 'product-report.component.html'
})
export class ProductReportComponent {
    originalReports: IProductReport[];
    reports: IProductReport[];
    searchKey: string = '';

    constructor(
        private reportService: ReportService,
        private translateService: TranslateService,
        public navCtrl: RouteHelperService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadReportList', this.reload);
        this.navCtrl.subscribe('reloadReportList', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-report');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const reports = [await this.reportService.getCustomReport(1, 'product-report')];
        this.originalReports = JSON.parse(JSON.stringify(reports));
        this.reports = reports;
        this.filter();
    }

    openReportAdd(): void {
        this.navCtrl.push('/product-report/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('product-report-search');
        let reports: IProductReport[] = JSON.parse(JSON.stringify(this.originalReports));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            reports = reports.filter((item) => {
                return (item.name && item.name.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.reports = reports;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let reports: IProductReport[] = JSON.parse(JSON.stringify(this.originalReports));
        reports = this.sortByModifiedAt(reports);
        this.reports = reports;
    }

    sortByModifiedAt(reports: any[]): any[] {
        if (reports) {
            return _.orderBy(reports, ['modifiedAt'], ['desc']);
        }
        return null;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectReport(id: number): void {
        this.navCtrl.push('/product-report/detail', { id: id });
    }

    async deleteReport(report: IProductReport): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('report-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.reportService.deleteProductReport(report).then(async () => {
                            this.analyticsService.logEvent('product-report-delete-success');
                            let i = this.reports.findIndex(item => item.id == report.id);
                            if (i >= 0) {
                                this.reports.splice(i, 1);
                            }
                            i = this.originalReports.findIndex(item => item.id == report.id);
                            if (i >= 0) {
                                this.originalReports.splice(i, 1);
                            }
                        });
                    }
                },
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                }
            ]
        });
        await confirm.present();
    }

    async presentActionSheet(report: IProductReport) {
        let actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('report-detail.delete-report'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteReport(report);
                    }
                }, {
                    text: this.translateService.instant('report-category.view-detail'),
                    handler: () => {
                        this.selectReport(report.id);
                    }
                }, {
                    text: this.translateService.instant('common.cancel'),
                    role: 'cancel',
                    handler: () => {
                    }
                }
            ]
        });
        await actionSheet.present();
    }

    getDateType(report: IProductReport): string {
        if (report.dateType == 0) {
            return this.translateService.instant('report-category.by-week');
        }
        if (report.dateType == 1) {
            return this.translateService.instant('report-category.by-month');
        }
        if (report.dateType == 2) {
            return this.translateService.instant('report-category.by-year');
        }
        if (report.dateType == 3) {
            return this.translateService.instant('report-category.by-day');
        }
        if (report.dateType == 4) {
            return this.translateService.instant('report-category.custom');
        }
        if (report.dateType == 5) {
            return this.translateService.instant('report-category.by-quarter');
        }
        return '';
    }

    getFilter(report: IProductReport): string {
        let filter = '';

        if (report.productListType != 0 || report.ignoreProduct != 0) {
            if (filter != '') {
                filter += "; "
            }
            filter += this.translateService.instant("report-output.product-limited");
        }
        return filter;
    }
}
