import { ExcelColumn } from './../../../models/excel-column.model';
import { ExcelRow } from './../../../models/excel-row.model';
import { ExcelSheet } from './../../../models/excel-sheet.model';
import { Chart } from './../../../models/chart.model';
import { IChart } from './../../../models/chart.interface';
import { IReportOutput } from './../../../models/report-output.interface';
import { ProductReport } from './../../../models/product-report.model';
import { IProductReport } from './../../../models/product-report.interface';
import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { UserService } from '../../../providers/user.service';
import { ReportService } from '../../../providers/report.service';
import { ExcelService } from '../../../providers/excel.service';
import { Helper } from '../../../providers/helper.service';
import { DateTimeService } from '../../../providers/datetime.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'product-report-detail',
    templateUrl: 'product-report-detail.component.html',
})
export class ProductReportDetailComponent {
    @ViewChild('chart', { static: true }) chart: any;
    params: any = null;
    isCapturing = false;
    chartImg: any;
    report: IProductReport = new ProductReport();
    productReports = [];
    totalProduct = 0;
    totalValue = 0;
    dateType = '';
    dateFrom = '';
    dateTo = '';
    filter = '';
    currentMoment: moment.Moment = moment();
    currency: string;
    isLoadingChart = false;

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

    constructor(public navCtrl: RouteHelperService,
                public translateService: TranslateService,
                private file: File,
                private userService: UserService,
                private reportService: ReportService,
                private actionSheetCtrl: ActionSheetController,
                private alertCtrl: AlertController,
                private excelService: ExcelService,
                private analyticsService: AnalyticsService,
    ) {
        const reloadProductReportHandle = (event) => {
            const report = event.detail;
            if (this.report && report.id === this.report.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadProductReport', reloadProductReportHandle);
        this.navCtrl.subscribe('reloadProductReport', reloadProductReportHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-report-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.userService.getAttr('current-currency').then((currency) => {
            this.currency = currency;
        });
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            this.reportService.getCustomReport(id, 'product-report').then((report) => {
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
        this.reportService.calculateProductReport(this.report, this.currentMoment).then((reportOutput: IReportOutput) => {
            this.productReports = reportOutput.reports;
            this.totalProduct = reportOutput.totalItem;
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

    edit(): void {
        this.navCtrl.push('/product-report/add', { id: this.report.id });
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
                        this.reportService.deleteProductReport(this.report).then(async () => {
                            this.analyticsService.logEvent('product-report-detail-delete-success');
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
        for (const report of this.productReports) {
            barChartLabels.push(Helper.productName(report.product.code, report.product.title));
            source.data.push(report.value);
        }
        this.barChartLabels = barChartLabels;
        this.barChartData = [source];
    }

    enableChart(): void {
        this.isInChartMode = !this.isInChartMode;
    }

    selectReport(report: any) {
        this.navCtrl.push('/product/detail', {
            id: report.productId, tab: 'trade'
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
        chart.dataType = 2;
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

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    exportExcel(): void {
        const sheet: ExcelSheet = new ExcelSheet();
        let row: ExcelRow = new ExcelRow();
        row.addColumn(new ExcelColumn(this.translateService.instant('report-product.title')));
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
        row.addColumn(new ExcelColumn(this.translateService.instant('export.product')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.money')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.quantity')));
        row.addColumn(new ExcelColumn(this.translateService.instant('export.unit')));
        sheet.addRow(row);
        for (const report of this.productReports) {
            row = new ExcelRow();
            row.addColumn(new ExcelColumn(Helper.productName(report.product.code, report.product.title)));
            row.addColumn(new ExcelColumn(report.value, 'number'));
            row.addColumn(new ExcelColumn(report.quantity, 'number'));
            row.addColumn(new ExcelColumn(this.currency));
            sheet.addRow(row);
        }
        const fileName = 'product-report-' + Helper.getCurrentDate() + '.xlsx';
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
