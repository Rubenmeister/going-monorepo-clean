import { RoleGuard } from '@/app/components/common/RoleGuard';

export default function OperadoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['operator']} redirectTo="/?acceso=solo-operadores">
      {children}
    </RoleGuard>
  );
}
