import { INotePicture } from './../../models/note-picture.interface';
import { IContact } from './../../models/contact.interface';
import { INote } from './../../models/note.interface';
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { RouteHelperService } from '../../providers/route-helper.service';
import { NoteService } from '../../providers/note.service';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { DateTimeService } from '../../providers/datetime.service';
import { AnalyticsService } from '../../providers/analytics.service';
import { Helper } from '../../providers/helper.service';

@Component({
    selector: 'note',
    templateUrl: 'note.component.html'
})
export class NoteComponent {
    params: any = null;
    title = 'Ghi chú';
    originalNotes: INote[];
    notes: INote[];
    searchKey = '';
    noteFilter = 'frequency';

    constructor(
        private noteService: NoteService,
        public navCtrl: RouteHelperService,
        private translateService: TranslateService,
        private actionSheetCtrl: ActionSheetController,
        private alertCtrl: AlertController,
        private analyticsService: AnalyticsService
    ) {
        const reloadNoteListHandle = (event) => {
            const data = event.detail;
            if (data && data.filter && data.filter != '') {
                this.noteFilter = data.filter;
            }
            this.reload();
        };
        this.navCtrl.unsubscribe('reloadNoteList', reloadNoteListHandle);
        this.navCtrl.subscribe('reloadNoteList', reloadNoteListHandle);
    }

    ngOnInit(): void {
        this.reload();
    }

    async reload(): Promise<void> {
        this.params = this.navCtrl.getParams(this.params);
        const loading = await this.navCtrl.loading();
        this.noteService.getNotes().then(async (notes) => {
            await loading.dismiss();
            this.originalNotes = JSON.parse(JSON.stringify(notes));
            this.notes = notes;
            if (this.params && this.params.filter && this.params.filter != '') {
                this.noteFilter = this.params.filter;
            }
            this.filter();
            if (!this.notes || this.notes.length === 0) {
                this.noteFilter = 'recent';
                this.filter();
            }
        });
    }

    async ionViewWillEnter() {
        await this.analyticsService.setCurrentScreen('note');
    }

    openNoteAdd(): void {
        this.navCtrl.push('/note/add');
    }

    async search(): Promise<void> {
        this.analyticsService.logEvent('note-search');
        let notes: INote[] = JSON.parse(JSON.stringify(this.originalNotes));
        if (this.searchKey !== null && this.searchKey !== '') {
            let searchKey = this.searchKey.toLowerCase();
            notes = notes.filter((item) => {
                return (item.content && item.content.toLowerCase().indexOf(searchKey) !== -1);
            });
        }
        this.notes = notes;
    }

    clearSearch() {
        this.searchKey = null;
        this.reload();
    }

    filter(): void {
        let notes: INote[] = JSON.parse(JSON.stringify(this.originalNotes));
        if (this.noteFilter === 'important') {
            notes = notes.filter((item) => {
                return item.important;
            });
        }
        else if (this.noteFilter === 'frequency') {
            notes = notes.filter((item) => {
                return item.frequency;
            })
        }
        notes = this.sortByModifiedAt(notes);
        this.notes = notes;
    }

    sortByModifiedAt(notes: INote[]): INote[] {
        if (notes) {
            return _.orderBy(notes, ['modifiedAt'], ['desc']);
        }
        return null;
    }

    dateFormat(date: string): string {
        return DateTimeService.toUiString(date);
    }

    contactImageOrPlaceholder(contact: IContact): string {
        return Helper.contactImageOrPlaceholder(contact.avatarUrl);
    }

    limitText(text: string, maxLength: number = 200): string {
        return Helper.limitText(text, maxLength);
    }

    selectNote(id: number): void {
        this.navCtrl.push('/note/detail', { id: id });
    }

    async deleteNote(note: INote): Promise<void> {
        let confirm = await this.alertCtrl.create({
            header: this.translateService.instant('common.confirm'),
            message: this.translateService.instant('note.delete-alert'),
            buttons: [
                {
                    text: this.translateService.instant('common.agree'),
                    handler: () => {
                        this.noteService.deleteNote(note).then(async () => {
                            this.analyticsService.logEvent('note-delete-success');
                            let i = this.notes.findIndex(item => item.id == note.id);
                            if (i >= 0) {
                                this.notes.splice(i, 1);
                            }
                            i = this.originalNotes.findIndex(item => item.id == note.id);
                            if (i >= 0) {
                                this.originalNotes.splice(i, 1);
                            }
                            this.noteService.getNotePicturesByNoteId(note.id).then((notePictures: INotePicture[]) => {
                                if (notePictures && notePictures.length > 0) {
                                    this.noteService.deleteNotePictures(notePictures);
                                }
                            });
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

    async presentActionSheet(note: INote) {
        let actionSheet = await this.actionSheetCtrl.create({
            header: this.translateService.instant('action.action'),
            buttons: [
                {
                    text: this.translateService.instant('note.delete'),
                    role: 'destructive',
                    handler: () => {
                        this.deleteNote(note);
                    }
                }, {
                    text: this.translateService.instant('note.detail'),
                    handler: () => {
                        this.selectNote(note.id);
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
}
