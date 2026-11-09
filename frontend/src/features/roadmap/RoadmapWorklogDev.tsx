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
  'pcp/fila': [
    {
      category: 'Produto',
      description:
        'Criação do módulo persistente de ordens de serviço no backend, com model, repositório, endpoints de listagem, consulta, criação, atualização e exclusão e catálogo das etapas operacionais.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão da normalização do número da OS, validação do payload, prevenção de duplicidade, validação de etapa e tratamento dos erros de criação e atualização na API.',
    },
    {
      category: 'Produto',
      description:
        'Definição das regras de acesso por perfil e etapa: Admin e Mecânico podem acompanhar o fluxo completo, enquanto o PCP fica limitado às etapas iniciais e aos avanços permitidos pela operação.',
    },
    {
      category: 'Produto',
      description:
        'Implementação da serialização por seção e por perfil, com status, etapa atual, etapas disponíveis e somente os campos operacionais permitidos para cada papel do sistema.',
    },
    {
      category: 'Transversal',
      description:
        'Criação dos testes automatizados do ciclo de ordens de serviço, cobrindo listagem, criação, atualização, exclusão, normalização, duplicidade e restrições de acesso.',
    },
    {
      category: 'Produto',
      description:
        'Migração da tela de entrada para o novo serviço de ordens de serviço, substituindo o repositório local pela API persistente e mantendo a criação, edição, exclusão e acompanhamento da OS no fluxo existente.',
    },
    {
      category: 'Produto',
      description:
        'Implementação do stepper operacional com seis etapas, indicação da etapa atual e do maior progresso alcançado, navegação entre etapas permitidas e validações específicas antes de avançar.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão do salvamento progressivo por etapa, preservando o estado do formulário, o status da OS e os dados já registrados ao avançar pelo ciclo operacional.',
    },
    {
      category: 'Produto',
      description:
        'Implementação do armazenamento local das fotos por OS e categoria, com upload, recuperação de metadados, remoção dos arquivos e integração das evidências ao salvamento do progresso.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão da autoria da OS com chave estrangeira para o usuário criador, retorno do nome e da data de criação pela API e exibição dessas informações na fila.',
    },
    {
      category: 'Produto',
      description:
        'Inclusão do upload opcional de nota fiscal no recebimento, reutilizando o sistema de arquivos existente e vinculando o arquivo à OS por chave estrangeira, com acesso para PCP e Mecânico.',
    },
    {
      category: 'Produto',
      description:
        'Vinculação obrigatória da OS ao cliente por chave estrangeira no ORM e na API, com clientId obrigatório no payload, remoção do fallback por nome e persistência do vínculo no banco.',
    },
    {
      category: 'Transversal',
      description:
        'Migração manual da OS existente no PostgreSQL remoto para a nova FK de cliente, remoção das migrações automáticas em runtime e validação do backend estrito com testes automatizados.',
    },
    {
      category: 'Produto',
      description:
        'Ajuste do carregamento inicial para buscar todas as OS e as etapas na abertura da página, permitindo selecionar uma OS usando os dados já carregados em memória, sem uma nova chamada de detalhe.',
    },
    {
      category: 'Produto',
      description:
        'Refinamento da fila com skeleton somente para os dados do backend, fallback local das etapas, data de criação por extenso, badge do criador e bloqueio visual e funcional das etapas futuras.',
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
        'Criação da listagem administrativa de usuários consumindo o backend, com nome, e-mail, perfil, status e último login persistido.',
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
        'Refinamento do cadastro de usuários com remoção do campo de setor, confirmação de senha, botão para exibir ou ocultar a senha e status derivado do acesso ativo ou suspenso.',
    },
    {
      category: 'Produto',
      description:
        'Implementação do fluxo de ciclo de vida dos usuários: usuários ativos são desativados primeiro; usuários suspensos podem ser excluídos permanentemente, com confirmação em dois passos e bloqueio equivalente no backend.',
    },
    {
      category: 'Produto',
      description:
        'Correção da identidade da sessão após o login, removendo o fallback para usuários demonstrativos e exibindo no menu o nome, perfil e iniciais do usuário autenticado.',
    },
    {
      category: 'Produto',
      description:
        'Restrição dos responsáveis pela desmontagem aos usuários ativos com perfil Mecânico, mantendo a seleção geral de usuários ativos para o recebimento da OS.',
    },
    {
      category: 'Produto',
      description:
        'Adição de skeleton loading à tela de usuários para métricas, contagem e linhas da tabela, preservando a estrutura visual enquanto os dados são carregados.',
    },
    {
      category: 'Transversal',
      description:
        'Configuração do ambiente local para acessar exclusivamente o PostgreSQL da Hostinger por túnel SSH, incluindo os dados principais e as métricas, sem montar ou usar SQLite local como fonte de verdade.',
    },
    {
      category: 'Transversal',
      description:
        'Validação ponta a ponta do cadastro de usuários e clientes diretamente no PostgreSQL remoto, com rebuild do backend local e testes automatizados do fluxo de hard delete.',
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
