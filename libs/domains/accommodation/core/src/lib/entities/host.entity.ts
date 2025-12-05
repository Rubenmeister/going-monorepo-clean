import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result, ok, err } from 'neverthrow';

// Definimos los posibles estados de verificación del anfitrión
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface HostProps {
  id: UUID;
  userId: UUID; // Referencia al ID de User en el User-Auth-Service
  companyName: string;
  verificationStatus: VerificationStatus;
  bio: string;
  documentId: string; // ID del documento de verificación
  createdAt: Date;
}

export class Host {
  readonly id: UUID;
  readonly userId: UUID;
  readonly companyName: string;
  readonly verificationStatus: VerificationStatus;
  readonly bio: string;
  readonly documentId: string;
  readonly createdAt: Date;

  private constructor(props: HostProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.companyName = props.companyName;
    this.verificationStatus = props.verificationStatus;
    this.bio = props.bio;
    this.documentId = props.documentId;
    this.createdAt = props.createdAt;
  }

  // Lógica de Negocio: Creación inicial al registrarse
  public static create(props: Omit<HostProps, 'id' | 'verificationStatus' | 'createdAt'>): Result<Host, Error> {
    
    if (props.companyName.length < 5) {
      return err(new Error('Company name is too short.'));
    }
    
    const host = new Host({
      ...props,
      id: new UUID(),
      verificationStatus: 'pending', // Siempre comienza pendiente
      createdAt: new Date(),
    });

    return ok(host);
  }
  
  // Lógica de Negocio: Marcar como verificado (usado en VerifyHostUseCase)
  public verify(): Result<void, Error> {
      if (this.verificationStatus === 'verified') {
          return err(new Error('Host is already verified.'));
      }
      (this as any).verificationStatus = 'verified'; 
      return ok(undefined);
  }
  
  // [toPrimitives y fromPrimitives también deben estar aquí]
}