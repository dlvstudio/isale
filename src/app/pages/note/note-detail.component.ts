import { INotePicture } from './../../models/note-picture.interface';
import { Note } from './../../models/note.model';
import { INote } from './../../models/note.interface';
import { IContact } from './../../models/contact.interface';
import { Component, ViewChild } from '@angular/core';
import { RouteHelperService } from '../../providers/route-helper.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController, IonSlides } from '@ionic/angular';
import { NoteService } from '../../providers/note.service';
import { ContactService } from '../../providers/contact.service';
import { UserService } from '../../providers/user.service';
import { Helper } from '../../providers/helper.service';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';

@Component({
    selector: 'note-detail',
    templateUrl: 'note-detail.component.html',
})
export class NoteDetailComponent {
    @ViewChild('mySlider', {static: true}) slider: IonSlides;
    params: any = null;
    contactSelected: IContact;
    note: INote = new Note();
    noteSegment = 'content';
    notePictures: INotePicture[] = [];
    isInViewPictureMode = false;
    arr = [];

    constructor(
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private noteService: NoteService,
        private contactService: ContactService,
        private userService: UserService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService
    ) {
        const reloadNoteHandle = (event) => {
            const note = event.detail;
            if (this.note && note.id === this.note.id) {
                this.reload();
            }
        };
        this.navCtrl.unsubscribe('reloadNote', reloadNoteHandle);
        this.navCtrl.subscribe('reloadNote', reloadNoteHandle);
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('note-detail');
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.note = new Note();
        this.noteSegment = 'content';
        this.params = this.navCtrl.getParams(this.params);
        if (this.params && this.params.id && this.params.id > 0) {
            const id = this.params.id;
            const loading = await this.navCtrl.loading();
            this.noteService.get(id).then(async (note) => {
                await loading.dismiss();
                this.note = note;
                this.noteService.getNotePicturesByNoteId(this.note.id).then((notePictures: INotePicture[]) => {
                    this.notePictures = notePictures;
                    const arr = [];
                    let row = [];
                    for (const picture of this.notePictures) {
                        row.push(picture);
                        if (row.length == 3) {
                            arr.push(row);
                            row = [];
                        }
                    }
                    if (row.length > 0) {
                        arr.push(row);
                    }
                    this.arr = arr;

                    if (this.note.content == '' && this.arr && this.arr.length > 0) {
                        this.noteSegment = 'picture';
                    }
                });
            });
        }
    }

    isNotCordova() {
        return this.navCtrl.isNotCordova();
    }

    call(): void {
        this.saveLastActive('call');
        Helper.callPhone(this.note.contact.mobile);
    }

    text(): void {
        this.saveLastActive('text');
        Helper.sendSms(this.note.contact.mobile);
    }

    saveLastActive(action: string): Promise<number> {
        this.note.contact.lastActive = DateTimeService.toDbString();
        this.note.contact.lastAction = action;
        return this.contactService.saveContact(this.note.contact).then((result) => {
            this.navCtrl.publish('reloadContactList');
            this.navCtrl.publish('reloadContact', this.note.contact);
            return result;
        });
    }

    contactImageOrPlaceholder(): string {
        return Helper.contactImageOrPlaceholder(this.note.contact.avatarUrl);
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiDateString(date);
    }

    actionIcon(action: string): string {
        return Helper.actionIcon(action);
    }

    dateTimeFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    edit(): void {
        this.navCtrl.push('/note/add', { id: this.note.id });
    }

    showImage(picture: INotePicture): void {
        const i = this.notePictures.findIndex(item => item.id == picture.id);
        const images = this.notePictures.map(item => { return item.imageUrl });
        this.navCtrl.push('/gallery', { images, id: i });
    }

    closeViewPicture(): void {
        this.isInViewPictureMode = false;
    }

    async presentActionSheet() {
        const actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('note.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteNote();
                    }
                }, {
                    text: this.translateService.instant('note-detail.share'),
                    handler: () => {
                        this.shareNote();
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

    async deleteNote(): Promise<void> {
        const confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('note.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.noteService.deleteNote(this.note).then(async () => {
                            this.analyticsService.logEvent('note-detail-delete-success');
                            this.noteService.getNotePicturesByNoteId(this.note.id).then((notePictures: INotePicture[]) => {
                                if (notePictures && notePictures.length > 0) {
                                    this.noteService.deleteNotePictures(notePictures);
                                }
                            });
                            this.navCtrl.publish('reloadNoteList');
                            this.navCtrl.publish('reloadContact', this.note.contact);
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

    shareNote(): void {
        const body = this.note.content;
        const image = this.notePictures && this.notePictures.length > 0 ? this.notePictures[0].imageUrl : '';

        this.userService.share(body, image);
    }
}