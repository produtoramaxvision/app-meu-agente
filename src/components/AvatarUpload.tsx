import { useState, useRef } from 'react';
import { User, Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userPhone: string;
  userName: string;
  onUploadComplete: (url: string | null) => void;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userPhone, 
  userName,
  onUploadComplete 
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const triggerFileSelect = () => {
    // Previne o acionamento se já estiver em processo de upload
    if (uploading) return;
    
    // Fallback: usar document.getElementById se useRef não funcionar
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Simular evento de input para reutilizar handleFileUpload
      const mockEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(mockEvent);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleFileUpload chamado!', {
      eventType: event.type,
      target: event.target,
      files: event.target.files
    });
    
    try {
      // Validações básicas antes de marcar como uploading
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      console.log('🚀 Iniciando upload de avatar...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userPhone
      });

      // Validation
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Por favor, selecione um arquivo JPEG ou PNG.');
        return;
      }

      const maxSizeInBytes = 600 * 1024; // 600KB
      if (file.size > maxSizeInBytes) {
        toast.error('O tamanho máximo da imagem é de 600KB.');
        return;
      }

      // A partir daqui consideramos que realmente teremos upload
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userPhone}/avatar.${fileExt}`;

      console.log('📤 Enviando arquivo para Supabase Storage...', {
        fileName,
        bucket: 'avatars'
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '0'
        });

      if (uploadError) {
        console.error("❌ Supabase upload error:", uploadError);
        throw uploadError;
      }

      console.log('✅ Upload para Storage concluído com sucesso!');

      const { data: { publicUrl: baseUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('🔄 Atualizando URL do avatar no banco de dados...', {
        phone: userPhone,
        avatarUrl: baseUrl
      });

      const { error: updateError } = await supabase
        .from('clientes')
        .update({ avatar_url: baseUrl })
        .eq('phone', userPhone);

      if (updateError) {
        console.error("❌ Supabase DB update error:", updateError);
        throw updateError;
      }

      console.log('✅ Avatar atualizado no banco de dados com sucesso!');

      const timestamp = new Date().getTime();
      const publicUrlWithTimestamp = `${baseUrl}?t=${timestamp}`;

      onUploadComplete(publicUrlWithTimestamp);
      
      toast.success('Foto de perfil atualizada com sucesso!');
    } catch (error: unknown) {
      console.error('❌ Erro ao fazer upload de avatar:', error);

      let errorMessage = 'Erro ao fazer upload da foto.';

      const errorMsg = error instanceof Error ? error.message : '';
      const errorStatusCode = (error as { statusCode?: number })?.statusCode;

      if (errorMsg.includes('row-level security') || errorMsg.includes('RLS')) {
        errorMessage = 'Erro de permissão. Verifique se você está logado corretamente.';
      } else if (errorMsg.includes('size') || errorMsg.includes('large') || errorStatusCode === 413) {
        errorMessage = 'Arquivo muito grande. O tamanho máximo é de 600KB.';
      } else if (
        (error && typeof error === 'object' && 'message' in error && typeof (error as Record<string, unknown>).message === 'string' && (
          String((error as Record<string, unknown>).message).includes('type') ||
          String((error as Record<string, unknown>).message).includes('format') ||
          String((error as Record<string, unknown>).message).includes('content-type')
        ))
      ) {
        errorMessage = 'Formato não suportado. Use apenas imagens JPEG ou PNG.';
      } else if (error && typeof error === 'object' && 'statusCode' in error && (error as Record<string, unknown>).statusCode === 400) {
        errorMessage = 'Erro ao fazer upload. Verifique se o arquivo é uma imagem válida.';
      } else if (error && typeof error === 'object' && 'statusCode' in error && ((error as Record<string, unknown>).statusCode === 401 || (error as Record<string, unknown>).statusCode === 403)) {
        errorMessage = 'Erro de autenticação. Faça login novamente.';
      } else if (error && typeof error === 'object' && 'statusCode' in error && (error as Record<string, unknown>).statusCode === 500) {
        errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
      }

      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`
                relative cursor-pointer rounded-full transition-all duration-300 ease-in-out
                ${isHovered ? 'scale-105 shadow-lg' : 'hover:scale-105'}
                ${isDragging ? 'scale-110 shadow-xl ring-2 ring-primary ring-offset-2' : ''}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={triggerFileSelect}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Avatar className={`
                h-24 w-24 sm:h-32 sm:w-32 border-2 transition-all duration-300
                ${isDragging ? 'border-primary border-dashed' : 'border-border'}
                ${isHovered ? 'border-primary/50' : ''}
              `}>
                {currentAvatarUrl ? (
                  <AvatarImage src={currentAvatarUrl} alt={userName} key={currentAvatarUrl} />
                ) : (
                  <AvatarFallback className="bg-surface text-2xl sm:text-4xl">
                    <User className="h-8 w-8 sm:h-12 sm:w-12 text-text-muted" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Overlay com ícone de upload */}
              <div className={`
                absolute inset-0 flex items-center justify-center rounded-full
                bg-black/50 text-white transition-opacity duration-300
                ${isHovered || isDragging ? 'opacity-100' : 'opacity-0'}
                ${uploading ? 'opacity-100 bg-black/70' : ''}
              `}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                    <span className="text-xs">Enviando...</span>
                  </div>
                ) : isDragging ? (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span className="text-xs font-medium">Solte aqui</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8" />
                    <span className="text-xs font-medium">
                      {currentAvatarUrl ? 'Alterar foto' : 'Adicionar foto'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {currentAvatarUrl 
                ? 'Clique ou arraste uma nova foto para alterar' 
                : 'Clique ou arraste uma foto para adicionar'
              }
            </p>
          </TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          id="avatar-upload"
          type="file"
          accept="image/jpeg, image/png"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />

        <div className="text-center space-y-1">
          <p className="text-sm text-text-muted font-medium">
            {currentAvatarUrl ? 'Foto de perfil' : 'Adicionar foto de perfil'}
          </p>
          <p className="text-xs text-text-muted/70">
            Clique na foto ou arraste uma imagem aqui
          </p>
          <p className="text-xs text-text-muted/50">
            PNG ou JPG até 600KB
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}