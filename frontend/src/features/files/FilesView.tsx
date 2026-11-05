import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  CalendarDays,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Trash2,
  Upload,
  UsersRound,
} from 'lucide-react';

import { CrudTable } from '../../shared/ui/CrudTable';
import { formatLongDateTimeBR } from '../../utils/formatLongDateTimeBR';
import {
  deleteFile,
  fetchFile,
  getStorageHealth,
  listFiles,
  uploadFile,
  type FileRecord,
  type FileKind,
} from './service';

const KIND_OPTIONS = ['Todos', 'PDF', 'Imagem', 'Planilha', 'Documento'];

const SUMMARY_ACCENT_CLASSES = {
  blue: 'bg-blue-400/10 text-blue-300',
  violet: 'bg-violet-400/10 text-violet-300',
  cyan: 'bg-cyan-400/10 text-cyan-300',
  emerald: 'bg-emerald-400/10 text-emerald-300',
};

function FileIcon({ kind, size = 18 }: { kind: FileKind; size?: number }) {
  if (kind === 'PDF') return <FileText size={size} />;
  if (kind === 'Imagem') return <FileImage size={size} />;
  if (kind === 'Planilha') return <FileSpreadsheet size={size} />;
  return <File size={size} />;
}

function FilePreview({ file, onClick }: { file: FileRecord; onClick?: () => void }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (file.kind !== 'Imagem') {
      setPreviewUrl('');
      return undefined;
    }

    let active = true;
    let objectUrl = '';

    void fetchFile(file.key)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (active) setPreviewUrl('');
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.key, file.kind]);

  if (file.kind === 'Imagem' && previewUrl) {
    return (
      <button
        type="button"
        title={`Abrir ${file.name}`}
        onClick={onClick}
        className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-900 transition hover:border-blue-300/70 hover:ring-2 hover:ring-blue-400/20"
      >
        <img
          src={previewUrl}
          alt={`Preview de ${file.name}`}
          className="h-full w-full object-cover"
        />
      </button>
    );
  }

  return (
    <div
      className={`relative flex h-14 w-[4.5rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${file.color}`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_25%,currentColor_25%,currentColor_26%,transparent_26%,transparent_55%,currentColor_55%,currentColor_56%,transparent_56%)]" />
      <FileIcon kind={file.kind} />
      <span className="relative mt-0.5 text-[9px] font-bold leading-tight tracking-wide text-center whitespace-pre-line">
        {file.preview}
      </span>
    </div>
  );
}

export function FilesView() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('Todos');
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  const [storageHealth, setStorageHealth] = useState<'loading' | 'healthy' | 'unhealthy'>(
    'loading',
  );
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function loadFiles() {
    setLoadingFiles(true);
    setLoadErrorMessage('');
    try {
      setFiles(await listFiles());
    } catch {
      setLoadErrorMessage('Não foi possível carregar os arquivos.');
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    void loadFiles();
    void getStorageHealth()
      .then((health) => setStorageHealth(health.status))
      .catch(() => setStorageHealth('unhealthy'));
  }, []);

  const summary = useMemo(() => {
    const documents = files.filter((file) => file.kind !== 'Imagem').length;
    const images = files.filter((file) => file.kind === 'Imagem').length;
    const collaborators = new Set(files.map((file) => file.uploadedBy)).size;
    return { documents, images, collaborators };
  }, [files]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setLoadErrorMessage('');
    try {
      await uploadFile(file);
      await loadFiles();
    } catch {
      setLoadErrorMessage('Não foi possível enviar o arquivo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleFileAction(file: FileRecord, download: boolean) {
    try {
      const blob = await fetchFile(file.key, download);
      const objectUrl = URL.createObjectURL(blob);
      if (download) {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = file.name;
        anchor.click();
      } else {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      setLoadErrorMessage('Não foi possível acessar o arquivo.');
    }
  }

  async function handleDelete(file: FileRecord) {
    if (!window.confirm(`Excluir o arquivo "${file.name}"?`)) return;
    try {
      await deleteFile(file.key);
      setFiles((currentFiles) =>
        currentFiles.filter((currentFile) => currentFile.key !== file.key),
      );
    } catch {
      setLoadErrorMessage('Não foi possível excluir o arquivo.');
    }
  }

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return files.filter((file) => {
      const matchesKind = kind === 'Todos' || file.kind === kind;
      const matchesQuery =
        !normalizedQuery ||
        [file.name, file.kind, file.uploadedBy].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      return matchesKind && matchesQuery;
    });
  }, [files, kind, query]);

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <FolderOpen size={15} />
            Gestão
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">Arquivos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Documentos, imagens e evidências da operação em um só lugar.
          </p>
          <StorageHealthBadge status={storageHealth} />
        </div>

        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
        >
          <Upload size={17} />
          {uploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
        <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Archive size={18} />}
          label="Total de arquivos"
          value={String(files.length)}
          accent="blue"
        />
        <SummaryCard
          icon={<FileText size={18} />}
          label="Documentos"
          value={String(summary.documents)}
          accent="violet"
        />
        <SummaryCard
          icon={<FileImage size={18} />}
          label="Imagens"
          value={String(summary.images)}
          accent="cyan"
        />
        <SummaryCard
          icon={<UsersRound size={18} />}
          label="Colaboradores"
          value={String(summary.collaborators)}
          accent="emerald"
        />
      </div>

      <CrudTable
        search={{
          id: 'files-search',
          label: 'Pesquisar arquivos',
          value: query,
          placeholder: 'Nome do arquivo ou responsável pelo upload',
          onChange: setQuery,
        }}
        count={{
          loadingLabel: 'Carregando arquivos...',
          count: filteredFiles.length,
          singularLabel: 'arquivo encontrado',
          pluralLabel: 'arquivos encontrados',
        }}
        filters={{
          options: KIND_OPTIONS.map((option) => ({ key: option, label: option })),
          selectedKey: kind,
          onChange: setKind,
          ariaLabel: 'Filtrar arquivos por tipo',
        }}
        loading={loadingFiles}
        error={
          loadErrorMessage
            ? {
                message: loadErrorMessage,
                hint: 'Tente carregar os arquivos novamente.',
                onRetry: () => void loadFiles(),
              }
            : undefined
        }
        empty={
          !loadingFiles && !loadErrorMessage && filteredFiles.length === 0
            ? {
                title: 'Nenhum arquivo encontrado',
                description: 'Tente outro nome, responsável ou tipo de arquivo.',
                actionLabel: 'Limpar filtros',
                onAction: () => {
                  setQuery('');
                  setKind('Todos');
                },
              }
            : undefined
        }
        footer="Dados demonstrativos para validação da tela de arquivos."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-rkmborder bg-rkmbg/50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Arquivo</th>
                <th className="px-4 py-3 font-medium">Enviado por</th>
                <th className="px-4 py-3 font-medium">Data e horário</th>
                <th className="px-4 py-3 font-medium">Tamanho</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rkmborder/70">
              {filteredFiles.map((file) => (
                <FileRow
                  key={file.key}
                  file={file}
                  onPreview={() => void handleFileAction(file, false)}
                  onDownload={() => void handleFileAction(file, true)}
                  onDelete={() => void handleDelete(file)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CrudTable>
    </div>
  );
}

function StorageHealthBadge({ status }: { status: 'loading' | 'healthy' | 'unhealthy' }) {
  const content = {
    loading: {
      label: 'Verificando Garage...',
      classes: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
      dot: 'bg-slate-400',
    },
    healthy: {
      label: 'Garage conectado',
      classes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
      dot: 'bg-emerald-400',
    },
    unhealthy: {
      label: 'Garage indisponível',
      classes: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
      dot: 'bg-rose-400',
    },
  }[status];

  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${content.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${content.dot}`} />
      {content.label}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: keyof typeof SUMMARY_ACCENT_CLASSES;
}) {
  return (
    <div className="rkm-card flex items-center gap-3 p-4">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${SUMMARY_ACCENT_CLASSES[accent]}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xl font-semibold text-slate-100">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function FileRow({
  file,
  onPreview,
  onDownload,
  onDelete,
}: {
  file: FileRecord;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group transition hover:bg-white/[0.025]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <FilePreview file={file} onClick={onPreview} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-200">{file.name}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <FileIcon kind={file.kind} size={13} /> {file.kind}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300">
            {file.initials}
          </span>
          <span className="text-sm text-slate-300">{file.uploadedBy}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays size={14} className="text-slate-500" />
          {formatLongDateTimeBR(file.uploadedAt)}
        </div>
        <div className="mt-1 text-xs text-slate-500">{file.relativeTime}</div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-400">{file.size}</td>
      <td className="px-4 py-3">
        <FileActions onPreview={onPreview} onDownload={onDownload} onDelete={onDelete} />
      </td>
    </tr>
  );
}

function FileActions({
  onPreview,
  onDownload,
  onDelete,
}: {
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        title="Visualizar"
        onClick={onPreview}
        className="rounded-md p-2 text-slate-500 hover:bg-blue-500/10 hover:text-blue-300"
      >
        <Eye size={16} />
      </button>
      <button
        type="button"
        title="Baixar"
        onClick={onDownload}
        className="rounded-md p-2 text-slate-500 hover:bg-blue-500/10 hover:text-blue-300"
      >
        <Download size={16} />
      </button>
      <button
        type="button"
        title="Excluir"
        onClick={onDelete}
        className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
