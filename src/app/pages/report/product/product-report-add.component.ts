import { IProduct } from './../../../models/product.interface';
import { IProductReport } from './../../../models/product-report.interface';
import { ProductReport } from './../../../models/product-report.model';
import { Component } from '@angular/core';
import { RouteHelperService } from '../../../providers/route-helper.service';
import { ModalController } from '@ionic/angular';
import { ReportService } from '../../../providers/report.service';
import { AnalyticsService } from '../../../providers/analytics.service';

@Component({
    selector: 'product-report-add',
    templateUrl: 'product-report-add.component.html',
})
export class ProductReportAddComponent {
    params: any = null;
    report: IProductReport = new ProductReport();
    selectedProducts: IProduct[] = [];
    ignoredProducts: IProduct[] = [];

    constructor(
        public navCtrl: RouteHelperService,
        private modalCtrl: ModalController,
        private reportService: ReportService,
        private analyticsService: AnalyticsService,
    ) {
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('product-report');
    }

    ngOnInit(): void {
        let reportId = 0;
        this.params = this.params ? this.params : this.navCtrl.getParams();
        if (this.params && this.params.id) {
            reportId = this.params.id;
        }

        if (reportId && reportId > 0) {
            this.reportService.getCustomReport(reportId, 'product-report').then((report) => {
                this.report = report;
                if (report.productListCustom && report.productListCustom !== '') {
                    this.selectedProducts = JSON.parse(report.productListCustom);
                }
                if (report.ignoredProducts && report.ignoredProducts !== '') {
                    this.ignoredProducts = JSON.parse(report.ignoredProducts);
                }
            });
        }
    }

    save(): void {
        this.reportService.saveCustomReport(this.report, 'product-report').then(async (id: number) => {
            this.analyticsService.logEvent('product-report-add-save-success');
            this.report.id = id;
            this.exitPage();
        });
    }

    async exitPage() {
        await this.navCtrl.popOnly();
        if (!this.params || !this.params.id) {
            await this.navCtrl.push('/product-report/detail', { id: this.report.id });
        }
        this.navCtrl.publish('reloadReportList');
        this.navCtrl.publish('reloadProductReport', this.report);
    }

    async showSearchProduct(isSelected: boolean = true) {
        const callback = (data) => {
            const product = data;
            if (product) {
                if (isSelected) {
                    const idx = this.selectedProducts.findIndex(item => item.id === product.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.selectedProducts.push(product);
                    this.report.productListCustom = JSON.stringify(this.selectedProducts);
                } else {
                    const idx = this.ignoredProducts.findIndex(item => item.id === product.id);
                    if (idx >= 0) {
                        return;
                    }
                    this.ignoredProducts.push(product);
                    this.report.ignoredProducts = JSON.stringify(this.ignoredProducts);
                }
            }
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    removeIgnoredProduct(product: IProduct) {
        const idx = this.ignoredProducts.findIndex(item => item.id === product.id);
        if (idx >= 0) {
            this.ignoredProducts.splice(idx, 1);
            this.report.ignoredProducts = JSON.stringify(this.ignoredProducts);
        }
    }

    removeSelectedProduct(product: IProduct) {
        const idx = this.selectedProducts.findIndex(item => item.id === product.id);
        if (idx >= 0) {
            this.selectedProducts.splice(idx, 1);
            this.report.productListCustom = JSON.stringify(this.selectedProducts);
        }
    }
}
