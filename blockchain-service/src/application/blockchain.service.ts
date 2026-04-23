import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BlockchainRepository } from '../infrastructure/persistence/blockchain.repository';
import { createHash } from 'crypto';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);

  constructor(private readonly blockchainRepository: BlockchainRepository) {}

  async onModuleInit() {
    const latest = await this.blockchainRepository.getLatestBlock();
    if (!latest) {
      await this.createGenesisBlock();
    }
    setInterval(() => this.mineBlock().catch(() => {}), 30000);
  }

  private async createGenesisBlock(): Promise<void> {
    const genesis = {
      blockIndex: 0,
      hash: this.sha256('genesis-going-ecuador-2026'),
      previousHash: '0000000000000000',
      timestamp: new Date(),
      transactions: [],
      merkleRoot: this.sha256(''),
      nonce: 0,
    };
    await this.blockchainRepository.createBlock(genesis);
    this.logger.log('Genesis block created');
  }

  async recordTrip(data: {
    rideId: string; userId: string; driverId: string;
    fromAddress: string; toAddress: string;
    distanceKm?: number; durationSeconds?: number;
    fare?: number; paymentMethod?: string; completedAt?: Date;
  }): Promise<any> {
    const existing = await this.blockchainRepository.findTripByRideId(data.rideId);
    if (existing) return existing;

    const hash = this.sha256(JSON.stringify({ ...data, recorded: Date.now() }));
    const record = await this.blockchainRepository.saveTripRecord({ ...data, hash, status: 'pending' });
    this.logger.log(`Trip ${data.rideId} recorded with hash ${hash.substring(0, 16)}...`);
    return record;
  }

  async getTrip(rideId: string): Promise<any> {
    const record = await this.blockchainRepository.findTripByRideId(rideId);
    if (!record) return null;
    return {
      rideId: record.rideId,
      hash: record.hash,
      blockHash: record.blockHash,
      status: record.status,
      data: {
        userId: record.userId,
        driverId: record.driverId,
        fromAddress: record.fromAddress,
        toAddress: record.toAddress,
        distanceKm: record.distanceKm,
        fare: record.fare,
        completedAt: record.completedAt,
      },
      verified: !!record.blockHash,
    };
  }

  async verify(hash: string): Promise<any> {
    const trip = await this.blockchainRepository.findTripByRideId(hash).catch(() => null)
      || await (async () => {
        const all = await this.blockchainRepository.getPendingTrips();
        return all.find(t => t.hash === hash);
      })();

    const block = await this.blockchainRepository.findBlockByHash(hash);

    if (!trip && !block) return { valid: false, message: 'Hash not found' };
    return { valid: true, type: block ? 'block' : 'trip', hash, timestamp: (trip || block).createdAt };
  }

  async mineBlock(): Promise<any | null> {
    const pending = await this.blockchainRepository.getPendingTrips();
    if (pending.length === 0) return null;

    const latest = await this.blockchainRepository.getLatestBlock();
    const transactions = pending.map(t => ({ rideId: t.rideId, hash: t.hash, fare: t.fare }));
    const merkleRoot = this.sha256(JSON.stringify(transactions));
    const blockIndex = (latest?.blockIndex ?? 0) + 1;
    const hash = this.sha256(`${blockIndex}${latest?.hash}${merkleRoot}${Date.now()}`);

    const block = await this.blockchainRepository.createBlock({
      blockIndex,
      hash,
      previousHash: latest?.hash ?? '0',
      timestamp: new Date(),
      transactions,
      merkleRoot,
      nonce: 0,
    });

    await this.blockchainRepository.confirmTrips(pending.map(t => t.rideId), hash);
    this.logger.log(`Block #${blockIndex} mined with ${transactions.length} transactions`);
    return block;
  }

  async getChainStats(): Promise<any> {
    const totalBlocks = await this.blockchainRepository.countBlocks();
    const latest = await this.blockchainRepository.getLatestBlock();
    return {
      totalBlocks,
      latestBlock: latest ? { index: latest.blockIndex, hash: latest.hash, timestamp: latest.timestamp } : null,
      network: 'going-mainnet',
      algorithm: 'SHA-256',
      status: 'operational',
    };
  }

  async getRecentBlocks(limit = 10): Promise<any> {
    const blocks = await this.blockchainRepository.getRecentBlocks(limit);
    return {
      blocks: blocks.map(b => ({
        index: b.blockIndex,
        hash: b.hash,
        previousHash: b.previousHash,
        timestamp: b.timestamp,
        transactionCount: b.transactions?.length ?? 0,
      })),
    };
  }

  private sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
