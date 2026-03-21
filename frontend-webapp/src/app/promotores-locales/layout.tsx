import { RoleGuard } from '@/components/common/RoleGuard';

export default function PromotoresLocalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['guide']} redirectTo="/?acceso=solo-promotores">
      {children}
    </RoleGuard>
  );
}
