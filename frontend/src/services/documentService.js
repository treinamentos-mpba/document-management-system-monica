const API_BASE_URL = '/api';
const DEMO_USER_ID = 'demo-user-001';

function requestHeaders() {
  return { 'x-user-id': DEMO_USER_ID };
}

async function throwResponseError(response) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  throw new Error(payload?.error?.message || 'Não foi possível concluir a solicitação.');
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    headers: requestHeaders(),
  });

  if (!response.ok) {
    await throwResponseError(response);
  }

  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: requestHeaders(),
    body: formData,
  });

  if (!response.ok) {
    await throwResponseError(response);
  }

  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(id)}/download`, {
    headers: requestHeaders(),
  });

  if (!response.ok) {
    await throwResponseError(response);
  }

  return response.blob();
}