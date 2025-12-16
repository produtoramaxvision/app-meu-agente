import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { HelpAndSupport } from '@/components/HelpAndSupport';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Com detectSessionInUrl: true, o Supabase já terá processado tokens da URL.
        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch (error) {
        console.error('Erro ao validar sessão de redefinição:', error);
        setHasSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        throw error;
      }

      toast.success('Senha atualizada com sucesso!');

      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar sua senha. Tente novamente em instantes.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (hasSession === null) {
      return (
        <p className="text-center text-sm text-text-muted">
          Validando link de redefinição de senha...
        </p>
      );
    }

    if (!hasSession) {
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-muted">
            Este link de redefinição não é válido ou já foi utilizado.
          </p>
          <Button variant="outline" onClick={() => navigate('/auth/forgot-password')}>
            Voltar para recuperação de senha
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">Mínimo de 8 caracteres.</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Atualizando senha...' : 'Salvar nova senha'}
        </Button>
      </form>
    );
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size="2xl" showText={false} />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm text-center">
          Redefinir senha
        </h1>
        <p className="text-text-muted mt-2 text-center max-w-xl mx-auto">
          Defina uma nova senha forte para proteger a sua conta.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="rounded-xl bg-surface p-8 shadow-2 border border-border space-y-6">
          {renderContent()}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Se você não solicitou esta alteração, ignore este e-mail e mantenha sua senha atual.
        </p>
      </div>

      <HelpAndSupport mode="floatingAuth" />
    </div>
  );
}


