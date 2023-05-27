import { INotePicture } from './note-picture.interface';
import { IContact } from './../models/contact.interface';
export interface INote {
    id: number;
    contactId: number;
    content: string;
    important: boolean;
    frequency: boolean;
    createdAt: string;
    modifiedAt: string;
    contact: IContact;
    notePictures: INotePicture[];
    avatarUrl: string;
}