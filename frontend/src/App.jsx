import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentService.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setIsLoading(true);
      setError('');

      try {
        const result = await listDocuments();
        if (isCurrent) {
          setDocuments(result);
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  async function handleUpload(file) {
    setError('');
    setNotice('');

    try {
      const uploadedDocument = await uploadDocument(file);
      setNotice(`${uploadedDocument.originalName} enviado com sucesso.`);
      setRefreshKey((currentKey) => currentKey + 1);
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  function handleDownloadError(message) {
    setError(message);
    setNotice('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS</span>
        </a>
        <div className="topbar-context">
          <span className="storage-indicator" aria-hidden="true" />
          <span>Armazenamento local</span>
          <span className="context-divider" aria-hidden="true" />
          <span>Usuário demo</span>
        </div>
      </header>

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO</p>
            <h1>Documentos</h1>
          </div>
          <button
            className="refresh-button"
            type="button"
            onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
            disabled={isLoading}
          >
            Atualizar lista
          </button>
        </div>

        {error && <div className="message message-error" role="alert">{error}</div>}
        {notice && <div className="message message-success" role="status">{notice}</div>}

        <div className="workspace-grid">
          <UploadComponent onUpload={handleUpload} />
          <section className="documents-section" aria-labelledby="documents-heading">
            <div className="section-heading">
              <div>
                <h2 id="documents-heading">Biblioteca</h2>
                <p>
                  {isLoading
                    ? 'Atualizando documentos...'
                    : `${documents.length} ${documents.length === 1 ? 'documento' : 'documentos'}`}
                </p>
              </div>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              onDownloadError={handleDownloadError}
            />
          </section>
        </div>

        <footer className="page-footer">
          <span>Document Management System</span>
          <span>Arquivos mantidos neste dispositivo</span>
        </footer>
      </main>
    </div>
  );
}
