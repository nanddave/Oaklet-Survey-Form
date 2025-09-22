import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { logger } from '../config/logger';

export interface SensitiveData {
  email: string;
  healthResponses: {
    q2?: string;
    q3: string;
    q4?: string;
    q5: string;
  };
}

export class SurveyEncryptionService {
  private kms?: KMSClient;
  private keyId: string;

  constructor() {
    this.kms = new KMSClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.keyId = process.env.SURVEY_KMS_KEY_ID || 'alias/oaklet-survey-hipaa';
  }

  async encryptPHI(data: SensitiveData): Promise<string> {
    try {
      if (!this.kms) {
        throw new Error('KMS client not initialized');
      }

      const sensitiveData = {
        ...data,
        encryptedAt: new Date().toISOString(),
        version: '1.0'
      };

      const command = new EncryptCommand({
        KeyId: this.keyId,
        Plaintext: Buffer.from(JSON.stringify(sensitiveData), 'utf-8')
      });

      const result = await this.kms.send(command);
      
      if (!result.CiphertextBlob) {
        throw new Error('No ciphertext returned from KMS');
      }

      logger.info('Successfully encrypted PHI data', {
        keyId: this.keyId,
        dataSize: JSON.stringify(sensitiveData).length
      });

      return Buffer.from(result.CiphertextBlob).toString('base64');
    } catch (error) {
      logger.error('Failed to encrypt PHI data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: this.keyId
      });
      throw error;
    }
  }

  async decryptPHI(encryptedData: string): Promise<SensitiveData> {
    try {
      if (!this.kms) {
        throw new Error('KMS client not initialized');
      }

      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData, 'base64')
      });

      const result = await this.kms.send(command);
      
      if (!result.Plaintext) {
        throw new Error('No plaintext returned from KMS');
      }

      const decryptedData = Buffer.from(result.Plaintext).toString('utf-8');
      const parsedData = JSON.parse(decryptedData);

      logger.info('Successfully decrypted PHI data', {
        version: parsedData.version,
        encryptedAt: parsedData.encryptedAt
      });

      // Remove metadata and return just the sensitive data
      const { encryptedAt, version, ...sensitiveData } = parsedData;
      return sensitiveData;
    } catch (error) {
      logger.error('Failed to decrypt PHI data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keyId: this.keyId
      });
      throw error;
    }
  }

  async testEncryption(): Promise<boolean> {
    const testData: SensitiveData = {
      email: 'encryption.test@oaklet.internal',
      healthResponses: {
        q3: 'test response',
        q5: 'test response 2'
      }
    };

    const encrypted = await this.encryptPHI(testData);
    const decrypted = await this.decryptPHI(encrypted);

    const isValid = decrypted.email === testData.email && 
                   decrypted.healthResponses.q3 === testData.healthResponses.q3;

    logger.info('Encryption test result', { isValid });
    return isValid;
  }
}
