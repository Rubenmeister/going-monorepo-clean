import { RoleGuard } from '@/components/common/RoleGuard';

export default function AnfitrioneLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['host']} redirectTo="/?acceso=solo-anfitriones">
      {children}
    </RoleGuard>
  );
}
