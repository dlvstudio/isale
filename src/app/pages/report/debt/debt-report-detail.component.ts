import { Chart } from './../../../models/chart.model';
import { IChart } from './../../../models/chart.interface';
import { IContact } from './../../../models/contact.interface';
import { IReportOutput } from './../../../models/report-output.interface';
import { DebtReport } from './../../../models/debt-report.model';
import { IDebtReport } from './../../../models/debt-report.interface';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { UserService } from '../../../providers/user.service';
import { ReportService } from '../../../providers/report.service';
import { Helper } from '../../../providers/helper.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'debt-report-detail',
    templateUrl: 'debt-report-detail.component.html',
})
export class DebtReportDetailComponent {
    @ViewChild('chart', { static: true }) chart: any;
    params: any = null;
    isCapturing = false;
    chartImg: any;
    report: IDebtReport = new DebtReport();
    itemReports = [];
    totalItem = 0;
    totalValue = 0;
    dateType = '';
    dateFrom = '';
    dateTo = '';
    filter = '';
    currentMoment: moment.Moment = moment();
    currency: string;

    barChartOptions: any = {
        scaleShowVerticalLines: false,
        responsive: true,
        bezierCurve: false,
        onAnimationComplete: this.done
    };

    done(): void {

    }

    barChartLabels: string[] = [""];
    barChartType = 'bar';
    barChartLegend = true;

    barChartData: any[] = [{ data: [0] }];

    isInChartMode = false;
    isLoadingChart = false;

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private userService: UserService,
                private reportService: ReportService,
                private actionSheetCtrl: ActionSheetController,
                private alertCtrl: AlertController,
                private analyticsService: AnalyticsService,
    ) {
        const reloadDebtReportHandle = (event) => {
            const report = event.detail;
            if (this.report && report.id === this.report.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadDebtReport', reloadDebtReportHandle);
        this.navCtrl.subscribe('reloadDebtReport', reloadDebtReportHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('debt-report-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.params = this.params ? this.params : this.navCtrl.getParams();
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.reportService.getCustomReport(id, 'debt-report-' + this.params.debtType).then((report) => {
                this.report = report;
                this.doCalculate();
            });
        } else if (this.params && this.params.templateReport) {
            this.report = this.params.templateReport;
            this.doCalculate();
        }
    }

    doCalculate(): void {
        this.isLoadingChart = true;
        if (this.report.reportType == 0 || this.report.reportType == 2) {
            this.reportService.calculateDebtReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
                this.itemReports = reportOutput.reports;
                this.totalItem = reportOutput.totalItem;
                this.totalValue = reportOutput.totalValue;
                this.dateType = reportOutput.dateType;
                this.dateFrom = reportOutput.dateFrom;
                this.dateTo = reportOutput.dateTo;
                this.filter = reportOutput.filter;

                this.showChart();
                this.isInChartMode = true;
                this.isLoadingChart = false;
            });
        } else {
            this.reportService.calculateDebtCategoryReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
                this.itemReports = reportOutput.reports;
                this.totalItem = reportOutput.totalItem;
                this.totalValue = reportOutput.totalValue;
                this.dateType = reportOutput.dateType;
                this.dateFrom = reportOutput.dateFrom;
                this.dateTo = reportOutput.dateTo;
                this.filter = reportOutput.filter;

                this.showChart();
                this.isInChartMode = true;
                this.isLoadingChart = false;
            });
        }
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    edit(): void {
        this.navCtrl.push('/debt-report/add', { id: this.report.id, debtType: this.params.debtType });
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('report-detail.delete-report'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteReport();
                    }
                }, {
                    text: this.translateService.instant('report-detail.share'),
                    role: 'destructive',
                    handler: () => {
                        this.shareReport();
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

    async deleteReport(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('report-detail.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.reportService.deleteDebtReport(this.report).then(async () => {
                            this.analyticsService.logEvent('debt-report-detail-delete-success');
                            this.navCtrl.publish('reloadDebtReportList');
                            this.navCtrl.pop();
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

    showChart(): void {
        const source = { label: '', data: [] };
        const barChartLabels = [];
        for (const itemReport of this.itemReports) {
            if (this.report.reportType == 0) {
                barChartLabels.push(itemReport.item.fullName);
            } else if (this.report.reportType == 2) {
                barChartLabels.push(Helper.productName(itemReport.item.code, itemReport.item.title));
            }
            source.data.push(itemReport.value);
        }
        this.barChartLabels = barChartLabels;
        this.barChartData = [source];
    }

    enableChart(): void {
        this.isInChartMode = !this.isInChartMode;
    }

    selectReport(report: any) {
        if (this.report.reportType == 0) {
            this.navCtrl.push('/contact/detail', {
                id: report.itemId, tab: 'debt'
                , dateDebtFrom: DateTimeService.toDbString(this.dateFrom, DateTimeService.getUiDateFormat())
                , dateDebtTo: DateTimeService.toDbString(this.dateTo, DateTimeService.getUiDateFormat())
            });
            return;
        }
        if (this.report.reportType == 2) {
            this.navCtrl.push('/product/detail', {
                id: report.itemId, tab: 'debt'
                , dateDebtFrom: DateTimeService.toDbString(this.dateFrom, DateTimeService.getUiDateFormat())
                , dateDebtTo: DateTimeService.toDbString(this.dateTo, DateTimeService.getUiDateFormat())
            });
            return;
        }
        this.navCtrl.push('/trade-category/detail', {
            id: report.itemId, tab: 'debt'
            , dateDebtFrom: DateTimeService.toDbString(this.dateFrom, DateTimeService.getUiDateFormat())
            , dateDebtTo: DateTimeService.toDbString(this.dateTo, DateTimeService.getUiDateFormat())
        });
    }

    previousMoment(): void {
        this.currentMoment = moment(this.currentMoment).subtract(1, DateTimeService.dateTypeToDuration(this.report.dateType));
        this.doCalculate();
    }

    nextMoment(): void {
        this.currentMoment = moment(this.currentMoment).add(1, DateTimeService.dateTypeToDuration(this.report.dateType));
        this.doCalculate();
    }

    viewTrend(): void {
        const chart: IChart = new Chart();
        chart.dataType = this.report.reportType;
        chart.dateType = this.report.dateType;
        if (chart.dateType != 3 && chart.dateType != 4) {
            chart.dateFrom = moment().startOf('year').format(DateTimeService.getDbFormat());
        }
        chart.dateTo = moment().endOf('day').format(DateTimeService.getDbFormat());
        chart.dataSources = JSON.stringify([this.report]);
        this.reportService.calculateDebtChart(chart).then((data) => {
            this.navCtrl.push('/chart/detail', { chart, data, isDebtChart: true });
        });
    }

    shareReport(): void {
        this.isCapturing = true;
        this.chartImg = this.chart.nativeElement.toDataURL();
        this.userService.shareScreenshot().then(() => {
            this.isCapturing = false;
        }).catch(() => {
            this.isCapturing = false;
        });
    }
}
