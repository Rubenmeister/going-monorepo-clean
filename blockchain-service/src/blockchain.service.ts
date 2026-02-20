/**
 * Blockchain Integration Service
 * Smart contracts for payments, transparent ledger, and transaction verification
 */

import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

export interface BlockchainTransaction {
  id?: string;
  transactionHash: string;
  from: string;
  to: string;
  amount: number; // in wei
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  gasUsed?: number;
  gasPrice?: string;
  blockNumber?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SmartContractPayment {
  id?: string;
  contractAddress: string;
  payerAddress: string;
  payeeAddress: string;
  amount: number; // in wei
  escrowAmount: number; // in wei
  status: 'PENDING' | 'LOCKED' | 'RELEASED' | 'REFUNDED';
  transactionHash?: string;
  condition?: string; // e.g., "DELIVERY_CONFIRMED"
  confirmedAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id?: string;
  transactionHash: string;
  action: string;
  actor: string;
  details: Record<string, any>;
  timestamp: Date;
  blockchainTimestamp: number;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  // In-memory storage (use MongoDB in production)
  private transactions: Map<string, BlockchainTransaction> = new Map();
  private payments: Map<string, SmartContractPayment> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    // Initialize Ethereum connection
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545';
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Smart contract ABI (simplified)
    const contractABI = [
      'function createEscrow(address payee, uint256 amount) public payable returns (bytes32)',
      'function releaseEscrow(bytes32 escrowId) public',
      'function refundEscrow(bytes32 escrowId) public',
      'function getEscrowStatus(bytes32 escrowId) public view returns (uint8)',
      'function recordDelivery(bytes32 orderId, string ipfsHash) public',
    ];

    const contractAddress =
      process.env.SMART_CONTRACT_ADDRESS ||
      '0x0000000000000000000000000000000000000000';
    this.contract = new ethers.Contract(
      contractAddress,
      contractABI,
      this.wallet
    );

    this.logger.log(`🔗 Blockchain service initialized (Network: Polygon)`);
  }

  /**
   * Create escrow payment for delivery
   * Amount locked until delivery confirmation
   */
  async createEscrowPayment(
    payerAddress: string,
    payeeAddress: string,
    amount: number,
    orderId: string
  ): Promise<SmartContractPayment> {
    try {
      const amountInWei = ethers.parseEther(amount.toString());

      // Call smart contract to create escrow
      const tx = await this.contract.createEscrow(payeeAddress, amountInWei, {
        from: payerAddress,
        value: amountInWei,
      });

      await tx.wait(); // Wait for confirmation

      const payment: SmartContractPayment = {
        id: `pay-${Date.now()}`,
        contractAddress: this.contract.address,
        payerAddress,
        payeeAddress,
        amount: Number(amountInWei),
        escrowAmount: Number(amountInWei),
        status: 'LOCKED',
        transactionHash: tx.hash,
        condition: 'DELIVERY_CONFIRMED',
        createdAt: new Date(),
      };

      this.payments.set(payment.id!, payment);

      // Record audit log
      await this.recordAuditLog(tx.hash, 'ESCROW_CREATED', payerAddress, {
        payee: payeeAddress,
        amount: amount,
        orderId,
      });

      this.logger.log(`💰 Escrow created: ${amount} ETH for order ${orderId}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to create escrow: ${error}`);
      throw error;
    }
  }

  /**
   * Confirm delivery and release escrow funds to driver
   */
  async releaseEscrow(
    paymentId: string,
    deliveryProof: string
  ): Promise<BlockchainTransaction> {
    try {
      const payment = this.payments.get(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Call smart contract to release funds
      const tx = await this.contract.releaseEscrow(paymentId);
      await tx.wait();

      payment.status = 'RELEASED';
      payment.confirmedAt = new Date();

      // Record blockchain transaction
      const blockchainTx: BlockchainTransaction = {
        id: `txn-${Date.now()}`,
        transactionHash: tx.hash,
        from: this.wallet.address,
        to: payment.payeeAddress,
        amount: payment.escrowAmount,
        status: 'CONFIRMED',
        timestamp: new Date(),
        metadata: { paymentId, deliveryProof },
      };

      this.transactions.set(tx.hash, blockchainTx);

      // Record audit log
      await this.recordAuditLog(
        tx.hash,
        'ESCROW_RELEASED',
        payment.payerAddress,
        {
          amount: ethers.formatEther(payment.escrowAmount),
          recipient: payment.payeeAddress,
          deliveryProof,
        }
      );

      this.logger.log(
        `✅ Escrow released: ${ethers.formatEther(payment.escrowAmount)} ETH`
      );
      return blockchainTx;
    } catch (error) {
      this.logger.error(`Failed to release escrow: ${error}`);
      throw error;
    }
  }

  /**
   * Refund escrow if delivery failed or disputed
   */
  async refundEscrow(
    paymentId: string,
    reason: string
  ): Promise<BlockchainTransaction> {
    try {
      const payment = this.payments.get(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Call smart contract to refund
      const tx = await this.contract.refundEscrow(paymentId);
      await tx.wait();

      payment.status = 'REFUNDED';

      // Record blockchain transaction
      const blockchainTx: BlockchainTransaction = {
        id: `txn-${Date.now()}`,
        transactionHash: tx.hash,
        from: this.wallet.address,
        to: payment.payerAddress,
        amount: payment.escrowAmount,
        status: 'CONFIRMED',
        timestamp: new Date(),
        metadata: { paymentId, reason },
      };

      this.transactions.set(tx.hash, blockchainTx);

      // Record audit log
      await this.recordAuditLog(
        tx.hash,
        'ESCROW_REFUNDED',
        payment.payerAddress,
        {
          amount: ethers.formatEther(payment.escrowAmount),
          reason,
        }
      );

      this.logger.log(
        `🔄 Escrow refunded: ${ethers.formatEther(
          payment.escrowAmount
        )} ETH (${reason})`
      );
      return blockchainTx;
    } catch (error) {
      this.logger.error(`Failed to refund escrow: ${error}`);
      throw error;
    }
  }

  /**
   * Record delivery on blockchain
   */
  async recordDelivery(
    orderId: string,
    ipfsHash: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Store delivery proof on IPFS (simplified: using hash directly)
      const tx = await this.contract.recordDelivery(orderId, ipfsHash);
      await tx.wait();

      // Record audit log
      await this.recordAuditLog(
        tx.hash,
        'DELIVERY_RECORDED',
        this.wallet.address,
        {
          orderId,
          ipfsHash,
          metadata,
        }
      );

      this.logger.log(`📦 Delivery recorded on blockchain: ${orderId}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to record delivery: ${error}`);
      throw error;
    }
  }

  /**
   * Record transaction on blockchain
   */
  async recordTransaction(
    from: string,
    to: string,
    amount: number,
    description: string
  ): Promise<BlockchainTransaction> {
    try {
      const amountInWei = ethers.parseEther(amount.toString());

      // Send transaction
      const tx = await this.wallet.sendTransaction({
        to,
        value: amountInWei,
      });

      const receipt = await tx.wait();

      const blockchainTx: BlockchainTransaction = {
        id: `txn-${Date.now()}`,
        transactionHash: tx.hash,
        from: this.wallet.address,
        to,
        amount: Number(amountInWei),
        status: receipt ? 'CONFIRMED' : 'PENDING',
        gasUsed: receipt?.gasUsed ? Number(receipt.gasUsed) : undefined,
        gasPrice: tx.gasPrice?.toString(),
        blockNumber: receipt?.blockNumber,
        timestamp: new Date(),
        metadata: { description },
      };

      this.transactions.set(tx.hash, blockchainTx);

      // Record audit log
      await this.recordAuditLog(tx.hash, 'TRANSACTION_RECORDED', from, {
        to,
        amount,
        description,
      });

      this.logger.log(`💳 Transaction recorded: ${amount} ETH to ${to}`);
      return blockchainTx;
    } catch (error) {
      this.logger.error(`Failed to record transaction: ${error}`);
      throw error;
    }
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(
    transactionHash: string
  ): Promise<BlockchainTransaction | null> {
    try {
      // Check in-memory first
      let tx = this.transactions.get(transactionHash);
      if (tx) return tx;

      // Query blockchain
      const receipt = await this.provider.getTransactionReceipt(
        transactionHash
      );
      if (!receipt) return null;

      const transaction = await this.provider.getTransaction(transactionHash);
      if (!transaction) return null;

      tx = {
        id: `txn-${Date.now()}`,
        transactionHash,
        from: transaction.from || '',
        to: transaction.to || '',
        amount: Number(transaction.value),
        status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
        gasUsed: Number(receipt.gasUsed),
        gasPrice: transaction.gasPrice?.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
      };

      this.transactions.set(transactionHash, tx);
      return tx;
    } catch (error) {
      this.logger.error(`Failed to get transaction status: ${error}`);
      throw error;
    }
  }

  /**
   * Record audit log entry
   */
  private async recordAuditLog(
    transactionHash: string,
    action: string,
    actor: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      // Get blockchain timestamp
      const block = await this.provider.getBlock('latest');
      const blockchainTimestamp =
        block?.timestamp || Math.floor(Date.now() / 1000);

      const log: AuditLog = {
        id: `log-${Date.now()}`,
        transactionHash,
        action,
        actor,
        details,
        timestamp: new Date(),
        blockchainTimestamp,
      };

      this.auditLogs.push(log);
      this.logger.log(`📋 Audit log recorded: ${action}`);
    } catch (error) {
      this.logger.error(`Failed to record audit log: ${error}`);
    }
  }

  /**
   * Get audit trail for order
   */
  async getAuditTrail(orderId: string): Promise<AuditLog[]> {
    try {
      return this.auditLogs.filter(
        (log) =>
          log.details.orderId === orderId || log.details.description === orderId
      );
    } catch (error) {
      this.logger.error(`Failed to get audit trail: ${error}`);
      throw error;
    }
  }

  /**
   * Get all transactions
   */
  async getTransactions(limit = 50): Promise<BlockchainTransaction[]> {
    try {
      return Array.from(this.transactions.values()).slice(-limit);
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string
  ): Promise<SmartContractPayment | null> {
    try {
      return this.payments.get(paymentId) || null;
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error}`);
      throw error;
    }
  }

  /**
   * Verify transaction on blockchain
   */
  async verifyTransaction(transactionHash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.getTransactionReceipt(
        transactionHash
      );
      return receipt !== null && receipt.status === 1;
    } catch (error) {
      this.logger.error(`Failed to verify transaction: ${error}`);
      return false;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get wallet balance: ${error}`);
      throw error;
    }
  }

  /**
   * Get smart contract balance
   */
  async getContractBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.contract.address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get contract balance: ${error}`);
      throw error;
    }
  }

  /**
   * Create transparent ledger snapshot
   */
  async createLedgerSnapshot(): Promise<any> {
    try {
      const snapshot = {
        timestamp: new Date(),
        totalTransactions: this.transactions.size,
        totalPayments: this.payments.size,
        transactions: Array.from(this.transactions.values()).map((t) => ({
          hash: t.transactionHash,
          from: t.from,
          to: t.to,
          amount: ethers.formatEther(t.amount),
          status: t.status,
          blockNumber: t.blockNumber,
        })),
        payments: Array.from(this.payments.values()).map((p) => ({
          id: p.id,
          payer: p.payerAddress,
          payee: p.payeeAddress,
          amount: ethers.formatEther(p.amount),
          status: p.status,
          confirmedAt: p.confirmedAt,
        })),
        auditLog: this.auditLogs.slice(-100),
      };

      this.logger.log(
        `📊 Ledger snapshot created: ${this.transactions.size} transactions`
      );
      return snapshot;
    } catch (error) {
      this.logger.error(`Failed to create ledger snapshot: ${error}`);
      throw error;
    }
  }
}
