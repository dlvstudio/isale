import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, IonContent, IonInput, IonText } from '@ionic/angular';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { callFBAPI, extractPhone } from '../../providers/helper';
import { DateTimeService } from '../../providers/datetime.service';
import { ContactService } from '../../providers/contact.service';
import { IProduct } from '../../models/product.interface';
import { CurrencyPipe } from '@angular/common';
import { UserService } from '../../providers/user.service';
import { ProductService } from '../../providers/product.service';
import { DataService } from '../../providers/data.service';

declare let FB;

@Component({
    selector: 'fb-message',
    templateUrl: 'fb-message.component.html'
})
export class FbMessageComponent {
    @ViewChild('messageInput', { static: false }) messageInput: IonInput;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    flow: any;
    profile: any;
    pageAccessToken: string;
    originals: any[];
    messages: any[];
    searchKey: any = '';
    currency: string;
    message: string;
    photo;
    fileToUpload: any;
    uploadDisabled = false;
    multiSelect = false;
    selectedAll = false;
    tab = 'all';

    constructor(
        private dataService: DataService,
        private omniChannelService: OmniChannelService,
        private userService: UserService,
        private contactService: ContactService,
        private productService: ProductService,
        private camera: Camera,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private analyticsService: AnalyticsService,
        private alertCtrl: AlertController,
        private currencyPipe: CurrencyPipe,
        private actionSheetController: ActionSheetController
    ) {
        this.navCtrl.unsubscribe('reloadFbMessages', this.reload);
        this.navCtrl.subscribe('reloadFbMessages', this.reload);
    }

    handleMessage = async (event) => {
        const message = event.detail;
        if (message && this.flow && message.fromUserId !== this.flow.fromUserId || message && this.flow && message.pageId !== this.flow.pageId || this.searchKey) {
            return;
        }
        if (this.originals) {
            this.originals.push(message);
        }
        if (this.messages) {
            this.messages.push(message);
        }
        setTimeout(async () => {
            this.content.scrollToBottom(300);
        }, 100);
        this.flow.lastMessage = message.message;
        this.flow.lastTimestamp = new Date();
        this.flow.lastMessageId = message.messageId;
        this.flow.isRead = true;
        this.flow.fromUser = true;
        this.flow.fromUserAvatarUrl = this.flow.fromUserAvatarUrl
            ? this.flow.fromUserAvatarUrl
            : this.profile
                ? this.profile.profile_pic
                : '';
        this.flow.fromUserName = this.flow.fromUserName
            ? this.flow.fromUserName
            : this.profile
                ? this.profile.name
                : '';
        await this.omniChannelService.saveFlow(this.flow);
        await this.omniChannelService.setRecentNotification(false);
    }

    ionViewWillLeave() {
        this.navCtrl.unsubscribe('fbmessage', this.handleMessage);
    }

    async ionViewWillEnter() {
        this.navCtrl.subscribe('fbmessage', this.handleMessage);
        await this.analyticsService.setCurrentScreen('fb-message');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.flow) {
            this.flow = data.flow;
        } else if (data && data.comment) {
            const comment = data.comment;
            const flows = await this.omniChannelService.getFlowsByFromUser(comment.fromUserId, comment.pageId);
            this.flow = {};
            this.flow.id = 0;
            this.flow.pageId = comment.pageId;
            this.flow.pageName = comment.pageName;
            this.flow.fromUserName = comment.fromUserName;
            this.flow.fromUserId = comment.fromUserId;
            if (flows && flows.length) {
                this.flow = flows[0];
            }
            this.originals = [];
            this.messages = [];
        }
        this.omniChannelService.getMessages(this.flow.fromUserId, this.flow.pageId).then(async (messages) => {
            this.flow.isRead = true;
            await this.omniChannelService.saveFlow(this.flow);
            await this.omniChannelService.updateNotificationsForFlow(this.flow);
            this.navCtrl.publish('reloadFbNotifications');
            let i = 0;
            for (const message of messages) {
                i++;
                const phone = extractPhone(message.message);
                if (phone) {
                    message.phone = phone;
                }
                if (!message.fromUser) {
                    continue;
                }
                // get top 10 message from bottom
                if (messages.length - 10 <= i) {
                    const products = await this.productService.getProductsByMessage(message.message);
                    if (products && products.length) {
                        message.products = products;
                    }
                }
            }
            this.originals = JSON.parse(JSON.stringify(messages));
            this.messages = messages;
            setTimeout(async () => {
                this.content.scrollToBottom(300);
                setTimeout(async () => {
                    await this.messageInput.setFocus();
                }, 500);
                await loading.dismiss();
            }, 100);
        });
    }

    selectPage(id): void {
        this.navCtrl.push('/fbpage/detail', { id });
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-messageflow-search');
        let messages: any[] = JSON.parse(JSON.stringify(this.originals));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            messages = messages.filter((item) => (
                item.message && Helper.stringSpecialContains(searchKey, item.message)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
                || item.fromUserId && Helper.stringSpecialContains(searchKey, item.fromUserId)
                || item.fromUserName && Helper.stringSpecialContains(searchKey, item.fromUserName)
                || item.pageName && Helper.stringSpecialContains(searchKey, item.pageName)
            ));
        }
        this.messages = messages;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    loginFacebook() {
        FB.login((response) => {
            if (response.status === 'connected') {   // Logged into your webpage and Facebook.
                this.readPages();
            } else {                                 // Not logged into your webpage or we are unable to tell.
                alert(this.translateService.instant('fb-page.login-fail-alert'));
            }

        }, { scope: 'public_profile,pages_show_list,pages_manage_metadata,pages_messaging,pages_manage_engagement,user_videos' });
    }

    async readPages() {
        const sentMessage = {
            message: this.message,
            pageId: this.flow.pageId,
            pageName: this.flow.pageName,
            fromUserId: this.flow.fromUserId,
            fromUser: false,
            fromUserAvatarUrl: null,
            fromUserName: null,
            photoUrl: this.photo,
            messageId: ''
        }
        this.originals.push(sentMessage);
        this.messages.push(sentMessage);
        this.message = '';
        setTimeout(() => {
            this.content.scrollToBottom(300);
        }, 100);
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            return;
        }
        for (const pageItem of response.data) {
            if (this.flow.pageId !== pageItem.id) {
                continue;
            }
            this.pageAccessToken = pageItem.access_token;
            if (!this.profile) {
                const profile = await callFBAPI('/' + this.flow.fromUserId, "GET",
                    {
                        access_token: this.pageAccessToken,
                        fields: 'name,profile_pic'
                    });
                if (profile) {
                    this.profile = profile;
                }
            }

            const response2 = await callFBAPI('/' + this.flow.pageId + '/messages', "POST",
                {
                    access_token: this.pageAccessToken,
                    message: { text: sentMessage.message },
                    recipient: { id: this.flow.fromUserId }
                });
            if (!response2 || !response2.message_id) {
                alert(this.translateService.instant('fb-page.login-fail-alert'));
                return;
            }
            if (this.photo) {
                const response3 = await callFBAPI('/' + this.flow.pageId + '/messages', "POST",
                    {
                        access_token: this.pageAccessToken,
                        message: {
                            attachment: {
                                type: "IMAGE",
                                payload: { url: this.photo },
                            }
                        },
                        recipient: { id: this.flow.fromUserId }
                    });
                if (!response3 || !response3.message_id) {
                    alert(this.translateService.instant('fb-page.login-fail-alert'));
                    return;
                }
                this.photo = null;
            }
            sentMessage.messageId = response2.message_id;
            sentMessage.fromUserAvatarUrl = this.profile ? this.profile.profile_pic : '';
            sentMessage.fromUserName = this.profile ? this.profile.name : '';
            this.flow.lastMessage = sentMessage.message;
            this.flow.lastTimestamp = new Date();
            this.flow.lastMessageId = response2.message_id;
            this.flow.photoUrl = this.photo;
            this.flow.isRead = true;
            this.flow.fromUser = false;
            this.flow.fromUserAvatarUrl = this.profile ? this.profile.profile_pic : '';
            this.flow.fromUserName = this.profile ? this.profile.name : '';
            await this.omniChannelService.saveMessage(sentMessage);
            await this.omniChannelService.saveFlow(this.flow);
            break;
        }
    }

    dateFormat(date: string): string {
        const now = date ? moment(date) : moment();
        let dateChanged = date;
        if (!date || date.indexOf(':00Z') < 0) {
            dateChanged = now.format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
    }

    enterMessage() {
        FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
                this.readPages();
            } else if (response.status === 'not_authorized') {
                this.loginFacebook();
            } else {
                this.loginFacebook();
            }
        });
    }

    async upload() {
        this.analyticsService.logEvent('contact-add-upload-avatar');
        const actionSheet = await this.actionSheetController.create({
            header: this.translateService.instant('common.select-image-source'),
            buttons: [{
                text: this.translateService.instant('common.load-from-gallery'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.PHOTOLIBRARY);
                }
            },
            {
                text: this.translateService.instant('common.use-camera'),
                handler: () => {
                    this.doUpload(this.camera.PictureSourceType.CAMERA);
                }
            },
            {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel'
            }
            ]
        });
        await actionSheet.present();
    }

    async doUpload(sourceType: number) {
        this.uploadDisabled = true;
        const options: CameraOptions = {
            quality: 100,
            sourceType,
            destinationType: this.camera.DestinationType.DATA_URL,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE
        };
        this.camera.getPicture(options).then(async (imageData) => {
            const base64Image = imageData;
            const loading = await this.navCtrl.loading();
            this.dataService.uploadPictureBase64(base64Image).then(async (message) => {
                await loading.dismiss();
                if (message && message.url) {
                    this.photo = message.url;
                    this.uploadDisabled = false;
                    this.fileToUpload = null;
                    this.fileUploadInput.nativeElement.value = null;
                } else if (message && message.error) {
                    alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
                }
                this.uploadDisabled = false;
            }).catch(async (err) => {
                await loading.dismiss();
                console.error(err);
            });
        });
    }

    removePhoto() {
        this.photo = null;
    }

    rememberFile($event): void {
        this.fileToUpload = $event.target.files[0];
        this.browsePicture();
    }

    async browsePicture(): Promise<void> {
        this.analyticsService.logEvent('contact-add-browse-avatar');
        if (!this.fileToUpload) {
            alert(this.translateService.instant('note-add.no-picture-selected'));
            return;
        }
        this.uploadDisabled = true;
        this.dataService.uploadPicture(this.fileToUpload).then((message) => {
            if (message && message.url) {
                this.photo = message.url;
            } else if (message && message.error) {
                alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            }
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        }).catch(() => {
            alert('Có vấn đề xảy ra, hãy thử lại sau. (English: Something wrong, please try again later).');
            this.uploadDisabled = false;
            this.fileToUpload = null;
            this.fileUploadInput.nativeElement.value = null;
        });
    }

    selectMulti() {
        this.multiSelect = !this.multiSelect;
    }

    changeSelectedAll() {
        for (const comment of this.messages) {
            comment.selected = this.selectedAll;
        }
    }

    async deleteMulti() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-multi-message-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        for (const comment of this.messages) {
                            if (comment.selected) {
                                await this.omniChannelService.deleteMessage(comment);
                            }
                        }
                        this.analyticsService.logEvent('comment-delete-success');
                        this.navCtrl.publish('reloadFbMessages', null);
                        this.multiSelect = false;
                    }
                },
            ]
        });
        await confirm.present();
    }

    scroll() {
        setTimeout(async () => {
            this.content.scrollToBottom(300);
        }, 100);
    }

    async showHeaderMenu() {
        const buttons = [
            {
                text: this.translateService.instant('fb-page.select-multi'),
                handler: () => {
                    this.selectMulti();
                }
            }, {
                text: this.translateService.instant('fb-page.add-order'),
                handler: () => {
                    this.addOrder(null);
                }
            }, {
                text: this.translateService.instant('fb-page.send-product'),
                handler: () => {
                    this.sendProduct();
                }
            }, {
                text: this.translateService.instant('fb-page.add-contact'),
                handler: () => {
                    this.addToContact();
                }
            }, {
                text: this.translateService.instant('common.cancel'),
                role: 'cancel',
                handler: () => {
                }
            }
        ];
        const actionSheet = await this.actionSheetController.create({
            header: this.translateService.instant('action.action'),
            buttons
        });
        await actionSheet.present();
    }

    addOrder(message) {
        this.navCtrl.push('/order/add', { flow: this.flow, products: message.products });
    }

    sendProduct(productInput = null) {
        if (productInput) {
            const price = this.currencyPipe.transform(productInput.price, this.currency, 'symbol', '1.0-2', this.translateService.currentLang);
            let message = productInput.code;
            message = message ? message + ' ' + productInput.title : productInput.title;
            message = message && productInput.description ? message + '\r\n' + productInput.description : message;
            message = message && productInput.price ? message + '\r\n' + this.translateService.instant('product-add.price') + ': ' + price : message;
            this.message = message;
            if (productInput.avatarUrl) {
                this.photo = productInput.avatarUrl;
            }
            this.enterMessage();
            return;
        }
        const callback = (data: IProduct) => {
            const product = data;
            if (!product) {
                return;
            }
            const price = this.currencyPipe.transform(product.price, this.currency, 'symbol', '1.0-2', this.translateService.currentLang);
            let message = product.code;
            message = message ? message + ' ' + product.title : product.title;
            message = message && product.description ? message + '\r\n' + product.description : message;
            message = message && product.price ? message + '\r\n' + this.translateService.instant('product-add.price') + ': ' + price : message;
            this.message = message;
            if (product.avatarUrl) {
                this.photo = product.avatarUrl;
            }
            this.enterMessage();
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    async addToContact(phone = null) {
        if (!this.flow || !this.flow.fromUserId) {
            return;
        }
        const contact = await this.contactService.searchContactByFbUserId(this.flow.fromUserId);
        if (contact) {
            if (!phone) {
                this.navCtrl.push('/contact/detail', { id: contact.id });
                return;
            }
            this.navCtrl.push('/contact/add', { id: contact.id, phone });
            return;
        }
        this.navCtrl.push('/contact/add', { flow: this.flow, phone });
    }

    openPage() {
        if (!this.flow) {
            return;
        }
        this.analyticsService.logEvent('fb-message-open-profile');
        this.navCtrl.openExternalUrl('https://www.facebook.com/' + this.flow.fromUserId);
    }

    call(phone): void {
        Helper.callPhone(phone);
    }

    text(phone): void {
        Helper.sendSms(phone);
    }

    viewOrder(order: any): void {
        this.navCtrl.push('/order/detail', { id: order.id });
    }

    changeTab() {
        this.analyticsService.logEvent('fb-messageflow-show-tab');
        let messages: any[] = JSON.parse(JSON.stringify(this.originals));
        messages = messages.filter((item) => (
            this.tab === 'all'
            || this.tab === 'phone' && item.phone
            || this.tab === 'order' && (item.products || item.order)
            || this.tab === 'order-phone' && (item.products || item.order || item.phone)
        ));
        this.messages = messages;
    }
}
