import { redirect } from 'next/navigation';

// /services/envios → redirige al hub de envíos
export default function ServicesEnviosPage() {
  redirect('/envios');
}
