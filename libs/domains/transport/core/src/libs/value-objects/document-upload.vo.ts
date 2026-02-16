import { Result, ok, err } from 'neverthrow';

export enum DocumentType {
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  CRIMINAL_RECORD = 'CRIMINAL_RECORD',
  VEHICLE_INSPECTION = 'VEHICLE_INSPECTION',
  DRIVER_PHOTO = 'DRIVER_PHOTO',
  DRIVER_VIDEO = 'DRIVER_VIDEO',
  VEHICLE_PHOTO_FRONT = 'VEHICLE_PHOTO_FRONT',
  VEHICLE_PHOTO_BACK = 'VEHICLE_PHOTO_BACK',
  VEHICLE_PHOTO_INTERIOR = 'VEHICLE_PHOTO_INTERIOR',
  VEHICLE_PHOTO_DASHCAM = 'VEHICLE_PHOTO_DASHCAM',
  VEHICLE_VIDEO = 'VEHICLE_VIDEO',
  ID_DOCUMENT = 'ID_DOCUMENT',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface DocumentUploadProps {
  type: DocumentType;
  url: string;
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  expiresAt?: Date;
  rejectionReason?: string;
}

export class DocumentUpload {
  readonly type: DocumentType;
  readonly url: string;
  readonly mimeType: string;
  readonly status: DocumentStatus;
  readonly uploadedAt: Date;
  readonly reviewedAt?: Date;
  readonly expiresAt?: Date;
  readonly rejectionReason?: string;

  private constructor(props: DocumentUploadProps) {
    this.type = props.type;
    this.url = props.url;
    this.mimeType = props.mimeType;
    this.status = props.status;
    this.uploadedAt = props.uploadedAt;
    this.reviewedAt = props.reviewedAt;
    this.expiresAt = props.expiresAt;
    this.rejectionReason = props.rejectionReason;
  }

  public static create(props: {
    type: DocumentType;
    url: string;
    mimeType: string;
    expiresAt?: Date;
  }): Result<DocumentUpload, Error> {
    if (!props.url || props.url.length === 0) {
      return err(new Error('Document URL is required'));
    }
    const validMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
    ];
    if (!validMimeTypes.includes(props.mimeType)) {
      return err(new Error(`Invalid mime type: ${props.mimeType}`));
    }
    return ok(new DocumentUpload({
      ...props,
      status: DocumentStatus.PENDING_REVIEW,
      uploadedAt: new Date(),
    }));
  }

  public approve(): DocumentUpload {
    return new DocumentUpload({
      ...this,
      status: DocumentStatus.APPROVED,
      reviewedAt: new Date(),
    });
  }

  public reject(reason: string): DocumentUpload {
    return new DocumentUpload({
      ...this,
      status: DocumentStatus.REJECTED,
      reviewedAt: new Date(),
      rejectionReason: reason,
    });
  }

  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  public toPrimitives(): DocumentUploadProps {
    return { ...this };
  }

  public static fromPrimitives(props: DocumentUploadProps): DocumentUpload {
    return new DocumentUpload(props);
  }
}
