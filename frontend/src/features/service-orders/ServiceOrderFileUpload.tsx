import { useEffect, useState } from 'react';
import { CircleCheck, Images, Pencil, Trash2, Upload, X } from 'lucide-react';

import { getFilePreviewUrl, listFiles, type FileRecord } from '../files/service';

type ServiceOrderFileUploadProps = {
  file?: FileRecord;
  onUpload: (file: File) => Promise<void>;
  onDeselect: () => void;
  onDelete: () => void;
  onSelectExisting: (file: FileRecord) => void;
  label?: string;
  hint?: string;
  selectedBadge?: string;
  addLabel?: string;
  addHint?: string;
  uploadingLabel?: string;
  uploadingHint?: string;
  accept?: string;
  category?: string;
  showLibrary?: boolean;
  variant?: 'default' | 'checklist';
};

function ServiceOrderFilePreview({ file, previewLabel, documentLabel }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file?.key) {
      setPreviewUrl('');
      return undefined;
    }

    let active = true;
    void getFilePreviewUrl(file.key)
      .then((url) => {
        if (active) setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setPreviewUrl('');
      });

    return () => {
      active = false;
    };
  }, [file?.key]);

  return (
    <button
      type="button"
      className="service-entry-invoice-preview"
      title={`Abrir ${file.name}`}
      onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
    >
      {previewUrl && file.contentType?.startsWith('image/') ? (
        <img src={previewUrl} alt={`${previewLabel} ${file.name}`} />
      ) : previewUrl && file.contentType === 'application/pdf' ? (
        <iframe title={`${previewLabel} ${file.name}`} src={previewUrl} />
      ) : (
        <span className="service-entry-invoice-document">{documentLabel}</span>
      )}
    </button>
  );
}

type FilePickerMode = 'upload' | 'existing';

const ServiceOrderFileSourceToggle = ({ mode, onChange }) => (
  <div className="service-entry-file-source-toggle mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-950/25 px-3 py-2.5 shadow-inner shadow-slate-950/20">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
        {mode === 'existing' ? <Images size={16} /> : <Upload size={16} />}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-200">{mode === 'existing' ? 'Biblioteca de arquivos' : 'Novo upload'}</span>
        <span className="block truncate text-[11px] text-slate-500">
          {mode === 'existing' ? 'Escolha um arquivo já armazenado' : 'Adicionar uma nova foto ou arquivo'}
        </span>
      </span>
    </div>
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={mode === 'existing'}
        onChange={(event) => onChange(event.target.checked ? 'existing' : 'upload')}
      />
      <span
        className={`relative flex h-8 w-14 items-center rounded-full border p-1 transition-all duration-200 ${
          mode === 'existing' ? 'border-sky-300/70 bg-sky-400/20 shadow-[0_0_16px_rgba(56,189,248,0.22)]' : 'border-slate-600 bg-slate-800/90'
        }`}
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
            mode === 'existing' ? 'translate-x-6 bg-sky-200 text-sky-950' : 'translate-x-0 bg-slate-200 text-slate-700'
          }`}
        >
          {mode === 'existing' ? <Images size={13} /> : <Upload size={13} />}
        </span>
      </span>
    </label>
  </div>
);

const ServiceOrderExistingFileList = ({ files, label, onSelect, loading }) => (
  <div className="service-entry-invoice-library">
    {files.map((existingFile) => (
      <div className="service-entry-invoice-card service-entry-invoice-existing-card" key={existingFile.id}>
        <ServiceOrderFilePreview file={existingFile} previewLabel={label} documentLabel={existingFile.kind === 'Imagem' ? 'IMG' : 'FILE'} />
        <div className="service-entry-invoice-details">
          <strong title={existingFile.name}>{existingFile.name}</strong>
          <small>{existingFile.size}</small>
          <button
            type="button"
            className="service-entry-invoice-select"
            aria-label={`Usar a foto ${existingFile.name}`}
            title="Usar esta foto"
            onClick={() => onSelect(existingFile)}
          >
            <CircleCheck size={23} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </div>
    ))}
    {loading ? (
      <div className="service-entry-invoice-empty">Carregando arquivos...</div>
    ) : (
      files.length === 0 && <div className="service-entry-invoice-empty">Nenhum arquivo existente disponível para este campo.</div>
    )}
  </div>
);

const ServiceOrderFileDropzone = ({ accept, addLabel, addHint, dragging, uploading, onChange, onDragEnter, onDragOver, onDragLeave, onDrop }) => (
  <label
    className={`service-entry-invoice-card service-entry-invoice-add-card${dragging ? ' is-dragging' : ''}`}
    onDragEnter={onDragEnter}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <input type="file" accept={accept} onChange={onChange} disabled={uploading} />
    <span className="service-entry-invoice-add-icon" aria-hidden="true">
      ＋
    </span>
    <strong>{addLabel}</strong>
    <small>{addHint}</small>
  </label>
);

export function ServiceOrderFileUpload({
  file,
  onUpload,
  onDeselect,
  onDelete,
  onSelectExisting,
  label = 'Arquivo',
  hint = 'Opcional — arquivo armazenado no sistema de arquivos.',
  selectedBadge = 'Arquivo selecionado',
  addLabel = 'Adicionar arquivo',
  addHint = 'Clique ou arraste um arquivo',
  uploadingLabel = 'Enviando arquivo...',
  uploadingHint = 'Aguarde enquanto o arquivo é armazenado.',
  accept = '*/*',
  category,
  showLibrary = true,
  variant = 'default',
}: ServiceOrderFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [existingFiles, setExistingFiles] = useState<FileRecord[]>([]);
  const [loadingExistingFiles, setLoadingExistingFiles] = useState(false);
  const [editingSelection, setEditingSelection] = useState(false);
  const [selectionMode, setSelectionMode] = useState<FilePickerMode>('upload');
  const selectedFile = file;
  const showingExistingFiles = showLibrary && selectionMode === 'existing';

  useEffect(() => {
    if (!showLibrary) {
      return undefined;
    }
    let active = true;
    setLoadingExistingFiles(true);
    void listFiles()
      .then((files) => {
        if (!active) return;
        const availableFiles = files.filter(
          (candidate) =>
            candidate.bytes > 0 &&
            (accept !== 'image/*' || candidate.kind === 'Imagem') &&
            (!category || candidate.category?.trim().toLowerCase() === category.trim().toLowerCase()),
        );
        if (showingExistingFiles) setExistingFiles(availableFiles);
      })
      .catch(() => {
        if (active && showingExistingFiles) setExistingFiles([]);
      })
      .finally(() => {
        if (active) setLoadingExistingFiles(false);
      });

    return () => {
      active = false;
    };
  }, [accept, category, showLibrary, showingExistingFiles]);

  const uploadSelectedFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    await uploadSelectedFile(selectedFile);
  };

  const dropFile = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await uploadSelectedFile(event.dataTransfer.files?.[0]);
  };

  const dragOverFile = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  return (
    <div
      className={`service-entry-photo-field${variant === 'checklist' ? ' service-entry-photo-field-checklist' : ''}`}
      onDragOverCapture={dragOverFile}
      onDropCapture={dropFile}
    >
      <label className="service-entry-photo-label">{label}</label>
      {hint && <p>{hint}</p>}
      {showLibrary && !selectedFile && (
        <ServiceOrderFileSourceToggle
          mode={selectionMode}
          onChange={(mode) => {
            setSelectionMode(mode);
            setEditingSelection(false);
          }}
        />
      )}
      {uploading ? (
        <div className="service-entry-invoice-card is-uploading" aria-live="polite">
          <div className="service-entry-invoice-preview service-entry-invoice-uploading-preview">
            <span className="service-entry-invoice-spinner" aria-hidden="true" />
          </div>
          <div className="service-entry-invoice-details">
            <strong>{uploadingLabel}</strong>
            <small>{uploadingHint}</small>
          </div>
        </div>
      ) : selectedFile && !editingSelection ? (
        <div className="service-entry-invoice-card service-entry-invoice-selected-card">
          <div className="service-entry-invoice-lock-badge">{selectedBadge}</div>
          <ServiceOrderFilePreview file={selectedFile} previewLabel={label} documentLabel={selectedFile.kind === 'Imagem' ? 'IMG' : 'FILE'} />
          <div className="service-entry-invoice-details">
            <strong title={selectedFile.name}>{selectedFile.name}</strong>
            <div>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-edit"
                aria-label={`Trocar ${selectedFile.name}`}
                title="Trocar arquivo"
                onClick={() => {
                  setEditingSelection(true);
                  setSelectionMode('existing');
                }}
              >
                <Pencil size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-deselect"
                aria-label={`Desselecionar ${selectedFile.name}`}
                title="Desselecionar arquivo"
                onClick={() => {
                  setEditingSelection(false);
                  setSelectionMode('upload');
                  onDeselect();
                }}
              >
                <X size={19} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-delete"
                aria-label={`Apagar ${selectedFile.name}`}
                title="Apagar arquivo"
                onClick={() => {
                  setEditingSelection(false);
                  setSelectionMode('upload');
                  onDelete();
                }}
              >
                <Trash2 size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {selectedFile && editingSelection && (
            <button type="button" className="service-entry-invoice-cancel-edit" onClick={() => setEditingSelection(false)}>
              Cancelar troca
            </button>
          )}
          {showingExistingFiles ? (
            <ServiceOrderExistingFileList
              files={existingFiles}
              label={label}
              loading={loadingExistingFiles}
              onSelect={(existingFile) => {
                onSelectExisting(existingFile);
                setEditingSelection(false);
                setSelectionMode('upload');
              }}
            />
          ) : (
            <ServiceOrderFileDropzone
              accept={accept}
              addLabel={addLabel}
              addHint={addHint}
              dragging={dragging}
              uploading={uploading}
              onChange={selectFile}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={dragOverFile}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragging(false);
              }}
              onDrop={dropFile}
            />
          )}
        </>
      )}
    </div>
  );
}
