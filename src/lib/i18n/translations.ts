export type Language = 'pt' | 'en' | 'es'

export type TranslationRecord = typeof translations['pt']

export const translations = {
  pt: {
    language: {
      label: 'Português',
      shortLabel: 'PT',
      switcherLabel: 'Idioma',
    },
    auth: {
      verifying: 'Verificando sua sessão...'
    },
    navigation: {
      dashboard: 'Dashboard',
      matches: 'Partidas',
      competitions: 'Competições',
      teams: 'Equipes',
      stats: 'Estatísticas',
      reports: 'Súmulas',
      users: 'Usuários'
    },
    header: {
      welcome: 'Bem-vindo(a)',
      refresh: 'Atualizar dados'
    },
    actions: {
      refresh: 'Atualizar',
      viewAll: 'Ver tudo',
      dismiss: 'OK',
      cancel: 'Cancelar'
    },
    dashboard: {
      title: 'Resumo geral',
      description: 'Acompanhe métricas em tempo real das partidas e operações do Scorefy.',
      loading: 'Sincronizando dados do dashboard...',
      metrics: {
        liveMatches: {
          title: 'Partidas ao vivo',
          helper: 'Cobertura simultânea',
          description: 'Monitorando árbitros e operadores em tempo real.'
        },
        activeUsers: {
          title: 'Usuários ativos',
          helper: 'Operadores conectados hoje',
          description: 'Baseado na última sincronização do painel.'
        },
        averageGoals: {
          title: 'Média de gols',
          helper: 'Últimas partidas finalizadas',
          description: 'Média combinada de mandantes e visitantes.'
        },
        victoryRate: {
          title: 'Taxa de vitórias mandante',
          helper: 'Comparado à rodada anterior',
          description: 'Percentual considerando os confrontos mais recentes.'
        }
      },
      charts: {
        teamPerformance: {
          title: 'Gols por equipe',
          description: 'Desempenho ofensivo das principais equipes'
        },
        weeklyPerformance: {
          title: 'Desempenho semanal',
          description: 'Gols marcados x sofridos por rodada'
        },
        labels: {
          goalsFor: 'Gols marcados',
          goalsAgainst: 'Gols sofridos'
        }
      },
      matches: {
        title: 'Últimas partidas',
        description: 'Atualizadas automaticamente pelos operadores',
        empty: 'Nenhuma partida disponível no momento.',
        table: {
          date: 'Data',
          teams: 'Equipes',
          score: 'Placar',
          status: 'Status'
        }
      },
      status: {
        scheduled: 'Agendada',
        not_started: 'Não iniciada',
        live: 'Ao vivo',
        paused: 'Pausada',
        halftime: 'Intervalo',
        final: 'Finalizada',
        finished: 'Finalizada',
        canceled: 'Cancelada'
      },
      alerts: {
        overview: 'Não foi possível atualizar as métricas principais. Exibindo dados temporários.',
        charts: 'Falha ao sincronizar os gráficos. Exibindo dados de apoio.',
        matches: 'Não foi possível carregar as últimas partidas. Os dados podem estar desatualizados.',
        mock: 'Não foi possível sincronizar com o backend. Mostrando dados simulados.',
        partial: 'Algumas seções estão usando dados de apoio até que o backend responda.',
        network: 'Erro de comunicação com o backend. Verifique sua conexão.'
      }
    },
    matchControl: {
      loading: 'Carregando painel da partida...',
      header: {
        breadcrumb: 'Scorefy • Operações ao vivo',
        title: 'Painel de controle',
        subtitle: 'Fluxo oficial da partida',
        back: 'Voltar',
        syncNow: 'Forçar sincronização agora',
        reload: 'Recarregar estado do servidor',
        fullscreen: {
          enter: 'Tela cheia',
          exit: 'Sair da tela cheia'
        },
        scoresheet: {
          view: 'Ver súmula',
          loading: 'Gerando súmula...'
        }
      },
      badges: {
        online: 'Online (sincronizado)',
        offline: 'Offline',
        pending: 'Eventos pendentes: {count}',
        lastSync: 'Última sync'
      },
      alerts: {
        timeout: 'Tempo técnico em andamento ({team}) — {seconds}s restantes.',
        scoresheetSuccess: 'Súmula gerada com sucesso.',
        scoresheetError: 'Não foi possível gerar a súmula desta partida.',
        dismissTimeout: 'Encerrar tempo técnico'
      },
      labels: {
        homeTeam: 'Mandante',
        awayTeam: 'Visitante'
      },
      overview: {
        startLabel: 'Início previsto',
        venueLabel: 'Local',
        broadcastLabel: 'Transmissão',
        broadcastEmpty: 'Sem transmissão para esta partida. Informe uma URL para acompanhar ao vivo.',
        broadcastActive: 'Ativa',
        broadcastInactive: 'Indisponível',
        noVenue: 'Local indefinido'
      },
      broadcast: {
        title: 'Transmissão',
        subtitle: 'Quadro ao vivo',
        empty: 'Sem transmissão para esta partida. Informe uma URL para acompanhar ao vivo.'
      },
      quickActions: {
        title: 'Ações rápidas',
        description: 'Dispare eventos mais frequentes da partida com um toque.',
        items: {
          homeGoal: {
            label: 'Gol Mandante',
            description: 'Selecione o atleta responsável pelo gol.'
          },
          awayGoal: {
            label: 'Gol Visitante',
            description: 'Selecione o atleta responsável pelo gol.'
          },
          timeoutHome: {
            label: 'Timeout Mandante',
            description: 'Pausa o cronômetro para o time mandante.'
          },
          timeoutAway: {
            label: 'Timeout Visitante',
            description: 'Pausa o cronômetro para o time visitante.'
          }
        }
      },
      playerActions: {
        goal: 'Gol',
        yellowCard: 'Cartão amarelo',
        redCard: 'Cartão vermelho',
        twoMinutes: 'Dois minutos',
        blueCard: 'Cartão azul'
      },
      timeline: {
        title: 'Linha do tempo',
        description: 'Registros em ordem cronológica inversa.',
        loading: 'Carregando eventos...',
        empty: 'Nenhum evento registrado para esta partida.'
      },
      roster: {
        subtitle: 'Seleção oficial enviada pelos clubes.',
        count: '{count} atletas',
        empty: 'Nenhum participante disponível.',
        staffLabel: 'Staff',
        playerLabel: 'Jogador',
        actionsLabel: 'Registrar evento'
      },
      controls: {
        title: 'Fluxo operacional',
        subtitle: 'Controles da partida',
        lastSync: 'Última sincronização',
        statusLabel: 'Status atual',
        resumeFinalConfirm: 'Esta partida já foi finalizada. Deseja retomá-la?',
        resumeFinalDescription: 'Reabrir a partida permitirá registrar novos eventos.',
        resumeConfirm: 'Retomar esta partida agora?',
        resumeDescription: 'Isso sincronizará o cronômetro e reativará os eventos em tempo real.',
        nextPeriod: 'Próximo período',
        startNextPeriod: 'Iniciar próximo período',
        buttons: {
          start: 'Iniciar partida',
          starting: 'Iniciando...',
          resume: 'Retomar',
          resuming: 'Retomando...',
          pause: 'Pausar',
          pausing: 'Pausando...',
          finish: 'Encerrar partida',
          finishing: 'Encerrando...',
          startNextPeriod: 'Iniciar próximo período',
          startingNextPeriod: 'Iniciando próximo período...',
          cancel: 'Cancelar partida',
          canceling: 'Cancelando...'
        },
        pauseReasonTitle: 'Motivo da pausa',
        pauseReasonDescription: 'Explique por que o cronômetro está sendo pausado.',
        pauseReasonPlaceholder: 'Ex.: Tempo técnico solicitado',
        pauseReasonError: 'Informe um motivo para a pausa.',
        pauseReasonConfirm: 'Confirmar pausa'
      },
      goalDialog: {
        title: 'Selecionar atleta',
        description: 'Escolha quem participou do lance.',
        cancel: 'Cancelar',
        empty: 'Nenhum atleta disponível para este time.'
      },
      scoreboard: {
        matchTime: 'Tempo de jogo',
        periodLabel: 'Período',
        editLabel: 'Ajustar'
      }
    }
  },
  en: {
    language: {
      label: 'English',
      shortLabel: 'EN',
      switcherLabel: 'Language'
    },
    auth: {
      verifying: 'Checking your session...'
    },
    navigation: {
      dashboard: 'Dashboard',
      matches: 'Matches',
      competitions: 'Competitions',
      teams: 'Teams',
      stats: 'Stats',
      reports: 'Reports',
      users: 'Users'
    },
    header: {
      welcome: 'Welcome',
      refresh: 'Refresh data'
    },
    actions: {
      refresh: 'Refresh',
      viewAll: 'View all',
      dismiss: 'Dismiss',
      cancel: 'Cancel'
    },
    dashboard: {
      title: 'Overview',
      description: 'Monitor live metrics from matches and tournament operations.',
      loading: 'Syncing dashboard data...',
      metrics: {
        liveMatches: {
          title: 'Live matches',
          helper: 'Simultaneous coverage',
          description: 'Monitoring referees and operators in real time.'
        },
        activeUsers: {
          title: 'Active users',
          helper: 'Operators connected today',
          description: 'Based on the latest dashboard sync.'
        },
        averageGoals: {
          title: 'Average goals',
          helper: 'Recently finished games',
          description: 'Combined average for home and away teams.'
        },
        victoryRate: {
          title: 'Home win rate',
          helper: 'Compared with last round',
          description: 'Percentage calculated on the latest fixtures.'
        }
      },
      charts: {
        teamPerformance: {
          title: 'Goals per team',
          description: 'Offensive performance from the leading teams'
        },
        weeklyPerformance: {
          title: 'Weekly performance',
          description: 'Goals scored vs conceded each round'
        },
        labels: {
          goalsFor: 'Goals scored',
          goalsAgainst: 'Goals conceded'
        }
      },
      matches: {
        title: 'Latest matches',
        description: 'Updated automatically by operators',
        empty: 'No matches available right now.',
        table: {
          date: 'Date',
          teams: 'Teams',
          score: 'Score',
          status: 'Status'
        }
      },
      status: {
        scheduled: 'Scheduled',
        not_started: 'Not started',
        live: 'Live',
        paused: 'Paused',
        halftime: 'Halftime',
        final: 'Finished',
        finished: 'Finished',
        canceled: 'Canceled'
      },
      alerts: {
        overview: 'We could not refresh the main metrics. Showing temporary data.',
        charts: 'Charts are temporarily using fallback data.',
        matches: 'Latest matches are unavailable right now.',
        mock: 'Backend is unreachable. Showing simulated data.',
        partial: 'Some sections still rely on fallback data.',
        network: 'Unable to communicate with the backend. Please check your connection.'
      }
    },
    matchControl: {
      loading: 'Loading match control board...',
      header: {
        breadcrumb: 'Scorefy • Live operations',
        title: 'Control panel',
        subtitle: 'Official match workflow',
        back: 'Back',
        syncNow: 'Force sync now',
        reload: 'Reload server state',
        fullscreen: {
          enter: 'Enter fullscreen',
          exit: 'Exit fullscreen'
        },
        scoresheet: {
          view: 'View scoresheet',
          loading: 'Generating scoresheet...'
        }
      },
      badges: {
        online: 'Online (synced)',
        offline: 'Offline',
        pending: 'Pending events: {count}',
        lastSync: 'Last sync'
      },
      alerts: {
        timeout: 'Timeout in progress ({team}) — {seconds}s remaining.',
        scoresheetSuccess: 'Scoresheet generated successfully.',
        scoresheetError: 'Unable to generate the scoresheet for this match.',
        dismissTimeout: 'Dismiss timeout'
      },
      labels: {
        homeTeam: 'Home',
        awayTeam: 'Away'
      },
      overview: {
        startLabel: 'Scheduled start',
        venueLabel: 'Venue',
        broadcastLabel: 'Broadcast',
        broadcastEmpty: 'No broadcast available for this match. Provide a URL to share the stream.',
        broadcastActive: 'Active',
        broadcastInactive: 'Unavailable',
        noVenue: 'Undefined venue'
      },
      broadcast: {
        title: 'Broadcast',
        subtitle: 'Live board',
        empty: 'No broadcast available for this match. Provide a URL to share the stream.'
      },
      quickActions: {
        title: 'Quick actions',
        description: 'Trigger the most frequent match events with one tap.',
        items: {
          homeGoal: {
            label: '+ Home goal',
            description: 'Select the player who scored for the home team.'
          },
          awayGoal: {
            label: '+ Away goal',
            description: 'Select the player who scored for the away team.'
          },
          timeoutHome: {
            label: 'Home timeout',
            description: 'Pause the clock for the home team.'
          },
          timeoutAway: {
            label: 'Away timeout',
            description: 'Pause the clock for the away team.'
          }
        }
      },
      playerActions: {
        goal: 'Goal',
        yellowCard: 'Yellow card',
        redCard: 'Red card',
        twoMinutes: 'Two minutes',
        blueCard: 'Blue card'
      },
      timeline: {
        title: 'Timeline',
        description: 'Entries are listed in reverse chronological order.',
        loading: 'Loading events...',
        empty: 'No events registered for this match.'
      },
      roster: {
        subtitle: 'Official roster provided by the clubs.',
        count: '{count} athletes',
        empty: 'No participants available.',
        staffLabel: 'Staff',
        playerLabel: 'Player',
        actionsLabel: 'Log event'
      },
      controls: {
        title: 'Operational flow',
        subtitle: 'Match controls',
        lastSync: 'Last sync',
        statusLabel: 'Current status',
        resumeFinalConfirm: 'This match is already finished. Do you want to resume it?',
        resumeFinalDescription: 'Resuming will reopen the match and allow new events to be logged.',
        resumeConfirm: 'Resume this match now?',
        resumeDescription: 'This will sync the clock and enable live event tracking again.',
        nextPeriod: 'Next period',
        startNextPeriod: 'Start next period',
        buttons: {
          start: 'Start match',
          starting: 'Starting...',
          resume: 'Resume',
          resuming: 'Resuming...',
          pause: 'Pause',
          pausing: 'Pausing...',
          finish: 'End match',
          finishing: 'Ending...',
          startNextPeriod: 'Start next period',
          startingNextPeriod: 'Starting next period...',
          cancel: 'Cancel match',
          canceling: 'Cancelling...'
        },
        pauseReasonTitle: 'Pause reason',
        pauseReasonDescription: 'Describe why the clock is being paused.',
        pauseReasonPlaceholder: 'e.g. Timeout requested',
        pauseReasonError: 'Please provide a reason for the pause.',
        pauseReasonConfirm: 'Confirm pause'
      },
      goalDialog: {
        title: 'Select player',
        description: 'Choose who took part in the play.',
        cancel: 'Cancel',
        empty: 'No athletes available for this team.'
      },
      scoreboard: {
        matchTime: 'Match clock',
        periodLabel: 'Period',
        editLabel: 'Adjust'
      }
    }
  },
  es: {
    language: {
      label: 'Español',
      shortLabel: 'ES',
      switcherLabel: 'Idioma'
    },
    auth: {
      verifying: 'Verificando tu sesión...'
    },
    navigation: {
      dashboard: 'Panel',
      matches: 'Partidos',
      competitions: 'Competiciones',
      teams: 'Equipos',
      stats: 'Estadísticas',
      reports: 'Actas',
      users: 'Usuarios'
    },
    header: {
      welcome: 'Bienvenido(a)',
      refresh: 'Actualizar datos'
    },
    actions: {
      refresh: 'Actualizar',
      viewAll: 'Ver todo',
      dismiss: 'Entendido',
      cancel: 'Cancelar'
    },
    dashboard: {
      title: 'Resumen general',
      description: 'Sigue métricas en tiempo real de los partidos y las operaciones del torneo.',
      loading: 'Sincronizando datos del panel...',
      metrics: {
        liveMatches: {
          title: 'Partidos en vivo',
          helper: 'Cobertura simultánea',
          description: 'Monitoreando árbitros y operadores en tiempo real.'
        },
        activeUsers: {
          title: 'Usuarios activos',
          helper: 'Operadores conectados hoy',
          description: 'Basado en la última sincronización del panel.'
        },
        averageGoals: {
          title: 'Promedio de goles',
          helper: 'Últimos partidos finalizados',
          description: 'Promedio combinado entre locales y visitantes.'
        },
        victoryRate: {
          title: 'Tasa de victorias local',
          helper: 'Comparado con la jornada anterior',
          description: 'Porcentaje calculado con los partidos recientes.'
        }
      },
      charts: {
        teamPerformance: {
          title: 'Goles por equipo',
          description: 'Rendimiento ofensivo de los equipos destacados'
        },
        weeklyPerformance: {
          title: 'Rendimiento semanal',
          description: 'Goles anotados vs recibidos por jornada'
        },
        labels: {
          goalsFor: 'Goles a favor',
          goalsAgainst: 'Goles en contra'
        }
      },
      matches: {
        title: 'Últimos partidos',
        description: 'Actualizados automáticamente por los operadores',
        empty: 'No hay partidos disponibles en este momento.',
        table: {
          date: 'Fecha',
          teams: 'Equipos',
          score: 'Marcador',
          status: 'Estado'
        }
      },
      status: {
        scheduled: 'Programado',
        not_started: 'Sin iniciar',
        live: 'En vivo',
        paused: 'Pausado',
        halftime: 'Descanso',
        final: 'Finalizado',
        finished: 'Finalizado',
        canceled: 'Cancelado'
      },
      alerts: {
        overview: 'No pudimos actualizar las métricas principales. Mostrando datos temporales.',
        charts: 'Los gráficos se muestran con datos de respaldo.',
        matches: 'Los últimos partidos no están disponibles por el momento.',
        mock: 'No fue posible comunicar con el backend. Mostrando datos simulados.',
        partial: 'Algunas secciones aún dependen de datos de respaldo.',
        network: 'Error de comunicación con el backend. Verifica tu conexión.'
      }
    },
    matchControl: {
      loading: 'Cargando panel del partido...',
      header: {
        breadcrumb: 'Scorefy • Operaciones en vivo',
        title: 'Panel de control',
        subtitle: 'Flujo oficial del partido',
        back: 'Volver',
        syncNow: 'Forzar sincronización ahora',
        reload: 'Recargar estado del servidor',
        fullscreen: {
          enter: 'Pantalla completa',
          exit: 'Salir de pantalla completa'
        },
        scoresheet: {
          view: 'Ver acta',
          loading: 'Generando acta...'
        }
      },
      badges: {
        online: 'En línea (sincronizado)',
        offline: 'Sin conexión',
        pending: 'Eventos pendientes: {count}',
        lastSync: 'Última sync'
      },
      alerts: {
        timeout: 'Tiempo solicitado en curso ({team}) — quedan {seconds}s.',
        scoresheetSuccess: 'El acta se generó correctamente.',
        scoresheetError: 'No fue posible generar el acta de este partido.',
        dismissTimeout: 'Finalizar tiempo solicitado'
      },
      labels: {
        homeTeam: 'Local',
        awayTeam: 'Visitante'
      },
      overview: {
        startLabel: 'Inicio previsto',
        venueLabel: 'Sede',
        broadcastLabel: 'Transmisión',
        broadcastEmpty: 'Sin transmisión disponible. Proporciona una URL para compartir el partido.',
        broadcastActive: 'Activa',
        broadcastInactive: 'No disponible',
        noVenue: 'Sede indefinida'
      },
      broadcast: {
        title: 'Transmisión',
        subtitle: 'Panel en vivo',
        empty: 'Sin transmisión disponible. Proporciona una URL para compartir el partido.'
      },
      quickActions: {
        title: 'Acciones rápidas',
        description: 'Dispara los eventos más frecuentes del partido con un toque.',
        items: {
          homeGoal: {
            label: '+ Gol local',
            description: 'Selecciona al jugador que anotó para el equipo local.'
          },
          awayGoal: {
            label: '+ Gol visitante',
            description: 'Selecciona al jugador que anotó para el equipo visitante.'
          },
          timeoutHome: {
            label: 'Tiempo local',
            description: 'Pausa el reloj para el equipo local.'
          },
          timeoutAway: {
            label: 'Tiempo visitante',
            description: 'Pausa el reloj para el equipo visitante.'
          }
        }
      },
      playerActions: {
        goal: 'Gol',
        yellowCard: 'Tarjeta amarilla',
        redCard: 'Tarjeta roja',
        twoMinutes: 'Dos minutos',
        blueCard: 'Tarjeta azul'
      },
      timeline: {
        title: 'Cronología',
        description: 'Registros en orden cronológico inverso.',
        loading: 'Cargando eventos...',
        empty: 'No hay eventos registrados para este partido.'
      },
      roster: {
        subtitle: 'Convocatoria oficial enviada por los clubes.',
        count: '{count} atletas',
        empty: 'No hay participantes disponibles.',
        staffLabel: 'Staff',
        playerLabel: 'Jugador',
        actionsLabel: 'Registrar evento'
      },
      controls: {
        title: 'Flujo operativo',
        subtitle: 'Controles del partido',
        lastSync: 'Última sync',
        statusLabel: 'Estado actual',
        resumeFinalConfirm: 'Este partido ya finalizó. ¿Deseas retomarlo?',
        resumeFinalDescription: 'Reabrir el partido permitirá registrar nuevos eventos.',
        resumeConfirm: '¿Deseas reanudar este partido ahora?',
        resumeDescription: 'Esto sincronizará el reloj y permitirá registrar eventos en vivo nuevamente.',
        nextPeriod: 'Próximo período',
        startNextPeriod: 'Iniciar próximo período',
        buttons: {
          start: 'Iniciar partido',
          starting: 'Iniciando...',
          resume: 'Reanudar',
          resuming: 'Reanudando...',
          pause: 'Pausar',
          pausing: 'Pausando...',
          finish: 'Terminar partido',
          finishing: 'Terminando...',
          startNextPeriod: 'Iniciar próximo período',
          startingNextPeriod: 'Iniciando próximo período...',
          cancel: 'Cancelar partido',
          canceling: 'Cancelando...'
        },
        pauseReasonTitle: 'Motivo de la pausa',
        pauseReasonDescription: 'Describe por qué se está pausando el reloj.',
        pauseReasonPlaceholder: 'Ej.: Tiempo solicitado',
        pauseReasonError: 'Indica un motivo para la pausa.',
        pauseReasonConfirm: 'Confirmar pausa'
      },
      goalDialog: {
        title: 'Seleccionar atleta',
        description: 'Elige quién participó en la jugada.',
        cancel: 'Cancelar',
        empty: 'No hay atletas disponibles para este equipo.'
      },
      scoreboard: {
        matchTime: 'Tiempo de juego',
        periodLabel: 'Período',
        editLabel: 'Ajustar'
      }
    }
  }
} as const
