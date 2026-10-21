import React from 'react';

import { Tooltip } from '../../Tooltip';
import { ROADMAP } from './roadmap-data';

type PhaseKind = 'v0' | 'v1' | 'v2' | 'v3' | 'v4' | 'manutencao';

type Phase = {
  start: number;
  end: number;
  label: string;
  kind: PhaseKind;
};

type GanttRow = {
  id: string;
  title: string;
  phases: Phase[];
};

const INSTALLMENTS = Array.from({ length: 14 }, (_, index) => index + 1);
const V0_DEADLINE_INSTALLMENT = 2;

// Referência visual: primeira parcela em outubro de 2026.
const FIRST_MONTH = new Date(2026, 9, 1);

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const SCHEDULE_MONTHS = INSTALLMENTS.map((installment) => {
  const date = new Date(FIRST_MONTH.getFullYear(), FIRST_MONTH.getMonth() + installment - 1, 1);

  return {
    installment,
    year: date.getFullYear(),
    month: MONTH_NAMES[date.getMonth()],
  };
});

const YEAR_GROUPS = SCHEDULE_MONTHS.reduce<Array<{ year: number; count: number }>>(
  (groups, item) => {
    const last = groups[groups.length - 1];

    if (last && last.year === item.year) {
      last.count += 1;
    } else {
      groups.push({ year: item.year, count: 1 });
    }

    return groups;
  },
  [],
);

const GANTT_ROWS: GanttRow[] = [
  {
    id: 'pcp',
    title: 'PCP',
    phases: [
      { start: 1, end: 2, label: 'V0', kind: 'v0' },
      { start: 5, end: 5, label: 'V2', kind: 'v2' },
      { start: 7, end: 7, label: 'V3', kind: 'v3' },
      { start: 10, end: 10, label: 'V4', kind: 'v4' },
    ],
  },
  {
    id: 'oficina',
    title: 'Oficina',
    phases: [
      { start: 1, end: 2, label: 'V0', kind: 'v0' },
      { start: 3, end: 4, label: 'V1', kind: 'v1' },
      { start: 6, end: 6, label: 'V2', kind: 'v2' },
      { start: 8, end: 8, label: 'V3', kind: 'v3' },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    phases: [{ start: 2, end: 2, label: 'V0', kind: 'v0' }],
  },
  {
    id: 'finalizacao',
    title: 'Finalização',
    phases: [
      { start: 2, end: 2, label: 'V0', kind: 'v0' },
      { start: 9, end: 9, label: 'V3', kind: 'v3' },
    ],
  },
  {
    id: 'administracao',
    title: 'Administração',
    phases: [{ start: 10, end: 10, label: 'V4', kind: 'v4' }],
  },
];

const GANTT_FEATURE_ACTIONS: Record<string, string> = {
  'pcp/clientes': 'Cadastrar clientes e pesquisá-los por CNPJ, razão social ou nome fantasia.',
  'pcp/abertura-os': 'Abrir uma OS, selecionar o cliente e registrar o equipamento recebido.',
  'pcp/fila': 'Consultar a situação das OS, seus responsáveis e os prazos previstos.',
  'oficina/bancadas': 'Cadastrar bancadas, vincular funcionários e consultar sua ocupação.',
  'oficina/diagnostico-minimo': 'Abrir uma OS e registrar um diagnóstico inicial em texto livre.',
  'oficina/execucao-minima': 'Atualizar o andamento do serviço, o responsável e o próximo passo.',
  'comercial/tabela-precos': 'Cadastrar e consultar peças, produtos e serviços com seus preços.',
  'comercial/orcamento-minimo': 'Montar um orçamento e registrar sua aprovação, revisão ou recusa.',
  'finalizacao/encerramento': 'Encerrar uma OS e registrar a saída do material.',
  'finalizacao/relatorio-pdf': 'Gerar um PDF básico com os dados da OS e do serviço realizado.',
  'oficina/checklists': 'Selecionar o tipo de equipamento e preencher a peritagem correspondente.',
  'oficina/componentes': 'Registrar componentes, suas condições, defeitos e observações.',
  'oficina/medicoes': 'Adicionar e consultar medições técnicas de cada componente.',
  'oficina/diagnostico-estruturado':
    'Consolidar o diagnóstico e indicar o que recuperar ou substituir.',
  'controle/pendencias': 'Registrar o motivo da parada de uma OS e quem precisa agir.',
  'pcp/prazos': 'Definir e consultar prazos e prioridades das OS.',
  'oficina/nao-aplicavel': 'Marcar como não aplicáveis as etapas desnecessárias de uma OS.',
  'controle/liberacao': 'Registrar aprovações e liberações com responsável e data.',
  'controle/auditoria': 'Consultar o histórico de alterações, etapas e responsáveis de uma OS.',
  'oficina/evidencias': 'Anexar fotos e evidências às etapas de uma OS.',
  'oficina/testes': 'Registrar resultados e observações dos testes realizados.',
  'finalizacao/anexos': 'Anexar documentos e consultar os arquivos vinculados à OS.',
  'finalizacao/relatorio-tecnico':
    'Gerar um relatório técnico com peritagem, fotos, medidas e testes.',
  'pcp/avisos': 'Consultar avisos de OS atrasadas, paradas ou com pendências.',
  'pcp/indicadores': 'Visualizar indicadores de prazo, tempo por etapa e gargalos da operação.',
  'admin/treinamentos': 'Consultar avisos sobre treinamentos próximos do vencimento.',
};

function getPhaseTooltipContent(row: GanttRow, phase: Phase) {
  const version = ROADMAP.find((entry) => entry.id === phase.label);
  const area = version?.areas.find((entry) => entry.id === row.id);

  if (!area) {
    return `${row.title} · ${phase.label}`;
  }

  return (
    <span className="block max-w-[360px] space-y-2 text-left">
      <strong className="block text-sm text-sky-200">
        {phase.label} · {row.title}
      </strong>

      <span className="block text-xs text-slate-300">O que será possível fazer:</span>

      <span className="block space-y-1.5">
        {area.features.map((feature) => (
          <span
            key={feature.id}
            className="flex items-start gap-2 text-xs leading-relaxed text-slate-100"
          >
            <span aria-hidden="true" className="shrink-0 text-sky-300">
              •
            </span>
            <span>{GANTT_FEATURE_ACTIONS[feature.id] ?? feature.title}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function getCellClass(kind?: PhaseKind) {
  if (kind === 'v0') {
    return 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100';
  }

  if (kind === 'v1') {
    return 'border-sky-300/45 bg-sky-400/10 text-sky-100';
  }

  if (kind === 'v2') {
    return 'border-violet-300/45 bg-violet-400/10 text-violet-100';
  }

  if (kind === 'v3') {
    return 'border-indigo-300/45 bg-indigo-400/10 text-indigo-100';
  }

  if (kind === 'v4') {
    return 'border-fuchsia-300/45 bg-fuchsia-400/10 text-fuchsia-100';
  }

  if (kind === 'manutencao') {
    return 'border-amber-300/40 bg-amber-300/20 text-amber-100';
  }

  return 'border-rkmborder bg-rkmcard2/30 text-slate-500';
}

export function RoadmapGanttLocalDev() {
  return (
    <section className="rounded-xl border border-amber-400/20 bg-rkmcard2/35 p-4">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            Planejamento interno · localhost
          </div>
          <h3 className="mt-1 text-base font-semibold text-slate-100">
            Diagrama de Gantt por área
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Distribuição macro das 5 grandes áreas ao longo das 14 parcelas. As últimas parcelas
            priorizam manutenção, ajustes e pequenas evoluções — sem exigir novas entregas grandes
            em todo mês.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            V0
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-400/10 px-3 py-1 text-sky-200">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
            V1
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-violet-200">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-300" />
            V2
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-indigo-200">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
            V3
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-200">
            <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-300" />
            V4
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            Manutenção
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1320px] space-y-1 text-xs">
          <div className="grid grid-cols-[190px_repeat(14,minmax(0,1fr))] gap-1">
            <div className="flex items-center rounded-md border border-rkmborder bg-rkmcard2/50 px-3 font-semibold text-slate-300">
              Área
            </div>

            {YEAR_GROUPS.map((group) => (
              <div
                key={group.year}
                style={{ gridColumn: `span ${group.count}` }}
                className="rounded-md border border-slate-500/40 bg-slate-700/60 py-2 text-center font-bold text-slate-100"
              >
                {group.year}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[190px_repeat(14,minmax(0,1fr))] gap-1">
            <div className="flex items-center rounded-md border border-rkmborder bg-rkmcard2/50 px-3 text-slate-400">
              Parcela
            </div>

            {SCHEDULE_MONTHS.map((item) => {
              const isV0Deadline = item.installment === V0_DEADLINE_INSTALLMENT;

              return (
                <div
                  key={item.installment}
                  className={`flex flex-col items-center justify-center rounded-md border py-2 ${
                    isV0Deadline
                      ? 'border-amber-300/45 bg-amber-300/10 shadow-[0_0_0_1px_rgba(252,211,77,0.08)]'
                      : 'border-rkmborder bg-rkmcard2/50'
                  }`}
                >
                  <span
                    className={`font-semibold ${isV0Deadline ? 'text-amber-100' : 'text-slate-100'}`}
                  >
                    {item.month}
                  </span>
                  <span
                    className={`text-[10px] ${isV0Deadline ? 'text-amber-300' : 'text-slate-400'}`}
                  >
                    P{item.installment}
                  </span>
                </div>
              );
            })}
          </div>

          {GANTT_ROWS.map((row) => (
            <div
              key={row.id}
              className="grid min-h-11 grid-cols-[190px_repeat(14,minmax(0,1fr))] gap-1 rounded-md bg-rkmcard2/25"
            >
              <div
                style={{ gridColumn: 1, gridRow: 1 }}
                className="flex min-h-11 items-center rounded-md border border-rkmborder bg-rkmcard2/50 px-3 text-sm font-semibold text-slate-100"
              >
                {row.title}
              </div>

              {row.phases.map((phase) => (
                <Tooltip
                  key={`${row.id}-${phase.start}-${phase.end}`}
                  mode="cursor"
                  instant
                  content={getPhaseTooltipContent(row, phase)}
                  className={`flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-center text-xs font-semibold ${getCellClass(phase.kind)}`}
                  targetClassName="flex h-full w-full items-center justify-center"
                  style={{
                    display: 'flex',
                    gridColumn: `${phase.start + 1} / span ${phase.end - phase.start + 1}`,
                    gridRow: 1,
                  }}
                >
                  <span>{phase.label}</span>
                </Tooltip>
              ))}
            </div>
          ))}

          {/* RKM_GANTT_SUPPORT_P11_P14 */}
          <div className="grid min-h-11 grid-cols-[190px_repeat(14,minmax(0,1fr))] gap-1 rounded-md bg-rkmcard2/25">
            <div
              style={{ gridColumn: 1, gridRow: 1 }}
              className="flex min-h-11 items-center rounded-md border border-rkmborder bg-rkmcard2/50 px-3 text-sm font-semibold text-slate-100"
            >
              Período geral
            </div>
            <div
              style={{ gridColumn: '12 / span 4', gridRow: 1 }}
              title="P11–P14 · Sustentação, correções e pequenas evoluções"
              className={`flex min-h-11 items-center justify-center rounded-md border px-3 py-2 text-center text-xs font-semibold ${getCellClass('manutencao')}`}
            >
              Sustentação
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
