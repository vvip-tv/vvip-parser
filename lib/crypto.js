import CryptoJS from 'crypto-js';
import forge from 'node-forge';

// MD5加密
export function md5(text) {
    return CryptoJS.MD5(text).toString();
}

export function md5X(text) {
    return md5(text);
}

// AES加密解密
export function aesX(mode, encrypt, input, key, iv = '') {
    try {
        // 标准化模式名称
        const modeMap = {
            'ECB': CryptoJS.mode.ECB,
            'CBC': CryptoJS.mode.CBC,
            'CFB': CryptoJS.mode.CFB,
            'OFB': CryptoJS.mode.OFB,
            'CTR': CryptoJS.mode.CTR
        };

        const paddingMap = {
            'Pkcs7': CryptoJS.pad.Pkcs7,
            'NoPadding': CryptoJS.pad.NoPadding,
            'ZeroPadding': CryptoJS.pad.ZeroPadding,
            'Iso10126': CryptoJS.pad.Iso10126,
            'Iso97971': CryptoJS.pad.Iso97971,
            'AnsiX923': CryptoJS.pad.AnsiX923
        };

        // 解析模式和填充
        const parts = mode.split('/');
        const cipherMode = modeMap[parts[0]] || CryptoJS.mode.ECB;
        const padding = paddingMap[parts[1]] || CryptoJS.pad.Pkcs7;

        const keyWordArray = CryptoJS.enc.Utf8.parse(key);
        const ivWordArray = iv ? CryptoJS.enc.Utf8.parse(iv) : undefined;

        const config = {
            mode: cipherMode,
            padding: padding
        };

        if (ivWordArray && parts[0] !== 'ECB') {
            config.iv = ivWordArray;
        }

        if (encrypt) {
            const encrypted = CryptoJS.AES.encrypt(input, keyWordArray, config);
            return encrypted.toString();
        } else {
            const decrypted = CryptoJS.AES.decrypt(input, keyWordArray, config);
            return decrypted.toString(CryptoJS.enc.Utf8);
        }
    } catch (error) {
        console.error('AES operation failed:', error);
        return '';
    }
}

// RSA加密解密
export function rsaX(mode, encrypt, input, key) {
    try {
        if (encrypt) {
            // RSA加密
            const publicKey = forge.pki.publicKeyFromPem(key);
            const encrypted = publicKey.encrypt(input, mode);
            return forge.util.encode64(encrypted);
        } else {
            // RSA解密
            const privateKey = forge.pki.privateKeyFromPem(key);
            const decoded = forge.util.decode64(input);
            const decrypted = privateKey.decrypt(decoded, mode);
            return decrypted;
        }
    } catch (error) {
        console.error('RSA operation failed:', error);
        return '';
    }
}

// 导出所有加密函数
export default {
    md5,
    md5X,
    aesX,
    rsaX
};