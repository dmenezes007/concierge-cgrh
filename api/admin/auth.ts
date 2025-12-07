import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { password, action } = req.body;

      // Login
      if (action === 'login') {
        if (!password) {
          return res.status(400).json({ error: 'Senha é obrigatória' });
        }

        const hashedPassword = process.env.ADMIN_PASSWORD_HASH;
        if (!hashedPassword) {
          return res.status(500).json({ error: 'Configuração de senha não encontrada' });
        }

        const isValid = await bcrypt.compare(password, hashedPassword);

        if (isValid) {
          // Gerar token de sessão
          const token = crypto.randomUUID();
          
          try {
            // Tentar salvar no Vercel KV (expira em 1 hora)
            await kv.set(`admin_session:${token}`, { 
              authenticated: true, 
              timestamp: Date.now() 
            }, { ex: 3600 });
          } catch (kvError) {
            // Se KV não estiver configurado, usar token simples
            console.warn('Vercel KV não disponível, usando token temporário');
          }

          return res.status(200).json({ 
            success: true,
            token,
            message: 'Login realizado com sucesso' 
          });
        }

        return res.status(401).json({ error: 'Senha incorreta' });
      }

      // Validar sessão
      if (action === 'validate') {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({ error: 'Token é obrigatório' });
        }

        try {
          const session = await kv.get(`admin_session:${token}`);
          
          if (session) {
            return res.status(200).json({ valid: true });
          }
        } catch (kvError) {
          console.warn('Vercel KV não disponível');
        }

        return res.status(401).json({ valid: false, error: 'Sessão inválida ou expirada' });
      }

      // Logout
      if (action === 'logout') {
        const { token } = req.body;
        
        if (token) {
          try {
            await kv.del(`admin_session:${token}`);
          } catch (kvError) {
            console.warn('Erro ao deletar sessão do KV');
          }
        }

        return res.status(200).json({ success: true, message: 'Logout realizado' });
      }

      return res.status(400).json({ error: 'Ação inválida' });

    } catch (error: any) {
      console.error('Erro no auth:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
