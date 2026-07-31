import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Users,
  type LucideIcon,
} from "lucide-react";

export type DashboardCardVariant =
  | "default"
  | "danger"
  | "success"
  | "clients"
  | "progress";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  variant?: DashboardCardVariant;
  icon?: LucideIcon;
  onClick?: () => void;
};

type CardConfig = {
  icon: LucideIcon;
  iconClassName: string;
  iconContainerClassName: string;
  valueClassName: string;
  detailClassName: string;
};

const configuracoes: Record<
  DashboardCardVariant,
  CardConfig
> = {
  default: {
    icon: ClipboardList,
    iconClassName:
      "text-slate-700",
    iconContainerClassName:
      "border-slate-200 bg-slate-100",
    valueClassName:
      "text-slate-950",
    detailClassName:
      "bg-slate-100 text-slate-600",
  },

  danger: {
    icon: AlertTriangle,
    iconClassName:
      "text-red-600",
    iconContainerClassName:
      "border-red-100 bg-red-50",
    valueClassName:
      "text-red-600",
    detailClassName:
      "bg-red-50 text-red-700",
  },

  success: {
    icon: CheckCircle2,
    iconClassName:
      "text-emerald-600",
    iconContainerClassName:
      "border-emerald-100 bg-emerald-50",
    valueClassName:
      "text-emerald-600",
    detailClassName:
      "bg-emerald-50 text-emerald-700",
  },

  clients: {
    icon: Users,
    iconClassName:
      "text-violet-600",
    iconContainerClassName:
      "border-violet-100 bg-violet-50",
    valueClassName:
      "text-violet-600",
    detailClassName:
      "bg-violet-50 text-violet-700",
  },

  progress: {
    icon: Activity,
    iconClassName:
      "text-blue-600",
    iconContainerClassName:
      "border-blue-100 bg-blue-50",
    valueClassName:
      "text-blue-600",
    detailClassName:
      "bg-blue-50 text-blue-700",
  },
};

export function DashboardCard({
  title,
  value,
  description,
  variant = "default",
  icon,
  onClick,
}: Props) {
  const configuracao =
    configuracoes[variant];

  const Icon =
    icon ||
    configuracao.icon;

  const interativo =
    typeof onClick ===
    "function";

  return (
    <article
      onClick={
        onClick
      }
      onKeyDown={(
        event
      ) => {
        if (
          !interativo
        ) {
          return;
        }

        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();

          onClick?.();
        }
      }}
      role={
        interativo
          ? "button"
          : undefined
      }
      tabIndex={
        interativo
          ? 0
          : undefined
      }
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-200
        ${
          interativo
            ? "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300"
            : "hover:border-slate-300 hover:shadow-md"
        }
      `}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-70" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-600">
            {title}
          </p>

          <p
            className={`mt-3 text-4xl font-bold tracking-tight ${configuracao.valueClassName}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-200 group-hover:scale-105 ${configuracao.iconContainerClassName}`}
        >
          <Icon
            className={`h-5 w-5 ${configuracao.iconClassName}`}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="min-w-0 truncate text-sm text-slate-500">
          {description ||
            "Sem informações adicionais"}
        </p>

        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${configuracao.detailClassName}`}
        />
      </div>
    </article>
  );
}