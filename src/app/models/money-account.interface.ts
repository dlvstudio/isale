export interface IMoneyAccount {
    id: number;
    accountName: string;
    total: number;
    createdAt: string;
    modifiedAt: string;
    isDefault: boolean;
    onlineId: number;
    bankName: string;
    bankNumber: string;
    bankAccountName: string;
}
