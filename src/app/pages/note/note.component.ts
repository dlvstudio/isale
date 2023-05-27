/* eslint-disable @typescript-eslint/prefer-for-of */
import { Component } from '@angular/core';
import * as _ from 'lodash';
import { NoteService } from '../../providers/note.service';

@Component({
    selector: 'note',
    templateUrl: 'note.component.html'
})
export class NoteComponent {
    segmentValues = [
        ['frequency',
            ['icon', 'bookmark'],
            ['filter',
                ['frequency', 'true'],
                ['modifiedAt', 'desc']]],
        ['important',
            ['icon', 'star'],
            ['filter',
                ['important', 'true'],
                ['modifiedAt', 'desc']]],
        ['recent',
            ['icon', 'time'],
            ['filter',
                ['modifiedAt', 'desc']]],
    ];

    itemTemplate = {
        h2: {
            valueFunc: 'limit content',
        },
        pList: [
            {
                field: 'contact.full-name',
            },
            {
                field: 'modified-at',
                style: 'font-size: 0.8em;',
                valueFunc: 'note modified at',
            }
        ]
    };

    deleteRelated = async (item) => {
        this.noteService.getNotePicturesByNoteId(item.id).then((notePictures: any[]) => {
            if (notePictures && notePictures.length > 0) {
                this.noteService.deleteNotePictures(notePictures);
            }
        });
    }

    searchFields = ['content'];

    constructor(
        private noteService: NoteService,
    ) { }

    async ngOnInit() {
    }
}
