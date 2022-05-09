import Cryptr from 'cryptr'

export function encryptSecretKey(secretKey: string, key: string) {
    const cryptr = new Cryptr(key);
    const encryptedSecretKey = cryptr.encrypt(secretKey);
    return encryptedSecretKey;

}
export function decryptSecretKey(encryptedString: string, key: string) {
    const cryptr = new Cryptr(key);
    const decryptedSecretKey= cryptr.decrypt(encryptedString);
    return decryptedSecretKey;
}

