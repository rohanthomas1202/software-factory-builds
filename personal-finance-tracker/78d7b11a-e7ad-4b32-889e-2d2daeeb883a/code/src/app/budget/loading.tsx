import LoadingSpinner from '@/components/LoadingSpinner';

export default function BudgetLoading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}