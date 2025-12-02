"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCheck, Inbox, Bell, AlertTriangle, Trash2, Eye } from 'lucide-react';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { NotificationItem } from '@/components/NotificationItem';
import { SkeletonNotification } from '@/components/SkeletonNotification';
import { AlertsSection } from '@/components/AlertsSection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'unread';

export default function Notifications() {
  const { notifications, loading, unreadCount, markAsRead, markAsUnread, markAllAsRead, deleteNotification } = useNotificationsData();
  const [filter, setFilter] = useState<Filter>('all');

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.lida);
    }
    return notifications;
  }, [notifications, filter]);

  const triggerClasses = cn(
    'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
    'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
    'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
  );

  return (
    <main className="py-4 sm:py-6 lg:py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
            Notificações e Alertas
          </h1>
          <p className="text-text-muted mt-2">
            Aqui você encontrará avisos importantes sobre sua conta, sistema e finanças.
          </p>
        </div>
        
      </div>


      {/* Main Content */}
      <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 p-1 h-auto">
            <TabsTrigger value="notifications" className={triggerClasses}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                <div className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </div>
                Notificações
              </span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className={triggerClasses}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas Financeiros
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <Card
              className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
              <CardHeader className="relative z-10 pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <CardTitle className="text-sm font-semibold tracking-tight">
                          Caixa de entrada
                        </CardTitle>
                        <p className="text-[11px] text-text-muted">
                          Visualize todas as notificações e não lidas em um só lugar
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <Badge className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                        {unreadCount} nova{unreadCount > 1 && 's'}
                      </Badge>
                    )}
                  </div>

                  <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                    <TabsList className="grid grid-cols-2 gap-1 p-1 h-auto max-w-sm bg-background/70">
                      <TabsTrigger value="all" className={triggerClasses}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        <span className="relative z-10">Todas</span>
                      </TabsTrigger>
                      <TabsTrigger value="unread" className={triggerClasses}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        <span className="relative z-10 flex items-center gap-2">
                          Não Lidas
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                {loading ? (
                  <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonNotification key={i} />
                    ))}
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((n, index) => (
                      <div
                        key={n.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <NotificationItem
                          notification={n}
                          onMarkRead={markAsRead}
                          onMarkUnread={markAsUnread}
                          onDelete={deleteNotification}
                          onMarkAllAsRead={markAllAsRead}
                          unreadCount={unreadCount}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                      <Inbox className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Caixa de entrada vazia'}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {filter === 'unread' ? 'Você está em dia!' : 'Novas notificações aparecerão aqui.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <AlertsSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Empty State Alert */}
      {!loading && notifications.length === 0 && (
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Alert className="border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-surface to-background shadow-sm">
            <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <AlertTitle className="text-sky-900 dark:text-sky-100">
              Bem-vindo ao sistema de notificações!
            </AlertTitle>
            <AlertDescription className="text-sky-800 dark:text-sky-200">
              Quando você receber notificações importantes sobre sua conta, sistema ou finanças, elas aparecerão aqui. 
              Você pode marcar como lidas, arquivar ou excluir conforme necessário.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </main>
  );
}