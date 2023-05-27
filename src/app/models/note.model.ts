import { Helper } from './../providers/helper.service';
import { INotePicture } from './note-picture.interface';
import { Join } from './join.model';
import { Contact } from './contact.model';
import { IContact } from './contact.interface';
import { INote } from './note.interface';
export class Note implements INote{
    id: number = 0;
    contactId: number = 0;
    content: string = '';
    important: boolean = false;
    frequency: boolean = false;
    createdAt: string = '';
    modifiedAt: string = '';
    contact: IContact = new Contact;
    notePictures: INotePicture[] = [];
    avatarUrl: string = '';
    joins: Join[] = [
        new Join('contactId', 'contact', Helper.contactTableName),
    ];
}