import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AlertController, Platform } from '@ionic/angular';
import { Contacts } from '@capacitor-community/contacts';
import * as _ from 'lodash';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { RouteHelperService } from '../../providers/route-helper.service';
import { UserService } from '../../providers/user.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { ExcelService } from '../../providers/excel.service';


@Component({
    selector: 'contact',
    templateUrl: 'contact.component.html'
})
export class ContactComponent {
    presentItemActions = {
        'contact.new-note': ['/note/add', (item) => {
            this.navCtrl.navigateForward('/note/add', { contact: item.id });
        }],
        'contact.new-trade': ['/trade/add', (item) => {
            this.navCtrl.navigateForward('/trade/add', { contact: item.id });
        }],
    };

    segmentValues = [
        ['all',
            ['icon', 'people'],
            ['filter',
                ['fullName', 'asc']]],
        ['important',
            ['icon', 'star'],
            ['filter',
                ['isImportant', 'true'],
                ['fullName', 'asc']]],
        ['recent',
            ['icon', 'time'],
            ['filter',
                ['lastActive', 'not null and empty'],
                ['limit', 50],
                ['lastActive', 'desc']]],
    ];
    itemTemplate = {
        h2: {
            valueFunc: 'fullname and code',
        },
        pList: [
            {
                field: 'mobile'
            }, {
                short: 'level.title',
            }, {
                short: 'point',
                valueFunc: (item) => item.point + ' ' + this.translateService.instant('point-add.point'),
            }, {
                field: 'address'
            }, {
                short: 'staff.name',
                icon: {
                    name: 'person-outline',
                    slot: 'start'
                },
            }, {
                short: 'business-type.title',
            }, {
                short: 'sales-line.title',
            }, {
                field: 'last-action',
                filterValue: 'recent',
                style: 'font-size: 0.8em;',
                icon: {
                    nameFunc: (item) => this.actionIcon(item.lastAction)
                },
                valueFunc: (item) => this.dateFormat(item.lastActive),
            }
        ]
    };

    searchFields = ['fullName', 'code', 'mobile', 'address', 'staff.name', 'businessType.title', 'salesLine.title'];

    filterObjects = {
        staff: {
            field: 'name'
        },
        'business-type': {
            field: 'title'
        },
        'sales-line': {
            field: 'title'
        }
    };

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    constructor(
        private navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private platform: Platform,
        private userService: UserService,
        private excelService: ExcelService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController,
    ) {
    }

    exportContacts = async () => {
        const fileName = 'contacts-export.xlsx';
        const loading = await this.navCtrl.loading();
        this.excelService.downloadContactsReport(fileName).then(async (url) => {
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

    import = async (objects) => {
        if (this.platform.is('capacitor') || this.platform.is('cordova')) {
            await Contacts.getPermissions();
        }
        const isGranted = (this.platform.is('capacitor') || this.platform.is('cordova'))
            ? await Contacts.getPermissions()
            : true;
        if (!isGranted) {
            return;
        }
        const temp = {
            contacts: []
        };
        const result = this.platform.is('capacitor')
            ? (await Contacts.getContacts())
            : temp;
        if (!result || !result.contacts || !result.contacts.length) {
            alert(this.translateService.instant('contact.no-contacts-to-load'))
            return;
        }
        const arr = [];
        for (const contact of result.contacts) {
            let exists = false;
            for (const isaleContact of objects) {
                if (isaleContact.email && contact.emails && contact.emails.length && isaleContact.email === contact.emails[0].address) {
                    exists = true;
                    break;
                }
                if (isaleContact.mobile && contact.phoneNumbers && contact.phoneNumbers.length && isaleContact.mobile === contact.phoneNumbers[0].number) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                continue;
            }
            arr.push(contact);
        }
        this.navCtrl.push('/contact/mobile-import', { contacts: arr });
    }

    actions = [
        {
            hidden: () => false,
            path: '/contact/import',
            icon: 'document-attach',
            color: 'danger',
            title: 'contact.import-from-excel',
        },
        {
            hidden: () => false,
            click: this.exportContacts,
            isFaIcon: true,
            icon: 'file-excel',
            color: '#3880ff',
            title: 'contact.export-to-excel',
        },
        {
            hidden: () => false,
            click: this.import,
            icon: 'cloud-upload',
            color: 'success',
            title: 'contact.import-from-device',
        },
    ];
}
