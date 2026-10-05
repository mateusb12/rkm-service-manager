type WorkEntry = {
  category: 'Produto' | 'Transversal' | 'Ambiente';
  description: string;
};

const WORKLOG: Record<string, WorkEntry[]> = {
  'pcp/clientes': [
    {
      category: 'Produto',
      description:
        'Implementação do CRUD demonstrativo de clientes: listagem, cadastro, edição, exclusão, busca por CNPJ ou nome e validações de formulário. Estado React, sem backend ou persistência.',
    },
    {
      category: 'Transversal',
      description:
        'Revisão dos cinco cargos anteriores para Admin, Mecânico, PCP e Comercial, com ajustes de permissões, navegação, ITs e regras de aprovação.',
    },
    {
      category: 'Transversal',
      description:
        'Adequação da autenticação no backend, atualização dos usuários demonstrativos, limpeza controlada do SQLite local e Docker e verificação dos quatro perfis pela API.',
    },
    {
      category: 'Transversal',
      description:
        'Reorganização de auth em security e approvals, atualização dos imports/exports e correções encontradas nas validações de formatação, lint e build.',
    },
    {
      category: 'Transversal',
      description:
        'Refatoração do backend Go para arquitetura vertical (internal/features e internal/shared), separação das responsabilidades de autenticação, criação das regras RKM-GO-001 e RKM-GO-002, renomeação de 164 referências e validação dos quatro cargos por testes e smoke tests.',
    },
    {
      category: 'Transversal',
      description:
        'Migração da persistência do backend para GORM sobre SQLite, com models de usuários e sessões, compatibilidade com o banco existente e hardening da autenticação: correção do cookie de refresh, revogação de sessão no logout, rotação protegida contra reutilização, tratamento seguro de tokens e Argon2, testes do ciclo completo e validação no volume persistido do Docker.',
    },
    {
      category: 'Ambiente',
      description:
        'Diagnóstico e recuperação da integração WakaTime após recriação do frontend, reutilizando a configuração existente no Linux.',
    },
  ],
};

const styles = {
  Produto: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  Transversal: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
  Ambiente: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
};

export default function RoadmapWorklogDev({ featureId }: { featureId: string }) {
  const entries = WORKLOG[featureId];

  if (!entries?.length) return null;

  return (
    <details className="rounded-lg border border-sky-400/20 bg-sky-400/5 p-3">
      <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-sky-300">
        Trabalho realizado
      </summary>

      <ul className="mt-3 space-y-3">
        {entries.map((entry, index) => (
          <li key={index} className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
            <span
              className={`h-fit w-fit shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[entry.category]}`}
            >
              {entry.category}
            </span>
            <span className="text-xs leading-relaxed text-slate-300">{entry.description}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
