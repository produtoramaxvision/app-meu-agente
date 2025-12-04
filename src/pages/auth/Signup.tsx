import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Phone, User, Mail, Lock } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { HelpAndSupport } from '@/components/HelpAndSupport';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';

export default function Signup() {
  const { cliente, signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  if (cliente) {
    return <Navigate to="/dashboard" replace />;
  }

  // Função para validar força da senha
  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Senha deve ter no mínimo 8 caracteres' };
    }
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const missing = [];
    if (!hasLowercase) missing.push('letra minúscula');
    if (!hasUppercase) missing.push('letra maiúscula');
    if (!hasNumber) missing.push('número');
    if (!hasSymbol) missing.push('símbolo (!@#$%...)');
    
    if (missing.length > 0) {
      return { 
        valid: false, 
        message: `Senha deve conter: ${missing.join(', ')}` 
      };
    }
    
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Remove non-digits from phone and cpf
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const cleanCpf = formData.cpf.replace(/\D/g, '');
    
    // Validations
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }

    if (cleanPhone.length !== 13) {
      toast.error('Telefone deve estar no formato: 55 (XX) X XXXX-XXXX');
      return;
    }

    if (cleanCpf.length !== 11) {
      toast.error('CPF é obrigatório e deve ter 11 dígitos');
      return;
    }

    // Validação de força da senha
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await signup({
        phone: cleanPhone,
        name: formData.name.trim(),
        email: formData.email.trim(),
        cpf: cleanCpf,
        password: formData.password,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 13) {
      // Brazilian format with country code: 55 (11) 9 8451-2354
      return digits
        .replace(/^(\d{2})(\d)/, '$1 ($2')
        .replace(/^(\d{2}\s\(\d{2})(\d)/, '$1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return digits;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header Section - Matching Dashboard Style */}
      <div className="animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size="xl" showText={false} />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm text-center">
          Criar Conta
        </h1>
        <p className="text-text-muted mt-2 text-center">
          Preencha os dados para começar
        </p>
      </div>

      {/* Signup Form Card */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-surface p-8 shadow-2 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="55 (11) 9 8451-2354"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  className="pl-10"
                  required
                  maxLength={19}
                />
              </div>
              <p className="mt-1 text-xs text-text-muted">Formato: 55 (XX) X XXXX-XXXX</p>
            </div>

            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                  className="pl-10"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              {/* Componente visual de força da senha */}
              <div className="mt-3">
                <PasswordStrengthMeter password={formData.password} />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full group relative overflow-hidden"
            disabled={loading}
          >
            <span className="relative z-10">{loading ? 'Criando conta...' : 'Criar Conta'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>

          <div className="text-center text-sm">
            <span className="text-text-muted">Já tem uma conta? </span>
            <Link 
              to="/auth/login" 
              className="font-medium text-brand hover:opacity-80 transition-opacity px-2 py-1 rounded-md inline-block"
            >
              Entrar
            </Link>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
        </p>
      </div>
      <HelpAndSupport mode="floatingAuth" />
    </div>
  );
}