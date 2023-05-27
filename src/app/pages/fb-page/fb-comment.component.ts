import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { ContactService } from '../../providers/contact.service';
import { ProductService } from '../../providers/product.service';
import { CurrencyPipe } from '@angular/common';
import { IProduct } from '../../models/product.interface';
import { UserService } from '../../providers/user.service';
import { DataService } from '../../providers/data.service';

declare let FB;

@Component({
    selector: 'fb-comment',
    templateUrl: 'fb-comment.component.html'
})
export class FbCommentComponent {
    @ViewChild('messageInput', { static: false }) messageInput: IonInput;
    @ViewChild('fileUploadInput', { static: false }) fileUploadInput: ElementRef;
    @ViewChild(IonContent, { static: true }) content: IonContent;
    params: any = null;
    post: any;
    pageAccessToken: string;
    originals: any[];
    comments: any[];
    searchKey: any = '';
    currency: string;
    comment: string;
    photo;
    fileToUpload: any;
    uploadDisabled = false;
    replyingComment;
    multiSelect = false;
    selectedAll = false;
    tab = 'all';

    constructor(
        private omniChannelService: OmniChannelService,
        private contactService: ContactService,
        private dataService: DataService,
        private productService: ProductService,
        private camera: Camera,
        private actionSheetController: ActionSheetController,
        public navCtrl: RouteHelperService,
        public translateService: TranslateService,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService,
        private userService: UserService,
        private currencyPipe: CurrencyPipe,
    ) {
        this.navCtrl.unsubscribe('reloadFbComments', this.reload);
        this.navCtrl.subscribe('reloadFbComments', this.reload);
    }

    handleComment = async (event) => {
        const comment = event.detail;
        if (comment && this.post && comment.fromUserId !== this.post.fromUserId || comment && this.post && comment.pageId !== this.post.pageId || this.searchKey) {
            return;
        }
        if (this.originals) {
            this.originals.push(comment);
        }
        if (this.comments) {
            this.comments.push(comment);
        }
        setTimeout(async () => {
            this.content.scrollToBottom(300);
        }, 100);
        this.post.lastComment = comment.comment;
        this.post.lastTimestamp = new Date();
        this.post.lastCommentId = comment.commentId;
        this.post.isRead = true;
        this.post.fromUser = true;
        this.post.lastFromUserName = comment.fromUserName
        this.post.lastFromUserAvatarUrl = comment.fromUserAvatarUrl;
        await this.omniChannelService.savePost(this.post);
        await this.omniChannelService.setRecentNotification(false);
    }

    ionViewWillLeave() {
        this.navCtrl.unsubscribe('fbcomment', this.handleComment);
    }

    async ionViewWillEnter() {
        this.navCtrl.subscribe('fbcomment', this.handleComment);
        await this.analyticsService.setCurrentScreen('fb-comment');
    }

    ngOnInit(): void {
        this.reload();
    }

    openPage() {
        if (!this.post) {
            return;
        }
        this.analyticsService.logEvent('fb-comment-open-page');
        this.navCtrl.openExternalUrl('https://www.facebook.com/' + this.post.postId);
    }

    reload = async () => {
        const loading = await this.navCtrl.loading();
        this.currency = await this.userService.getAttr('current-currency');
        const data = this.params ? this.params : this.navCtrl.getParams();
        this.params = data;
        if (data && data.post) {
            this.post = data.post;
            this.omniChannelService.getComments(this.post.postId, this.post.pageId).then(async (comments) => {
                if (!comments || !comments.length) {
                    return;
                }
                let i = 0;
                for (const comment of comments) {
                    i++;
                    const parent = comments.find(c => c.commentId === comment.parentId);
                    comment.parent = parent;
                    const phone = extractPhone(comment.comment);
                    if (phone) {
                        comment.phone = phone;
                    }

                    // get top 10 message from bottom
                    if (comments.length - 10 <= i) {
                        const products = await this.productService.getProductsByMessage(comment.comment);
                        if (products && products.length) {
                            comment.products = products;
                        }
                    }
                }
                this.post.isRead = true;
                await this.omniChannelService.savePost(this.post);
                await this.omniChannelService.updateNotificationsForPost(this.post);
                this.navCtrl.publish('reloadFbNotifications');
                this.originals = JSON.parse(JSON.stringify(comments));
                this.comments = comments;
                setTimeout(async () => {
                    this.content.scrollToBottom(300);
                    setTimeout(async () => {
                        await this.messageInput.setFocus();
                    }, 500);
                    await loading.dismiss();
                }, 100);
            });
        }
    }

    scroll() {
        setTimeout(async () => {
            this.content.scrollToBottom(300);
        }, 100);
    }

    selectPage(id): void {
        this.navCtrl.push('/fbpage/detail', { id });
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

    async readPages() {
        const parentId = this.replyingComment ? this.replyingComment.commentId : this.post.postId;
        const sentComment = {
            comment: this.comment,
            pageId: this.post.pageId,
            pageName: this.post.pageName,
            fromUser: false,
            photoUrl: this.photo,
            postId: this.post.postId,
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
            if (this.post.pageId !== pageItem.id) {
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
            this.post.lastComment = sentComment.comment;
            this.post.lastCommentId = response2.id;
            this.post.photoUrl = this.photo;
            this.post.isRead = true;
            this.post.fromUser = false;
            this.post.notified = false;
            this.photo = null;
            await this.omniChannelService.saveComment(sentComment);
            await this.omniChannelService.savePost(this.post);
            break;
        }
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
