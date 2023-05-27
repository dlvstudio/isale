import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Helper } from './helper.service';
import { ExcelColumn } from './../models/excel-column.model';
import { ExcelRow } from './../models/excel-row.model';
import { ExcelSheet } from './../models/excel-sheet.model';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { RouteHelperService } from './route-helper.service';
import { StaffService } from './staff.service';

declare let JSZip: any;
declare let saveAs: any;
declare let cordova: any;

@Injectable()
export class ExcelService {

    private files: { [filePath: string]: string } = {};

    constructor(
        private http: HttpClient,
        private file: File,
        private apiService: ApiService,
        private userService: UserService,
        private staffService: StaffService,
        private navCtrl: RouteHelperService,
    ) {
    }

    async uploadReceivedNoteFile(file: any, storeId: number): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.uploadWithPost(this.userService.apiUrl + '/excel/UploadReceivedNote', file, lang, storeId, staffId);
    }

    async uploadOrdersFile(file: any, storeId: number): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.uploadWithPost(this.userService.apiUrl + '/excel/UploadOrders', file, lang, storeId, staffId);
    }

    async uploadProductsFile(file: any, storeId: number, isMaterial = false): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        const link = isMaterial ? 'UploadMaterials' : 'UploadProducts';
        return this.apiService.uploadWithPost(this.userService.apiUrl + '/excel/' + link, file, lang, storeId, staffId);
    }

    async getSalesReport(orderIds: number[], reportType: number, staffId: number, dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {dateFrom, dateTo, reportType, lang, storeId, orderIds};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        if (staffId) {
            data.staffId = staffId;
        }
        return this.apiService.post(this.userService.apiUrl + '/excel/SalesReport', data);
    }

    async getProductReport(reportType: number, productId: number, dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {dateFrom, dateTo, reportType, lang, productId, storeId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/excel/ProductReport', data);
    }

    async uploadContactsFile(file: any, storeId: number): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.uploadWithPost(this.userService.apiUrl + '/excel/UploadContacts', file, lang, storeId, staffId);
    }

    async createReceivedNoteFile(fileName: string, noteId): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang, productId: noteId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/CreateReceivedNoteFile', data, fileName);
    }

    async createTransferNoteFile(fileName: string, noteId): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang, productId: noteId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/CreateTransferNoteFile', data, fileName);
    }

    async downloadPdf(filename, html: any, size = 6): Promise<any> {
        const data: any = {html , size};
        return await this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/PdfConvertShare', data, filename);
    }

    async downloadExcelOrderReport(orderIds: number[], fileName: string, reportType: number, staffId: number,
                                   dateFrom: string = '', dateTo: string = '', storeId = 0): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {dateFrom, dateTo, reportType, lang, storeId, orderIds};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        if (staffId) {
            data.staffId = staffId;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/DownloadSalesReportExcel', data, fileName);
    }

    async downloadReceivedNoteTemplate(fileName: string): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/ReceivedTemplate', data, fileName);
    }

    async downloadOrderTemplate(fileName: string): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/CreateOrdersTemplate', data, fileName);
    }

    async downloadProductsTemplate(fileName: string, isMaterial = false): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        if (isMaterial) {
            data.isMaterial = isMaterial;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/ProductsTemplate', data, fileName);
    }

    async downloadContactsTemplate(fileName: string): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/ContactsTemplate', data, fileName);
    }

    async downloadExcelInventoryReport(fileName: string, productId: number, reportType: number,
                                       dateFrom: string = '', dateTo: string = '', storeId): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {dateFrom, dateTo, reportType, lang, productId, storeId};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/inventory', data, fileName);
    }

    async downloadProductsReport(fileName: string, isMaterial = false): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        if (isMaterial) {
            data.isMaterial = isMaterial;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/products', data, fileName);
    }

    async downloadContactsReport(fileName: string): Promise<any> {
        const lang = await this.userService.getAttr('current-language');
        const data: any = {lang};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.downloadWithPost(this.userService.apiUrl + '/excel/contacts', data, fileName);
    }

    createSheetData(rows: any[]) {
        const sheet: ExcelSheet = new ExcelSheet();
        for (const rowObj of rows) {
            const excelRow = new ExcelRow();
            const row = rowObj as any[];
            for (const obj of row) {
                let col = obj as ExcelColumn;
                if (typeof obj === 'object') {
                    excelRow.addColumn(col);
                } else if (typeof obj === 'number') {
                    col = new ExcelColumn(obj + '', 'number');
                    excelRow.addColumn(col);
                } else {
                    const str = obj as string;
                    col = new ExcelColumn(str);
                    excelRow.addColumn(col);
                }
            }
            sheet.addRow(excelRow);
        }
        return sheet;
    }

    exportExcel(sheet: ExcelSheet, fileName?: string): Promise<string> {
        return new Promise((r, j) => {
            const zip = new JSZip();
            zip.folder('_rels');
            zip.folder('docProps');
            zip.folder('xl');
            zip.folder('xl').folder('_rels');
            zip.folder('xl').folder('theme');
            zip.folder('xl').folder('worksheets');
            const arrReadFile = [];
            arrReadFile.push(this.GetFile('[Content_Types].xml', 'assets/excel/_Content_Types_.xml'));
            arrReadFile.push(this.GetFile('_rels/.rels', 'assets/excel/rels/x.rels'));
            arrReadFile.push(this.GetFile('docProps/app.xml', 'assets/excel/docProps/app.xml'));
            arrReadFile.push(this.GetFile('docProps/core.xml', 'assets/excel/docProps/core.xml'));
            arrReadFile.push(this.GetFile('xl/styles.xml', 'assets/excel/xl/styles.xml'));
            arrReadFile.push(this.GetFile('xl/workbook.xml', 'assets/excel/xl/workbook.xml'));
            arrReadFile.push(this.GetFile('xl/_rels/workbook.xml.rels', 'assets/excel/xl/rels/workbook.xml.rels'));
            arrReadFile.push(this.GetFile('xl/theme/theme1.xml', 'assets/excel/xl/theme/theme1.xml'));
            Promise.all(arrReadFile).then(() => {
                zip.file('[Content_Types].xml', this.files['[Content_Types].xml']);

                zip.folder('_rels').file('.rels', this.files['_rels/.rels']);

                zip.folder('docProps').file('app.xml', this.files['docProps/app.xml']);
                zip.folder('docProps').file('core.xml', this.files['docProps/core.xml']);

                zip.folder('xl').file('styles.xml', this.files['xl/styles.xml']);
                zip.folder('xl').file('workbook.xml', this.files['xl/workbook.xml']);

                zip.folder('xl').folder('_rels').file('workbook.xml.rels', this.files['xl/_rels/workbook.xml.rels']);

                zip.folder('xl').folder('theme').file('theme1.xml', this.files['xl/theme/theme1.xml']);

                zip.folder('xl').folder('worksheets').file('sheet1.xml', sheet.toStr());
                if (this.navCtrl.isNotCordova()) {
                    zip.generateAsync({ type: 'blob' })
                        .then((content) => {
                            // see FileSaver.js
                            saveAs(content, fileName);
                            r(content);
                        });
                    return;
                }
                const self = this;
                zip.generateAsync({ type: 'base64' })
                    .then((content) => {
                        const ret = 'data:application/' + fileName + ';base64,' + content;
                        const imgWithMeta = ret.split(',');
                        // base64 data
                        const imgData = imgWithMeta[1].trim();
                        // content type
                        const imgType = imgWithMeta[0].trim().split(';')[0].split(':')[1];

                        // this.fs is correctly set to cordova.file.externalDataDirectory
                        // tslint:disable-next-line:no-string-literal
                        self.file.resolveLocalFilesystemUrl(cordova['file']['externalDataDirectory']).then((dirEntry) => {
                            const nativeURL = dirEntry.toURL();
                            Helper.savebase64AsImageFile(nativeURL, fileName, imgData, imgType);
                        }, (err) => {
                            console.error(err);
                        });
                        r(ret);
                    }, (err1) => {
                        console.error(err1);
                    });
            }, (err) => {
                console.error(err);
            });
        });

    }

    private GetFile(filePath, fileUrl): Promise<any> {
        return new Promise((r, j) => {
            const option = {
                responseType: 'text' as 'json'
            };
            this.http.get(fileUrl, option)
                .subscribe(res => {
                    this.files[filePath] = res as string;
                    r(true);
                }, (err) => {
                    console.error(err);
                });
        });
    }

    async convertPdf(html: string, size = 5): Promise<any> {
        const data: any = {html, size};
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/excel/PdfConvert', data);
    }
}
