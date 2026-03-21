import { RoleGuard } from '@/app/components/common/RoleGuard';

export default function ConductoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['driver']} redirectTo="/?acceso=solo-conductores">
      {children}
    </RoleGuard>
  );
}
