export default function StatCard({ icon: Icon, title, value, iconBgClass, iconTextClass }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
      <div className={`p-3.5 rounded-lg ${iconBgClass} ${iconTextClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
