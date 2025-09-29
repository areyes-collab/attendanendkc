import { CardManagement } from '@/components/admin/card-management';

export default function CardsPage() {
  return (
    <div className="h-full bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <CardManagement />
        </main>
      </div>
    </div>
  );
}