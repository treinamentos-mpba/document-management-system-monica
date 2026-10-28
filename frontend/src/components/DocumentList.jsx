import DownloadButton from './DownloadButton.jsx';

function formatSize(size) {
  if (!size) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / (1024 ** unitIndex);

  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: unitIndex ? 1 : 0 })} ${units[unitIndex]}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

export default function DocumentList({ documents, isLoading, onDownloadError }) {
  if (isLoading) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <p>Nenhum documento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Data de envio</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((file) => (
            <tr key={file.id}>
              <td data-label="Nome">
                <span className="file-name">{file.originalName}</span>
                <span className="file-type">{file.mimeType || 'Arquivo'}</span>
              </td>
              <td data-label="Tamanho">{formatSize(file.size)}</td>
              <td data-label="Data de envio">{formatDate(file.uploadedAt)}</td>
              <td className="table-action" data-label="Ações">
                <DownloadButton file={file} onError={onDownloadError} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}