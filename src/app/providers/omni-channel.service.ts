import { Injectable } from '@angular/core';

import { UserService } from './user.service';
import { ApiService } from './api.service';
import { StaffService } from './staff.service';
import { StorageService } from './storage.service';

@Injectable()
export class OmniChannelService {

    constructor(
        private apiService: ApiService,
        private userService: UserService,
        private storageService: StorageService,
        private staffService: StaffService
    ) {
    }

    async gotRecentNoti(): Promise<boolean> {
        const s = await this.storageService.get('recent-noti');
        if (!s) {
            return false;
        }
        return s === 'true';
    }

    savePage(page: any): Promise<number> {
        return new Promise((r, j) => {
            page.table = 'fbpage';
            if (this.staffService.isStaff()) {
                page.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', page).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                page.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveMessage(message: any): Promise<number> {
        return new Promise((r, j) => {
            message.table = 'fbmessage';
            if (this.staffService.isStaff()) {
                message.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', message).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                message.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveComment(comment: any): Promise<number> {
        return new Promise((r, j) => {
            comment.table = 'fbcomment';
            if (this.staffService.isStaff()) {
                comment.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', comment).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                comment.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveReplyConfig(config: any): Promise<number> {
        return new Promise((r, j) => {
            config.table = 'fbautoreplyconfig';
            if (this.staffService.isStaff()) {
                config.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', config).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                config.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveAutoOrderConfig(config: any): Promise<number> {
        return new Promise((r, j) => {
            config.table = 'fbautoorderconfig';
            if (this.staffService.isStaff()) {
                config.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', config).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                config.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    saveFlow(message: any): Promise<number> {
        return new Promise((r, j) => {
            message.table = 'fbmessageflow';
            if (this.staffService.isStaff()) {
                message.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', message).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                message.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    updateFbToken(fbUserId, fbToken): Promise<any> {
        return new Promise((r, j) => {
            this.apiService.post(this.userService.apiUrl + '/omni/UpdateToken', {fbUserId, fbToken}).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    savePost(post: any): Promise<number> {
        return new Promise((r, j) => {
            post.table = 'fbpost';
            if (this.staffService.isStaff()) {
                post.staffId = this.staffService.selectedStaff.id.toString();
            }
            this.apiService.post(this.userService.apiUrl + '/data/save', post).then(res => {
                if (!res) {
                    r(0);
                    return;
                }
                const ret = res;
                post.id = ret;
                r(ret);
            }, (err) => {
                j(err);
            });
        });
    }

    get(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=fbpage&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getReplyConfig(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=fbautoreplyconfig&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getAutoOrderConfig(id: number): Promise<any> {
        let url = this.userService.apiUrl + '/data?table=fbautoorderconfig&id=' + id;
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getPagesByPageId(pageId: string): Promise<any[]> {
        const model: any = { table: 'fbpage', pageId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getPages(): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=fbpage';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getFlowsByFromUser(fromUserId: string, pageId: string): Promise<any[]> {
        const model: any = { table: 'fbmessageflow', fromUserId, pageId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getMessages(fromUserId: string, pageId: string): Promise<any[]> {
        const model: any = { table: 'fbmessage', fromUserId, pageId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getComments(postId: string, pageId: string): Promise<any[]> {
        const model: any = { table: 'fbcomment', postId, pageId };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getReplyConfigs(): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=fbautoreplyconfig';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getAutoOrderConfigs(): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=fbautoorderconfig';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getAutoOrderConfigsForLive(): Promise<any[]> {
        const model: any = { table: 'fbautoorderconfig', isActive: true, applyOnLiveStream: true };
        if (this.staffService.selectedStaff) {
            model.staffId = this.staffService.selectedStaff.id.toString();
        }
        const url = this.userService.apiUrl + '/data/listequal';
        return this.apiService.post(url, model);
    }

    getMessageFlows(): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=fbmessageflow';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    getPosts(): Promise<any[]> {
        let url = this.userService.apiUrl + '/data/list?table=fbpost';
        if (this.staffService.selectedStaff) {
            url += '&staffId=' + this.staffService.selectedStaff.id.toString();
        }
        return this.apiService.get(url);
    }

    deletePage(page: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=fbpage&id=' + page.id, null);
    }

    deleteReplyConfig(config: any): Promise<any> {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=fbautoreplyconfig&id=' + config.id, null);
    }

    async updateNotificationsForFlow(flow) {
        const json = await this.storageService.get("notifications");
        let notifications: any[] = [];
        if (json) {
            notifications = JSON.parse(json);
        }
        for (const noti of notifications) {
            if (noti.fromUserId === flow.fromUserId && noti.pageId === flow.pageId) {
                noti.isRead = true;
            }
        }
        const jsonRet = JSON.stringify(notifications);
        await this.storageService.set("notifications", jsonRet);
    }

    async updateNotificationsForPost(post) {
        const json = await this.storageService.get("notifications");
        let notifications: any[] = [];
        if (json) {
            notifications = JSON.parse(json);
        }
        for (const noti of notifications) {
            if (noti.fromUserId === post.fromUserId && noti.pageId === post.pageId && noti.postId === post.postId) {
                noti.isRead = true;
            }
        }
        const jsonRet = JSON.stringify(notifications);
        await this.storageService.set("notifications", jsonRet);
    }

    async deleteNotification(notification) {
        const json = await this.storageService.get("notifications");
        let notifications: any[] = [];
        if (json) {
            notifications = JSON.parse(json);
        }
        const idx = notifications.findIndex(n => n.id === notification.id);
        if (idx > -1) {
            notifications.splice(idx, 1);
        }
        const jsonRet = JSON.stringify(notifications);
        await this.storageService.set("notifications", jsonRet);
    }

    async deleteComment(comment) {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=fbcomment&id=' + comment.id, null);

    }

    async deleteMessage(message) {
        return this.apiService.post(this.userService.apiUrl + '/data/remove?table=fbmessage&id=' + message.id, null);

    }

    async setRecentNotification(hasNoti: boolean) {
        await this.storageService.set("recent-noti", hasNoti ? "true" : "false");
    }

    async getNotificationsFromStorage(): Promise<any[]> {
        if (!this.userService.loggedUser) {
            return;
        }
        const json = await this.storageService.get("notifications");
        if (!json) {
            return [];
        }
        return JSON.parse(json);
    }

    async getNotifications(): Promise<any[]> {
        if (!this.userService.loggedUser) {
            return;
        }
        const data: any = { table: 'fbmessage', notified: false, fromUser: true };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr;
        }
        return [];
    }

    async getCommentNotifications(): Promise<any[]> {
        if (!this.userService.loggedUser) {
            return;
        }
        const data: any = { table: 'fbcomment', notified: false, fromUser: true };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr;
        }
        return [];
    }

    async addFbMessageNoti(message, isComment = false) {
        let notifications = [];
        const objStr = await this.storageService.get('notifications');
        if (objStr) {
            notifications = JSON.parse(objStr);
        }
        message.isComment = isComment;
        notifications.unshift(message);
        await this.storageService.set('notifications', JSON.stringify(notifications));
    }

    async getPostByComment(comment): Promise<any[]> {
        return this.getPostByPostId(comment.postId, comment.pageId);
    }

    async getPostByPostId(postId, pageId): Promise<any[]> {
        const data: any = { table: 'fbpost', postId, pageId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr[0];
        }
        return null;
    }

    async getMessageFlowByMessage(message): Promise<any[]> {
        const data: any = { table: 'fbmessageflow', fromUserId: message.fromUserId, pageId: message.pageId };
        if (this.staffService.isStaff()) {
            data.staffId = this.staffService.selectedStaff.id.toString();
        }
        const arr = await this.apiService.post(this.userService.apiUrl + '/data/ListEqual', data);
        if (arr && arr.length) {
            return arr[0];
        }
        return null;
    }
}
