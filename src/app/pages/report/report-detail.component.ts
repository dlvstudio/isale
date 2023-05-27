import { ExcelColumn } from './../../models/excel-column.model';
import { ExcelRow } from './../../models/excel-row.model';
import { ExcelSheet } from './../../models/excel-sheet.model';
import { Chart } from './../../models/chart.model';
import { IChart } from './../../models/chart.interface';
import { IReportOutput } from './../../models/report-output.interface';
import { Report } from './../../models/report.model';
import { IReport } from './../../models/report.interface';
import { IContact } from './../../models/contact.interface';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { UserService } from '../../providers/user.service';
import { ContactService } from '../../providers/contact.service';
import { TradeService } from '../../providers/trade.service';
import { ReportService } from '../../providers/report.service';
import { ExcelService } from '../../providers/excel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { Helper } from '../../providers/helper.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'report-detail',
    templateUrl: 'report-detail.component.html',
})
export class ReportDetailComponent {
    @ViewChild('chart', { static: true }) chart: any;
    params: any = null;
    isCapturing = false;
    chartImg: any;
    report: IReport = new Report();
    contactReports = [];
    totalContact = 0;
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

    barChartLabels: string[] = [''];
    barChartType = 'bar';
    barChartLegend = true;

    barChartData: any[] = [{ data: [0] }];

    isInChartMode = false;
    isLoadingChart = false;

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private userService: UserService,
                private file: File,
                private reportService: ReportService,
                private actionSheetCtrl: ActionSheetController,
                private alertCtrl: AlertController,
                private excelService: ExcelService,
                private analyticsService: AnalyticsService,
    ) {
        const reloadReportHandle = (event) => {
            const report = event.detail;
            if (this.report && report.id === this.report.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadReport', reloadReportHandle);
        this.navCtrl.subscribe('reloadReport', reloadReportHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('report-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.currency = await this.userService.getAttr('current-currency');
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.reportService.getCustomReport(id, 'customer-report').then((report) => {
                this.report = report;
                this.doCalculate();
            });
        }
        else if (this.params && this.params.templateReport) {
            this.report = this.params.templateReport;
            this.doCalculate();
        }
    }

    doCalculate(): void {
        this.isLoadingChart = true;
        this.reportService.calculateReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
            this.contactReports = reportOutput.reports;
            this.totalContact = reportOutput.totalItem;
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

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    edit(): void {
        this.navCtrl.push('/report/add', { id: this.report.id });
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
                    text: this.translateService.instant('export.export-to-excel'),
                    handler: () => {
                        this.exportExcel();
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
                        this.reportService.deleteReport(this.report).then(async () => {
                            this.analyticsService.logEvent('report-detail-delete-success');
                            this.navCtrl.publish('reloadReportList');
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
        for (const report of this.contactReports) {
            barChartLabels.push(report.contact.fullName);
            source.data.push(report.value);
        }
        this.barChartLabels = barChartLabels;
        this.barChartData = [source];
    }

    enableChart(): void {
        this.isInChartMode = !this.isInChartMode;
    }

    selectReport(report: any) {
        this.navCtrl.push('/contact/detail', {
            id: report.contactId, tab: 'trade'
            , dateFrom: DateTimeService.toDbString(this.dateFrom, DateTimeService.getUiDateFormat())
            , dateTo: DateTimeService.toDbString(this.dateTo, DateTimeService.getUiDateFormat())
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
        const chart: IChart = new Chart;
        chart.dataType = 0;
        chart.dateType = this.report.dateType;
        if (chart.dateType != 3 && chart.dateType != 4) {
            chart.dateFrom = moment().startOf('year').format(DateTimeService.getDbFormat());
        }
        chart.dateTo = moment().endOf('day').format(DateTimeService.getDbFormat());
        chart.dataSources = JSON.stringify([this.report]);
        this.reportService.calculateChart(chart).then((data) => {
            this.navCtrl.push('/chart/detail', { chart, data });
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

    exportExcel(): void {
        const sheet: ExcelSheet = new ExcelSheet();
        let row: ExcelRow = new ExcelRow();
        row.addColumn(new ExcelColumn(this.translateService.instant('report.title')));
        sheet.addRow(row);

        if (this.dateFrom && this.dateTo) {
            row = new ExcelRow();
            const strFrom = this.translateService.instant('common.from');
            const strTo = this.translateService.instant('common.to');
            const str = `${this.dateType} ${strFrom} ${this.dateFrom} ${strTo} ${this.dateTo}`;
            row.addColumn(new ExcelColumn(str));
            sheet.addRow(row);
        }

        row = new ExcelRow();
        row.addColumn(new ExcelColumn(this.translateService.instant('export.contact')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.money')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.unit')));
        sheet.addRow(row);
        for (const report of this.contactReports) {
            row = new ExcelRow();
            row.addColumn(new ExcelColumn(report.contact.fullName));
            row.addColumn(new ExcelColumn(report.value, 'number'));
            row.addColumn(new ExcelColumn(this.currency));
            sheet.addRow(row);
        }
        const fileName = 'customer-report-' + this.report.id + '-' + Helper.getCurrentDate() + '.xlsx';
        this.excelService.exportExcel(sheet, fileName).then(async (content) => {
            if (this.navCtrl.isNotCordova()) {
                return;
            }
            const confirm = await this.alertCtrl.create({
                header: this.translateService.instant('common.confirm'),
                message: this.translateService.instant('report.file-save-alert') + this.file.externalDataDirectory + fileName,
                buttons: [
                    {
                        text: this.translateService.instant('common.agree'),
                        handler: () => {
                        }
                    }
                ]
            });
            await confirm.present();
            this.userService.shareFile(null, content);
        });
    }
}
