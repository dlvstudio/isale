import { INotePicture } from './../models/note-picture.interface';
import { INote } from './../models/note.interface';
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';

@Injectable()
export class NoteService {
    constructor(
        private apiService: ApiService,
        private staffService: StaffService,
        private userService: UserService) {
    }

    getNotes(): Promise<INote[]> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/list?table=note' + (staffId ? '?staffId=' + staffId : '');
        return this.apiService.get(url);
    }

    getNotesByContact(contactId: number): Promise<INote[]> {
        const data: any = { contactId, table: 'note' };
        if (this.staffService.selectedStaff) {
            data.staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
    }

    getNotePicturesByNoteId(noteId: number): Promise<INotePicture[]> {
        const model: any = { noteId, table: 'note_picture' };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id;
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    get(id: number): Promise<INote> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        return this.apiService.get(this.userService.apiUrl + '/data?table=note&id=' + id + (staffId ? '&staffId=' + staffId : ''));
    }

    deleteNote(note: INote): Promise<any> {
        if (this.staffService.selectedStaff) {
            note['staffId'] = this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=note&id=' + note.id, null);
    }

    deleteNotePictures(pictures: INotePicture[]): Promise<boolean> {
        let staffId = 0;
        if (this.staffService.selectedStaff) {
            staffId = this.staffService.selectedStaff.id;
        }
        const arr: Promise<any>[] = [];
        for(const picture of pictures) {
            const p = this.apiService.post(this.userService.apiUrl + '/data/remove?table=note_picture&id=' + picture.id + (staffId ? '&staffId=' + staffId : ''), null);
            arr.push(p);
        }
        return new Promise((resolve, reject) => {
            Promise.all(arr)
                .then(() => {
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    }

    saveNote(note: INote): Promise<number> {
        return new Promise((r,j) => {
            note['table'] = 'note';
            if (this.staffService.selectedStaff) {
                note['staffId'] = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', note).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                note.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveNotePictures(note: INote): Promise<boolean> {
        const arr: Promise<any>[] = [];
        for (const notePicture of note.notePictures) {
            notePicture.noteId = note.id;
            const p = new Promise((r,j) => {
                notePicture['table'] = 'note_picture';
                this.apiService.post(this.userService.apiUrl + '/data/save', notePicture).then(res => {
                    if (!res) {
                        r(0);
                        return;
                    }
                    const ret = res;
                    notePicture.id = ret;
                    r(ret);
                }, (err) => {
                    j(err);
                });
            });
            arr.push(p);
        }
        return new Promise((resolve, reject) => {
            Promise.all(arr).then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });
        });
    }
}
