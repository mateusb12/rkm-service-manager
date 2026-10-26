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
      category: 'Produto',
      description:
        'Implementação do backend persistente de clientes com GORM e SQLite: cadastro, consulta individual, listagem e busca por CNPJ, razão social ou nome fantasia, edição e exclusão, com validações, CNPJ único, controle de acesso para Admin e PCP, proteção CSRF e testes automatizados e em container.',
    },
    {
      category: 'Produto',
      description:
        'Integração do CRUD de clientes com a API persistente: remoção dos dados demonstrativos e do estado global no App, carregamento dos clientes a partir do backend, cadastro, edição e exclusão persistentes, tratamento de loading e erros, compartilhamento da infraestrutura HTTP/CSRF com autenticação e validação ponta a ponta até o SQLite do volume Docker.',
    },
    {
      category: 'Produto',
      description:
        'Integração da busca de clientes à abertura da OS: substituição do campo livre por um combobox com dropdown inicial, pesquisa server-side por CNPJ, razão social ou nome fantasia, debounce de 250 ms, seleção explícita do cliente, navegação por teclado e estados de carregamento, ausência de resultados e erro.',
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
  'pcp/abertura-os': [
    {
      category: 'Produto',
      description:
        'Implementação do fluxo de recebimento e abertura da OS, com seleção do cliente por CNPJ, razão social ou nome fantasia, geração automática do número da OS e registro do equipamento ou material recebido.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão do registro opcional de nota fiscal, com suporte a número informado, N/A ou complementação posterior, mantendo os dados do recebimento persistidos localmente.',
    },
    {
      category: 'Produto',
      description:
        'Substituição do seletor incorreto de clientes no campo “Recebido por” por uma busca de usuários ativos, exibindo nome, perfil e e-mail do responsável pelo recebimento.',
    },
    {
      category: 'Produto',
      description:
        'Simplificação da identificação inicial: remoção da condição externa e da triagem de segurança para permitir salvar o recebimento e avançar para a desmontagem.',
    },
    {
      category: 'Produto',
      description:
        'Adição dos ícones de cilindro, acumulador, bomba hidráulica, motor hidráulico e outro na seleção de categoria do equipamento, seguindo o padrão visual do catálogo.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão do seletor de usuários ativos como responsável pela desmontagem, com busca por nome, e-mail ou perfil e seleção integrada ao formulário da OS.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão de date picker em português para o início da desmontagem, com data e horário atual pré-preenchidos, formato de 24 horas, exibição por extenso e campo protegido contra edição manual.',
    },
    {
      category: 'Produto',
      description:
        'Simplificação do formulário de desmontagem com remoção dos checklists e dos controles de confirmação, mantendo o registro de observações e evidências fotográficas.',
    },
    {
      category: 'Produto',
      description: 'Ajuste da validação da desmontagem para tratar a foto como opcional.',
    },
    {
      category: 'Produto',
      description:
        'Criação da checklist visual de saúde do cilindro com botões para camisa, haste, êmbolo, cabeçotes, vedações, articulações e outros componentes, preparada para a próxima etapa de avaliação.',
    },
    {
      category: 'Transversal',
      description:
        'Padronização do feedback de validação em toast compacto, com fechamento manual, desaparecimento automático e barra de progresso.',
    },
    {
      category: 'Ambiente',
      description:
        'Inclusão do acompanhamento de atividade local do frontend em localhost:4173 no cálculo de tempo da feature, separado das atividades do ChatGPT.',
    },
  ],
  'admin/usuarios': [
    {
      category: 'Produto',
      description:
        'Implementação da autenticação Bearer JWT com claims de usuário, perfil e permissões, refresh token rotativo e proteção de rotas administrativas.',
    },
    {
      category: 'Produto',
      description:
        'Criação da listagem administrativa de usuários consumindo o backend, com nome, e-mail, perfil, setor, status e último login persistido.',
    },
    {
      category: 'Transversal',
      description:
        'Persistência dos usuários e sessões com GORM, incluindo migração automática da coluna de último login e registro do acesso após autenticação bem-sucedida.',
    },
    {
      category: 'Transversal',
      description:
        'Migração do frontend para autenticação exclusivamente via Bearer, removendo o suporte a cookies HttpOnly e CSRF baseado em cookie.',
    },
    {
      category: 'Transversal',
      description:
        'Organização do backend por responsabilidade, separando rotas, controllers e repositório da administração de usuários, além da padronização dos arquivos de endpoints das demais features.',
    },
    {
      category: 'Produto',
      description:
        'Implementação dos endpoints administrativos para cadastrar, consultar, editar, desativar e excluir permanentemente usuários, com validações, hash de senha e controle de acesso exclusivo para administradores.',
    },
    {
      category: 'Produto',
      description:
        'Integração da gestão de usuários do frontend com o backend, incluindo cadastro, edição, desativação, exclusão permanente e expansão inline dos detalhes na própria tabela.',
    },
    {
      category: 'Produto',
      description:
        'Criação da seleção de usuários ativos no campo “Recebido por” da abertura da OS, substituindo a busca incorreta por clientes/CNPJ e corrigindo o scroll do dropdown.',
    },
  ],
  'comercial/tabela-precos': [
    {
      category: 'Produto',
      description:
        'Implementação do CRUD demonstrativo da tabela de preços, com cadastro de peças, produtos e serviços, edição, busca, filtros, validações, preços em centavos e persistência local. Inclui exclusão híbrida conforme a existência de vínculos simulados com orçamentos.',
    },
    {
      category: 'Produto',
      description:
        'Refinamento visual dos tipos do catálogo, com ícones de peças e serviços, destaque das imagens na listagem e seleção visual dos tipos no formulário.',
    },
    {
      category: 'Transversal',
      description:
        'Criação do componente compartilhado CrudTable, reutilizado por Clientes e Tabela de preços para padronizar listagens, buscas, filtros, ações e estados visuais.',
    },
    {
      category: 'Transversal',
      description:
        'Extração dos utilitários compartilhados de formatação monetária e normalização textual, eliminando duplicações entre os cadastros.',
    },
    {
      category: 'Transversal',
      description:
        'Integração da Tabela de preços à navegação Comercial, com restrição visual para Admin e Comercial e padronização dos ícones com Lucide React.',
    },
    {
      category: 'Transversal',
      description:
        'Refinamento da navegação contextual das sub-telas pela TopBar, com retorno para a listagem no título da página e remoção de breadcrumbs e identificadores redundantes do formulário.',
    },
    {
      category: 'Transversal',
      description:
        'Implementação dos indicadores de andamento no roadmap, com diferenciação visual entre features planejadas, em andamento e concluídas.',
    },
    {
      category: 'Ambiente',
      description:
        'Adequação do Docker de desenvolvimento para utilizar a configuração WakaTime existente no Linux, sem duplicar a chave no projeto e mantendo a integração isolada do ambiente de produção.',
    },
    {
      category: 'Transversal',
      description:
        'Diagnóstico e correção da falha do Frontend CI causada por arquivos utilitários ausentes no primeiro commit, restabelecendo o build da branch.',
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
