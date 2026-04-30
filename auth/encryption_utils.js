import * as crypto from "node:crypto";
import { GLOBAL } from "../config/globals.js";


function encrypt(string){
    const toBeEncryptedString = JSON.stringify(string);

    const initializationVector = crypto.randomBytes(GLOBAL.IV_BYTE_LENGTH);

    const cypherInstance = crypto.createCipheriv(GLOBAL.LOCATION_ENCRYPTION_ALGORITHM,
                                                            GLOBAL.LOCATION_ENCRYPTION_MASTER,
                                                            initializationVector,
                                                    {authTagLength: GLOBAL.AUTH_TAG_BYTE_LENGTH}
    );

    let encryptedData = cypherInstance.update(toBeEncryptedString, 'utf-8', 'hex');
    encryptedData += cypherInstance.final('hex');

    const authTag = cypherInstance.getAuthTag().toString('hex');

    return `${initializationVector.toString('hex')}:${encryptedData}:${authTag}`;
}

function decrypt(encryptedString){
    const [initializationVectorHEX, encryptedData, authTagHEX] = encryptedString.split(':');

    const initializationVectorBYTES = Buffer.from(initializationVectorHEX, 'hex');
    const authTagBYTES = Buffer.from(authTagHEX, 'hex');

    const decipherInstance = crypto.createDecipheriv(GLOBAL.LOCATION_ENCRYPTION_ALGORITHM,
                                                                  GLOBAL.LOCATION_ENCRYPTION_MASTER,
                                                                  initializationVectorBYTES,
                                                          {authTagLength: GLOBAL.AUTH_TAG_BYTE_LENGTH}
    );

    decipherInstance.setAuthTag(authTagBYTES);

    let decryptedData = decipherInstance.update(encryptedData, 'hex', 'utf-8');
    decryptedData += decipherInstance.final('utf-8');

    return JSON.parse(decryptedData);
}

export {encrypt, decrypt};