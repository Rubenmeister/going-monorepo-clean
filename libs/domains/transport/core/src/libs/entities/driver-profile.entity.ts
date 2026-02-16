import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { DocumentUpload, DocumentType, DocumentStatus } from '../value-objects/document-upload.vo';

export type DriverProfileStatus = 'pending_verification' | 'active' | 'suspended' | 'rejected';

export const REQUIRED_DRIVER_DOCUMENTS: DocumentType[] = [
  DocumentType.DRIVER_LICENSE,
  DocumentType.ID_DOCUMENT,
  DocumentType.CRIMINAL_RECORD,
  DocumentType.DRIVER_PHOTO,
  DocumentType.DRIVER_VIDEO,
];

export interface DriverProfileProps {
  id: UUID;
  userId: UUID;
  phone: string;
  whatsappNumber: string;
  documents: DocumentUpload[];
  rating: number;
  totalTrips: number;
  status: DriverProfileStatus;
  createdAt: Date;
  verifiedAt?: Date;
}

export class DriverProfile {
  readonly id: UUID;
  readonly userId: UUID;
  readonly phone: string;
  readonly whatsappNumber: string;
  readonly documents: DocumentUpload[];
  readonly rating: number;
  readonly totalTrips: number;
  readonly status: DriverProfileStatus;
  readonly createdAt: Date;
  readonly verifiedAt?: Date;

  private constructor(props: DriverProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.phone = props.phone;
    this.whatsappNumber = props.whatsappNumber;
    this.documents = props.documents;
    this.rating = props.rating;
    this.totalTrips = props.totalTrips;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.verifiedAt = props.verifiedAt;
  }

  public static create(props: {
    userId: UUID;
    phone: string;
    whatsappNumber: string;
  }): Result<DriverProfile, Error> {
    if (!props.phone || props.phone.length < 7) {
      return err(new Error('Valid phone number is required'));
    }
    if (!props.whatsappNumber || props.whatsappNumber.length < 7) {
      return err(new Error('WhatsApp number is required'));
    }

    return ok(new DriverProfile({
      id: uuidv4(),
      userId: props.userId,
      phone: props.phone,
      whatsappNumber: props.whatsappNumber,
      documents: [],
      rating: 5.0,
      totalTrips: 0,
      status: 'pending_verification',
      createdAt: new Date(),
    }));
  }

  public addDocument(doc: DocumentUpload): DriverProfile {
    return new DriverProfile({
      ...this,
      documents: [...this.documents, doc],
    });
  }

  public hasAllRequiredDocuments(): boolean {
    return REQUIRED_DRIVER_DOCUMENTS.every(reqType =>
      this.documents.some(d => d.type === reqType && d.status === DocumentStatus.APPROVED),
    );
  }

  public getMissingDocuments(): DocumentType[] {
    return REQUIRED_DRIVER_DOCUMENTS.filter(reqType =>
      !this.documents.some(d => d.type === reqType && d.status === DocumentStatus.APPROVED),
    );
  }

  public verify(): Result<DriverProfile, Error> {
    if (!this.hasAllRequiredDocuments()) {
      const missing = this.getMissingDocuments();
      return err(new Error(`Missing approved documents: ${missing.join(', ')}`));
    }
    return ok(new DriverProfile({
      ...this,
      status: 'active',
      verifiedAt: new Date(),
    }));
  }

  public suspend(): DriverProfile {
    return new DriverProfile({ ...this, status: 'suspended' });
  }

  public reject(): DriverProfile {
    return new DriverProfile({ ...this, status: 'rejected' });
  }

  public updateRating(newRating: number): Result<DriverProfile, Error> {
    if (newRating < 1 || newRating > 5) {
      return err(new Error('Rating must be between 1 and 5'));
    }
    const updatedRating = ((this.rating * this.totalTrips) + newRating) / (this.totalTrips + 1);
    return ok(new DriverProfile({
      ...this,
      rating: Math.round(updatedRating * 100) / 100,
      totalTrips: this.totalTrips + 1,
    }));
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      phone: this.phone,
      whatsappNumber: this.whatsappNumber,
      documents: this.documents.map(d => d.toPrimitives()),
      rating: this.rating,
      totalTrips: this.totalTrips,
      status: this.status,
      createdAt: this.createdAt,
      verifiedAt: this.verifiedAt,
    };
  }

  public static fromPrimitives(props: any): DriverProfile {
    return new DriverProfile({
      ...props,
      documents: props.documents.map((d: any) => DocumentUpload.fromPrimitives(d)),
    });
  }
}
