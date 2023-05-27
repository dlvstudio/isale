import { SyncStatus } from "capacitor-codepush/dist/esm/syncStatus";

declare let FB;

export function snake2Pascal(str) {
  str += '';
  str = str.split('-');

  function upper(str2: string) {
    return str2.slice(0, 1).toUpperCase() + str2.slice(1, str2.length);
  }

  for (let i = 0; i < str.length; i++) {
    const str2 = str[i].split('/');
    for (let j = 0; j < str2.length; j++) {
      str2[j] = upper(str2[j]);
    }
    str[i] = str2.join('');
  }
  return str.join('');
}

export function findChildInstructions(instructions: any[], name: string): any {
  if (!instructions || !instructions.length) {
    return null;
  }
  for (const instruction of instructions) {
    if (instruction && Array.isArray(instruction) && instruction[0] === name) {
      return instruction;
    }
  }
  return null;
}

export function hasInstructionValue(instructions: any[], value: string): any {
  if (!instructions || !instructions.length) {
    return false;
  }
  for (const instruction of instructions) {
    if (instruction === value) {
      return true;
    }
  }
  return false;
}

export function lowerModelKeys(model: any): any {
  if (model) {
    if (Array.isArray(model)) {
      const arr = [];
      for (const item of model) {
        arr.push(lowerModelKeys(item));
      }
      return arr;
    }
    if (!(typeof model === 'object')) {
      return model;
    }
    const member = {};
    // tslint:disable-next-line:forin
    for (const key in model) {
      member[key.toLowerCase()] = lowerModelKeys(model[key]);
    }
    return member;
  }
  return model;
}

export function isValidDate(d: any): boolean {
  if (Object.prototype.toString.call(d) === "[object Date]") {
    // it is a date
    if (isNaN(d.getTime())) {  // d.valueOf() could also work
      return false;
    }
    return true;
  }
  return false;
}

export function syncStatus(status: SyncStatus) {
  let message;
  switch (status) {
    case SyncStatus.DOWNLOADING_PACKAGE:
      message = 'DOWNLOADING_PACKAGE';
      break;
    case SyncStatus.AWAITING_USER_ACTION:
      message = 'AWAITING_USER_ACTION';
      break;
    case SyncStatus.CHECKING_FOR_UPDATE:
      message = 'CHECKING_FOR_UPDATE';
      break;
    case SyncStatus.ERROR:
      message = 'ERROR';
      break;
    case SyncStatus.INSTALLING_UPDATE:
      message = 'INSTALLING_UPDATE';
      break;
    case SyncStatus.IN_PROGRESS:
      message = 'IN_PROGRESS';
      break;
    case SyncStatus.IN_PROGRESS:
      message = 'IN_PROGRESS';
      break;
    case SyncStatus.UPDATE_IGNORED:
      message = 'UPDATE_IGNORED';
      break;
    case SyncStatus.UPDATE_INSTALLED:
      message = 'UPDATE_INSTALLED';
      break;
    case SyncStatus.UP_TO_DATE:
      message = 'UP_TO_DATE';
      break;
  }
  return message;
}

export function copyMessage(textToCopy: string) {
  // navigator clipboard api needs a secure context (https)
  if (navigator.clipboard && window.isSecureContext) {
    // navigator clipboard api method'
    return navigator.clipboard.writeText(textToCopy);
  } else {
    // text area method
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise<void>((res, rej) => {
      // here the magic happens
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      document.execCommand('copy') ? res() : rej();
      textArea.remove();
    });
  }
}

export function removeVietnameseTones(strInp: string): string {
  let str = strInp;
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  // Bỏ các khoảng trắng liền nhau
  str = str.replace(/ + /g, ' ');
  str = str.trim();
  // Remove punctuations
  // Bỏ dấu câu, kí tự đặc biệt
  str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, ' ');
  return str;
}

const phonePrefixs = [
  '08',
  '09',
  '03',
  '07',
  '05',
]

export function extractPhone(str: string) {
  const strTrim = str.replace(/[,:\-.!]/g, ''); // sử dụng chuỗi đại diện
  const arr = strTrim.split(' ');
  for (const s of arr) {
    if (!s || !s.length || s.length < 10) {
      continue;
    }
    for (const pre of phonePrefixs) {
      if (s.startsWith(pre)) {
        return s;
      }
    }
  }
  return null;
}

export function callFBAPI(path, method, params): Promise<any> {
  return new Promise(r => {
    FB.api(path, method, params, (response) => {
      r(response);
    });
  });
}

export function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
}

export function snakeToPascalCase(str) {
  return str.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function snakeToKebabCase(str) {
  return str.replace(/_/g, '-');
}

export function camelToKebab(camelCaseString) {
  return camelCaseString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function snakeToCamel(snakeCaseString) {
  return snakeCaseString.replace(/([-_]\w)/g, function (match) {
    return match.charAt(1).toUpperCase();
  });
}

