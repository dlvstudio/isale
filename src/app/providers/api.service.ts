/* eslint-disable eqeqeq */
import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';
import { Platform } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';

@Injectable()
export class ApiService {

    constructor(
        private http: HttpClient,
        private userService: UserService,
        private platform: Platform,
        private file: File,
        private androidPermissions: AndroidPermissions,
        private nativeHTTP: HTTP
    ) {
    }

    post(url: string, body: any, tryCount: number = 0): Promise<any> {
        return new Promise((r) => {
            if (tryCount == 3) {
                r(null);
                return;
            }
            const tryLogin = () => {
                if (this.userService.loggedUser != null) {
                    const user = this.userService.loggedUser.username;
                    const pass = this.userService.loggedUser.password;
                    this.userService.getUserByNameAndPassword(user, pass, true)
                        .then((userGot) => {
                            if (!userGot) {
                                this.userService.removeRefreshToken();
                                r(null);
                                return;
                            }
                            this.post(url, body, tryCount + 1).then((res2) => {
                                if (!res2) {
                                    r(null);
                                    return;
                                }
                                r(res2);
                            });
                        }).catch(() => {
                            r(null);
                        });
                    return;
                }
                this.userService.getRefreshToken()
                    .then((tokenData) => {
                        if (!tokenData) {
                            r(null);
                            return;
                        }
                        const user = tokenData.userName;
                        const pass = tokenData.pass;
                        this.userService.getUserByNameAndPassword(user, pass, false)
                            .then((userGot) => {
                                if (!userGot) {
                                    this.userService.removeRefreshToken();
                                    r(null);
                                    return;
                                }
                                this.post(url, body, tryCount + 1).then((res2) => {
                                    if (!res2) {
                                        r(null);
                                        return;
                                    }
                                    r(res2);
                                });
                            }).catch(() => {
                                r(null);
                            });
                    });
            }

            if (!this.userService.token) {
                tryLogin();
                return;
            }
            const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.userService.token });
            const option = {
                headers
            };
            this.http.post(url, body, option).subscribe((res) => {
                if (!res) {
                    r(null);
                    return;
                }
                const data = res;
                r(data);
            }, () => {
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(null);
                    return;
                }
                // try to login again
                tryLogin();
            });
        });
    }

    postNoToken(url: string, body: any, tryCount: number = 0): Promise<any> {
        return new Promise((r) => {
            if (tryCount == 3) {
                r(null);
                return;
            }
            const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
            const option = {
                headers
            };
            this.http.post(url, body, option).subscribe((res) => {
                if (!res) {
                    r(null);
                    return;
                }
                const data = res;
                r(data);
            }, () => {
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(null);
                    return;
                }
            });
        });
    }

    async downloadUrlToFolder(folder, fileName, urlDownload) {
        const ret = await this.nativeHTTP.downloadFile(urlDownload, {}, {}, folder + fileName);
        return ret;
    }

    downloadWithPost(url: string, body: any, fileName: string, tryCount: number = 0): Promise<any> {
        return new Promise((r, j) => {
            if (tryCount == 3) {
                r(null);
                return;
            }
            const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.userService.token });
            const option = {
                headers,
                responseType: 'text' as 'json'
            };
            this.http.post(url, body, option).subscribe(async (res) => {
                if (!res) {
                    r(null);
                    return;
                }
                const urlDownload = this.userService.apiUrl + '/downloads/' + res;
                if (!(this.platform.is('capacitor') || this.platform.is('cordova'))
                    || this.platform.is('electron')
                    || document.URL.indexOf('atakafe.com/isale') !== -1
                    || document.URL.indexOf('isale.online/app') !== -1
                ) {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = urlDownload;
                    downloadLink.download = fileName;
                    downloadLink.target = '_blank';

                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    r(urlDownload);
                    return;
                }

                const checkPermission = await this.androidPermissions.checkPermission(
                    this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
                if (!checkPermission || !checkPermission.hasPermission) {
                    const requestPermission = await this.androidPermissions.requestPermission(
                        this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE);
                    if (!requestPermission || !requestPermission.hasPermission) {
                        r(null);
                        return;
                    }
                }
                let folder = '';
                const arr = [];
                if (this.platform.is('ios')) {
                    folder = this.file.documentsDirectory + 'NoCloud/';
                    arr.push(this.downloadUrlToFolder(folder, fileName, urlDownload));
                } else if (this.platform.is('android')) {
                    folder = this.file.externalDataDirectory;
                    arr.push(this.downloadUrlToFolder(this.file.externalDataDirectory, fileName, urlDownload));
                }
                const fileNameAndPath = folder + fileName;
                await Promise.all(arr).then(() => {
                    r(fileNameAndPath);
                }).catch((err) => {
                    console.error(err);
                    r(null);
                });
            }, (err) => {
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(null);
                    return;
                }
                console.error(err);
                // try to login again
                if (this.userService.loggedUser != null) {
                    const user = this.userService.loggedUser.username;
                    const pass = this.userService.loggedUser.password;
                    this.userService.getUserByNameAndPassword(user, pass, true)
                        .then((userGot) => {
                            if (!userGot) {
                                this.userService.removeRefreshToken();
                                r(null);
                                return;
                            }
                            this.post(url, body, tryCount + 1).then((res2) => {
                                if (!res2) {
                                    r(null);
                                    return;
                                }
                                r(res2);
                            });
                        }).catch(() => {
                            r(null);
                        });
                    return;
                }
                this.userService.getRefreshToken()
                    .then((tokenData) => {
                        if (!tokenData) {
                            r(null);
                            return;
                        }
                        const user = tokenData.userName;
                        const pass = tokenData.pass;
                        this.userService.getUserByNameAndPassword(user, pass, false)
                            .then((userGot) => {
                                if (!userGot) {
                                    this.userService.removeRefreshToken();
                                    r(null);
                                    return;
                                }
                                this.downloadWithPost(url, body, fileName, tryCount + 1).then((res2) => {
                                    if (!res2) {
                                        r(null);
                                        return;
                                    }
                                    r(res2);
                                });
                            }).catch(() => {
                                r(null);
                            });
                    });
            });
        });
    }

    uploadWithPost(url: string, file: any, lang: string, storeId, staffId, tryCount: number = 0): Promise<any> {
        return new Promise((r) => {
            if (tryCount == 3) {
                r(null);
                return;
            }
            const headers = new HttpHeaders({ Authorization: 'Bearer ' + this.userService.token });
            const option = {
                headers
            };
            const formData = new FormData();
            formData.append('File', file);
            formData.append('Lang', lang);
            if (storeId) {
                formData.append('StoreId', storeId);
            }
            if (staffId) {
                formData.append('StaffId', staffId);
            }

            this.http.post(url, formData, option).subscribe(async (res) => {
                if (!res) {
                    r(null);
                    return;
                }
                r(res);
            }, () => {
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(null);
                    return;
                }
                // try to login again
                if (this.userService.loggedUser != null) {
                    const user = this.userService.loggedUser.username;
                    const pass = this.userService.loggedUser.password;
                    this.userService.getUserByNameAndPassword(user, pass, true)
                        .then((userGot) => {
                            if (!userGot) {
                                this.userService.removeRefreshToken();
                                r(null);
                                return;
                            }
                            this.uploadWithPost(url, file, lang, storeId, staffId, tryCount + 1).then((res2) => {
                                if (!res2) {
                                    r(null);
                                    return;
                                }
                                r(res2.json());
                            });
                        }).catch(() => {
                            r(null);
                        });
                    return;
                }
                this.userService.getRefreshToken()
                    .then((tokenData) => {
                        if (!tokenData) {
                            r(null);
                            return;
                        }
                        const user = tokenData.userName;
                        const pass = tokenData.pass;
                        this.userService.getUserByNameAndPassword(user, pass, false)
                            .then((userGot) => {
                                if (!userGot) {
                                    this.userService.removeRefreshToken();
                                    r(null);
                                    return;
                                }
                                this.uploadWithPost(url, file, lang, storeId, staffId, tryCount + 1).then((res2) => {
                                    if (!res2) {
                                        r(null);
                                        return;
                                    }
                                    r(res2.json());
                                });
                            }).catch(() => {
                                r(null);
                            });
                    });
            });
        });
    }

    get(url: string, tryCount: number = 0): Promise<any> {
        return new Promise((r) => {
            if (tryCount == 3) {
                r(null);
                return;
            }
            const tryLogin = () => {
                // try to login again
                if (this.userService.loggedUser != null) {
                    const user = this.userService.loggedUser.username;
                    const pass = this.userService.loggedUser.password;
                    this.userService.getUserByNameAndPassword(user, pass, true)
                        .then((userGot) => {
                            if (!userGot) {
                                this.userService.removeRefreshToken();
                                r(null);
                                return;
                            }
                            this.get(url, tryCount + 1).then((res2) => {
                                if (!res2) {
                                    r(null);
                                    return;
                                }
                                r(res2);
                            });
                        }).catch(() => {
                            r(null);
                        });
                    return;
                }
                this.userService.getRefreshToken()
                    .then((tokenData) => {
                        if (!tokenData) {
                            r(null);
                            return;
                        }
                        const user = tokenData.userName;
                        const pass = tokenData.pass;
                        this.userService.getUserByNameAndPassword(user, pass, true)
                            .then((userGot) => {
                                if (!userGot) {
                                    this.userService.removeRefreshToken();
                                    r(null);
                                    return;
                                }
                                this.get(url, tryCount + 1).then((res2) => {
                                    if (!res2) {
                                        r(null);
                                        return;
                                    }
                                    r(res2);
                                });
                            }).catch(() => {
                                r(null);
                            });
                    });
            }
            if (!this.userService.token) {
                tryLogin();
                return;
            }
            const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.userService.token });
            const option = {
                headers
            };
            this.http.get(url, option).subscribe((res) => {
                if (!res) {
                    r(null);
                    return;
                }
                const data = res;
                r(data);
            }, (err) => {
                console.error(err);
                if (!navigator.onLine) {
                    alert('Check your internet connection - Kiểm tra lại kết nối mạng.');
                    r(null);
                    return;
                }
                // try to login again
                tryLogin();
            });
        });
    }

    changePassword(newPassword: string, oldPassword: string): Promise<any> {
        return new Promise<any>((resolve, rej) => {
            const data = { newPassword, oldPassword };
            this.post(this.userService.authenApiUrl + '/user/UpdatePassword', data).then((result: any) => {
                resolve(result);
            }).catch((err) => {
                rej(err);
            });
        });
    }
}
