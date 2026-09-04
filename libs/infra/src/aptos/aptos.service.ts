import {
  Account,
  AccountAddress,
  AnyRawTransaction,
  Aptos,
  Ed25519PrivateKey,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
  InputGenerateTransactionPayloadData,
  TransactionWorkerEventsEnum,
  InputGenerateTransactionOptions,
  SimpleTransaction,
  KeylessPublicKey,
  Signature,
  AptosConfig,
  Network,
  Deserializer,
  Hex,
  KeylessSignature,
} from '@aptos-labs/ts-sdk';
import { Logger } from '@libs/common/loggers';
import { StringUtils } from '@libs/common/utils';
import { stringToHex, stringToHexString } from '@libs/common/utils/function';
import { EEnvKey } from '@libs/constants/env.constant';
import { APTOS_INSTANCE_TOKEN } from '@libs/infra/aptos/aptos.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AptosService {
  private readonly _logger = new Logger(AptosService.name);
  private readonly adminAccount: Account;

  constructor(
    @Inject(APTOS_INSTANCE_TOKEN)
    private readonly _aptos: Aptos,
    public readonly configService: ConfigService,
  ) {
    const adminPrivateKey = this.configService.get<string>(EEnvKey.SNAXFI_ADMIN_KEY);
    this.adminAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(adminPrivateKey),
    });
    _aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSendFailed, async data => {
      this._logger.error('Transaction send failed:', data.message);
    });

    _aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionExecutionFailed, async data => {
      this._logger.error('Transaction execution failed:', data.message);
    });

    _aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionExecuted, async data => {
      this._logger.info(`Transaction hash ${data.transactionHash} executed:`, data.message);
    });

    _aptos.transaction.batch.on(TransactionWorkerEventsEnum.TransactionSent, async data => {
      this._logger.info(`Transaction hash ${data.transactionHash} sent:`, data.message);
    });

    _aptos.transaction.batch.on(TransactionWorkerEventsEnum.ExecutionFinish, async data => {
      this._logger.info('Execution finished:', data.message);
    });
  }

  public getAptos(): Aptos {
    return this._aptos;
  }

  public async getAptBalance(address: string): Promise<number> {
    try {
      return this._aptos.account.getAccountAPTAmount({
        accountAddress: AccountAddress.fromString(address),
      });
    } catch (e) {
      this._logger.error(`[getAptBalance] Failed to fetch balance: ${e.message}`);
    }
    return 0;
  }

  public async getTokenDecimals(tokenAddress: string): Promise<number> {
    const tokenMetadata = await this._aptos.fungibleAsset.getFungibleAssetMetadataByAssetType({
      assetType: tokenAddress,
    });
    return tokenMetadata.decimals;
  }

  public getAccountAddressFromPublicKey(publicKey: Ed25519PublicKey): AccountAddress {
    return publicKey.authKey().derivedAddress();
  }

  public getAccountAddressFromPublicKeyKeyLess(publicKey: KeylessPublicKey): AccountAddress {
    return publicKey.authKey().derivedAddress();
  }

  async verifyKeylessMessage(pubKey: KeylessPublicKey, signature: Signature, message: string): Promise<boolean> {
    try {
      return pubKey.verifySignatureAsync({
        message: stringToHexString(message),
        signature: signature,
        aptosConfig: new AptosConfig({
          network: Network.TESTNET,
        }),
      });
    } catch (err) {
      console.error('verifyKeylessMessage error:', err);
      return false;
    }
  }

  /**
   * Verify Ed25519 signature with message
   */
  async verifyEd25519Message(
    publicKey: Ed25519PublicKey,
    signature: Ed25519Signature,
    message: string,
  ): Promise<boolean> {
    try {
      return publicKey.verifySignature({
        message: stringToHex(message),
        signature: signature,
      });
    } catch (err) {
      console.error('verifyEd25519Message error:', err);
      return false;
    }
  }
  public async verifyMultiAgentTransaction(
    publicKey: Ed25519PublicKey,
    signature: Ed25519Signature,
    transaction: AnyRawTransaction,
  ): Promise<boolean> {
    const signingMessage = generateSigningMessageForTransaction(transaction);
    return publicKey.verifySignature({
      message: signingMessage,
      signature,
    });
  }
  public async generateKeylessPubkeyFromPublickey(publicKey: string) {
    const deserialze = new Deserializer(Hex.fromHexInput(publicKey.slice(4)).toUint8Array()); // Remove 0x03 prefix
    const keylessPubkey = KeylessPublicKey.deserialize(deserialze);
    return keylessPubkey;
  }

  public async generateKeylessSignFromSignature(signature: string) {
    const deserialze = new Deserializer(Hex.fromHexString(signature).toUint8Array());
    const keylessSignature = KeylessSignature.deserialize(deserialze);
    return keylessSignature;
  }
  public async simulateTransaction(signer: Account, transaction: SimpleTransaction): Promise<boolean> {
    const aptos = this.getAptos();
    const [simulationResult] = await aptos.transaction.simulate.simple({
      signerPublicKey: signer.publicKey,
      transaction,
    });
    if (!simulationResult.success) {
      this._logger.error(`Transaction simulation failed: ${JSON.stringify(simulationResult)}`);
    }
    return simulationResult.success;
  }

  public async batchTransactions(
    data: InputGenerateTransactionPayloadData[],
    options: InputGenerateTransactionOptions = { maxGasAmount: 20000, gasUnitPrice: 100 },
  ): Promise<void> {
    const aptos = this.getAptos();
    const executableTransactionsData = [];
    await Promise.all(
      data.map(async (transactionData: InputGenerateTransactionPayloadData) => {
        const transaction = await aptos.transaction.build.simple({
          sender: this.adminAccount.accountAddress,
          data: transactionData,
          options,
        });
        const isExecutable = await this.simulateTransaction(this.adminAccount, transaction);
        if (isExecutable) {
          executableTransactionsData.push(transactionData);
        }
      }),
    );
    this._logger.info(`Batching ${executableTransactionsData.length} executable transactions out of ${data.length}`);
    aptos.transaction.batch.forSingleAccount({
      sender: this.adminAccount,
      data: executableTransactionsData,
      options,
    });
  }

  public async getTokenAddress(fungibleAddress: string): Promise<string> {
    let tokenAddress = fungibleAddress;
    try {
      const pairedCoinType = await this._aptos.view({
        payload: {
          function: `0x1::coin::paired_coin`,
          functionArguments: [tokenAddress],
          typeArguments: [],
        },
      });
      if (!pairedCoinType.length || !(pairedCoinType[0] as any).vec[0]) {
        return tokenAddress; // If no paired coin type found, return the original address
      }
      const { account_address, module_name, struct_name } = (pairedCoinType[0] as any).vec[0];
      tokenAddress = `${account_address}::${StringUtils.hexToString(module_name)}::${StringUtils.hexToString(
        struct_name,
      )}`;
    } catch (error) {
      this._logger.error(`Failed to get token address for ${fungibleAddress}: ${error.message}`);
    }
    return tokenAddress;
  }
  public async getAllCoinsByAddress(address: string): Promise<
    {
      assetType: string;
      amount: number;
    }[]
  > {
    try {
      const coins = await this._aptos.account.getAccountCoinsData({
        accountAddress: AccountAddress.fromString(address),
      });
      return coins.map(coin => ({
        assetType: coin.asset_type,
        amount: coin.amount,
      }));
    } catch (error) {
      this._logger.error(`Failed to get all coins for address ${address}: ${error.message}`);
      return [];
    }
  }
}
