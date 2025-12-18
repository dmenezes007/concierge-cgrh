import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  RefreshCw, 
  LogOut, 
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileUp,
  Download
} from 'lucide-react';

interface Document {
  name: string;
  size: number;
  modified: string;
  path: string;
}

export default function AdminDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    loadDocuments();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/admin/login.html';
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      console.log('Carregando documentos...');
      const response = await fetch('/api/admin/documents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login.html';
        return;
      }

      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (response.ok) {
        console.log(`Documentos carregados: ${data.documents?.length || 0}`);
        setDocuments(data.documents || []);
      } else {
        console.error('Erro na resposta:', data);
        setError(data.error || 'Erro ao carregar documentos');
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
      setError('Erro de conexão ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        setError('Apenas arquivos .docx são permitidos');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      const formData = new FormData();
      formData.append('document', selectedFile);

      console.log('Enviando arquivo:', selectedFile.name, 'Tamanho:', selectedFile.size);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        throw new Error('Erro no servidor: resposta inválida');
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        const message = data.message || 'Upload realizado com sucesso!';
        setSuccess(message);
        setSelectedFile(null);
        // Recarregar lista de documentos
        setTimeout(() => loadDocuments(), 500);
      } else {
        const errorMsg = data.error || 'Erro ao enviar documento';
        const detailMsg = data.message ? `\n\n${data.message}` : '';
        setError(errorMsg + detailMsg);
        console.error('Erro do servidor:', data);
      }
    } catch (err: any) {
      console.error('Erro completo:', err);
      const errorMessage = err.message || 'Erro de conexão ao enviar documento';
      setError(`${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${filename}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/documents?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Documento "${filename}" deletado com sucesso`);
        // Recarregar lista de documentos
        setTimeout(() => loadDocuments(), 500);
      } else {
        // Mostrar mensagem explicativa sobre limitação da Vercel
        const message = data.message ? `${data.error}\n\n${data.message}` : data.error;
        setError(message || 'Erro ao deletar documento');
      }
    } catch (err) {
      setError('Erro ao deletar documento');
      console.error(err);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/download?filename=${encodeURIComponent(filename)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erro ao fazer download');
        return;
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Download de "${filename}" iniciado`);
    } catch (err) {
      setError('Erro ao fazer download do documento');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login.html';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
                  <p className="text-sm text-slate-400">Concierge RH Digital</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="px-6 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors"
                  style={{ textDecoration: 'none', fontWeight: '700' }}
                >
                  IR PARA CONCIERGE RH DIGITAL
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total de Documentos</p>
                  <p className="text-2xl font-bold text-white">{documents.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-2xl font-bold text-white">Ativo</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Último Upload</p>
                  <p className="text-sm font-medium text-white">
                    {documents.length > 0 ? 'Hoje' : 'Nenhum'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileUp className="w-5 h-5" />
              Enviar Novo Documento
            </h2>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block w-full">
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 cursor-pointer hover:border-blue-600 transition-colors">
                    {selectedFile ? selectedFile.name : 'Selecione um arquivo .docx'}
                  </div>
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              O documento será salvo no Vercel Blob Storage. Para incluí-lo no sistema de busca, adicione-o à pasta docs/ e execute npm run convert-docs localmente.
            </p>
          </div>

          {/* Documents List */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Documentos</h2>
                <button
                  onClick={loadDocuments}
                  disabled={loading}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Carregando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum documento encontrado</p>
                <p className="text-sm text-slate-500 mt-2">Faça upload do primeiro documento acima</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Modificado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {documents.map((doc, index) => (
                      <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-white">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {formatFileSize(doc.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {formatDate(doc.modified)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownload(doc.name)}
                              className="p-2 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.name)}
                              className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
