import { IUser } from './user.interface';
export class User implements IUser{
    id: number = 0;
    username: string = '';
    password: string = '';
    isRemember: boolean = false;
}