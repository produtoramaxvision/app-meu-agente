import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { HelpAndSupport } from '@/components/HelpAndSupport';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Erro ao enviar e-mail de recuperação:', error);
        throw error;
      }

      setSent(true);
      toast.success('Enviamos um link de recuperação para o seu e-mail.');
    } catch (error: unknown) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Não foi possível enviar o e-mail de recuperação. Tente novamente em instantes.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size="2xl" showText={false} />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm text-center">
          Recuperar senha
        </h1>
        <p className="text-text-muted mt-2 text-center max-w-xl mx-auto">
          Informe o e-mail associado à sua conta para enviarmos um link seguro de redefinição de senha.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto">
        <div className="rounded-xl bg-surface p-8 shadow-2 border border-border space-y-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth/login')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para login
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoFocus
                  required
                />
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Usaremos este e-mail apenas para enviar instruções de recuperação.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            {sent && (
              <p className="text-xs text-emerald-500 text-center">
                Se o e-mail estiver cadastrado, você receberá o link de recuperação em poucos minutos.
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Caso não tenha acesso ao seu e-mail, entre em contato com o suporte.
        </p>
      </div>

      <HelpAndSupport mode="floatingAuth" />
    </div>
  );
}


