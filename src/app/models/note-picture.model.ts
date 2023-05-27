import { INotePicture } from './note-picture.interface';
export class NotePicture implements INotePicture{
    id: number = 0;
    noteId: number = 0;
    imageUrl: string = '';
}