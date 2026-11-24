import Link from "next/link";
import { AttentionBadge } from "@/components/ui/AttentionBadge";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";
import type { PatientListItem } from "@/types/api";

export function PatientTable({ patients }: { patients: PatientListItem[] }) {
  if (!patients.length) {
    return (
      <div className="px-6 py-14 text-center">
        <Icon name="users" className="mx-auto mb-3 h-9 w-9 text-slate-300" />
        <p className="font-semibold text-navy">Пациенты не найдены</p>
        <p className="mt-1 text-sm text-slate-400">Проверьте ID или добавьте новую карточку</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-6 py-4 font-medium">ID пациента</th>
            <th className="px-4 py-4 font-medium">Препарат</th>
            <th className="px-4 py-4 font-medium">Последний опрос</th>
            <th className="px-4 py-4 font-medium">Результат</th>
            <th className="px-6 py-4">
              <span className="sr-only">Открыть</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <tr key={patient.id} className="group transition-colors hover:bg-brand-50/40">
              <td className="px-6 py-4">
                <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon name="users" className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-navy group-hover:text-brand-600">
                    {patient.public_id}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">{patient.medication}</td>
              <td className="px-4 py-4 text-sm text-slate-500">
                {formatDate(patient.latest_survey_at)}
                <span className="block text-xs text-slate-400">
                  Опросов: {patient.survey_count}
                </span>
              </td>
              <td className="px-4 py-4">
                <AttentionBadge attention={patient.latest_attention} />
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/patients/${patient.id}`}
                  aria-label={`Открыть карточку ${patient.public_id}`}
                >
                  <Icon
                    name="arrow-right"
                    className="inline text-slate-300 group-hover:text-brand-600"
                  />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
