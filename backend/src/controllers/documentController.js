const documentService = require('../services/documentService');

function errorResponse(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function requireOwner(req, res, next) {
  const owner = req.get('x-user-id')?.trim();

  if (!owner) {
    return errorResponse(res, 400, 'USER_ID_REQUIRED', 'O header x-user-id é obrigatório.');
  }

  req.documentOwner = owner;
  return next();
}

function upload(req, res) {
  if (!req.file) {
    return errorResponse(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  try {
    const document = documentService.createDocument(req.file, req.documentOwner);
    return res.status(201).json({ document });
  } catch {
    return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Não foi possível registrar o documento.');
  }
}

function list(req, res) {
  try {
    const documents = documentService.listDocuments(req.documentOwner);
    return res.status(200).json({ documents });
  } catch {
    return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Não foi possível listar os documentos.');
  }
}

function download(req, res, next) {
  const document = documentService.findDocumentForOwner(req.params.id, req.documentOwner);

  if (!document) {
    return errorResponse(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return res.download(document.storagePath, document.originalName, (error) => {
    if (!error) {
      return;
    }

    if (res.headersSent) {
      return next(error);
    }

    return errorResponse(res, 500, 'FILE_READ_FAILED', 'Não foi possível baixar o documento.');
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    return errorResponse(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o limite permitido.');
  }

  if (error.name === 'MulterError') {
    return errorResponse(res, 400, 'INVALID_MULTIPART', 'A requisição de upload é inválida.');
  }

  return errorResponse(res, 500, 'INTERNAL_SERVER_ERROR', 'Ocorreu um erro interno.');
}

module.exports = {
  requireOwner,
  upload,
  list,
  download,
  handleError,
};