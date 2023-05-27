import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { ActionSheetController, AlertController, IonContent, IonInput, IonText } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import * as moment from 'moment';
import { RouteHelperService } from '../../providers/route-helper.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';
import { OmniChannelService } from '../../providers/omni-channel.service';
import { DateTimeService } from '../../providers/datetime.service';
import { callFBAPI, extractPhone } from '../../providers/helper';
import { ProductService } from '../../providers/product.service';
import { IProduct } from '../../models/product.interface';
import { CurrencyPipe } from '@angular/common';
import { UserService } from '../../providers/user.service';
import { ContactService } from '../../providers/contact.service';
import { IOrder } from '../../models/order.interface';
import { Order } from '../../models/order.model';
import { DataService } from '../../providers/data.service';

declare let FB;

@Component({
    selector: 'fb-live-comment',
    templateUrl: 'fb-live-comment.component.html'
})
export class FbLiveCommentComponent {
    @ViewChild('messageInput', { static: false }) messageInput: IonInput;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    selectedPage: any;
    post: any;
    liveVideo: any;
    liveVideoId: any;
    pageAccessToken: string;
    originals: any[] = [];
    comments: any[] = [];
    searchKey: any = '';
    comment: string;
    photo;
    fileToUpload: any;
    uploadDisabled = false;
    replyingComment;
    multiSelect = false;
    selectedAll = false;
    currency;
    source: EventSource;
    tab = 'all';
    autoOrderConfigs: any[] = [];

    constructor(
        private cdRef: ChangeDetectorRef,
        private omniChannelService: OmniChannelService,
        private currencyPipe: CurrencyPipe,
        private productService: ProductService,
        private userService: UserService,
        private dataService: DataService,
        private camera: Camera,
        private actionSheetController: ActionSheetController,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private contactService: ContactService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
    ) {
        this.navCtrl.unsubscribe('reloadFbComments', this.reload);
        this.navCtrl.subscribe('reloadFbComments', this.reload);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('fb-comment');
    }

    ngOnInit(): void {
        this.reload();
    }

    reload = async () => {
        this.currency = await this.userService.getAttr('current-currency');
        this.autoOrderConfigs = await this.omniChannelService.getAutoOrderConfigsForLive();
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
    }

    scroll() {
        setTimeout(async () => {
            this.content.scrollToBottom(300);
        }, 100);
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('fb-comment-search');
        let comments: any[] = JSON.parse(JSON.stringify(this.originals));
        if (this.searchKey !== null && this.searchKey !== '') {
            const searchKey = this.searchKey.toLowerCase();
            comments = comments.filter((item) => (
                item.comment && Helper.stringSpecialContains(searchKey, item.comments)
                || item.pageId && Helper.stringSpecialContains(searchKey, item.pageId)
                || item.fromUserId && Helper.stringSpecialContains(searchKey, item.fromUserId)
                || item.fromUserName && Helper.stringSpecialContains(searchKey, item.fromUserName)
                || item.pageName && Helper.stringSpecialContains(searchKey, item.pageName)
            ));
        }
        this.comments = comments;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    dateFormat(date: string): string {
        const now = date ? moment(date) : moment();
        let dateChanged = date;
        if (!date || date.indexOf(':00Z') < 0) {
            dateChanged = now.format(DateTimeService.getDateTimeDbFormat());
        }
        return DateTimeService.toUiLocalDateTimeString(dateChanged);
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

    readPages = async () => {
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            return;
        }
        for (const pageItem of response.data) {
            if (this.selectedPage.pageId !== pageItem.id) {
                continue;
            }
            this.pageAccessToken = pageItem.access_token;
            const response2 = await callFBAPI('/' + pageItem.id + '/live_videos', null, null);
            if (!response2 || !response2.data) {
                alert(this.translateService.instant('fb-page.login-fail-alert'));
                return;
            }
            if (!response2.data.length) {
                alert(this.translateService.instant('fb-page.no-livestream-video'));
                return;
            }
            this.liveVideo = response2.data[0];
            if (!this.liveVideo) {
                return;
            }
            this.cdRef.detectChanges();
            this.liveVideoId = this.liveVideo.id;
            this.readComments();
            break;
        }
    }

    handleLiveEvent = async (event) => {
        if (!event || !event.data) {
            return;
        }
        const data = JSON.parse(event.data);
        const fromUserId = data.from.id;
        const fromUserName = data.from.name;
        const sentComment: any = {
            comment: data.message,
            commentId: data.id,
            parent: null,
            phone: null,
            parentId: null,
            pageId: this.selectedPage.pageId,
            pageName: this.selectedPage.pageName,
            fromUser: fromUserId !== this.selectedPage.pageId,
            fromUserId,
            fromUserName,
            fromUserAvatarUrl: data.from.picture && data.from.picture.data ? data.from.picture.data.url : ''
        }
        const parent = this.comments.find(c => c.commentId === sentComment.parentId);
        sentComment.parent = parent;
        const phone = extractPhone(sentComment.comment);
        if (phone) {
            sentComment.phone = phone;
        }
        const products = await this.productService.getProductsByMessage(sentComment.comment);
        if (products && products.length) {
            sentComment.products = products;
        }
        this.originals.push(sentComment);
        this.comments.push(sentComment);
        this.comment = '';
        const postId = data.object ? data.object.id : null;
        if (postId && !this.post) {
            this.post = await this.omniChannelService.getPostByPostId(this.selectedPage.pageId + "_" + postId, this.selectedPage.pageId);
            if (this.post) {
                this.post.liveVideoId = this.liveVideoId;
                await this.omniChannelService.savePost(this.post);
            }
        }
        this.removeReply();
        const autoConfig = this.autoOrderConfigs.find(a => (!a.pageId || a.pageId === this.selectedPage.pageId));
        const arr = sentComment.comment.split(' ');
        let isValidConfig = false;
        let quantity = 1;
        if (arr && arr.length && autoConfig && products && products.length) {
            if (arr.length === 3 && sentComment.phone &&
                (
                    autoConfig.comment === '(số điện thoại) (mã sản phẩm) (số lượng)'
                    || autoConfig.comment === '(phone) (product code) (quantity)'
                )) {
                    isValidConfig = true;
                    quantity = Number(arr[2]);
            } else if (arr.length === 2 &&
                (
                    autoConfig.comment === '(mã sản phẩm) (số lượng)'
                    || autoConfig.comment === '(product code) (quantity)'
                    || autoConfig.comment === '(số điện thoại) (mã sản phẩm)'
                    || autoConfig.comment === '(phone) (product code)'
                )) {
                    isValidConfig = true;
                    if (autoConfig.comment === '(mã sản phẩm) (số lượng)'
                    || autoConfig.comment === '(product code) (quantity)') {
                        quantity = Number(arr[1]);
                    }
            } else if (arr.length === 1 &&
                (
                    autoConfig.comment === '(mã sản phẩm)'
                    || autoConfig.comment === '(product code)'
                )) {
                    isValidConfig = true;
            }
        }

        if (isValidConfig) {
            const order: IOrder = new Order();
            if (sentComment.phone) {
                const contact = await this.contactService.searchContactByPhone(sentComment.phone);
                if (contact) {
                    order.contactId = contact.id;
                } else {
                    order.contactPhone = phone;
                }
            }
        }

        this.cdRef.detectChanges();
        setTimeout(() => {
            this.content.scrollToBottom(300);
        }, 500);
    }

    readComments = () => {
        if (this.source && (this.source.readyState == EventSource.OPEN)) {
            this.source.removeEventListener('message', this.handleLiveEvent);
            this.source.close();
        }
        this.source = new EventSource("https://streaming-graph.facebook.com/" + this.liveVideoId + "/live_comments?access_token=" + this.pageAccessToken + "&comment_rate=ten_per_second&fields=from{name,id,picture},message,object");
        this.source.addEventListener('message', this.handleLiveEvent);
        this.source.onerror = (e) => {
            alert(this.translateService.instant('fb-page.no-livestream-video'));
        };

    }

    enterMessage() {
        FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
                this.sendReply();
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

    reply(comment) {
        this.replyingComment = comment;
        setTimeout(async () => {
            this.content.scrollToBottom(300);
            await this.messageInput.setFocus();
        }, 100);
    }

    removeReply() {
        this.replyingComment = null;
    }

    selectMulti() {
        this.multiSelect = !this.multiSelect;
    }

    changeSelectedAll() {
        for (const comment of this.comments) {
            comment.selected = this.selectedAll;
        }
    }

    async deleteMulti() {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('fb-page.delete-multi-comment-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.cancel'),
                    handler: () => {
                    }
                },
                {
                    text: this.translateService.instant('common.agree'),
                    handler: async () => {
                        for (const comment of this.comments) {
                            if (comment.selected) {
                                await this.omniChannelService.deleteComment(comment);
                            }
                        }
                        this.analyticsService.logEvent('comment-delete-success');
                        this.navCtrl.publish('reloadFbComments', null);
                        this.multiSelect = false;
                    }
                },
            ]
        });
        await confirm.present();
    }

    chat(comment) {
        this.navCtrl.push('/fbpage/messages', { comment });
    }

    strip(s: string, limit) {
        if (!s || s.length < limit) {
            return s;
        }
        return s.substring(0, limit - 1) + "...";
    }

    showSearchPages() {
        this.analyticsService.logEvent('fb-live-comment-search-page');
        const callback = async (data) => {
            const page = data;
            if (page) {
                this.post = null;
                this.photo = null;
                this.replyingComment = null;
                this.selectedPage = page;
                this.loginFacebook();
            }
        };
        this.navCtrl.push('/fbpage/search-page', { callback, searchMode: true });
    }

    removePage() {
        this.selectedPage = null;
        this.source.close();
    }

    call(phone): void {
        Helper.callPhone(phone);
    }

    text(phone): void {
        Helper.sendSms(phone);
    }

    async addToContact(comment, phone = null) {
        const contact = await this.contactService.searchContactByFbUserId(comment.fromUserId);
        if (contact) {
            if (!phone) {
                this.navCtrl.push('/contact/detail', { id: contact.id });
                return;
            }
            this.navCtrl.push('/contact/add', { id: contact.id, phone });
            return;
        }
        this.navCtrl.push('/contact/add', { fbcomment: comment, phone });
    }

    async addOrder(comment) {
        this.navCtrl.push('/order/add', { fbcomment: comment, products: comment.products });
    }

    async moreAction(comment) {
        const buttons = [
            {
                icon: 'mail',
                text: this.translateService.instant('fb-page.private-chat'),
                handler: () => {
                    this.chat(comment);
                }
            }, {
                icon: 'person-add',
                text: this.translateService.instant('fb-page.add-contact'),
                handler: () => {
                    this.addToContact(comment);
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

    sendProduct(comment, productInput = null) {
        if (productInput) {
            const price = this.currencyPipe.transform(productInput.price, this.currency, 'symbol', '1.0-2', this.translateService.currentLang);
            let message = productInput.code;
            message = message ? message + ' ' + productInput.title : productInput.title;
            message = message && productInput.description ? message + '\r\n' + productInput.description : message;
            message = message && productInput.price ? message + '\r\n' + this.translateService.instant('product-add.price') + ': ' + price : message;
            this.replyingComment = comment;
            this.comment = message;
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
            this.comment = message;
            if (product.avatarUrl) {
                this.photo = product.avatarUrl;
            }
            this.enterMessage();
        };
        this.navCtrl.push('/product', { callback, searchMode: true });
    }

    viewOrder(order: any): void {
        this.navCtrl.push('/order/detail', { id: order.id });
    }

    async sendReply() {
        const parentId = this.replyingComment ? this.replyingComment.commentId : this.liveVideoId;
        const sentComment = {
            comment: this.comment,
            pageId: this.selectedPage.pageId,
            pageName: this.selectedPage.pageName,
            fromUser: false,
            photoUrl: this.photo,
            liveVideoId: this.liveVideoId,
            parentId,
            commentId: '',
            parent: this.replyingComment
        }
        this.originals.push(sentComment);
        this.comments.push(sentComment);
        this.comment = '';
        this.removeReply();
        setTimeout(() => {
            this.content.scrollToBottom(300);
        }, 100);
        const response = await callFBAPI('/me/accounts', null, null);
        if (!response || !response.data || !response.data.length) {
            alert(this.translateService.instant('fb-page.login-fail-alert'));
            return;
        }
        for (const pageItem of response.data) {
            if (this.selectedPage.pageId !== pageItem.id) {
                continue;
            }
            this.pageAccessToken = pageItem.access_token;

            const response2 = await callFBAPI('/' + parentId + '/comments', "POST",
                {
                    access_token: this.pageAccessToken,
                    message: sentComment.comment,
                    attachment_url: this.photo,

                });
            if (!response2 || !response2.id) {
                alert(this.translateService.instant('fb-page.login-fail-alert'));
                return;
            }
            sentComment.commentId = response2.id;
            /* this.post.lastComment = sentComment.comment;
            this.post.lastCommentId = response2.id;
            this.post.photoUrl = this.photo;
            this.post.isRead = true;
            this.post.fromUser = false;
            this.post.notified = false;
            this.photo = null;
            await this.omniChannelService.saveComment(sentComment);
            await this.omniChannelService.savePost(this.post); */
            this.photo = null;
            //await this.omniChannelService.saveComment(sentComment);
            break;
        }
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
        this.comments = messages;
    }
}
