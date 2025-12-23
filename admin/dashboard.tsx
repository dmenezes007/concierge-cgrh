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
  Download,
  Star,
  Eye
} from 'lucide-react';

interface Document {
  id?: string; // ID do documento no Redis
  name: string;
  size: number;
  modified: string;
  path: string;
  source?: 'redis' | 'blob' | 'filesystem';
  keywords?: string;
  description?: string;
  views?: number; // Número de visualizações
  averageRating?: number; // Avaliação média
  ratingCount?: number; // Número de avaliações
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
        const docs = data.documents || [];
        
        // Buscar estatísticas para cada documento
        const docsWithStats = await Promise.all(
          docs.map(async (doc: Document) => {
            if (doc.id) {
              try {
                const statsResponse = await fetch(`/api/document-stats?id=${doc.id}`);
                if (statsResponse.ok) {
                  const stats = await statsResponse.json();
                  return { ...doc, ...stats };
                }
              } catch (e) {
                console.warn('Erro ao buscar stats para', doc.id);
              }
            }
            return doc;
          })
        );
        
        setDocuments(docsWithStats);
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
      
      console.log('Enviando arquivo:', selectedFile.name, 'Tamanho:', selectedFile.size);

      // Upload via FormData (funciona para todos os tamanhos)
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Se não conseguir parsear JSON, usar mensagem genérica
          throw new Error(`Erro no upload (${response.status}): ${response.statusText}`);
        }
        
        if (response.status === 413) {
          throw new Error(`Arquivo muito grande! O limite é de 50MB. Seu arquivo tem ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`);
        }
        
        throw new Error(errorData.error || errorData.details || 'Erro no upload');
      }

      const result = await response.json();
      console.log('Upload concluído:', result);
      
      setSuccess(
        `✅ ${result.message || 'Documento enviado e indexado automaticamente!'}\n\n` +
        `O documento já está disponível para busca no sistema. 🚀`
      );
      setSelectedFile(null);
      
      // Recarregar lista de documentos
      setTimeout(() => loadDocuments(), 500);

    } catch (err: any) {
      console.error('Erro completo:', err);
      const errorMessage = err.message || 'Erro ao enviar documento';
      setError(`${errorMessage}\n\nVerifique o console (F12) para mais detalhes.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    const displayName = doc.name || doc.id || 'documento';
    
    console.log('🗑️ Tentando deletar documento:', {
      name: doc.name,
      id: doc.id,
      source: doc.source,
      path: doc.path
    });
    
    if (!confirm(`Tem certeza que deseja deletar "${displayName}"?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('admin_token');
      
      // Se é um documento do Redis, usar API de delete do Redis
      if (doc.source === 'redis' && doc.id) {
        console.log(`✅ Deletando documento do Redis via API: ${doc.id}`);
        const response = await fetch(`/api/admin/delete?id=${encodeURIComponent(doc.id)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📄 Response data:', data);

        if (response.ok) {
          setSuccess(`✅ Documento "${displayName}" deletado com sucesso!`);
          loadDocuments(); // Recarregar imediatamente
        } else {
          setError(data.error || 'Erro ao deletar documento');
        }
        return;
      }
      
      // Para documentos do Blob/filesystem, usar API antiga
      const response = await fetch(`/api/admin/documents?filename=${encodeURIComponent(doc.name)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Documento "${displayName}" deletado com sucesso`);
        loadDocuments(); // Recarregar imediatamente
      } else {
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
      
      // Usar link direto para evitar problemas de CORS
      // A API fará o proxy do arquivo
      const downloadUrl = `/api/admin/download?filename=${encodeURIComponent(filename)}`;
      
      // Criar link temporário e clicar
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Adicionar auth header via fetch e criar blob URL
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setError(data.error || 'Erro ao fazer download');
        } else {
          setError('Erro ao fazer download');
        }
        return;
      }

      // Criar blob do conteúdo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Criar link e fazer download
      link.href = url;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total de Visualizações</p>
                  <p className="text-2xl font-bold text-white">
                    {documents.reduce((sum, doc) => sum + (doc.views || 0), 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Avaliação Média</p>
                  <p className="text-2xl font-bold text-white">
                    {(() => {
                      const docsWithRating = documents.filter(d => d.averageRating && d.averageRating > 0);
                      if (docsWithRating.length === 0) return '—';
                      const avg = docsWithRating.reduce((sum, doc) => sum + (doc.averageRating || 0), 0) / docsWithRating.length;
                      return avg.toFixed(1);
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total de Avaliações</p>
                  <p className="text-2xl font-bold text-white">
                    {documents.reduce((sum, doc) => sum + (doc.ratingCount || 0), 0).toLocaleString('pt-BR')}
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
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-400 whitespace-pre-line">{success}</p>
                  <button
                    onClick={loadDocuments}
                    disabled={loading}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar lista agora
                  </button>
                </div>
              </div>
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
              Limite: 4.5 MB para upload via painel. Arquivos maiores devem ser adicionados manualmente na pasta docs/.
            </p>
          </div>

          {/* Documents List */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Documentos</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{documents.length} {documents.length === 1 ? 'documento' : 'documentos'}</span>
                  <button
                    onClick={loadDocuments}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    title="Atualizar lista de documentos"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                </div>
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3" />
                          Avaliação
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Visualizações
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
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {doc.averageRating !== undefined && doc.averageRating > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium text-white">
                                  {doc.averageRating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {doc.ratingCount} {doc.ratingCount === 1 ? 'voto' : 'votos'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Sem avaliações</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <span className="text-sm font-medium text-blue-400">
                              {doc.views !== undefined ? doc.views.toLocaleString('pt-BR') : '0'}
                            </span>
                          </div>
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
                              onClick={() => handleDelete(doc)}
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
