import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User, Mail, ArrowLeft } from 'lucide-react';
import { HelpAndSupport } from '@/components/HelpAndSupport';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

type AuthStep = 'phone' | 'password' | 'signup';

export default function Login() {
  const { login, signup, checkPhoneExists } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dados do signup
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    cpf: '',
    confirmPassword: '',
  });

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 13) {
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 13) {
      toast.error('Telefone deve estar no formato: 55 (XX) X XXXX-XXXX');
      return;
    }

    setLoading(true);
    try {
      const { phoneExists, hasAuthId } = await checkPhoneExists(cleanPhone);
      
      // Segue o plano:
      // - phoneExists && hasAuthId -> usuário já tem Auth -> fluxo de login (senha)
      // - demais casos -> fluxo de criação de conta (signup)
      if (phoneExists && hasAuthId) {
        setStep('password');
      } else {
        setStep('signup');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar telefone');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (password.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await login(cleanPhone, password);
    } catch (err: any) {
      // O AuthContext já exibe um toast unificado com tentativas restantes
      // Aqui apenas limpamos a senha para reforçar a segurança
      console.error('Login error:', err);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCpf = signupData.cpf.replace(/\D/g, '');
    
    // Validações
    if (!signupData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!signupData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return;
    }

    if (cleanCpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    if (password.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (password !== signupData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await signup({
        phone: cleanPhone,
        name: signupData.name.trim(),
        email: signupData.email.trim(),
        cpf: cleanCpf,
        password: password,
      });

      // Após criar a conta com sucesso:
      // - a função signup já dispara o toast e navega para /auth/login
      // - aqui garantimos que a UI volte para o passo inicial de login
      setStep('phone');
      setPassword('');
      setSignupData({
        name: '',
        email: '',
        cpf: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'password' || step === 'signup') {
      setStep('phone');
      setPassword('');
      setSignupData({
        name: '',
        email: '',
        cpf: '',
        confirmPassword: '',
      });
    }
  };

  const slideVariants = {
    enter: {
      x: 300,
      opacity: 0
    },
    center: {
      x: 0,
      opacity: 1
    },
    exit: {
      x: -300,
      opacity: 0
    }
  };

  const logoSrc =
    theme === 'dark'
      ? '/logo-horizontal-branco.png'
      : '/logo-horizontal-preto.png';

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex justify-center mb-6">
          <img
            src={logoSrc}
            alt="Meu Agente"
            className="h-24 sm:h-28 md:h-32 object-contain"
          />
        </div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm text-center">
          {step === 'phone' && 'Entrar'}
          {step === 'password' && 'Digite sua senha'}
          {step === 'signup' && 'Criar Conta'}
        </h1>
        <p className="text-text-muted mt-2 text-center">
          {step === 'phone' && 'Insira seu telefone para continuar'}
          {step === 'password' && 'Bem-vindo de volta!'}
          {step === 'signup' && 'Complete seu cadastro'}
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-xl bg-surface p-8 shadow-2 border border-border">
          <AnimatePresence mode="wait">
            {/* Etapa 1: Telefone */}
            {step === 'phone' && (
              <motion.form
                key="phone"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handlePhoneSubmit}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="55 (11) 9 8451-2354"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      className="pl-10"
                      required
                      maxLength={19}
                      autoFocus
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Formato: 55 (XX) X XXXX-XXXX</p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </Button>
              </motion.form>
            )}

            {/* Etapa 2a: Senha */}
            {step === 'password' && (
              <motion.form
                key="password"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handlePasswordSubmit}
                className="space-y-6"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>

                <div>
                  <Label htmlFor="phone-display">Telefone</Label>
                  <Input
                    id="phone-display"
                    value={phone}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-brand hover:opacity-80"
                    onClick={() => navigate('/auth/forgot-password')}
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </motion.form>
            )}

            {/* Etapa 2b: Signup */}
            {step === 'signup' && (
              <motion.form
                key="signup"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSignupSubmit}
                className="space-y-6"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="phone-display-signup">Telefone</Label>
                    <Input
                      id="phone-display-signup"
                      value={phone}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="João Silva"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className="pl-10"
                        required
                        autoFocus
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
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={signupData.cpf}
                        onChange={(e) => setSignupData({ ...signupData, cpf: formatCpf(e.target.value) })}
                        className="pl-10"
                        maxLength={14}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password-signup">Senha *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="password-signup"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">Mínimo 8 caracteres</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a
            href="https://site.meuagente.api.br/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            Termos de Serviço
          </a>{' '}
          e{' '}
          <a
            href="https://site.meuagente.api.br/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            Política de Privacidade
          </a>
        </p>
      </div>
      <HelpAndSupport mode="floatingAuth" />
    </div>
  );
}
